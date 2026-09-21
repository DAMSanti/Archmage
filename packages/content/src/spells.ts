/**
 * El catálogo de hechizos de **Plain y Verdant**.
 *
 * Spec en docs/SISTEMAS.md §7.1. Verdant se eligió por ser la escuela mejor
 * documentada del original (docs/ORIGINAL.md §6.4): **catorce hechizos y
 * quince unidades con nombre confirmado**, y fichas completas de tres rangos.
 *
 * Cada entrada lleva su `source`: qué publica la wiki y qué hemos puesto
 * nosotros. Son tres niveles y **no se mezclan en silencio**:
 *
 *  - `[orig] ficha` — los cuatro costes están publicados. Se copian exactos.
 *  - `[orig] nombre` — el hechizo o la unidad existen en el original con ese
 *    nombre, pero sus números no están publicados: van por la escala de
 *    rango.
 *  - `[nuestro]` — inventado entero, con su porqué.
 *
 * La escala por rango sale de las fichas publicadas
 * (docs/ORIGINAL.md §6.3):
 *
 *  | Rango | Turnos | Maná | Investigación |
 *  |---|---|---|---|
 *  | Simple | 1 | 3.000 | 900 |
 *  | Average | 2 | 7.900 | 1.400 |
 *  | Complex | 4-6 | 30.000-77.700 | 2.500-10.000 |
 *  | Ultimate | 8-12 | ~120.000 | ~12.000 | ← extrapolado
 *
 * Fuera de alcance, declarado: los hechizos de combate y ofensivos están
 * aquí con sus costes y **marcados `combat`**, que los hace investigables y
 * no lanzables hasta la fase 3.
 */

import type { SpellSpec, UnitEconomySpec } from '@archmage/core';

// --- Plain: magia neutra y de utilidad -----------------------------------
//
// [nuestro] entero. El original tiene una escuela Plain «neutra y
// administrativa» (docs/ORIGINAL.md §5) pero no publica ni un nombre. Se
// diseña pequeña y económica a propósito: es lo que todo mago puede lanzar,
// así que si fuera potente aplanaría la elección de escuela.

const PLAIN: SpellSpec[] = [
  {
    id: 'prospectors_eye',
    name: "Prospector's Eye",
    school: 'plain',
    rank: 'simple',
    castTurns: 1,
    castMana: 3_000,
    researchCost: 900,
    upkeepMana: 0,
    effect: { kind: 'resource', geld: 20_000 },
    source: '[nuestro] Escala Simple de ORIGINAL §6.3. 20.000 de geld son ~5 turnos de ingreso de un mago de 200 acres: útil al empezar, irrelevante luego, que es lo que debe ser un Simple de utilidad.',
  },
  {
    id: 'mana_tap',
    name: 'Mana Tap',
    school: 'plain',
    rank: 'simple',
    castTurns: 1,
    castMana: 0,
    researchCost: 900,
    upkeepMana: 0,
    effect: { kind: 'resource', mana: 1_500 },
    source: '[nuestro] Cuesta 0 y da 1.500: es el hechizo de emergencia para no quedarte a cero de maná y perder los encantamientos. Gasta un turno, que es su verdadero precio.',
  },
  {
    id: 'artisans_focus',
    name: "Artisan's Focus",
    school: 'plain',
    rank: 'average',
    castTurns: 2,
    castMana: 7_900,
    researchCost: 1_400,
    upkeepMana: 40,
    effect: { kind: 'enchantment', modifiers: { buildRate: 120 } },
    source: '[nuestro] Escala Average de ORIGINAL §6.3. +20% de construcción por 40 de maná/turno: compite con tener más workshops, que es la alternativa natural.',
  },
  {
    id: 'scholars_lamp',
    name: "Scholar's Lamp",
    school: 'plain',
    rank: 'average',
    castTurns: 2,
    castMana: 7_900,
    researchCost: 1_400,
    upkeepMana: 40,
    effect: { kind: 'enchantment', modifiers: { researchRate: 125 } },
    source: '[nuestro] +25% de investigación. Es el hechizo que se lanza pronto y se mantiene: acelera aprender todo lo demás.',
  },
  {
    id: 'census',
    name: 'Census',
    school: 'plain',
    rank: 'average',
    castTurns: 2,
    castMana: 7_900,
    researchCost: 1_400,
    upkeepMana: 50,
    effect: { kind: 'enchantment', modifiers: { populationGrowth: 130 } },
    source: '[nuestro] +30% de crecimiento de población. La población es el cuello de botella del geld (SISTEMAS §5.3), así que esto es economía indirecta.',
  },
  {
    id: 'aureate_vein',
    name: 'Aureate Vein',
    school: 'plain',
    rank: 'complex',
    castTurns: 4,
    castMana: 30_000,
    researchCost: 2_500,
    upkeepMana: 150,
    effect: { kind: 'enchantment', modifiers: { townOutput: 115 } },
    source: '[nuestro] Escala Complex baja de ORIGINAL §6.3 (la de Summon Unicorn). +15% de geld por 150 de maná/turno: convierte maná en geld, que es la conversión que el original hace con Aureate Conversion (Phantasm).',
  },
];

