/**
 * Cómo se enchufan las diez habilidades en las fórmulas que ya existían.
 *
 * **Éste era el riesgo 1 del plan** (docs/SISTEMAS.md §12.1): las
 * habilidades tocan nueve fórmulas escritas y calibradas en las fases 1 a
 * 3, y ahí es donde iban a salir las regresiones — no en el código nuevo.
 *
 * **La defensa es una sola idea:** todo pasa por un struct de
 * multiplicadores que **al nivel 0 vale exactamente 1 en los diez campos**.
 * Con eso, enchufarlas no puede mover un número de lo ya medido: un test lo
 * comprueba, y los tests de calibración de las fases 1-3 son el canario.
 *
 * **Y por qué un struct y no diez parámetros sueltos.** Porque una fórmula
 * que recibe `skills` tendría que saber cuál de las diez le toca, y eso
 * mete el catálogo dentro de la fórmula. Recibiendo un número ya resuelto,
 * `landTaken()` sigue sin saber que las habilidades existen.
 *
 * Fuera de alcance aquí:
 *  - **`barrierDefence`.** La curva del bonus de fort y barrier sigue
 *    `[abierto]` en docs/SISTEMAS.md §5.7: no hay magnitud que multiplicar.
 *    El multiplicador se calcula igual y **no lo usa nadie todavía**, que es
 *    deuda declarada y no un olvido.
 */

import { skillMultiplier } from './skills.js';
import type { SkillSpec, SkillTarget } from './skills.js';

/** Un multiplicador por cada cosa que las habilidades tocan. */
export type SkillModifiers = Record<SkillTarget, number>;

/** Todo a 1: un mago sin una sola habilidad. */
export function noSkills(): SkillModifiers {
  return {
    spellManaCost: 1,
    offColourFailure: 1,
    enchantmentUpkeep: 1,
    summonCount: 1,
    animalAttack: 1,
    undeadAttack: 1,
    accuracy: 1,
    landTaken: 1,
    barrierDefence: 1,
    itemRate: 1,
  };
}

/**
 * Resuelve los diez multiplicadores de un mago.
 *
 * `levels` es `state.skills`, que ya existe en el estado desde la fase 1
 * (docs/SPECS.md §1) y hasta ahora iba vacío.
 */
export function skillModifiers(
  levels: Record<string, number>,
  catalog: readonly SkillSpec[],
): SkillModifiers {
  const m = noSkills();
  for (const spec of catalog) {
    const nivel = levels[spec.id] ?? 0;
    if (nivel <= 0) continue;
    // **Se multiplican**, no se suman: si un día dos habilidades tocaran la
    // misma magnitud, apilarlas no podría llegar a cero ni pasarse.
    m[spec.target] *= skillMultiplier(spec, nivel);
  }
  return m;
}

/**
 * Aplica un multiplicador a un entero, con **un solo `floor`**.
 *
 * Existe para que ninguna fórmula redondee por su cuenta al meterle una
 * habilidad: el invariante 7 dice un redondeo por fórmula, y una habilidad
 * no puede ser el segundo.
 */
export function withSkill(value: number, multiplier: number): number {
  return Math.floor(value * multiplier);
}
