/**
 * El contenido del juego: **datos, no código**
 * (docs/ARQUITECTURA.md §3, docs/SPECS.md §4).
 *
 * Todo número que pueda moverse al calibrar vive aquí. Si el simulador de
 * temporada dice que un reparto domina, **se cambia este fichero**, no el
 * núcleo — que es exactamente para lo que el contenido es dato.
 *
 * Cada número lleva de dónde sale: docs/ORIGINAL.md con su nivel de
 * confianza si viene del juego original, o el porqué si es nuestro.
 *
 * Fuera de alcance en la fase 1, a propósito:
 *  - Hechizos, items, héroes y habilidades (fases 2 a 4).
 *  - La mitad de **combate** de las unidades —ataque, defensa, HP,
 *    iniciativa—, que sigue `[abierto]` y es de la fase 3
 *    (docs/SISTEMAS.md §8).
 */

import { z } from 'zod';
import { BUILDINGS, SPECIALTIES } from '@archmage/core';
import type { Building, Catalog, ServerConfig } from '@archmage/core';
import type { StartingKingdom } from '@archmage/core';
import { MAX_SPELL_LEVEL, SPELLS_BY_ID, SUMMONED_UNITS } from './spells.js';

// --- Esquemas -------------------------------------------------------------

const positiveInt = z.number().int().nonnegative();

export const buildingSpecSchema = z.object({
  cost: positiveInt,
  upkeepGeld: positiveInt,
  upkeepMana: positiveInt,
});

export const unitEconomySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  specialty: z.enum(SPECIALTIES),
  cost: positiveInt,
  upkeepGeld: positiveInt,
  upkeepMana: positiveInt,
  upkeepPopulation: positiveInt,
  populationSpace: z.number().int().positive(),
  recruitPerBarracks: z.number().int().positive(),
});

export const catalogSchema = z.object({
  buildings: z.object(
    Object.fromEntries(BUILDINGS.map((b) => [b, buildingSpecSchema])) as Record<
      Building,
      typeof buildingSpecSchema
    >,
  ),
  units: z.record(z.string(), unitEconomySchema),
});

// --- Edificios ------------------------------------------------------------

/**
 * docs/SISTEMAS.md §4.2 [nuestro]. El coste sigue la **misma proporción que
 * el tiempo de construcción** del original
 * (`1 fort = 10 nodes/towns = 15 guilds = 30 workshops = 60 farms/barracks`,
 * docs/ORIGINAL.md §4, confianza alta): si un edificio fuera caro en tiempo y
 * barato en geld habría dos escaseces tirando en direcciones distintas.
 *
 * Escala comprobada el 2026-09-21: un mago de 5.000 acres con el reparto que
 * recomiendan las guías cuesta **23,5 millones** construido entero, el mismo
 * orden que los «around 30 mils» que una guía veterana recomienda tener
 * guardados a ese tamaño.
 */
export const BUILDING_SPECS: Catalog['buildings'] = {
  farms: { cost: 1_000, upkeepGeld: 5, upkeepMana: 0 },
  barracks: { cost: 1_000, upkeepGeld: 5, upkeepMana: 0 },
  workshops: { cost: 2_000, upkeepGeld: 5, upkeepMana: 0 },
  guilds: { cost: 4_000, upkeepGeld: 15, upkeepMana: 0 },
  towns: { cost: 6_000, upkeepGeld: 5, upkeepMana: 0 },
  nodes: { cost: 6_000, upkeepGeld: 6, upkeepMana: 0 },
  forts: { cost: 60_000, upkeepGeld: 100, upkeepMana: 0 },
  // Guilds y barriers son deliberadamente caros de mantener, como en el
  // original: es lo que impide tener 1.600 guilds y un ejército a la vez.
  barriers: { cost: 10_000, upkeepGeld: 20, upkeepMana: 50 },
};

// --- Unidades -------------------------------------------------------------

/**
 * docs/SISTEMAS.md §8.1 [nuestro]. **Solo la mitad económica.**
 *
 * Derivado el 2026-09-21 del ancla del original: un mago del turno 120, con
 * ~1.250 acres, sostiene **10.000-20.000 unidades**
 * (docs/ORIGINAL.md §4.1, confianza alta). Con el ingreso neto que producen
 * los números de §4.2 a ese tamaño —25.800 geld/turno—, un upkeep medio de
 * **2 geld por unidad** sitúa el ejército sostenible en **12.900**, dentro de
 * la banda documentada.
 *
 * Las cinco son tropa básica de barracks, sin escuela (`plain`):
 * docs/ORIGINAL.md §7, confianza alta.
 */