// --- Verdant: invocaciones ------------------------------------------------
//
// Las quince unidades tienen **nombre confirmado** (docs/ORIGINAL.md §6.4).
// Dos de los hechizos tienen ficha completa publicada.

const VERDANT_SUMMONS: SpellSpec[] = [
  {
    id: 'summon_dryad',
    name: 'Summon Dryad',
    school: 'verdant',
    rank: 'simple',
    castTurns: 1,
    castMana: 3_000,
    researchCost: 900,
    upkeepMana: 0,
    effect: { kind: 'summon', unitId: 'dryad', min: 2_200, max: 3_000 },
    source: '[orig] ficha — ORIGINAL §6.3: 1 turno, 3.000 de maná, 900 de investigación, confianza alta. La CANTIDAD no está publicada: [nuestro], por encima de la ninfa porque es un rango menor y una unidad más débil.',
  },
  {
    id: 'summon_creeping_vines',
    name: 'Summon Creeping Vines',
    school: 'verdant',
    rank: 'simple',
    castTurns: 1,
    castMana: 3_000,
    researchCost: 900,
    upkeepMana: 0,
    effect: { kind: 'summon', unitId: 'creeping_vines', min: 1_800, max: 2_600 },
    source: '[orig] nombre de unidad — ORIGINAL §6.4. Costes por la escala Simple.',
  },
  {
    id: 'summon_gorilla',
    name: 'Summon Gorilla',
    school: 'verdant',
    rank: 'simple',
    castTurns: 1,
    castMana: 3_000,
    researchCost: 900,
    upkeepMana: 0,
    effect: { kind: 'summon', unitId: 'gorilla', min: 1_400, max: 2_000 },
    source: '[orig] nombre de unidad — ORIGINAL §6.4. Costes por la escala Simple.',
  },
  {
    id: 'summon_nymph',
    name: 'Summon Nymph',
    school: 'verdant',
    rank: 'average',
    castTurns: 2,
    castMana: 7_900,
    researchCost: 1_400,
    upkeepMana: 0,
    effect: { kind: 'summon', unitId: 'nymph', min: 1_700, max: 2_400 },
    source: '[orig] ficha COMPLETA — ORIGINAL §6.3: 2 turnos, 7.900 de maná, 1.400 de investigación, y 1.700-2.400 ninfas. Confianza alta. Es el ancla de la que cuelga toda la escala.',
  },
  {
    id: 'summon_elven_archer',
    name: 'Summon Elven Archer',
    school: 'verdant',
    rank: 'average',
    castTurns: 2,
    castMana: 7_900,
    researchCost: 1_400,
    upkeepMana: 0,
    effect: { kind: 'summon', unitId: 'elven_archer', min: 1_200, max: 1_700 },
    source: '[orig] nombre de unidad — ORIGINAL §6.4. Costes por la escala Average.',
  },
  {
    id: 'summon_werebear',
    name: 'Summon Werebear',
    school: 'verdant',
    rank: 'average',
    castTurns: 3,
    castMana: 9_500,
    researchCost: 1_600,
    upkeepMana: 0,
    effect: { kind: 'summon', unitId: 'werebear', min: 700, max: 1_000 },
    source: '[orig] nombre de unidad — ORIGINAL §6.4. Algo por encima de la escala Average: menos unidades y más caras, siguiendo la regla de que el coste va con el poder total invocado, no con el número.',
  },
  {
    id: 'summon_swanmay',
    name: 'Summon Swanmay',
    school: 'verdant',
    rank: 'average',
    castTurns: 2,
    castMana: 7_900,
    researchCost: 1_400,
    upkeepMana: 0,
    effect: { kind: 'summon', unitId: 'swanmay', min: 900, max: 1_300 },
    source: '[orig] nombre de unidad — ORIGINAL §6.4. Costes por la escala Average.',
  },
  {
    id: 'summon_elven_magician',
    name: 'Summon Elven Magician',
    school: 'verdant',
    rank: 'complex',
    castTurns: 4,
    castMana: 30_000,
    researchCost: 2_500,
    upkeepMana: 0,
    effect: { kind: 'summon', unitId: 'elven_magician', min: 800, max: 1_100 },
    source: '[orig] nombre de unidad — ORIGINAL §6.4. Escala Complex baja, la de Summon Unicorn (30.000/2.500/4), que también invoca unos 900-1.000.',
  },
  {
    id: 'summon_druid',
    name: 'Summon Druid',
    school: 'verdant',
    rank: 'complex',
    castTurns: 5,
    castMana: 41_700,
    researchCost: 4_000,
    upkeepMana: 0,
    effect: { kind: 'summon', unitId: 'druid', min: 550, max: 750 },
    source: '[orig] nombre de unidad — ORIGINAL §6.4. Escala Complex media, la de Summon Hydra (41.700/4.000/5, que trae 700-800).',
  },
  {
    id: 'summon_griffon',
    name: 'Summon Griffon',
    school: 'verdant',
    rank: 'complex',
    castTurns: 5,
    castMana: 41_700,
    researchCost: 4_000,
    upkeepMana: 0,
    effect: { kind: 'summon', unitId: 'griffon', min: 480, max: 660 },
    source: '[orig] nombre de unidad — ORIGINAL §6.4. Escala Complex media. Vuela, así que en la fase 3 valdrá más por unidad.',
  },
  {
    id: 'summon_mandrake',
    name: 'Summon Mandrake',
    school: 'verdant',
    rank: 'complex',
    castTurns: 4,
    castMana: 30_000,
    researchCost: 2_500,
    upkeepMana: 0,
    effect: { kind: 'summon', unitId: 'mandrake', min: 700, max: 950 },
    source: '[orig] nombre de unidad — ORIGINAL §6.4. Escala Complex baja.',
  },
  {
    id: 'summon_earth_elemental',
    name: 'Summon Earth Elemental',
    school: 'verdant',
    rank: 'complex',
    castTurns: 6,
    castMana: 77_700,
    researchCost: 10_000,
    upkeepMana: 0,
    effect: { kind: 'summon', unitId: 'earth_elemental', min: 280, max: 380 },
    source: '[orig] nombre de unidad — ORIGINAL §6.4. Escala Complex ALTA, la de Summon Vampire (77.700/10.000/6, que trae ~295).',
  },
  {
    id: 'summon_treant',
    name: 'Summon Treant',
    school: 'verdant',
    rank: 'ultimate',
    castTurns: 9,
    castMana: 120_000,
    researchCost: 12_000,
    upkeepMana: 0,
    effect: { kind: 'summon', unitId: 'treant', min: 220, max: 300 },
    source: '[orig] nombre de unidad, y la wiki dice que «los treants son el corazón de muchos ejércitos verdes» (ORIGINAL §6.4), así que es el Ultimate. Costes [nuestro]: escala Ultimate extrapolada de SISTEMAS §7.1.',
  },
  {
    id: 'summon_faerie_dragon',
    name: 'Summon Faerie Dragon',
    school: 'verdant',
    rank: 'ultimate',
    castTurns: 10,
    castMana: 140_000,
    researchCost: 14_000,
    upkeepMana: 0,
    effect: { kind: 'summon', unitId: 'faerie_dragon', min: 130, max: 180 },
    source: '[orig] nombre de unidad — ORIGINAL §6.4. Costes [nuestro], por encima del Treant: menos unidades y más caras.',
  },
  {
    id: 'summon_phoenix',
    name: 'Summon Phoenix',
    school: 'verdant',
    rank: 'ultimate',
    castTurns: 12,
    castMana: 160_000,
    researchCost: 16_000,
    upkeepMana: 0,
    effect: { kind: 'summon', unitId: 'phoenix', min: 90, max: 130 },
    source: '[orig] nombre de unidad, descrita como «unidad mágica de mucho daño, inmune al fuego» (ORIGINAL §6.4): la más cara de la escuela. Costes [nuestro].',
  },
];

