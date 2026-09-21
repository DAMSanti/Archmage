/**
 * El contrato del API: **un esquema Zod por endpoint y por mensaje**.
 *
 * El servidor valida la entrada con él y el cliente deriva sus tipos de él,
 * así que **un cambio aquí rompe la compilación de los dos lados a la vez**.
 * Eso es lo que queremos (docs/ARQUITECTURA.md §3).
 *
 * Fuera de alcance en la fase 1:
 *  - Autenticación y sesiones: la fase 1 trabaja con un mago fijo
 *    (docs/ARQUITECTURA.md §9.6).
 *  - WebSocket: el estado se pide por HTTP; los avisos llegan en la fase 3,
 *    cuando haya algo que avisar (docs/SPECS.md §6).
 */

import { z } from 'zod';
import { BUILDINGS, SPECIALTIES } from '@archmage/core';

export const buildingSchema = z.enum(BUILDINGS);
export const specialtySchema = z.enum(SPECIALTIES);

const positiveTurns = z.number().int().positive().max(1_000);

/** docs/SPECS.md §2. Las seis de la fase 1. */
export const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('build'), building: buildingSchema, turns: positiveTurns }),
  z.object({ type: z.literal('demolish'), building: buildingSchema, turns: positiveTurns }),
  z.object({ type: z.literal('explore'), turns: positiveTurns }),
  z.object({ type: z.literal('chargeMana'), turns: positiveTurns }),
  z.object({ type: z.literal('chargeGeld'), turns: positiveTurns }),
  z.object({
    type: z.literal('setRecruit'),
    unitId: z.string().min(1).max(64),
    count: z.number().int().positive().max(10_000_000),
  }),
  // Fase 2.
  z.object({ type: z.literal('research'), spellId: z.string().min(1).max(64), turns: positiveTurns }),
  z.object({ type: z.literal('cast'), spellId: z.string().min(1).max(64), turns: positiveTurns }),
  z.object({ type: z.literal('dispel'), spellId: z.string().min(1).max(64) }),
  /**
   * Atacar. Fase 3.
   *
   * **No lleva `turns`** aunque los gaste: el coste en turnos de un ataque
   * lo fija la regla, no el jugador (docs/SISTEMAS.md §9.1). Dejar que lo
   * mandara el cliente sería una regla de juego viajando por el API.
   */
  z.object({
    type: z.literal('attack'),
    targetId: z.string().min(1).max(64),
    attackType: z.enum(['regular', 'siege', 'pillage']),
  }),
]);
export type ActionInput = z.infer<typeof actionSchema>;

const buildingsSchema = z.object(
  Object.fromEntries(BUILDINGS.map((b) => [b, z.number().int().nonnegative()])) as Record<
    (typeof BUILDINGS)[number],
    z.ZodNumber
  >,
);

export const mageStateSchema = z.object({
  id: z.string(),
  serverId: z.string(),
  name: z.string(),
  specialty: specialtySchema,
  turns: z.object({ current: z.number().int(), lastAccrualAt: z.number().int() }),
  turnsSpent: z.number().int().nonnegative(),
  land: z.object({ total: z.number().int(), free: z.number().int() }),
  buildings: buildingsSchema,
  construction: buildingsSchema,
  resources: z.object({
    geld: z.number().int(),
    mana: z.number().int(),
    population: z.number().int(),
  }),
  army: z.array(z.object({ unitId: z.string(), count: z.number().int(), heroId: z.string().optional() })),
  recruiting: z
    .object({ unitId: z.string(), remaining: z.number().int(), perTurn: z.number().int() })
    .nullable(),
  spellbook: z.object({
    known: z.array(z.string()),
    researching: z
      .object({ spellId: z.string(), progress: z.number().int() })
      .nullable(),
    level: z.number().int(),
  }),
  casting: z
    .object({ spellId: z.string(), turnsRemaining: z.number().int() })
    .nullable(),
  enchantments: z.array(
    z.object({
      spellId: z.string(),
      upkeepMana: z.number().int(),
      modifiers: z.record(z.string(), z.number().int()),
    }),
  ),
  heroes: z.array(z.object({ id: z.string(), level: z.number().int(), experience: z.number().int() })),
  items: z.record(z.string(), z.number().int()),
  skills: z.record(z.string(), z.number().int()),
});

