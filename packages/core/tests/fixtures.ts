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
import type { SpellSpec } from '../src/spells.js';
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
  // Espacio = 15×1.000 + 45×100 = 19.500; comida = 45×500 = 22.500.
  population: 19_500,
};

/**
 * Hechizos de prueba. **Copian la forma**, no el catálogo de verdad: aquí se
 * prueban las reglas, y que los datos reales sean los que son lo comprueban
 * los tests de `content`.
 */
export const SPELLS_TEST: Record<string, SpellSpec> = {
  // Verdant, en color para un mago verde.
  summon_dryad: {
    id: 'summon_dryad', name: 'Summon Dryad', school: 'verdant', rank: 'simple',
    castTurns: 1, castMana: 3_000, researchCost: 900, upkeepMana: 0,
    effect: { kind: 'summon', unitId: 'dryad', min: 2_200, max: 3_000 },
    source: 'test',
  },
  weather_summoning: {
    id: 'weather_summoning', name: 'Weather Summoning', school: 'verdant', rank: 'average',
    castTurns: 2, castMana: 7_900, researchCost: 1_400, upkeepMana: 60,
    effect: { kind: 'enchantment', modifiers: { farmOutput: 125 } },
    source: 'test',
  },
  slow_ritual: {
    id: 'slow_ritual', name: 'Slow Ritual', school: 'verdant', rank: 'complex',
    castTurns: 4, castMana: 30_000, researchCost: 2_500, upkeepMana: 0,
    effect: { kind: 'resource', geld: 50_000 },
    source: 'test',
  },
  plant_growth: {
    id: 'plant_growth', name: 'Plant Growth', school: 'verdant', rank: 'ultimate',
    castTurns: 8, castMana: 120_000, researchCost: 12_000, upkeepMana: 250,
    effect: { kind: 'combat', note: 'fase 3' },
    source: 'test',
  },
  // Plain: propio para todos.
  mana_tap: {
    id: 'mana_tap', name: 'Mana Tap', school: 'plain', rank: 'simple',
    castTurns: 1, castMana: 0, researchCost: 900, upkeepMana: 0,
    effect: { kind: 'resource', mana: 1_500 },
    source: 'test',
  },
  // Nether: opuesta a Verdant.
  dark_pact: {
    id: 'dark_pact', name: 'Dark Pact', school: 'nether', rank: 'average',
    castTurns: 1, castMana: 10_000, researchCost: 1_400, upkeepMana: 0,
    effect: { kind: 'resource', geld: 30_000 },
    source: 'test',
  },
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
    // Copian fichas publicadas del original (docs/ORIGINAL.md §9.5).
    // Upkeep en **centésimas**.
    militia: {
      id: 'militia', name: 'Milicia', specialty: 'plain', race: 'human',
      attack: { power: 80, types: ['melee'], initiative: 1 },
      counterAttack: 20, hitPoints: 80, abilities: ['clumsiness'],
      resistances: {}, weaknesses: [], spellResistances: {}, powerRank: 9,
      cost: 20, costPopulation: 1, upkeepGeld: 32, upkeepMana: 0,
      populationSpace: 1, recruitPerBarracks: 5, source: 'test [orig]',
    },
    phalanx: {
      id: 'phalanx', name: 'Falange', specialty: 'plain', race: 'human',
      attack: { power: 150, types: ['melee'], initiative: 2 },
      counterAttack: 60, hitPoints: 200, abilities: ['pike'],
      resistances: {}, weaknesses: [], spellResistances: {}, powerRank: 25,
      cost: 45, costPopulation: 1, upkeepGeld: 60, upkeepMana: 0,
      populationSpace: 1, recruitPerBarracks: 3, source: 'test',
    },
    cavalry: {
      id: 'cavalry', name: 'Caballería', specialty: 'plain', race: 'human',
      attack: { power: 420, types: ['melee'], initiative: 4 },
      counterAttack: 120, hitPoints: 320, abilities: ['swift'],
      resistances: {}, weaknesses: [], spellResistances: {}, powerRank: 68,
      cost: 150, costPopulation: 2, upkeepGeld: 190, upkeepMana: 0,
      populationSpace: 2, recruitPerBarracks: 1, source: 'test',
    },
    dryad: {
      id: 'dryad', name: 'Dríade', specialty: 'verdant', race: 'pixie',
      attack: { power: 240, types: ['magic', 'ranged'], initiative: 3 },
      counterAttack: 0, hitPoints: 70, abilities: ['beauty', 'charm'],
      resistances: { melee: 40 }, weaknesses: [], spellResistances: {}, powerRank: 23,
      cost: 0, costPopulation: 0, upkeepGeld: 80, upkeepMana: 1,
      populationSpace: 1, recruitPerBarracks: 0, source: 'test [orig]',
    },
  },
  spells: SPELLS_TEST,
  // Fase 4. **Dos items de batalla y nada más.** Los tests de las fases
  // 1-3 no llevan ninguno puesto, que es justo lo que tienen que
  // comprobar: sin items, nada de lo calibrado se mueve. Estos dos están
  // para los tests que sí quieren comprobar que se aplican.
  items: {
    potion_of_valor: {
      id: 'potion_of_valor',
      name: 'Poción de Valor',
      rarity: 'lesser',
      use: 'battle',
      effect: { kind: 'ap', side: 'friendly', multiplier: 1.2 },
      source: 'test [orig]',
    },
    strange_metallic_can: {
      id: 'strange_metallic_can',
      name: 'Extraña Lata Metálica',
      rarity: 'lesser',
      use: 'battle',
      effect: { kind: 'resurrect', share: 0.25 },
      source: 'test [orig]',
    },
  },
  skills: [],
  maxSpellLevel: 31,
};

/** docs/SISTEMAS.md §5.3 y §5.4. Los valores son los publicados: ORIGINAL.md §4.2. */
export const TUNING: EconomyTuning = {
  geldFlat: 1_000,
  spacePerTown: 1_000,
  spacePerFarm: 100,
  foodPerFarm: 500,
  foodPerUnit: 1,
  populationGrowthFlat: 50,
  populationGrowthRate: 0.015,
  manaStoragePerNode: 1_000,
};

/**
 * Azar determinista para los tests.
 *
 * Reexporta el generador del núcleo: **una sola implementación** para el
 * servidor, el simulador y los tests. Antes había tres copias de un xorshift32
 * y una de ellas tenía un fallo que no daba error (ver `src/random.ts`).
 */
export { makeRandom as seededRandom } from '../src/random.js';

/** Construye el estado que quieras directamente: nadie juega hasta llegar. */
export function mageWith(
  buildings: Partial<Buildings>,
  land: number,
  extra: Partial<{
    population: number;
    geld: number;
    mana: number;
    army: Stack[];
    /** Fase 4: inventario y habilidades, para los tests que los necesiten. */
    items: Record<string, number>;
    skills: Record<string, number>;
  }> = {},
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
    casting: null,
    enchantments: [],
    heroes: [],
    items: extra.items ?? {},
    skills: extra.skills ?? {},
  };
}