// --- Verdant: encantamientos ---------------------------------------------

const VERDANT_ENCHANTMENTS: SpellSpec[] = [
  {
    id: 'weather_summoning',
    name: 'Weather Summoning',
    school: 'verdant',
    rank: 'average',
    castTurns: 2,
    castMana: 7_900,
    researchCost: 1_400,
    upkeepMana: 60,
    effect: { kind: 'enchantment', modifiers: { farmOutput: 125 } },
    source: '[orig] nombre y efecto — ORIGINAL §6.4: «boosts farm output». Los números son [nuestro], por la escala Average. +25% de comida sube el tope de población, que es el cuello de botella del geld.',
  },
  {
    id: 'natures_favor',
    name: "Nature's Favor",
    school: 'verdant',
    rank: 'complex',
    castTurns: 4,
    castMana: 30_000,
    researchCost: 2_500,
    upkeepMana: 180,
    effect: {
      kind: 'enchantment',
      modifiers: { farmOutput: 115, populationGrowth: 120 },
    },
    source: '[orig] nombre y efecto — ORIGINAL §6.4: «farm output, pop income, and unit generation». Se implementan los dos primeros; la generación de unidades es de la fase 3. Números [nuestro], escala Complex baja.',
  },
];

// --- Verdant: lo que espera a la fase 3 ----------------------------------
//
// Están en el catálogo con sus costes: se investigan, suben el nivel de
// hechizo y se ven en el libro. **No se lanzan.** El libro enseña la escuela
// entera —que es lo que hace que elegir escuela signifique algo— sin que
// haya código que nadie pueda verificar (SISTEMAS §7.1).

