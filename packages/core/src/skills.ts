/**
 * Las diez habilidades del mago.
 *
 * **Qué hay publicado y qué no**, porque importa: el original publica los
 * nombres, que **son 20 niveles**, que llegar al 20 cuesta **210 puntos**,
 * que cinco cuestan **el doble fuera de tu color**, y que los puntos salen
 * de la **raíz cuadrada de los guilds**. Lo que **no** publica es qué hace
 * cada una — salvo una, *Spell Mastery*, y de fuente floja
 * ([docs/ORIGINAL.md §8](../../../docs/ORIGINAL.md), confianza baja).
 *
 * **De ahí sale todo lo demás, y no es invención: es deducción.** Ese único
 * dato da la escala —una habilidad al máximo vale del orden de un **20%**,
 * no de un 2% ni de un 200%— y con ella las diez quedan en **+1% por
 * rango** sobre la magnitud que cada una toca (docs/SISTEMAS.md §12.1).
 *
 * **Por qué lineal y no una curva.** Porque el único dato publicado es
 * lineal en sus tres primeros rangos, y **una curva inventada sería una
 * decisión de diseño escondida en una constante**. Si la calibración dice
 * que el 20% final es demasiado, se mueve el 20% — no la forma.
 *
 * Fuera de alcance aquí:
 *  - **Las habilidades de héroe**, que son otra lista y no tienen ancla
 *    publicada (docs/SISTEMAS.md §12.1).
 *  - **El hechizo *Wish***, que da un punto instantáneo: es del catálogo de
 *    hechizos, no de aquí.
 */

import type { Specialty } from './types.js';

/** Nivel máximo de una habilidad. docs/ORIGINAL.md §8. */
export const MAX_SKILL_LEVEL = 20;

/**
 * Lo que cuesta llegar al 20: **210 puntos**, que es `1+2+…+20`.
 *
 * No es una constante suelta: se calcula, y hay un test que comprueba que da
 * 210. Si un día alguien cambia el máximo, el coste se mueve solo.
 */
export const MAX_SKILL_COST = (MAX_SKILL_LEVEL * (MAX_SKILL_LEVEL + 1)) / 2;

/** Lo que multiplica una habilidad de otro color: el doble. */
export const OFF_COLOUR_MULTIPLIER = 2;

/** Lo que gana una habilidad por rango: **+1%**. Ver el docstring. */
export const PER_RANK = 0.01;

/** Qué magnitud toca cada habilidad. */
export type SkillTarget =
  | 'spellManaCost'
  | 'offColourFailure'
  | 'enchantmentUpkeep'
  | 'summonCount'
  | 'animalAttack'
  | 'undeadAttack'
  | 'accuracy'
  | 'landTaken'
  | 'barrierDefence'
  | 'itemRate';

export interface SkillSpec {
  id: string;
  name: string;
  target: SkillTarget;
  /** Si cuesta el doble fuera de tu color. */
  ofSpecialty: boolean;
  /**
   * Si el efecto **resta** en vez de sumar. Bajar un coste de maná un 20% y
   * subir un ataque un 20% son el mismo +1% por rango mirado al revés.
   */
  reduces: boolean;
  source: string;
}

/**
 * El multiplicador que una habilidad aplica a su magnitud.
 *
 * Al nivel 0 devuelve **exactamente 1**, y eso es lo que hace que enchufar
 * las habilidades no mueva un solo número de lo ya calibrado en las fases
 * 1 a 3. Es el criterio 14 de docs/SISTEMAS.md §12.1 y el canario del
 * riesgo 1 del plan.
 */
export function skillMultiplier(spec: SkillSpec, level: number): number {
  const n = Math.max(0, Math.min(MAX_SKILL_LEVEL, level));
  const delta = n * PER_RANK;
  return spec.reduces ? 1 - delta : 1 + delta;
}

/** Lo que cuesta subir del nivel `from` al siguiente. */
export function trainCost(spec: SkillSpec, from: number, specialty: Specialty): number {
  if (from >= MAX_SKILL_LEVEL) return Infinity;
  const base = from + 1;
  // **El doble fuera de tu color**, y solo las cinco de especialidad.
  // `plain` no tiene color propio, así que paga el doble por todas las que
  // lo piden: es coherente con que un mago Plain no sea de ninguna escuela.
  const fuera = spec.ofSpecialty && specialty !== colourOf(spec);
  return fuera ? base * OFF_COLOUR_MULTIPLIER : base;
}

/** Lo que cuesta llegar desde 0 hasta `level`. */
export function totalCost(spec: SkillSpec, level: number, specialty: Specialty): number {
  let total = 0;
  for (let i = 0; i < level; i++) total += trainCost(spec, i, specialty);
  return total;
}

/**
 * De qué color es una habilidad de especialidad.
 *
 * **[nuestro]** El original liga cada una a una escuela pero la wiki no dice
 * a cuál, salvo *Spell Mastery* → Phantasm, que sale del único efecto
 * publicado. Las otras cuatro se reparten por lo que hacen: quien manda
 * animales es Verdant, quien manda no muertos es Nether, quien penetra
 * hechizos es Eradication, y quien fabrica es Ascendant. Es deducción, no
 * dato, y por eso está aquí y no en `content`.
 */
export function colourOf(spec: SkillSpec): Specialty {
  switch (spec.target) {
    case 'animalAttack':
      return 'verdant';
    case 'undeadAttack':
      return 'nether';
    case 'offColourFailure':
      return 'eradication';
    case 'itemRate':
      return 'ascendant';
    case 'spellManaCost':
      return 'phantasm';
    default:
      return 'plain';
  }
}

/**
 * Puntos de habilidad que se generan al gastar un turno.
 *
 * **[orig]** Sale de la **raíz cuadrada del número de guilds**
 * (docs/ORIGINAL.md §8), con el ancla publicada: un mago de **5.000 de
 * tierra con el 5% en guilds** —250 guilds— saca **un punto cada ~34
 * turnos**.
 *
 * De ahí el coeficiente: `√250 ≈ 15,81`, y `1/34 ≈ 0,0294`, así que el
 * factor es `0,0294 / 15,81 ≈ 0,00186`. Se guarda el número y **el test
 * comprueba el ancla**, no el coeficiente: si un día cambia la forma, lo
 * que tiene que seguir cuadrando es el mago de 5.000 acres.
 *
 * Devuelve **fracción de punto**, que se acumula: los puntos son enteros
 * pero tardan decenas de turnos en salir, y redondear cada turno los dejaría
 * en cero para siempre.
 */
export const SKILL_POINT_FACTOR = 0.00186;

export function skillPointsPerTurn(guilds: number): number {
  if (guilds <= 0) return 0;
  return Math.sqrt(guilds) * SKILL_POINT_FACTOR;
}