export const UNIT_SPECS: Catalog['units'] = {
  militia: {
    id: 'militia',
    name: 'Milicia',
    specialty: 'plain',
    cost: 60,
    upkeepGeld: 1,
    upkeepMana: 0,
    upkeepPopulation: 0,
    populationSpace: 1,
    recruitPerBarracks: 5,
  },
  phalanx: {
    id: 'phalanx',
    name: 'Falange',
    specialty: 'plain',
    cost: 100,
    upkeepGeld: 2,
    upkeepMana: 0,
    upkeepPopulation: 0,
    populationSpace: 1,
    recruitPerBarracks: 3,
  },
  pikemen: {
    id: 'pikemen',
    name: 'Piqueros',
    specialty: 'plain',
    cost: 120,
    upkeepGeld: 2,
    upkeepMana: 0,
    upkeepPopulation: 0,
    populationSpace: 1,
    recruitPerBarracks: 3,
  },
  archers: {
    id: 'archers',
    name: 'Arqueros',
    specialty: 'plain',
    cost: 150,
    upkeepGeld: 2,
    upkeepMana: 0,
    upkeepPopulation: 0,
    populationSpace: 1,
    recruitPerBarracks: 2,
  },
  cavalry: {
    id: 'cavalry',
    name: 'Caballería',
    specialty: 'plain',
    cost: 250,
    upkeepGeld: 4,
    upkeepMana: 0,
    upkeepPopulation: 0,
    populationSpace: 2,
    recruitPerBarracks: 1,
  },
};

export const CATALOG: Catalog = {
  buildings: BUILDING_SPECS,
  // La tropa de barracks y las unidades invocables, en el mismo sitio: para
  // `upkeep()` una unidad es una unidad, venga de donde venga.
  units: { ...UNIT_SPECS, ...SUMMONED_UNITS },
  spells: SPELLS_BY_ID,
  maxSpellLevel: MAX_SPELL_LEVEL,
};

// --- Números de la economía ----------------------------------------------

/**
 * Los coeficientes que el original **no publica** y que calibramos nosotros
 * (docs/SISTEMAS.md §5.3 y §5.4). Están aquí, y no en el núcleo, porque son
 * exactamente lo que el simulador de temporada puede querer mover.
 *
 * El maná **no** está aquí: su fórmula sí está publicada y es una regla, no un
 * número (docs/ORIGINAL.md §3.1).
 */
export const ECONOMY = {
  /** geld por habitante y turno = base + porTown × (towns / tierra). */
  geldBase: 0.75,
  geldPerTownRatio: 2,
  /** Espacio de población por town. */
  populationPerTown: 300,
  /**
   * Habitantes que alimenta una farm.
   *
   * 300 y 100 están elegidos para que **la proporción 3:1 que recomienda el
   * original salga sola**: con 3 farms por town los dos topes se igualan.
   */
  populationPerFarm: 100,
  /** Crecimiento por turno: base + porcentaje de la población actual. */
  populationGrowthFlat: 50,
  populationGrowthRate: 0.015,
  /** Almacén de maná por node. docs/ORIGINAL.md §3, confianza alta. */
  manaStoragePerNode: 1_000,
  /** Exploración: acres por turno = factor × (1 − tierra/tope). */
  exploreFactor: 22,
  exploreLandCap: 3_500,
} as const;

/** docs/SISTEMAS.md §4.3 [orig], confianza alta. */
export const EFFECT_CAPS = {
  /** Resistencia máxima de las barriers, al 2,5% de la tierra. */
  barrierMaxResistance: 0.75,
  barrierCapRatio: 0.025,
  /** El bonus de fort aparece al 0,67% y es máximo al 2,33%. */
  fortMinRatio: 0.0067,
  fortMaxRatio: 0.0233,
} as const;

// --- Servidor y partida ---------------------------------------------------

/** docs/SISTEMAS.md §2 [nuestro]: el punto medio de los servidores del original. */
export const TERRA: ServerConfig = {
  id: 'terra',
  turnMinutes: 10,
  turnCap: 180,
  protectionTurns: 120,
};

/**
 * docs/SISTEMAS.md §15. Los 200 acres, los 180 turnos y los 120 de protección
 * son [orig] (docs/ORIGINAL.md §4.1, confianza alta); el reparto de edificios
 * es [nuestro], elegido para arrancar con ingreso positivo de los cuatro
 * recursos, con farms y towns ya en la proporción de equilibrio 3:1, y con
 * **casi la mitad de la tierra sin construir** — porque decidir en qué gastarla
 * es la primera decisión del juego.
 */
export const STARTING_KINGDOM: StartingKingdom = {
  land: 200,
  buildings: {
    farms: 45,
    towns: 15,
    nodes: 20,
    workshops: 10,
    barracks: 10,
    guilds: 5,
    forts: 1,
    barriers: 0,
  },
  geld: 100_000,
  mana: 5_000,
  population: 4_500,
};
export * from './spells.js';
