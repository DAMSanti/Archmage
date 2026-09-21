/**
 * El combate: la fórmula de daño y lo que entra en ella.
 *
 * Todo de [docs/ORIGINAL.md §9.1](../../../docs/ORIGINAL.md), **publicada**,
 * confianza alta. La regla nuestra está en docs/SISTEMAS.md §9.1.
 *
 * **Por qué este módulo es puro y sin estado.** Una batalla es lo único del
 * juego que el jugador ve como una repetición paso a paso: si el daño de una
 * ronda dependiera de algo que no esté en sus argumentos, la repetición que
 * se le enseña dejaría de cuadrar con lo que pasó (docs/SPECS.md §5,
 * invariante 3). El azar entra **como número ya tirado**, no como generador.
 *
 * Fuera de alcance aquí, y a propósito:
 *  - **El tope de bajas.** `casualties()` puede devolver más bajas que
 *    defensores hay; recortarlo es de la ronda, que es quien sabe cuántos
 *    quedan (tarea 11). Hacerlo aquí escondería el exceso, y el exceso es
 *    justo lo que mide si un ataque fue desproporcionado.
 *  - **Quién pega a quién**, el orden de stacks y la fatiga acumulada:
 *    tareas 9 y 10.
 *  - **Los modificadores** de encantamientos, items y héroes sobre el ataque
 *    y el acierto. Llegan ya sumados en los argumentos.
 */

import type { DamageType, UnitSpec } from './units.js';

/** Acierto base en defensa y ataque regular. docs/ORIGINAL.md §9.1. */
export const ACCURACY_BASE = 30;
/**
 * Acierto base en **asedio**: 20.
 *
 * Ésa **es** la penalización de asedio, dicha en números: el asedio se lleva
 * el doble de tierra (§9.1) y a cambio pega dos tercios.
 */
export const ACCURACY_BASE_SIEGE = 20;

/**
 * El acierto que sale de una base y un modificador acumulado `A`.
 *
 * La fórmula está publicada a tramos (docs/ORIGINAL.md §9.1) y escrita para
 * la base 30:
 *
 * ```
 * A ≥ 0          → 30 + A
 * |A| < 15       → 30 − |A|
 * 15 ≤ |A| < 30  → 24 − (3/5)·|A|
 * |A| ≥ 30       → 12 − (1/5)·|A|
 * ```
 *
 * **Dos cosas hubo que resolver para escribirla, y las dos se resolvieron
 * midiendo, no eligiendo:**
 *
 * 1. **El signo.** La fuente escribe el segundo tramo como `30 − A` con `A`
 *    negativo, que daría *más* acierto al penalizar. La lectura correcta es
 *    con valor absoluto, y lo demuestra que así **los tres tramos empalman
 *    exactamente** en 15 y en 30 (15 = 15, y 6 = 6). Con la lectura literal
 *    no empalmarían: es una curva continua, no tres reglas sueltas.
 *
 * 2. **Cómo generaliza al asedio, que la fuente NO dice.** Los números 24 y
 *    12 son `0,8×30` y `0,4×30`, y los cortes son `30/2` y `30`: la curva
 *    está escrita en función de su base, así que se reescribe con `B`. Eso
 *    deja **un punto de castigo costando un punto** en los dos casos.
 *
 *    La alternativa era multiplicar la curva entera por `B/30`, que daría
 *    dos tercios exactos con cualquier modificador — más bonito— pero
 *    haría que un castigo de 15 puntos costase **solo 10** en asedio. Un
 *    modificador de acierto está expresado en puntos de acierto y no puede
 *    valer distinto según el tipo de ataque, así que se descartó. El
 *    criterio 2 de §9.1 no distingue entre las dos lecturas: habla del caso
 *    sin modificar, donde las dos dan 20 contra 30.
 *
 *    **Consecuencia, y está en un test:** con modificadores la proporción
 *    se mueve, y las dos curvas cruzan el cero en `2×base` — 40 en asedio y
 *    60 en regular. Un castigo enorme deja un asedio en nada mientras un
 *    ataque regular todavía araña.
 *
 * El bono positivo, en cambio, **no escala**: +10 de acierto son +10 puntos
 * vengan de donde vengan.
 *
 * No se redondea: el acierto entra en la fórmula de daño como `acierto/100`,
 * y redondear aquí sería un segundo redondeo (docs/SPECS.md §5,
 * invariante 7).
 */
export function accuracyFor(modifier: number, siege: boolean): number {
  const base = siege ? ACCURACY_BASE_SIEGE : ACCURACY_BASE;
  if (modifier >= 0) return base + modifier;

  const castigo = -modifier;
  let acierto: number;
  if (castigo < base / 2) acierto = base - castigo;
  else if (castigo < base) acierto = 0.8 * base - (3 / 5) * castigo;
  else acierto = 0.4 * base - (1 / 5) * castigo;
  return Math.max(0, acierto);
}

/**
 * Lo que una **debilidad** mete en la media de resistencia: −50.
 * docs/ORIGINAL.md §9.1.
 */
export const WEAKNESS_PENALTY = 50;

