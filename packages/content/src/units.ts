/**
 * Las unidades, con su ficha completa.
 *
 * **Siete tienen ficha publicada** en el original y se copian exactas
 * (docs/ORIGINAL.md §9.5, confianza alta). Las otras trece se interpolan con
 * una regla escrita, y lo dicen en su `source`.
 *
 * ## Lo que esto corrige
 *
 * Los upkeeps de las fases 1 y 2 **estaban mal por un factor de entre 40 y
 * 100**: la Dríade cuesta **0,01** de maná y se había puesto 1; el Treant
 * **0,63** y se había puesto 24. Y la tropa de barracks también: la Milicia
 * cuesta **20** de geld al reclutar y **0,32** de upkeep, no 60 y 1.
 *
 * Y una premisa que también era falsa: **varias unidades invocadas cuestan
 * geld además de maná**. El Arquero élfico cuesta 1,04 de geld y 0,005 de
 * maná. La fase 2 asumía que lo invocado solo costaba maná.
 *
 * ## La regla de interpolación, para las trece sin ficha
 *
 * De las siete publicadas sale una escala por nivel de poder. Para las demás
 * se eligen ataque y HP coherentes con su rango de invocación, y el
 * `powerRank` se estima con `~6 × raíz(ataque × HP)`, que es lo que sale de
 * ajustar las publicadas —militia 8,9, arquero 5,5, dríade 5,6, druida 7,0,
 * ninfa 6,1, fénix 6,6; el treant se sale (14) y no se fuerza—.
 *
 * **No es la fórmula del original**, que no está publicada: es una
 * aproximación declarada, y si la simulación de la fase 3 dice que una unidad
 * está mal valorada, se cambia **aquí**.
 *
 * Todos los upkeeps están en **centésimas** (docs/SPECS.md §4).
 */

import type { UnitSpec } from '@archmage/core';

/** Ayuda para no repetir los campos vacíos. */
function unidad(u: Partial<UnitSpec> & Pick<UnitSpec, 'id' | 'name' | 'source'>): UnitSpec {
  return {
    specialty: 'verdant',
    race: 'treefolk',
    attack: { power: 0, types: ['melee'], initiative: 1 },
    counterAttack: 0,
    hitPoints: 1,
    abilities: [],
    resistances: {},
    weaknesses: [],
    spellResistances: {},
    powerRank: 1,
    cost: 0,
    costPopulation: 0,
    upkeepGeld: 0,
    upkeepMana: 0,
    populationSpace: 1,
    recruitPerBarracks: 0,
    ...u,
  } as UnitSpec;
}

// --- Tropa de barracks ----------------------------------------------------

const BARRACKS: UnitSpec[] = [
  unidad({
    id: 'militia',
    name: 'Milicia',
    specialty: 'plain',
    race: 'human',
    attack: { power: 80, types: ['melee'], initiative: 1 },
    counterAttack: 20,
    hitPoints: 80,
    abilities: ['clumsiness'],
    powerRank: 9,
    cost: 20,
    costPopulation: 1,
    upkeepGeld: 32,
    recruitPerBarracks: 5,
    source: '[orig] FICHA PUBLICADA — ORIGINAL §9.5: ataque 80, contraataque 20, HP 80, iniciativa 1, powerRank 9, recluta 20 de geld y 1 de población, upkeep 0,32 de geld. Confianza alta.',
  }),
  unidad({
    id: 'phalanx',
    name: 'Falange',
    specialty: 'plain',
    race: 'human',
    attack: { power: 150, types: ['melee'], initiative: 2 },
    counterAttack: 60,
    hitPoints: 200,
    abilities: ['pike'],
    powerRank: 25,
    cost: 45,
    costPopulation: 1,
    upkeepGeld: 60,
    recruitPerBarracks: 3,
    source: '[nuestro] Interpolada entre Milicia (publicada) y Piqueros. Pike porque el original da esa habilidad a la infantería de asta.',
  }),
  unidad({
    id: 'pikemen',
    name: 'Piqueros',
    specialty: 'plain',
    race: 'human',
    attack: { power: 200, types: ['melee'], initiative: 2 },
    counterAttack: 90,
    hitPoints: 230,
    abilities: ['pike'],
    powerRank: 33,
    cost: 60,
    costPopulation: 1,
    upkeepGeld: 75,
    recruitPerBarracks: 3,
    source: '[nuestro] Interpolada. Algo por encima de la Falange.',
  }),
  unidad({
    id: 'archers',
    name: 'Arqueros',
    specialty: 'plain',
    race: 'human',
    attack: { power: 130, types: ['missile', 'ranged'], initiative: 3 },
    counterAttack: 0,
    hitPoints: 110,
    abilities: ['marksmanship'],
    powerRank: 22,
    cost: 55,
    costPopulation: 1,
    upkeepGeld: 100,
    recruitPerBarracks: 2,
    source: '[nuestro] Calcada del Arquero élfico publicado (120/100/init 3/rank 20, upkeep 1,04 de geld), que es su equivalente humano.',
  }),
  unidad({
    id: 'cavalry',
    name: 'Caballería',
    specialty: 'plain',
    race: 'human',
    attack: { power: 420, types: ['melee'], initiative: 4 },
    counterAttack: 120,
    hitPoints: 320,
    abilities: ['swift'],
    powerRank: 68,
    cost: 150,
    costPopulation: 2,
    upkeepGeld: 190,
    populationSpace: 2,
    recruitPerBarracks: 1,
    source: '[nuestro] Interpolada. La más cara de barracks; Swift por la iniciativa alta, como el Arquero élfico publicado.',
  }),
];

