/**
 * El catálogo de items. **Copiado, no inventado.**
 *
 * Los lesser items del original están publicados enteros, con sus números
 * ([docs/ORIGINAL.md §7.2](../../../docs/ORIGINAL.md), confianza alta). Se
 * encontró el 2026-09-21, yendo a interpolar dieciséis — y no hizo falta
 * ninguno.
 *
 * **Qué NO está aquí, y por qué:**
 *  - **Los 46 unique items.** La wiki publica sus nombres y no sus efectos.
 *  - **Tres deshabilitados en el propio original**: *Bottle of Eversmoking*,
 *    *Cosmetics* y *Dozens of Silver-tipped Arrows*.
 *  - **Las variantes «en Arch»**, que son de un servidor concreto. El
 *    nuestro es uno, y se adopta el valor base.
 *
 * **Tres entran como dato y no hacen nada**, con el motivo dicho en su
 * `effect`: espiar, disipar hechizos de dioses y los Griales piden
 * mecánicas que este juego no tiene. Están para que el catálogo esté
 * completo y para que el día que existan no haya que buscarlas.
 */

import type { ItemSpec } from '@archmage/core';

const ORIG = '[orig] ORIGINAL §7.2, publicado. Confianza alta.';

function item(x: Omit<ItemSpec, 'source'> & { source?: string }): ItemSpec {
  return { source: ORIG, ...x } as ItemSpec;
}