const VERDANT_RESERVED: SpellSpec[] = [
  {
    id: 'plant_growth',
    name: 'Plant Growth',
    school: 'verdant',
    rank: 'ultimate',
    castTurns: 8,
    castMana: 120_000,
    researchCost: 12_000,
    upkeepMana: 250,
    effect: { kind: 'combat', note: '+ataque, contraataque y vida a los treefolk. El original da +228% a nivel 428.' },
    source: '[orig] nombre y efecto con cifra — ORIGINAL §6.4. Es el encantamiento insignia de Verdant. Costes [nuestro], escala Ultimate.',
  },
  {
    id: 'natures_lore',
    name: "Nature's Lore",
    school: 'verdant',
    rank: 'complex',
    castTurns: 4,
    castMana: 30_000,
    researchCost: 2_500,
    upkeepMana: 150,
    effect: { kind: 'combat', note: 'Sube el daño de las unidades élficas.' },
    source: '[orig] nombre y efecto — ORIGINAL §6.4. Costes [nuestro].',
  },
  {
    id: 'sunray',
    name: 'Sunray',
    school: 'verdant',
    rank: 'complex',
    castTurns: 4,
    castMana: 30_000,
    researchCost: 2_500,
    upkeepMana: 100,
    effect: { kind: 'combat', note: 'Resistencia a magia Nether y Phantasm.' },
    source: '[orig] nombre, efecto y UPKEEP — ORIGINAL §6.4 dice «100 mp upkeep». El upkeep es [orig]; el resto, [nuestro].',
  },
  {
    id: 'regeneration',
    name: 'Regeneration',
    school: 'verdant',
    rank: 'complex',
    castTurns: 0,
    castMana: 30_000,
    researchCost: 3_000,
    upkeepMana: 0,
    effect: { kind: 'combat', note: 'Cura el 15% de tus bajas al acabar la batalla (5% fuera de color, 2% en la opuesta).' },
    source: '[orig] ficha COMPLETA con sus porcentajes — ORIGINAL §6.3 y §6.4, confianza alta.',
  },
  {
    id: 'rust_armor',
    name: 'Rust Armor',
    school: 'verdant',
    rank: 'average',
    castTurns: 2,
    castMana: 7_900,
    researchCost: 1_400,
    upkeepMana: 0,
    effect: { kind: 'combat', note: 'Reduce la resistencia al melee del enemigo.' },
    source: '[orig] nombre y efecto — ORIGINAL §6.4. Costes [nuestro].',
  },
  {
    id: 'call_hurricane',
    name: 'Call Hurricane',
    school: 'verdant',
    rank: 'complex',
    castTurns: 4,
    castMana: 20_000,
    researchCost: 2_500,
    upkeepMana: 0,
    effect: { kind: 'combat', note: 'Afecta a las unidades voladoras enemigas.' },
    source: '[orig] nombre, efecto y COSTE — ORIGINAL §6.4 da 20.000 de maná. El resto, [nuestro].',
  },
  {
    id: 'web_of_the_spider_woman',
    name: 'Web of the Spider Woman',
    school: 'verdant',
    rank: 'simple',
    castTurns: 1,
    castMana: 600,
    researchCost: 900,
    upkeepMana: 0,
    effect: { kind: 'combat', note: 'Reduce la iniciativa del enemigo.' },
    source: '[orig] nombre, efecto y COSTE — ORIGINAL §6.4 da 600 de maná, muy por debajo de la escala Simple. Se respeta: es un hechizo de batalla barato, no una invocación.',
  },
  {
    id: 'summon_locust_swarm',
    name: 'Summon Locust Swarm',
    school: 'verdant',
    rank: 'average',
    castTurns: 2,
    castMana: 7_900,
    researchCost: 1_400,
    upkeepMana: 0,
    effect: { kind: 'combat', note: 'Ofensivo: daña las farms del enemigo.' },
    source: '[orig] nombre — ORIGINAL §6.4. Es ofensivo pese al nombre «summon». Costes [nuestro].',
  },
  {
    id: 'serenity',
    name: 'Serenity',
    school: 'verdant',
    rank: 'complex',
    castTurns: 4,
    castMana: 30_000,
    researchCost: 2_500,
    upkeepMana: 0,
    effect: { kind: 'combat', note: 'Ofensivo: disipa al azar encantamientos del mago objetivo.' },
    source: '[orig] nombre y efecto — ORIGINAL §6.4. Costes [nuestro].',
  },
  {
    id: 'wooden_soul',
    name: 'Wooden Soul',
    school: 'verdant',
    rank: 'complex',
    castTurns: 4,
    castMana: 30_000,
    researchCost: 2_500,
    upkeepMana: 120,
    effect: { kind: 'combat', note: 'Encantamiento defensivo de la escuela.' },
    source: '[orig] nombre — ORIGINAL §6.4; el efecto exacto no está publicado. Costes [nuestro].',
  },
];