// --- Invocables de Verdant ------------------------------------------------

const VERDANT: UnitSpec[] = [
  unidad({
    id: 'dryad',
    name: 'Dríade',
    race: 'pixie',
    attack: { power: 240, types: ['magic', 'ranged'], initiative: 3 },
    hitPoints: 70,
    abilities: ['beauty', 'charm'],
    resistances: { missile: 30, poison: 20, magic: 20, melee: 40, paralyse: 30, psychic: 40 },
    powerRank: 23,
    upkeepGeld: 80,
    upkeepMana: 1,
    source: '[orig] FICHA PUBLICADA — ORIGINAL §9.5: ataque 240 (Magic+Ranged), HP 70, iniciativa 3, powerRank 23, upkeep 0,80 de geld y 0,01 de maná, Beauty y Charm, con su tabla de resistencias. Confianza alta.',
  }),
  unidad({
    id: 'creeping_vines',
    name: 'Enredaderas',
    attack: { power: 180, types: ['melee'], initiative: 1 },
    counterAttack: 90,
    hitPoints: 260,
    abilities: ['endurance'],
    resistances: { missile: 50, melee: 30, poison: 60, fire: 0 },
    powerRank: 25,
    upkeepGeld: 70,
    upkeepMana: 2,
    source: '[nuestro] Interpolada al nivel de la Dríade. Aguanta más y pega menos, y es débil al fuego como todo lo vegetal del original.',
  }),
  unidad({
    id: 'gorilla',
    name: 'Gorila',
    race: 'animal',
    attack: { power: 360, types: ['melee'], initiative: 2 },
    counterAttack: 140,
    hitPoints: 300,
    abilities: [],
    resistances: { melee: 30, missile: 20 },
    powerRank: 38,
    upkeepGeld: 90,
    upkeepMana: 3,
    source: '[nuestro] Interpolada. Animal de melee puro, sin habilidades.',
  }),
  unidad({
    id: 'nymph',
    name: 'Ninfa',
    race: 'pixie',
    attack: { power: 940, types: ['psychic', 'ranged'], initiative: 3 },
    hitPoints: 150,
    abilities: ['beauty', 'charm'],
    resistances: { psychic: 50, magic: 30, melee: 20 },
    powerRank: 62,
    upkeepMana: 8,
    source: '[orig] FICHA PUBLICADA — ORIGINAL §9.5: ataque 940 (Psychic+Ranged), HP 150, iniciativa 3, powerRank 62, upkeep 0,075 de maná, Beauty y Charm. Confianza alta. El upkeep se redondea a 0,08 por el punto fijo en centésimas.',
  }),
  unidad({
    id: 'elven_archer',
    name: 'Arquero élfico',
    race: 'elf',
    attack: { power: 120, types: ['missile', 'ranged'], initiative: 3 },
    hitPoints: 100,
    abilities: ['marksmanship', 'swift'],
    resistances: { missile: 30 },
    powerRank: 20,
    upkeepGeld: 104,
    upkeepMana: 1,
    source: '[orig] FICHA PUBLICADA — ORIGINAL §9.5: ataque 120 (Missile+Ranged), HP 100, iniciativa 3, powerRank 20, upkeep 1,04 de geld y 0,005 de maná, Marksmanship y Swift. Confianza alta. El maná sube a 0,01 por el punto fijo.',
  }),
  unidad({
    id: 'werebear',
    name: 'Oso licántropo',
    race: 'animal',
    attack: { power: 1_400, types: ['melee'], initiative: 2 },
    counterAttack: 560,
    hitPoints: 900,
    abilities: ['endurance', 'regeneration'],
    resistances: { melee: 40, missile: 30, cold: 50 },
    powerRank: 130,
    upkeepMana: 18,
    populationSpace: 2,
    source: '[nuestro] Interpolada entre la Ninfa y el Treant publicados.',
  }),
  unidad({
    id: 'swanmay',
    name: 'Doncella cisne',
    race: 'elf',
    attack: { power: 700, types: ['melee'], initiative: 4 },
    counterAttack: 200,
    hitPoints: 240,
    abilities: ['flying', 'beauty'],
    resistances: { melee: 20, cold: 40 },
    powerRank: 72,
    upkeepMana: 10,
    source: '[nuestro] Interpolada. **Vuela**, que en el original es lo que la pone delante en el orden de stacks y la hace difícil de alcanzar.',
  }),
  unidad({
    id: 'elven_magician',
    name: 'Mago élfico',
    race: 'elf',
    attack: { power: 1_800, types: ['magic', 'ranged'], initiative: 4 },
    hitPoints: 260,
    abilities: ['marksmanship'],
    resistances: { magic: 60, psychic: 40 },
    spellResistances: { verdant: 40 },
    powerRank: 145,
    upkeepMana: 22,
    source: '[nuestro] Interpolada. Daño mágico a distancia, frágil.',
  }),
  unidad({
    id: 'druid',
    name: 'Druida',
    race: 'elf',
    attack: { power: 440, types: ['magic', 'ranged'], initiative: 3 },
    counterAttack: 60,
    hitPoints: 180,
    abilities: ['healing'],
    resistances: { magic: 40, poison: 50 },
    powerRank: 40,
    upkeepGeld: 80,
    upkeepMana: 5,
    source: '[orig] FICHA PUBLICADA — ORIGINAL §9.5: ataque 440 (Magic+Ranged), contraataque 60, HP 180, iniciativa 3, powerRank 40, upkeep 0,80 de geld y 0,05 de maná. Confianza alta. Healing es [nuestro]: el original lo llama «sacerdote de la naturaleza».',
  }),
  unidad({
    id: 'griffon',
    name: 'Grifo',
    race: 'animal',
    attack: { power: 2_200, types: ['melee'], initiative: 4 },
    counterAttack: 800,
    hitPoints: 1_500,
    abilities: ['flying', 'swift'],
    resistances: { melee: 40, missile: 50, lightning: 30 },
    powerRank: 210,
    upkeepMana: 30,
    populationSpace: 2,
    source: '[nuestro] Interpolada por debajo del Treant. Vuela y es rápido.',
  }),
  unidad({
    id: 'mandrake',
    name: 'Mandrágora',
    attack: { power: 900, types: ['poison'], initiative: 2 },
    counterAttack: 300,
    hitPoints: 700,
    abilities: ['endurance'],
    resistances: { poison: 90, melee: 50, missile: 40, fire: 0 },
    powerRank: 95,
    upkeepMana: 12,
    source: '[nuestro] Interpolada. Daño de veneno puro, muy resistente al veneno y débil al fuego, como el resto de lo vegetal.',
  }),
  unidad({
    id: 'earth_elemental',
    name: 'Elemental de tierra',
    race: 'elemental',
    attack: { power: 6_000, types: ['melee'], initiative: 1 },
    counterAttack: 2_400,
    hitPoints: 9_000,
    abilities: ['endurance', 'scales', 'siege'],
    resistances: { melee: 70, missile: 80, poison: 100, cold: 60, paralyse: 100, lightning: 0 },
    powerRank: 640,
    upkeepMana: 95,
    populationSpace: 3,
    source: '[nuestro] Interpolada por encima del Treant. **Siege**, que es lo que evita la penalización de asedio (ORIGINAL §9).',
  }),
  unidad({
    id: 'treant',
    name: 'Treant',
    attack: { power: 4_200, types: ['melee'], initiative: 1 },
    extraAttack: { power: 2_500, types: ['melee'], initiative: 1 },
    counterAttack: 1_680,
    hitPoints: 4_200,
    abilities: ['additional_strike', 'endurance'],
    resistances: {
      poison: 90, melee: 67, missile: 67, ranged: 67, cold: 80,
      paralyse: 75, psychic: 75, magic: 50, holy: 50,
      fire: 0, breath: 0, lightning: 0,
    },
    // Resiste 0% al fuego **y además** es débil a él: la ficha publicada
    // dice las dos cosas, y son dos cosas distintas (docs/ORIGINAL.md §9.1).
    weaknesses: ['fire'],
    spellResistances: { phantasm: 80 },
    powerRank: 423,
    upkeepMana: 63,
    populationSpace: 3,
    source: '[orig] FICHA PUBLICADA — ORIGINAL §9.5: ataque 4.200, contraataque 1.680, extra 2.500, HP 4.200, iniciativa 1, powerRank 423, upkeep 0,63 de maná, Additional Strike y Endurance, debilidad al fuego, y su tabla entera de resistencias. Confianza alta.',
  }),
  unidad({
    id: 'faerie_dragon',
    name: 'Dragón feérico',
    race: 'dragon',
    attack: { power: 40_000, types: ['magic'], initiative: 3 },
    extraAttack: { power: 90_000, types: ['breath'], initiative: 5 },
    counterAttack: 12_000,
    hitPoints: 25_000,
    abilities: ['flying', 'additional_strike', 'regeneration'],
    resistances: { magic: 70, melee: 60, missile: 70, breath: 80, psychic: 60 },
    spellResistances: { phantasm: 60, verdant: 50 },
    powerRank: 9_400,
    upkeepMana: 2_200,
    populationSpace: 4,
    source: '[nuestro] Interpolada entre el Treant y el Fénix publicados. Vuela y tiene aliento, como los dragones del original.',
  }),
  unidad({
    id: 'phoenix',
    name: 'Fénix',
    race: 'animal',
    attack: { power: 200_000, types: ['magic'], initiative: 1 },
    extraAttack: { power: 600_000, types: ['magic', 'ranged'], initiative: 5 },
    counterAttack: 40_000,
    hitPoints: 70_000,
    abilities: ['flying', 'regeneration', 'bursting'],
    resistances: {
      fire: 100, missile: 90, poison: 80, breath: 80, magic: 80,
      lightning: 80, cold: 80, paralyse: 80, psychic: 80, holy: 80,
      ranged: 80, melee: 80,
    },
    spellResistances: { eradication: 80, nether: 75, phantasm: 50 },
    powerRank: 36_883,
    upkeepMana: 6_000,
    populationSpace: 5,
    source: '[orig] FICHA PUBLICADA — ORIGINAL §9.5: ataque 200.000 (Magic), extra 600.000 (Magic+Ranged, iniciativa 5), contraataque 40.000, HP 70.000, powerRank 36.883, upkeep 60 de maná, Bursting de fuego 50.000, Flying y Regeneration. Confianza alta.',
  }),
];

export const UNITS: UnitSpec[] = [...BARRACKS, ...VERDANT];

export const UNITS_BY_ID: Record<string, UnitSpec> = Object.fromEntries(
  UNITS.map((u) => [u.id, u]),
);

/** Las siete con ficha publicada. El test comprueba que no se tocan. */
export const PUBLISHED_UNITS = [
  'militia',
  'dryad',
  'nymph',
  'elven_archer',
  'druid',
  'treant',
  'phoenix',
] as const;