export const ITEMS: readonly ItemSpec[] = [
  // --- Fuera de batalla: lo que te da algo -------------------------------
  item({
    id: 'sage_stone',
    name: 'Piedra del Sabio',
    rarity: 'lesser',
    use: 'outOfBattle',
    effect: { kind: 'grantGeld', amount: { min: 1_000_000, max: 2_000_000 } },
  }),
  item({
    id: 'mana_crystal',
    name: 'Cristal de Maná',
    rarity: 'lesser',
    use: 'outOfBattle',
    // «El maná se concede **después** de cobrar el upkeep», dice la fuente:
    // por eso no salva a un mago que se está quedando a cero ese turno.
    effect: { kind: 'grantMana', amount: { min: 30_000, max: 70_000 } },
  }),
  item({
    id: 'book_of_prophecy',
    name: 'Libro de Profecías',
    rarity: 'lesser',
    use: 'outOfBattle',
    effect: { kind: 'grantPopulation', amount: { min: 5_000, max: 10_000 } },
  }),
  item({
    id: 'wine_of_three_whips',
    name: 'Vino de los Tres Látigos',
    rarity: 'lesser',
    use: 'outOfBattle',
    // +10%, **o lo que falte hasta el tope**: el que ya está lleno no gana
    // nada, y eso lo hace una decisión de cuándo usarlo.
    effect: { kind: 'grantPopulationShare', share: 0.1 },
  }),
  item({
    id: 'magical_compass',
    name: 'Brújula Mágica',
    rarity: 'lesser',
    use: 'outOfBattle',
    effect: { kind: 'grantLand', amount: { min: 100, max: 250 } },
  }),
  item({
    id: 'horn_of_valhalla',
    name: 'Cuerno del Valhalla',
    rarity: 'lesser',
    use: 'outOfBattle',
    effect: { kind: 'grantUnits', unitId: 'phalanx', amount: { min: 2_000, max: 4_000 } },
    source: `${ORIG} Da Knights; aquí, la unidad de melee equivalente del catálogo.`,
  }),
  item({
    id: 'book_of_golem_summoning',
    name: 'Libro de Invocación de Gólems',
    rarity: 'lesser',
    use: 'outOfBattle',
    effect: { kind: 'grantUnits', unitId: 'earth_elemental', amount: { min: 7, max: 25 } },
    source: `${ORIG} Da Iron Golems; aquí, el elemental de tierra.`,
  }),
  item({
    id: 'peaches',
    name: 'Melocotones',
    rarity: 'lesser',
    use: 'outOfBattle',
    effect: { kind: 'grantUnits', unitId: 'gorilla', amount: { min: 1_500, max: 5_000 } },
  }),
  item({
    id: 'treasure_chest',
    name: 'Cofre del Tesoro',
    rarity: 'lesser',
    use: 'outOfBattle',
    // La fuente da el 2% del unique; el resto se reparte a partes iguales.
    effect: {
      kind: 'weighted',
      options: [
        { weight: 0.02, effect: { kind: 'grantUniqueItem' } },
        { weight: 0.33, effect: { kind: 'grantGeld', amount: { min: 500_000, max: 500_000 } } },
        { weight: 0.33, effect: { kind: 'grantItems', count: 5 } },
        { weight: 0.32, effect: null },
      ],
    },
  }),

  // --- Fuera de batalla: lo que le hace algo a otro ----------------------
  item({
    id: 'voodoo_doll',
    name: 'Muñeco Vudú',
    rarity: 'lesser',
    use: 'outOfBattle',
    targeted: true,
    // **Los turnos son un objetivo militar.** Solo tiene sentido si el
    // turno es la moneda, que es exactamente el §2 de SISTEMAS.
    effect: { kind: 'enemyTurns', amount: { min: 2, max: 8 } },
  }),
  item({
    id: 'rotten_food',
    name: 'Comida Podrida',
    rarity: 'lesser',
    use: 'outOfBattle',
    targeted: true,
    effect: { kind: 'enemyPopulation', amount: { min: 5_000, max: 15_000 } },
  }),
  item({
    id: 'mana_vortex',
    name: 'Vórtice de Maná',
    rarity: 'lesser',
    use: 'outOfBattle',
    targeted: true,
    effect: { kind: 'enemyMana', amount: { min: 3_000, max: 9_000 } },
  }),
  item({
    id: 'pipes_of_the_sewer',
    name: 'Flautas de la Cloaca',
    rarity: 'lesser',
    use: 'outOfBattle',
    targeted: true,
    // **Exactamente**, sin azar. Es el único de los cuatro que no tira dado.
    effect: { kind: 'enemyGeldAndPopulation', geld: 500_000, population: 7_500 },
  }),
  item({
    id: 'letters_thieves_guild',
    name: 'Cartas del Gremio de Ladrones',
    rarity: 'lesser',
    use: 'outOfBattle',
    targeted: true,
    effect: { kind: 'stealFromEnemy' },
  }),
  item({
    id: 'official_list_of_demands',
    name: 'Lista Oficial de Exigencias',
    rarity: 'lesser',
    use: 'outOfBattle',
    targeted: true,
    effect: {
      kind: 'oneOf',
      options: [
        { kind: 'stealFromEnemy' },
        { kind: 'enemyMana', amount: { min: 3_000, max: 9_000 } },
        { kind: 'enemyPopulation', amount: { min: 5_000, max: 15_000 } },
        { kind: 'enemyTurns', amount: { min: 2, max: 8 } },
      ],
    },
  }),

  // --- Batalla: ataque ---------------------------------------------------
  item({
    id: 'potion_of_valor',
    name: 'Poción de Valor',
    rarity: 'lesser',
    use: 'battle',
    effect: { kind: 'ap', side: 'friendly', multiplier: 1.2 },
  }),
  item({
    id: 'bubble_wine',
    name: 'Vino Burbujeante',
    rarity: 'lesser',
    use: 'battle',
    // Sube ataque **y** HP. El de HP es el que más pesa: +30%.
    effect: { kind: 'hp', side: 'friendly', multiplier: 1.3 },
    source: `${ORIG} +10% de AP y +30% de HP; el AP va en 'bubble_wine_ap'.`,
  }),
  item({
    id: 'drums_of_war',
    name: 'Tambores de Guerra',
    rarity: 'lesser',
    use: 'battle',
    effect: { kind: 'ap', side: 'enemy', multiplier: 0.9 },
  }),
  item({
    id: 'monkey_brains',
    name: 'Sesos de Mono',
    rarity: 'lesser',
    use: 'battle',
    effect: { kind: 'ap', side: 'friendly', multiplier: 2, damageType: 'psychic' },
  }),
  item({
    id: 'ring_of_animal_command',
    name: 'Anillo de Mando Animal',
    rarity: 'lesser',
    use: 'battle',
    // **+100% a los tuyos y −100% a los suyos**: el item más brutal de la
    // lista, y solo contra ejércitos de animales.
    effect: { kind: 'ap', side: 'friendly', multiplier: 2, race: 'animal' },
    source: `${ORIG} También reduce el AP animal enemigo al 0%.`,
  }),

  // --- Batalla: iniciativa ----------------------------------------------
  item({
    id: 'ash_of_invisibility',
    name: 'Ceniza de Invisibilidad',
    rarity: 'lesser',
    use: 'battle',
    effect: { kind: 'initiativeSet', side: 'friendly', value: 6 },
  }),
  item({
    id: 'spiders_web',
    name: 'Telaraña',
    rarity: 'lesser',
    use: 'battle',
    effect: { kind: 'initiativeDelta', side: 'enemy', delta: -1 },
  }),
  item({
    id: 'sogroms_binding',
    name: 'Atadura de Sogrom',
    rarity: 'lesser',
    use: 'battle',
    effect: { kind: 'initiativeSet', side: 'enemy', value: 0, randomStack: true },
  }),
  item({
    id: 'nets_of_ensnarement',
    name: 'Redes de Captura',
    rarity: 'lesser',
    use: 'battle',
    effect: { kind: 'ground', side: 'enemy', initiativeDelta: -1 },
  }),
  item({
    id: 'carpet_of_flying',
    name: 'Alfombra Voladora',
    rarity: 'lesser',
    use: 'battle',
    // Da *Flying* a los tuyos: es lo que rompe el «melee no toca voladores»
    // del criterio 5 de §9.1, y por eso vale tanto.
    effect: { kind: 'grantFlying', side: 'friendly' },
  }),

  // --- Batalla: resistencias --------------------------------------------
  item({
    id: 'brooch_of_protection',
    name: 'Broche de Protección',
    rarity: 'lesser',
    use: 'battle',
    effect: { kind: 'resistance', side: 'friendly', damageType: 'melee', delta: 40, cap: 100 },
  }),
  item({
    id: 'missile_shield',
    name: 'Escudo contra Proyectiles',
    rarity: 'lesser',
    use: 'battle',
    effect: { kind: 'resistance', side: 'friendly', damageType: 'ranged', delta: 50, cap: 100 },
  }),
  item({
    id: 'scroll_protection_fire',
    name: 'Pergamino de Protección contra el Fuego',
    rarity: 'lesser',
    use: 'battle',
    effect: { kind: 'resistance', side: 'friendly', damageType: 'fire', delta: 40, cap: 100 },
  }),
  item({
    id: 'oil_flasks',
    name: 'Frascos de Aceite',
    rarity: 'lesser',
    use: 'battle',
    // **Sin tope por abajo**: puede dejar la resistencia al fuego en
    // negativo, y entonces el fuego hace más daño del normal.
    effect: { kind: 'resistance', side: 'enemy', damageType: 'fire', delta: -40 },
  }),
  item({
    id: 'pixie_dust',
    name: 'Polvo de Hada',
    rarity: 'lesser',
    use: 'battle',
    // **Se reparte entre los stacks**: contra un ejército de veinte stacks
    // hace un 1% a cada uno. Premia atacar a quien concentra.
    effect: { kind: 'resistanceSpread', side: 'enemy', delta: -20 },
  }),
  item({
    id: 'candle_of_sleeping',
    name: 'Vela del Sueño',
    rarity: 'lesser',
    use: 'battle',
    effect: { kind: 'resistance', side: 'enemy', delta: -10 },
    source: `${ORIG} También baja un 10% la eficiencia enemiga.`,
  }),
  item({
    id: 'satchel_of_mist',
    name: 'Zurrón de Niebla',
    rarity: 'lesser',
    use: 'battle',
    // **A los dos bandos.** Un item que también te perjudica: sirve al que
    // pega más fuerte por golpe, no al que pega más veces.
    effect: { kind: 'accuracy', side: 'enemy', delta: -10, bothSides: true },
  }),
  item({
    id: 'vial_of_venom',
    name: 'Vial de Veneno',
    rarity: 'lesser',
    use: 'battle',
    effect: { kind: 'addDamageType', side: 'friendly', add: 'poison', ifHas: 'melee' },
  }),

  // --- Batalla: daño directo --------------------------------------------
  item({
    id: 'figurine_ice_queen',
    name: 'Figurilla de la Reina de Hielo',
    rarity: 'lesser',
    use: 'battle',
    effect: {
      kind: 'directDamage',
      damageType: 'cold',
      base: 100_000,
      perUnit: { min: 1, max: 3 },
    },
  }),
  item({
    id: 'javelin_lightning',
    name: 'Jabalina del Rayo',
    rarity: 'lesser',
    use: 'battle',
    effect: {
      kind: 'directDamage',
      damageType: 'lightning',
      base: 100_000,
      perUnit: { min: 1, max: 3 },
    },
    source: `${ORIG} También baja un 25% el contraataque enemigo.`,
  }),
  item({
    id: 'staff_of_illusion',
    name: 'Bastón de Ilusión',
    rarity: 'lesser',
    use: 'battle',
    effect: {
      kind: 'directDamage',
      damageType: 'magic',
      base: 100_000,
      perUnit: { min: 1, max: 3 },
    },
  }),
  item({
    id: 'powder_keg',
    name: 'Barril de Pólvora',
    rarity: 'lesser',
    use: 'battle',
    // **Sin el base de 100.000**: solo `1-3 × unidades`. Es el hermano
    // pobre de los tres de arriba, y la fuente lo dice así.
    effect: { kind: 'directDamage', damageType: 'fire', base: 0, perUnit: { min: 1, max: 3 } },
  }),
  item({
    id: 'flasks_of_holy_water',
    name: 'Frascos de Agua Bendita',
    rarity: 'lesser',
    use: 'battle',
    effect: { kind: 'damageToRace', damageType: 'holy', race: 'undead', damage: 100_000 },
  }),
  item({
    id: 'head_of_medusa',
    name: 'Cabeza de Medusa',
    rarity: 'lesser',
    use: 'battle',
    // **1-10 unidades**, no un porcentaje: contra stacks de élite muy caros
    // vale una fortuna, y contra veinte mil milicias no hace nada.
    effect: { kind: 'destroyUnits', side: 'enemy', amount: { min: 1, max: 10 } },
  }),

  // --- Batalla: curar y resucitar ---------------------------------------
  item({
    id: 'ointment_of_healing',
    name: 'Ungüento Curativo',
    rarity: 'lesser',
    use: 'battle',
    effect: { kind: 'heal', side: 'friendly', perUnit: { min: 1, max: 5 } },
  }),
  item({
    id: 'pouch_of_herbs',
    name: 'Bolsa de Hierbas',
    rarity: 'lesser',
    use: 'battle',
    effect: { kind: 'resurrect', share: 0.15 },
    source: `${ORIG} También da +10% de resistencia al veneno.`,
  }),
  item({
    id: 'strange_metallic_can',
    name: 'Extraña Lata Metálica',
    rarity: 'lesser',
    use: 'battle',
    // **Solo de los stacks que no fueron aniquilados**: no resucita a los
    // que desaparecieron del todo.
    effect: { kind: 'resurrect', share: 0.25 },
  }),
  item({
    id: 'capsule_monster',
    name: 'Monstruo Cápsula',
    rarity: 'lesser',
    use: 'battle',
    effect: { kind: 'summonTemporary', unitId: 'gorilla', count: 1_000 },
    source: `${ORIG} Invoca 1.000 Capsule Monsters que desaparecen al acabar; aquí, gorilas.`,
  }),

  // --- Entran como dato y no hacen nada, con el motivo dicho -------------
  item({
    id: 'crystal_ball',
    name: 'Bola de Cristal',
    rarity: 'lesser',
    use: 'outOfBattle',
    targeted: true,
    effect: {
      kind: 'notImplemented',
      why: 'Espiar necesita un sistema de información sobre otros magos que este juego no tiene.',
    },
  }),
  item({
    id: 'minor_indulgence',
    name: 'Indulgencia Menor',
    rarity: 'lesser',
    use: 'outOfBattle',
    effect: {
      kind: 'notImplemented',
      why: 'Disipa hechizos de dioses, y los dioses están fuera de alcance (SISTEMAS §16).',
    },
  }),
  item({
    id: 'blood_stained_map',
    name: 'Mapa Manchado de Sangre',
    rarity: 'lesser',
    use: 'outOfBattle',
    effect: {
      kind: 'notImplemented',
      why: 'Da Griales, y los cinco Griales no existen en este juego.',
    },
  }),
];

export const ITEMS_BY_ID: Record<string, ItemSpec> = Object.fromEntries(
  ITEMS.map((i) => [i.id, i]),
);

/** Los que se pueden llevar a una batalla. */
export const BATTLE_ITEM_IDS = ITEMS.filter((i) => i.use === 'battle').map((i) => i.id);
/** Los que se usan fuera y hacen algo. */
export const USABLE_ITEM_IDS = ITEMS.filter(
  (i) => i.use === 'outOfBattle' && i.effect.kind !== 'notImplemented',
).map((i) => i.id);