/** Lo que la interfaz necesita para enseñar números sin recalcular reglas. */
export const derivedSchema = z.object({
  income: z.object({ geld: z.number().int(), mana: z.number().int(), population: z.number().int() }),
  upkeep: z.object({ geld: z.number().int(), mana: z.number().int(), population: z.number().int() }),
  net: z.object({ geld: z.number().int(), mana: z.number().int(), population: z.number().int() }),
  manaStorage: z.number().int(),
  populationCapacity: z.object({
    space: z.number().int(),
    food: z.number().int(),
    capacity: z.number().int(),
  }),
  netPower: z.number().int(),
  /** Decoración: la cuenta atrás. Los turnos de verdad los dice `turns`. */
  msToNextTurn: z.number().int(),
  turnsAtCap: z.boolean(),
  protectedUntilTurn: z.number().int(),
  /**
   * El libro de hechizos **ya resuelto**: qué puede investigar, qué sabe, y
   * **lo que le costaría lanzar a él** con el recargo fuera de color
   * aplicado. La pantalla no recalcula nada (docs/INTERFAZ.md §3.1).
   */
  spellbook: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      school: specialtySchema,
      rank: z.enum(['simple', 'average', 'complex', 'ultimate', 'ancient']),
      castTurns: z.number().int(),
      researchCost: z.number().int(),
      upkeepMana: z.number().int(),
      effectKind: z.enum(['summon', 'enchantment', 'resource', 'combat']),
      known: z.boolean(),
      researchable: z.boolean(),
      castable: z.boolean(),
      castMana: z.number().int().nullable(),
      relation: z.enum(['own', 'adjacent', 'opposite']),
      /** Probabilidad de fallar, en %. 0 en tu color. */
      failureChance: z.number().int(),
    }),
  ),
  maxSpellLevel: z.number().int(),
});

export const serverConfigSchema = z.object({
  id: z.string(),
  turnMinutes: z.number().int().positive(),
  turnCap: z.number().int().positive(),
  protectionTurns: z.number().int().nonnegative(),
});

export const gameEventSchema = z.object({ type: z.string() }).passthrough();

/** `GET /api/mage/me` — el estado **ya devengado** (docs/SPECS.md §6). */
export const mageResponseSchema = z.object({
  mage: mageStateSchema,
  derived: derivedSchema,
  server: serverConfigSchema,
});
export type MageResponse = z.infer<typeof mageResponseSchema>;

/** `POST /api/mage/me/actions` — **una** acción. */
export const actionRequestSchema = z.object({ action: actionSchema });

/** Toda respuesta de acción devuelve el estado nuevo **y los eventos**. */
export const actionResponseSchema = mageResponseSchema.extend({
  events: z.array(gameEventSchema),
  /**
   * La batalla que acaba de ocurrir, si la acción fue un ataque.
   *
   * Va aquí y no en una respuesta aparte **para que el cliente no tenga dos
   * formas de respuesta que parsear**: un ataque es una acción como las
   * demás desde fuera, y lo único que añade es a dónde ir a ver qué pasó.
   */
  battleId: z.number().int().optional(),
});
export type ActionResponse = z.infer<typeof actionResponseSchema>;

/** docs/SPECS.md §5, invariante 9: un error de dominio es un 422 con código. */
export const errorResponseSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

