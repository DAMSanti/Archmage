/**
 * Datos de prueba del núcleo.
 *
 * **Copian** los valores de `@archmage/content` a propósito: el núcleo no
 * puede depender del contenido (sería una dependencia circular, y rompería el
 * invariante 1 de docs/SPECS.md). Aquí se prueban **las reglas**; que los
 * datos de verdad sean éstos lo comprueban los tests de `content`.
 */
import { emptyBuildings, emptyConstruction, type StartingKingdom } from '../src/mage.js';
import type { Buildings, Catalog, MageState, ServerConfig, Stack } from '../src/types.js';
import type { EconomyTuning } from '../src/economy.js';

/** El servidor de referencia. docs/SISTEMAS.md §2 [nuestro]. */
export const TERRA: ServerConfig = {
  id: 'terra',
  turnMinutes: 10,
  turnCap: 180,
  protectionTurns: 120,
};

/** El reino de partida. docs/SISTEMAS.md §15. */
export const STARTING_KINGDOM: StartingKingdom = {
  land: 200,
  buildings: {
    ...emptyBuildings(),
    farms: 45,
    towns: 15,
    nodes: 20,
    workshops: 10,
    barracks: 10,
    guilds: 5,
    forts: 1,
  },
  geld: 100_000,
  mana: 5_000,
  population: 4_500,
};

/** docs/SISTEMAS.md §4.2. */
export const CATALOG: Catalog = {
  buildings: {
    farms: { cost: 1_000, upkeepGeld: 5, upkeepMana: 0 },
    barracks: { cost: 1_000, upkeepGeld: 5, upkeepMana: 0 },
    workshops: { cost: 2_000, upkeepGeld: 5, upkeepMana: 0 },
    guilds: { cost: 4_000, upkeepGeld: 15, upkeepMana: 0 },
    towns: { cost: 6_000, upkeepGeld: 5, upkeepMana: 0 },
    nodes: { cost: 6_000, upkeepGeld: 6, upkeepMana: 0 },
    forts: { cost: 60_000, upkeepGeld: 100, upkeepMana: 0 },
    barriers: { cost: 10_000, upkeepGeld: 20, upkeepMana: 50 },
  },
  units: {
    militia: {
      id: 'militia',
      name: 'Milicia',
      specialty: 'plain',
      cost: 60,
      upkeepGeld: 1,
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
      upkeepPopulation: 0,
      populationSpace: 1,
      recruitPerBarracks: 3,
    },
    cavalry: {
      id: 'cavalry',
      name: 'Caballería',
      specialty: 'plain',
      cost: 250,
      upkeepGeld: 4,
      upkeepPopulation: 0,
      populationSpace: 2,
      recruitPerBarracks: 1,
    },
  },
};

/** docs/SISTEMAS.md §5.3 y §5.4. */
export const TUNING: EconomyTuning = {
  geldBase: 0.75,
  geldPerTownRatio: 2,
  populationPerTown: 300,
  populationPerFarm: 100,
  populationGrowthFlat: 50,
  populationGrowthRate: 0.015,
  manaStoragePerNode: 1_000,
};

/**
 * Azar determinista para los tests. docs/SPECS.md §5, invariante 3: el azar
 * entra por `Ctx`, y con semilla fija un test nunca sale intermitente.
 *
 * Generador xorshift32: pequeño, reproducible y suficiente para decidir qué
 * stack se disuelve.
 */
export function seededRandom(seed: number) {
  let s = seed >>> 0 || 1;
  const next = (): number => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 0x1_0000_0000;
  };
  return { next, nextInt: (max: number) => Math.floor(next() * max) };
}

/** Construye el estado que quieras directamente: nadie juega hasta llegar. */
export function mageWith(
  buildings: Partial<Buildings>,
  land: number,
  extra: Partial<{ population: number; geld: number; mana: number; army: Stack[] }> = {},
): MageState {
  const b: Buildings = { ...emptyBuildings(), ...buildings };
  const construidos = Object.values(b).reduce((a, v) => a + v, 0);
  return {
    id: 'test',
    serverId: TERRA.id,
    name: 'Test',
    specialty: 'plain',
    turns: { current: 100, lastAccrualAt: 0 },
    turnsSpent: 0,
    land: { total: land, free: land - construidos },
    buildings: b,
    construction: emptyConstruction(),
    resources: {
      geld: extra.geld ?? 1_000_000,
      mana: extra.mana ?? 100_000,
      population: extra.population ?? 0,
    },
    army: extra.army ?? [],
    recruiting: null,
    spellbook: { known: [], researching: null, level: 0 },
    enchantments: [],
    heroes: [],
    items: {},
    skills: {},
  };
}
