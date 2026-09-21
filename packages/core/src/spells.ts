/**
 * La forma de un hechizo y de su efecto.
 *
 * **La decisión de diseño de este módulo**: el efecto es una **forma
 * cerrada**, no un nombre que el núcleo tenga que reconocer. El núcleo sabe
 * resolver *invocar*, *encantar* y *dar recursos*; el catálogo dice cuál de
 * las tres y con qué números.
 *
 * Si añadir un hechizo obligara a tocar `core`, el modelo estaría mal — y el
 * contenido habría dejado de ser dato (docs/SPECS.md §4).
 *
 * Fuera de alcance en la fase 2, declarado:
 *  - **Los efectos de combate.** Un hechizo marcado `combat` está en el
 *    catálogo con su rango y sus costes, se puede investigar y **no se puede
 *    lanzar**: su efecto necesita una batalla, y no hay batallas hasta la
 *    fase 3 (docs/SISTEMAS.md §7.1).
 *  - **Los hechizos ofensivos**, que apuntan a otro mago. Misma razón.
 *  - **Ancient** y el mercado negro que los vende (fase 4).
 */

import type { SpellRank } from './magic.js';
import type { SpellId, Specialty, UnitId } from './types.js';

/**
 * Multiplicadores sobre la economía, en **centésimas** (100 = sin cambio).
 * Enteros, para que el único redondeo esté donde se aplican.
 *
 * Es la lista cerrada de lo que un encantamiento puede tocar en la fase 2.
 * Ampliarla es una decisión de diseño, no un detalle de implementación.
 */
export interface EconomyModifiers {
  /** Comida que produce una farm. */
  farmOutput?: number;
  /** Geld por habitante. */
  townOutput?: number;
  /** Maná que producen los nodes. */
  nodeOutput?: number;
  /** Crecimiento de población por turno. */
  populationGrowth?: number;
  /** Velocidad de construcción. */
  buildRate?: number;
  /** Velocidad de investigación. */
  researchRate?: number;
}

export type SpellEffect =
  /** Trae unidades al ejército. La cantidad escala con el nivel de hechizo. */
  | { kind: 'summon'; unitId: UnitId; min: number; max: number }
  /** Encantamiento propio, con upkeep continuo. */
  | { kind: 'enchantment'; modifiers: EconomyModifiers }
  /** Efecto inmediato sobre los recursos. */
  | { kind: 'resource'; geld?: number; mana?: number; population?: number }
  /**
   * Reservado para la fase 3. Está en el catálogo y **no se lanza**: el
   * libro enseña la escuela entera, que es lo que hace que elegir escuela
   * signifique algo, sin que haya código sin comprobar.
   */
  | { kind: 'combat'; note: string };

export interface SpellSpec {
  id: SpellId;
  name: string;
  school: Specialty;
  rank: SpellRank;
  /** Turnos que tarda en completarse el lanzamiento. 0 = inmediato. */
  castTurns: number;
  /** Coste base en maná, **en tu color**. El recargo lo pone `castCost()`. */
  castMana: number;
  researchCost: number;
  /** Mantenimiento continuo. Solo los encantamientos. */
  upkeepMana: number;
  effect: SpellEffect;
  /** De dónde sale el número: la fuente del original, o el porqué si es nuestro. */
  source: string;
}

/**
 * Un hechizo de combate se puede **aprender** pero no **lanzar** en la
 * fase 2. Es la única puerta: si algún día se olvida, el test lo pilla.
 */
export function isCastable(spell: SpellSpec): boolean {
  return spell.effect.kind !== 'combat';
}

/** Los encantamientos son los únicos con upkeep. */
export function isEnchantment(spell: SpellSpec): boolean {
  return spell.effect.kind === 'enchantment';
}

/**
 * Cuántas unidades trae una invocación, escalado por el nivel de hechizo.
 *
 * **El nivel de referencia es el NUESTRO, no el del original**
 * (docs/SISTEMAS.md §7.1). Las cifras publicadas son a nivel 624, y el
 * catálogo de una sola escuela llega a bastante menos: copiar el 624 dejaría
 * todas las invocaciones en una fracción ridícula de lo que deberían.
 *
 * A nivel máximo sale el rango publicado; a nivel cero, un suelo del 25%.
 * Entre medias, lineal. El azar reparte dentro del rango y **sale del
 * `RandomSource`** (docs/SPECS.md §5, invariante 3), así que una invocación
 * se puede repetir exacta.
 *
 * Se trunca **una sola vez**, al final.
 */
export const SUMMON_FLOOR = 25; // centésimas: 25% a nivel cero

export function summonCount(
  effect: Extract<SpellEffect, { kind: 'summon' }>,
  spellLevel: number,
  maxSpellLevel: number,
  roll: number,
): number {
  const span = effect.max - effect.min;
  const bruto = effect.min + span * Math.min(1, Math.max(0, roll));
  const ratio = maxSpellLevel > 0 ? Math.min(1, Math.max(0, spellLevel / maxSpellLevel)) : 0;
  const escala = SUMMON_FLOOR + (100 - SUMMON_FLOOR) * ratio;
  return Math.floor((bruto * escala) / 100);
}
