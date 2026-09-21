/**
 * Lo que se lleva el ganador: tierra y saqueo.
 *
 * Reglas de [docs/ORIGINAL.md §9.3](../../../docs/ORIGINAL.md), confirmadas.
 * Las nuestras, en docs/SISTEMAS.md §9.1.
 *
 * **La idea que hay detrás, y que conviene no perder:** en una guerra aquí
 * **se destruye más de lo que se roba**. El atacante se queda **un tercio**
 * de la tierra que arranca y los otros dos tercios desaparecen del mapa. Eso
 * es lo que impide que atacar sea gratis a nivel de mundo, y lo que hace que
 * una temporada larga sea una temporada más pobre.
 *
 * Fuera de alcance aquí:
 *  - **Quién gana**: eso es `battle.ts`. Aquí se asume decidido.
 *  - **Los items robados** en el saqueo: fase 4, no hay items todavía.
 */

import type { AttackType } from './battle.js';

/**
 * Cuántos supervivientes hacen falta por cada acre que se arranca: **50**.
 *
 * **[nuestro]** Las fuentes se contradicen —el *Beginner's Guide* da 2,5 en
 * regular y 5 en asedio; *Battle Mechanics* da 50 para los dos, con un
 * ejemplo aritmético que cuadra consigo mismo—. Es un factor de 10 a 20, y
 * nos quedamos con **50 porque viene con la cuenta hecha**
 * (docs/ORIGINAL.md §9.3).
 */
export const SURVIVORS_PER_ACRE = 50;

/** Tope de tierra que arranca cada tipo de ataque, en tanto por uno. */
export const LAND_SHARE: Record<AttackType, number> = {
  regular: 0.05,
  siege: 0.1,
  /** El saqueo **no quita tierra**: quema edificios y roba. */
  pillage: 0,
};

/**
 * La parte de lo arrancado que el atacante **se queda**: un tercio.
 * El resto se destruye.
 */
export const ATTACKER_LAND_SHARE = 1 / 3;

/** Acres que quema un saqueo como mucho. docs/ORIGINAL.md §9.3. */
export const PILLAGE_MAX_ACRES = 100;

export interface LandOutcome {
  /** Acres que pierde el defensor. */
  lost: number;
  /** De ésos, los que el atacante se lleva. */
  taken: number;
  /** Los que desaparecen. */
  destroyed: number;
  /** El tope que impuso el tamaño del ejército superviviente, si mordió. */
  limitedBySurvivors: boolean;
}

/**
 * Cuánta tierra cambia de manos.
 *
 * Dos topes, y manda el menor:
 *  - **El porcentaje del tipo de ataque** sobre la tierra del defensor: 5%
 *    regular, 10% asedio.
 *  - **Los supervivientes del atacante**, a 50 por acre.
 *
 * El ejemplo trabajado de la fuente sale clavado: con 3.654 acres, un asedio
 * arranca **365** como mucho, para lo que hacen falta **18.250**
 * supervivientes; el atacante se lleva **122** y se destruyen **243**.
 *
 * El `floor` va **una sola vez por cantidad**, y `destroyed` se calcula como
 * resta —no como su propio redondeo— para que las tres cifras cuadren
 * siempre (docs/SPECS.md §5, invariante 7).
 */
export function landTaken(
  defenderLand: number,
  attackerSurvivors: number,
  attackType: AttackType,
  battleBonus = 0,
  /** *Grand Conqueror*. Por defecto 1: sin la habilidad, nada cambia. */
  conqueror = 1,
): LandOutcome {
  const porPorcentaje = Math.floor(
    defenderLand * LAND_SHARE[attackType] * (1 + battleBonus) * conqueror,
  );
  const porSupervivientes = Math.floor(attackerSurvivors / SURVIVORS_PER_ACRE);
  const lost = Math.max(0, Math.min(porPorcentaje, porSupervivientes));
  const taken = Math.floor(lost * ATTACKER_LAND_SHARE);
  return {
    lost,
    taken,
    destroyed: lost - taken,
    limitedBySurvivors: porSupervivientes < porPorcentaje,
  };
}

export interface PillageOutcome {
  geld: number;
  population: number;
  /** Acres de edificios quemados, por tipo. */
  burned: number;
}

/**
 * El saqueo: **todo o nada**, y no quita tierra.
 *
 * Depende del **net power del ejército, no de su tamaño**
 * (docs/ORIGINAL.md §9.3), roba geld y población y quema hasta 100 acres de
 * farms, towns, workshops y guilds.
 *
 * **[nuestro]** Los porcentajes. La fuente dice qué roba y qué quema pero no
 * cuánto, así que se fija en **el 10% del geld y de la población** y en
 * quemar **1 acre por cada 200 de net power superviviente**, topado en 100.
 * Elegido para que un saqueo valga la pena sin sustituir a la conquista: a
 * 100 acres quemados, el defensor pierde construcción pero no territorio, y
 * el atacante no crece — que es lo que distingue el saqueo del asedio.
 */
export function pillageTaken(
  defenderGeld: number,
  defenderPopulation: number,
  attackerPower: number,
): PillageOutcome {
  return {
    geld: Math.floor(defenderGeld * 0.1),
    population: Math.floor(defenderPopulation * 0.1),
    burned: Math.min(PILLAGE_MAX_ACRES, Math.floor(attackerPower / 200)),
  };
}
