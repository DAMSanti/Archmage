/**
 * Qué piezas se pintan en la escena del reino.
 *
 * docs/INTERFAZ.md §6.5. **Una pieza por cada TIPO de edificio del que
 * tengas al menos uno**, no una por edificio.
 *
 * **Por qué esto no está en `packages/core`.** No es una regla del juego: no
 * cambia el estado, no decide nada, y dos magos con el mismo reino ven lo
 * mismo lo pinte quien lo pinte. Es una derivación de presentación, y meterla
 * en el núcleo habría sido cómodo y habría estado mal — el núcleo es donde
 * viven las reglas, y llenarlo de cosas que solo le importan a una pantalla
 * es cómo un núcleo puro deja de serlo sin que nadie lo decida.
 *
 * **Y por qué es emblemática y no cuantitativa.** Un reino calibrado llega a
 * miles de acres con cientos de edificios de cada tipo. Pintar más granjas
 * cuando hay más granjas funciona hasta un tope, y a partir del tope la
 * escena miente: un mago con 200 farms y otro con 4.000 verían lo mismo. Al
 * no prometer una cantidad, no puede incumplirla.
 *
 * Fuera de alcance aquí:
 *  - **Dónde va cada pieza.** La composición la pone el CSS, y el jugador no
 *    la elige (docs/INTERFAZ.md §6.8): no hay decisión de juego detrás, y
 *    añadirla sería inventar una mecánica para justificar un dibujo.
 *  - **Cuántos hay de cada uno.** Eso vive en su panel, y la escena no lo
 *    dice: la escena dice QUÉ, el panel dice CUÁNTO (§6.5, regla 9).
 */

import { BUILDINGS, type Building, type Buildings } from '@archmage/core';

/** Una pieza de la escena, y adónde lleva al tocarla. */
export interface Pieza {
  building: Building;
  /** El nombre accesible del control. Criterio 14. */
  nombre: string;
  /** La pantalla que abre. Criterio 12: nunca es la única puerta. */
  pantalla: string;
}

/**
 * Las ocho piezas posibles, **en el orden del catálogo**
 * (`BUILDINGS` de `packages/core`).
 *
 * El orden sale de ahí y no del objeto de estado a propósito: si dependiera
 * del orden de inserción de las llaves, la escena se recompondría sola el día
 * que el servidor mandara el mismo estado con las llaves en otro orden.
 *
 * **Los nombres se quedan como en el original** (CLAUDE.md): `node`, `fort`,
 * `barrier`. La wiki del original es parte de la documentación de esto.
 */
export const PIEZAS: readonly Pieza[] = [
  { building: 'farms', nombre: 'Farms', pantalla: 'reino' },
  { building: 'towns', nombre: 'Towns', pantalla: 'reino' },
  { building: 'nodes', nombre: 'Nodes', pantalla: 'magia' },
  { building: 'workshops', nombre: 'Workshops', pantalla: 'reino' },
  { building: 'barracks', nombre: 'Barracks', pantalla: 'ejercito' },
  { building: 'guilds', nombre: 'Guilds', pantalla: 'magia' },
  { building: 'forts', nombre: 'Forts', pantalla: 'guerra' },
  { building: 'barriers', nombre: 'Barriers', pantalla: 'guerra' },
];

const PORRAZO = new Map(PIEZAS.map((p) => [p.building, p]));

/**
 * Las piezas que le tocan a este reino.
 *
 * Criterio 11 de §6.7: **exactamente** los tipos de los que hay al menos uno,
 * ni uno más ni uno menos.
 */
export function piezasDe(buildings: Buildings): Pieza[] {
  return BUILDINGS.filter((b) => (buildings[b] ?? 0) > 0).map((b) => PORRAZO.get(b)!);
}