/** El catálogo, para que el cliente pinte nombres y costes sin adivinarlos. */
export const catalogResponseSchema = z.object({
  buildings: z.record(
    z.string(),
    z.object({ cost: z.number().int(), upkeepGeld: z.number().int(), upkeepMana: z.number().int() }),
  ),
  units: z.record(
    z.string(),
    z.object({
      id: z.string(),
      name: z.string(),
      specialty: specialtySchema,
      cost: z.number().int(),
      /** **Centésimas** de geld y de maná por turno (docs/SISTEMAS.md §9.1). */
      upkeepGeld: z.number().int(),
      upkeepMana: z.number().int(),
      populationSpace: z.number().int(),
      recruitPerBarracks: z.number().int(),
      // Fase 3: la ficha de combate. La pantalla de ejército enseña de qué
      // sirve una unidad, no solo lo que cuesta.
      hitPoints: z.number().int(),
      powerRank: z.number().int(),
      attack: z.object({
        power: z.number().int(),
        types: z.array(z.string()),
        initiative: z.number().int(),
      }),
      counterAttack: z.number().int(),
      abilities: z.array(z.string()),
    }),
  ),
});
export type CatalogResponse = z.infer<typeof catalogResponseSchema>;

// --- Guerra. Fase 3 ------------------------------------------------------

/** Un objetivo de la lista de /guerra. */
export const targetSchema = z.object({
  id: z.string(),
  name: z.string(),
  specialty: z.string(),
  land: z.number().int().nonnegative(),
  netPower: z.number().int().nonnegative(),
  /** Si sigue en periodo de protección: no se le puede atacar. */
  protected: z.boolean(),
  /**
   * Si está **fuera del rango de net power**. El saqueo solo alcanza a quien
   * tenga al menos el 50% del tuyo (docs/SISTEMAS.md §9.1): sin eso, machacar
   * novatos sería la estrategia óptima.
   */
  tooWeak: z.boolean(),
});
export type Target = z.infer<typeof targetSchema>;

export const targetsResponseSchema = z.object({ targets: z.array(targetSchema) });

/** Un golpe del log, tal y como lo pinta la repetición. */
export const blowSchema = z.object({
  round: z.number().int(),
  side: z.enum(['attacker', 'defender']),
  attackerStack: z.number().int(),
  attackerUnit: z.string(),
  defenderUnit: z.string(),
  kind: z.enum(['primary', 'counter', 'extra']),
  accuracy: z.number(),
  randomFactor: z.number(),
  efficiency: z.number(),
  resistance: z.number(),
  defensiveMultiplier: z.number(),
  casualties: z.number().int().nonnegative(),
});

export const battleSchema = z.object({
  id: z.number().int(),
  attackerId: z.string(),
  defenderId: z.string(),
  attackerName: z.string(),
  defenderName: z.string(),
  attackType: z.enum(['regular', 'siege', 'pillage']),
  /** La semilla, para que la repetición se pueda reconstruir. */
  seed: z.number().int(),
  winner: z.enum(['attacker', 'defender']),
  rounds: z.number().int(),
  landLost: z.number().int(),
  landTaken: z.number().int(),
  log: z.array(blowSchema),
  summary: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
});
export type Battle = z.infer<typeof battleSchema>;

export const battlesResponseSchema = z.object({
  battles: z.array(battleSchema.omit({ log: true })),
});

// --- Cuentas. Fase 4 -----------------------------------------------------

const emailSchema = z.string().trim().min(3).max(200).email();
/** Ocho como mínimo. Lo dice `MIN_PASSWORD` en el servidor, y aquí también. */
const passwordSchema = z.string().min(8).max(200);

export const registerSchema = z.object({ email: emailSchema, password: passwordSchema });
export const loginSchema = z.object({ email: emailSchema, password: passwordSchema });
export const forgotSchema = z.object({ email: emailSchema });
export const tokenSchema = z.object({ token: z.string().min(16).max(128) });
export const resetSchema = z.object({
  token: z.string().min(16).max(128),
  password: passwordSchema,
});

/**
 * Crear el mago. **No lleva `mageId` ni `accountId`**: el primero lo genera
 * el servidor y el segundo sale de la sesión (docs/SPECS.md §5,
 * invariante 13).
 */
export const createMageSchema = z.object({
  name: z.string().trim().min(2).max(40),
  specialty: specialtySchema,
});