/**
 * La resistencia del defensor a un ataque, en puntos.
 *
 * **Con varios tipos de daño se hace la media**, y el ejemplo de la fuente
 * es literal: `Fire Ranged = (30% + 75%) / 2 = 52,5%`. Un tipo que no esté
 * en la ficha cuenta como 0.
 *
 * **Una debilidad entra en la media como un término de −50**, no como un
 * multiplicador aparte. Eso importa: significa que la debilidad **se diluye
 * igual que una resistencia** cuando el ataque tiene varios tipos, y que un
 * ataque de un solo tipo contra una debilidad es lo que de verdad duele.
 *
 * Puede devolver **negativo**, y tiene que poder: en `(1 − resistencia/100)`
 * un negativo da un multiplicador mayor que 1, que es exactamente lo que una
 * debilidad hace. Topearlo en 0 dejaría la debilidad sin efecto contra quien
 * ya no resiste ese tipo — el caso del Treant y el fuego, que resiste 0% y
 * *además* es débil.
 *
 * No se redondea: el redondeo de la fórmula está en `casualties()` y solo
 * puede haber uno (docs/SPECS.md §5, invariante 7).
 */
export function resistanceAgainst(
  unit: Pick<UnitSpec, 'resistances' | 'weaknesses'>,
  types: readonly DamageType[],
): number {
  if (types.length === 0) return 0;
  let total = 0;
  for (const t of types) {
    const base = unit.resistances[t] ?? 0;
    const debil = unit.weaknesses?.includes(t) ? WEAKNESS_PENALTY : 0;
    total += base - debil;
  }
  return total / types.length;
}

/** Los términos de la fórmula, cada uno ya resuelto por quien lo sabe. */
export interface DamageInput {
  /** `N_A`: cuántas unidades atacan. */
  attackers: number;
  /** `ataque_A`: el *Attack Power* de la ficha, ya modificado. */
  attackPower: number;
  /** `acierto`: en puntos, no en tanto por uno. Base 30; 20 en asedio. */
  accuracy: number;
  /** `azar`: entre 0,25 y 0,75. **Fijo en 0,5** para Magic y Psychic. */
  randomFactor: number;
  /** `eficiencia`: empieza en 100 y la baja la fatiga. */
  efficiency: number;
  /** `resistencia_R`: en puntos. Ya promediada si el ataque tiene varios tipos. */
  resistance: number;
  /** Producto de las habilidades defensivas. 1 si no hay ninguna. */
  defensiveMultiplier: number;
  /** `HP_R`: los puntos de vida del defensor. */
  defenderHitPoints: number;
}

/**
 * Las bajas que causa un stack sobre otro.
 *
 * ```
 * bajas = N × ataque × (acierto/100) × azar × (eficiencia/100)
 *         × (1 − resistencia/100) × habilidades ÷ HP
 * ```
 *
 * **Un solo `floor`, y va al final** (docs/SPECS.md §5, invariante 7).
 * Redondear término a término acumularía el error hacia abajo y separaría la
 * previsión que ve el jugador del resultado que le sale.
 *
 * Trunca hacia abajo a propósito: media baja **no es una baja**, así que
 * picar con stacks diminutos no hace nada. Y nunca devuelve negativo — un
 * modificador absurdo (resistencia > 100, eficiencia < 0) da 0, no curación.
 */
export function casualties(input: DamageInput): number {
  const {
    attackers,
    attackPower,
    accuracy,
    randomFactor,
    efficiency,
    resistance,
    defensiveMultiplier,
    defenderHitPoints,
  } = input;

  // Sin defensor no hay división: `Infinity` se propagaría hasta borrar un
  // ejército entero sin dar error, que es la clase de fallo que este
  // proyecto persigue (docs/SPECS.md §5).
  if (defenderHitPoints <= 0) return 0;

  // **Los enteros primero y las divisiones al final.** Multiplicar por
  // `accuracy` y por `(100 − resistance)` —enteros— antes de dividir por
  // 100 mantiene la cuenta exacta mucho más lejos que hacer `accuracy/100`
  // de entrada, donde 30/100 ya deja de ser representable.
  const numerador =
    attackers *
    attackPower *
    accuracy *
    efficiency *
    (100 - resistance) *
    randomFactor *
    defensiveMultiplier;

  if (!(numerador > 0)) return 0;
  return floorExacto(numerador / (1_000_000 * defenderHitPoints));
}

/**
 * `Math.floor` que no se deja morder por el binario.
 *
 * **El problema, medido:** con *healing* 0,7 y *scales* 0,75 el
 * multiplicador debería ser 0,525 y en binario sale 0,52499999999999997. El
 * resultado exacto de esa batalla son **4.725** bajas; `Math.floor` daba
 * **4.724**. Un entero de menos, sin error, en un número que el jugador ve
 * en la previsión y otra vez en el resultado.
 *
 * No es un caso raro: pasa siempre que el multiplicador acumulado no es
 * representable, y los valores del original —0,7, 0,75, 0,8— no lo son casi
 * nunca. Aquí se pega al entero **solo cuando la distancia es error de
 * representación** y no un valor de verdad fraccionario: media baja sigue
 * siendo cero bajas, que es la regla (docs/SISTEMAS.md §9.1).
 */
function floorExacto(x: number): number {
  const entero = Math.round(x);
  return Math.abs(x - entero) < 1e-9 * Math.max(1, Math.abs(x)) ? entero : Math.floor(x);
}
