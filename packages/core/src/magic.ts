/**
 * La rueda de escuelas, el coste de lanzar fuera de color y el nivel de
 * hechizo.
 *
 * Todo lo de este módulo es **[orig]** y está publicado
 * (docs/ORIGINAL.md §5, §6.1 y §6.2, confianza alta). La rueda no es
 * decoración temática: junto con la tabla de multiplicadores es **la
 * decisión estructural de elegir escuela**.
 *
 * Fuera de alcance aquí:
 *  - Los hechizos Ancient, que no se investigan sino que se compran en el
 *    mercado negro (fase 4).
 *  - Las habilidades que modifican la magia —*Spell Penetration*,
 *    *Spell Mastery*, *Grand Enchanter*— son de la fase 4.
 */

import type { Specialty } from './types.js';

export const RANKS = ['simple', 'average', 'complex', 'ultimate', 'ancient'] as const;
export type SpellRank = (typeof RANKS)[number];

/** Dónde cae una escuela respecto a la tuya. */
export type Relation = 'own' | 'adjacent' | 'opposite';

/**
 * La rueda. docs/SISTEMAS.md §6 [orig].
 *
 * Cinco colores en círculo: cada uno tiene dos vecinos y dos opuestos.
 * `plain` está fuera del círculo y se trata aparte (ver `relationTo`).
 */
const ADJACENT: Record<Exclude<Specialty, 'plain'>, readonly Specialty[]> = {
  ascendant: ['phantasm', 'verdant'],
  verdant: ['ascendant', 'eradication'],
  eradication: ['verdant', 'nether'],
  nether: ['eradication', 'phantasm'],
  phantasm: ['nether', 'ascendant'],
};

/**
 * Qué es `school` para un mago de escuela `mage`.
 *
 * **Plain es de todos** (docs/SISTEMAS.md §6 [nuestro]): es la magia neutra
 * y de utilidad, así que cuenta como color propio para cualquiera y no paga
 * recargo. Sin esa regla, un mago Plain no podría lanzar ni su propia magia.
 *
 * Y al revés: **un mago Plain no tiene color propio**, así que todo lo que no
 * sea Plain le queda lejos. Es el precio de no especializarse.
 */
export function relationTo(mage: Specialty, school: Specialty): Relation {
  if (school === 'plain') return 'own';
  if (mage === school) return 'own';
  if (mage === 'plain') return 'opposite';
  return ADJACENT[mage].includes(school) ? 'adjacent' : 'opposite';
}

/**
 * Multiplicadores de maná al lanzar. docs/ORIGINAL.md §6.1, confianza alta.
 *
 * `null` significa **no se puede lanzar**: los Ultimate son solo de tu color.
 * Se guardan en centésimas para que el único redondeo esté en `castCost`.
 */
const CAST_MULTIPLIER: Record<SpellRank, Record<Relation, number | null>> = {
  simple: { own: 100, adjacent: 125, opposite: 200 },
  average: { own: 100, adjacent: 150, opposite: 350 },
  complex: { own: 100, adjacent: 200, opposite: 600 },
  ultimate: { own: 100, adjacent: null, opposite: null },
  ancient: { own: 100, adjacent: 125, opposite: 200 },
};

/**
 * Lo que de verdad te cuesta lanzar un hechizo, a ti.
 *
 * Devuelve `null` si no puedes lanzarlo. **Se trunca una sola vez, aquí**
 * (docs/SPECS.md §5, invariante 7): el multiplicador del Simple adyacente es
 * 1,25 y no da entero con cualquier precio base.
 */
export function castCost(
  baseMana: number,
  rank: SpellRank,
  relation: Relation,
  /**
   * *Spell Mastery*. **Por defecto 1**: un mago sin la habilidad paga
   * exactamente lo de antes, y los tests de la fase 2 no se mueven.
   */
  mastery = 1,
): number | null {
  const mult = CAST_MULTIPLIER[rank][relation];
  if (mult === null) return null;
  // **Un solo `floor`**, con la habilidad dentro (docs/SPECS.md, invariante 7).
  return Math.floor((baseMana * mult * mastery) / 100);
}

/**
 * Qué rangos se pueden investigar de cada escuela.
 * docs/ORIGINAL.md §6.1, confianza alta.
 *
 * Los **Ancient no están**: no se investigan, se compran (fase 4).
 */
const RESEARCHABLE: Record<Relation, readonly SpellRank[]> = {
  own: ['simple', 'average', 'complex', 'ultimate'],
  adjacent: ['simple', 'average', 'complex'],
  opposite: ['simple', 'average'],
};

export function canResearch(mage: Specialty, school: Specialty, rank: SpellRank): boolean {
  return RESEARCHABLE[relationTo(mage, school)].includes(rank);
}

/**
 * Lo que sube el nivel de hechizo al **aprender** uno.
 * docs/ORIGINAL.md §6.2, confianza alta.
 *
 * Nota del original: **Armageddon no suma**, a propósito. Cuando exista
 * (fase 5) será la excepción, y estará marcada en su entrada del catálogo.
 */
const LEVEL_GAIN: Record<SpellRank, number> = {
  simple: 1,
  average: 3,
  complex: 7,
  ultimate: 20,
  ancient: 15,
};

/**
 * Lo que sube el nivel al aprender un hechizo.
 *
 * **`noSpellLevel` lo pone a cero**, y lo tiene exactamente uno:
 * *Armageddon* (docs/ORIGINAL.md §10.1). Es el único del catálogo que no te
 * hace más fuerte — aprenderlo solo sirve para acabar el mundo.
 */
export function spellLevelGain(rank: SpellRank, noSpellLevel = false): number {
  return noSpellLevel ? 0 : LEVEL_GAIN[rank];
}

/**
 * El nivel es la suma de lo aprendido. Nada más.
 *
 * Acepta rangos sueltos —como siempre— o fichas enteras, que es lo que hace
 * falta para respetar `noSpellLevel` sin que quien llama tenga que saber
 * cuál es la excepción.
 */
export function spellLevelOf(
  learned: readonly (SpellRank | { rank: SpellRank; noSpellLevel?: boolean })[],
): number {
  let total = 0;
  for (const x of learned) {
    if (typeof x === 'string') total += LEVEL_GAIN[x];
    else total += spellLevelGain(x.rank, x.noSpellLevel);
  }
  return total;
}

/**
 * Si se puede investigar un hechizo marcado `researchLast`.
 *
 * *Armageddon* **se investiga después de todos los demás**
 * (docs/ORIGINAL.md §10.1): es el último botón del juego, y tiene que
 * costar llegar a él.
 */
export function canResearchLast(
  knownIds: readonly string[],
  allIds: readonly string[],
  itselfId: string,
): boolean {
  const faltan = allIds.filter((id) => id !== itselfId && !knownIds.includes(id));
  return faltan.length === 0;
}
