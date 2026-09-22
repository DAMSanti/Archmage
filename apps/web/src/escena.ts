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
  /** Posición en el paisaje, en % del ancho y del alto. */
  x: number;
  y: number;
  /** Cuánto se pinta. **Más al fondo, más pequeña.** */
  escala: number;
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
  // **Colocadas como un asentamiento, no como una rejilla.** El paisaje
  // lleva montañas y bosque en los bordes y el valle abierto en el medio,
  // así que todo vive en la franja central — y dentro de ella, donde tendría
  // sentido si alguien hubiera fundado el sitio:
  //
  //  - el **pueblo en el centro**, que es el corazón;
  //  - las **granjas delante**, en el llano, que es donde se siembra;
  //  - el **taller pegado al pueblo**, que es de quien vive en él;
  //  - el **cuartel y la fortaleza atrás y en alto**, mirando el valle;
  //  - la **barrera rodeando la fortaleza**, que es lo que hace;
  //  - el **node y el gremio apartados**, que la magia no se pone en la
  //    plaza del pueblo.
  //
  // Y **lo que está más al fondo se pinta más pequeño**. Es la única regla
  // de perspectiva que hay aquí, y es la que hace que ocho dibujos sueltos
  // parezcan un sitio en vez de una fila de iconos.
  //
  // **Y todo por encima del 66% de alto**: ahí abajo flota el panel de
  // «Gastar turnos». La primera versión ponía las granjas al 76% y el panel
  // **las tapaba enteras** — la pasada de navegador no pudo ni pasarles el
  // ratón por encima. Un edificio que no se puede pulsar no es un atajo.
  { building: 'farms', nombre: 'Farms', pantalla: 'reino', x: 34, y: 54, escala: 1.15 },
  { building: 'towns', nombre: 'Towns', pantalla: 'reino', x: 50, y: 45, escala: 1.0 },
  { building: 'nodes', nombre: 'Nodes', pantalla: 'magia', x: 20, y: 27, escala: 0.76 },
  { building: 'workshops', nombre: 'Workshops', pantalla: 'reino', x: 66, y: 51, escala: 1.08 },
  { building: 'barracks', nombre: 'Barracks', pantalla: 'ejercito', x: 76, y: 40, escala: 0.94 },
  { building: 'guilds', nombre: 'Guilds', pantalla: 'magia', x: 31, y: 37, escala: 0.86 },
  { building: 'forts', nombre: 'Forts', pantalla: 'guerra', x: 62, y: 31, escala: 0.8 },
  { building: 'barriers', nombre: 'Barriers', pantalla: 'guerra', x: 80, y: 23, escala: 0.72 },
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
