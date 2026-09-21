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
import { MAX_SPELL_LEVEL, SPELLS_BY_ID } from './spells.js';
import { ITEMS_BY_ID } from './items.js';
import { SKILLS } from './skills.js';
import { UNITS_BY_ID } from './units.js';

// --- Esquemas -------------------------------------------------------------

const positiveInt = z.number().int().nonnegative();

export const buildingSpecSchema = z.object({
  cost: positiveInt,
  upkeepGeld: positiveInt,
  upkeepMana: positiveInt,
});

export const catalogSchema = z.object({
  buildings: z.object(
    Object.fromEntries(BUILDINGS.map((b) => [b, buildingSpecSchema])) as Record<
      Building,
      typeof buildingSpecSchema
    >,
  ),
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

export const CATALOG: Catalog = {
  buildings: BUILDING_SPECS,
  // La tropa de barracks y las unidades invocables, en el mismo sitio: para
  // `upkeep()` una unidad es una unidad, venga de donde venga.
  units: UNITS_BY_ID,
  // Fase 4: items y habilidades. Dato, no código (docs/SPECS.md §4).
  items: ITEMS_BY_ID,
  skills: SKILLS,
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
  /**
   * **[orig]** Suelo de geld por turno. docs/ORIGINAL.md §4.2.
   *
   * El resto del ingreso es una fórmula, no un número, y vive en
   * `income()`: `Pob × √((100 + 10×towns) / tierra)`.
   */
  geldFlat: 1_000,
  /** **[orig]** Espacio residencial por town: 1.000. */
  spacePerTown: 1_000,
  /** **[orig]** Espacio residencial por farm: 100. */
  spacePerFarm: 100,
  /**
   * **[orig]** Comida por farm: 500.
   *
   * Con estos tres números **la proporción que aconseja el original sale
   * sola**, y es **2,5 farms por town**, no 3: con 10 towns y 25 farms el
   * espacio da 12.500 y la comida 12.500. Es el ejemplo trabajado de la
   * wiki (docs/ORIGINAL.md §4.2), y lo comprueba un test.
   */
  foodPerFarm: 500,
  /** **[nuestro]** Una unidad es una boca. El porqué, en `EconomyTuning`. */
  foodPerUnit: 1,
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
 * El servidor rápido. docs/SISTEMAS.md §14.1.
 *
 * **[orig]** Las cadencias son del original ([ORIGINAL.md §2](ORIGINAL.md)):
 * Blitz va a 5 minutos con tope 200. Se copia esa fila.
 *
 * **La protección baja a la mitad.** Va en turnos **gastados** (§15), y
 * quien juega al doble de ritmo los gasta al doble: dejarla en 120 daría
 * el doble de tiempo real de protección en el servidor pensado para ir
 * deprisa.
 */
export const VELOZ: ServerConfig = {
  id: 'veloz',
  turnMinutes: 5,
  turnCap: 200,
  protectionTurns: 60,
};

/**
 * Los servidores que existen. **Dato, no código** (docs/SPECS.md §4):
 * añadir el tercero es añadir una fila.
 */
export const SERVERS: readonly ServerConfig[] = [TERRA, VELOZ];

export const SERVERS_BY_ID: Record<string, ServerConfig> = Object.fromEntries(
  SERVERS.map((s) => [s.id, s]),
);

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
  /**
   * Arranca lleno: espacio = 15×1.000 + 45×100 = **19.500**, comida =
   * 45×500 = 22.500, y manda el menor.
   *
   * Eran 4.500 hasta el 2026-09-21, con los coeficientes que nos habíamos
   * inventado (300 por town, la farm como tope de comida). Los publicados
   * (docs/ORIGINAL.md §4.2) alojan **4,3 veces más gente en la misma
   * tierra**, y con ella viene el geld: el ingreso es la población.
   */
  population: 19_500,
};
export * from './spells.js';
export * from './units.js';
export * from './items.js';
export * from './skills.js';
