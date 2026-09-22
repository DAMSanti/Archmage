/**
 * La ficha completa de una unidad.
 *
 * Hasta la fase 2 solo existía la **mitad económica**; la de combate estaba
 * `[abierto]` esperando a que se investigara. Ya no: las fichas del original
 * están publicadas (docs/ORIGINAL.md §9.5, confianza alta) y se copian.
 *
 * **El upkeep va en centésimas.** Los valores publicados son fraccionarios
 * —la Dríade cuesta 0,01 de maná, el Arquero élfico 1,04 de geld— y los
 * recursos son enteros (docs/SPECS.md §5, invariante 7). Se guarda la tasa
 * ×100 y **el total se redondea una sola vez**, al sumar el ejército entero:
 * con miles de unidades la fracción deja de importar, y con tres unidades no
 * cobrar nada es lo correcto.
 *
 * Fuera de alcance en este módulo:
 *  - **Cómo se consigue** una unidad. Reclutar es fase 1, invocar fase 2; la
 *    taberna y el mercado, fase 4.
 *  - Las habilidades se declaran aquí y **las resuelve el combate**
 *    (fase 3): este módulo solo dice cuáles tiene.
 */

import type { Specialty, UnitId } from './types.js';

/**
 * Los tipos de daño del original (docs/ORIGINAL.md §9.5). Una unidad tiene
 * una resistencia para cada uno, y un ataque puede tener varios —entonces la
 * resistencia se promedia.
 */
export const DAMAGE_TYPES = [
  'melee',
  'ranged',
  'missile',
  'magic',
  'psychic',
  'fire',
  'cold',
  'lightning',
  'breath',
  'poison',
  'paralyse',
  'holy',
] as const;
export type DamageType = (typeof DAMAGE_TYPES)[number];

/**
 * Las habilidades que el original documenta (docs/ORIGINAL.md §7).
 *
 * Están aquí como lista cerrada a propósito: **una habilidad es dato, no un
 * caso especial en el código** (docs/SISTEMAS.md §8). El combate sabe
 * resolver estas; añadir una es añadirla aquí y darle su regla, no un `if`
 * con el nombre de una unidad.
 */
export const ABILITIES = [
  // Ofensivas
  'marksmanship',
  'additional_strike',
  'bursting',
  'siege',
  'piercing',
  'steal_life',
  // Defensivas — multiplican el daño recibido (docs/ORIGINAL.md §9.1)
  'endurance',
  'scales',
  'large_shield',
  'healing',
  'regeneration',
  'charm',
  'beauty',
  'pike',
  // De acierto y orden
  'fear',
  'swift',
  'clumsiness',
  'paralyze',
  // De movimiento
  'flying',
] as const;
export type Ability = (typeof ABILITIES)[number];

/** Un ataque: su potencia, sus tipos y su iniciativa. */
export interface Attack {
  power: number;
  /** Con varios, la resistencia del defensor se promedia. */
  types: readonly DamageType[];
  /** 0-5. Con 0 no ataca. docs/SISTEMAS.md §9.1 [nuestro]. */
  initiative: number;
}

/** Resistencias en porcentaje. Lo que no esté, es 0. */
export type Resistances = Partial<Record<DamageType, number>>;
export type SpellResistances = Partial<Record<Specialty, number>>;

export interface UnitSpec {
  id: UnitId;
  name: string;
  specialty: Specialty;
  /** Raza. Importa para el bonus de héroe (docs/ORIGINAL.md §7). */
  race: string;

  // --- Combate ---
  attack: Attack;
  /** Ataque extra, con su propia iniciativa. No gasta eficiencia. */
  extraAttack?: Attack;
  /** Potencia del contraataque. 0 = no contraataca. */
  counterAttack: number;
  hitPoints: number;
  abilities: readonly Ability[];
  resistances: Resistances;
  /**
   * Tipos de daño a los que la unidad es **débil**.
   *
   * No es lo mismo que resistir 0%: una debilidad **duplica el daño**
   * recibido (`WEAKNESS_MULTIPLIER` en `combat.ts`). El Treant resiste 0% al
   * fuego **y además** es débil a él: las dos cosas están en su ficha
   * publicada, y son dos cosas.
   *
   * **Este comentario decía «−50 en la media de resistencia» hasta el
   * 2026-09-22**, que fue como se modeló al principio y resultó falso: la
   * página *Damage Formula* dice `weakness (2.0 ...)`, un multiplicador
   * aparte. El código se corrigió en la fase 3 y este docstring se quedó
   * atrás — que es exactamente el tipo de mentira que no da ningún error.
   */
  weaknesses: readonly DamageType[];
  spellResistances: SpellResistances;
  /**
   * Lo que vale en net power. **Publicado en la ficha del original**
   * (docs/ORIGINAL.md §3.2 y §9.5): cierra el hueco que el net power tenía
   * desde la fase 1.
   */
  powerRank: number;

  // --- Economía ---
  /** Geld al reclutar. 0 si solo se invoca. */
  cost: number;
  /** Población que consume al reclutar. */
  costPopulation: number;
  /** **Centésimas** de geld por turno. */
  upkeepGeld: number;
  /** **Centésimas** de maná por turno. */
  upkeepMana: number;
  /** Espacio de población que ocupa. */
  populationSpace: number;
  /** Unidades por turno y por barracks. 0 si no se recluta. */
  recruitPerBarracks: number;
  /** De dónde salen sus números. */
  source: string;
}

/** Una unidad se recluta si se puede reclutar. */
export function isRecruitable(unit: UnitSpec): boolean {
  return unit.recruitPerBarracks > 0;
}

export function hasAbility(unit: UnitSpec, ability: Ability): boolean {
  return unit.abilities.includes(ability);
}

/** Un volador solo puede ser alcanzado por voladores o por ataques a distancia. */
export function isFlying(unit: UnitSpec): boolean {
  return hasAbility(unit, 'flying');
}

/** Alcanza a cualquiera: vuela, o pega a distancia. */
export function canReachAnything(unit: UnitSpec): boolean {
  return isFlying(unit) || unit.attack.types.some((t) => t === 'ranged' || t === 'missile');
}

/**
 * Multiplicador de orden de stack. docs/ORIGINAL.md §9.2, confianza alta.
 *
 * **Solo decide el orden**, no mejora nada: los voladores acaban delante y los
 * de distancia atrás.
 */
export function stackOrderMultiplier(unit: UnitSpec): number {
  if (isFlying(unit)) return 2.25;
  if (unit.attack.types.some((t) => t === 'ranged' || t === 'missile')) return 1.0;
  return 1.5;
}

/** Centésimas de upkeep de un stack. El redondeo va **fuera**, al total. */
export function stackUpkeepCentesimas(unit: UnitSpec, count: number): { geld: number; mana: number } {
  return { geld: unit.upkeepGeld * count, mana: unit.upkeepMana * count };
}