export const SPELLS: SpellSpec[] = [
  ...PLAIN,
  ...VERDANT_SUMMONS,
  ...VERDANT_ENCHANTMENTS,
  ...VERDANT_RESERVED,
];

export const SPELLS_BY_ID: Record<string, SpellSpec> = Object.fromEntries(
  SPELLS.map((s) => [s.id, s]),
);

// --- Las unidades invocables ---------------------------------------------
//
// **Solo la mitad económica**, como la tropa reclutada (SISTEMAS §8.1):
// upkeep, espacio y escuela ahora; ataque, defensa, HP e iniciativa en la
// fase 3.
//
// Las invocadas cuestan **maná** de mantener, no geld: es lo que hace a
// Verdant «muy intensiva en maná» como dice el original (ORIGINAL §6.4), y
// lo que da sentido a volcar la tierra en nodes.

function invocada(
  id: string,
  name: string,
  upkeepMana: number,
  populationSpace: number,
): UnitEconomySpec {
  return {
    id,
    name,
    specialty: 'verdant',
    // No se reclutan en barracks: se invocan. El coste es el del hechizo.
    cost: 0,
    upkeepGeld: 0,
    upkeepPopulation: 0,
    populationSpace,
    recruitPerBarracks: 1,
    upkeepMana,
  };
}

export const SUMMONED_UNITS: Record<string, UnitEconomySpec> = Object.fromEntries(
  [
    invocada('dryad', 'Dríade', 1, 1),
    invocada('creeping_vines', 'Enredaderas', 1, 1),
    invocada('gorilla', 'Gorila', 2, 1),
    invocada('nymph', 'Ninfa', 2, 1),
    invocada('elven_archer', 'Arquero élfico', 3, 1),
    invocada('werebear', 'Oso licántropo', 5, 2),
    invocada('swanmay', 'Doncella cisne', 4, 1),
    invocada('elven_magician', 'Mago élfico', 6, 1),
    invocada('druid', 'Druida', 9, 2),
    invocada('griffon', 'Grifo', 10, 2),
    invocada('mandrake', 'Mandrágora', 7, 1),
    invocada('earth_elemental', 'Elemental de tierra', 18, 3),
    invocada('treant', 'Treant', 24, 4),
    invocada('faerie_dragon', 'Dragón feérico', 38, 4),
    invocada('phoenix', 'Fénix', 55, 5),
  ].map((u) => [u.id, u]),
);

/**
 * El nivel de hechizo máximo de **este** catálogo: 207.
 *
 * Medido el 2026-09-21 y comprobado con un test. Es el que escala las
 * invocaciones (docs/SISTEMAS.md §7.1) — **no el 624 del original**, que
 * corresponde a un mago con las seis escuelas investigadas. Cuando se añadan
 * más escuelas, este número sube solo y las invocaciones se recalibran con
 * él.
 */
export const MAX_SPELL_LEVEL = 207;
