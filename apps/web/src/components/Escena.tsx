/**
 * La escena del reino.
 *
 * docs/INTERFAZ.md §6.5. **Una pieza por cada TIPO de edificio del que tengas
 * al menos uno** — qué piezas exactamente lo decide `escena.ts`, que es puro
 * y está comprobado (criterio 11).
 *
 * **Es un atajo, no la navegación** (§6.5, regla 7). Todo lo que se alcanza
 * tocando una pieza se alcanza también por la barra de abajo. Se decidió así
 * porque lo contrario esconde funciones detrás de saber que un dibujo se
 * puede tocar — y porque seis de las trece pantallas no tienen edificio que
 * tocar y necesitarían otra puerta igualmente.
 *
 * **Y la escena dice QUÉ, no CUÁNTO** (regla 9). «437 farms, el 12,3% de tu
 * tierra» vive en su fila de la tabla. Ningún dato vive solo aquí, que es el
 * criterio 13.
 *
 * Fuera de alcance:
 *  - **Arte.** Las figuras son marcadores hasta que exista la tanda de
 *    assets (tarea 23 de la fase 1, docs/ASSETS.md §8.2). La regla 3 de §6.5
 *    dice que la interfaz funciona entera sin ninguna ilustración, así que
 *    esto no es una degradación: es el estado normal mientras tanto.
 *  - **Móvil.** No aparece, y lo decide el CSS (§5).
 *  - **Colocar los edificios.** El jugador no elige dónde va nada (§6.8): no
 *    hay decisión de juego detrás, y añadirla sería inventar una mecánica
 *    para justificar un dibujo.
 */

import type { Buildings } from '@archmage/core';
import { piezasDe } from '../escena.js';

/**
 * Las piezas pintadas, desde el 2026-09-22.
 *
 * Son **el segundo juego de arte** que docs/INTERFAZ.md §6.5 regla 11
 * declara: planas en las tablas y la barra, pintadas aquí. Una pieza plana
 * sobre un paisaje pintado se ve pegada encima, no puesta dentro.
 */
const PINTADAS = new Set([
  'farms',
  'towns',
  'nodes',
  'workshops',
  'barracks',
  'guilds',
  'forts',
  'barriers',
]);

export function Escena({
  buildings,
  onIr,
}: {
  buildings: Buildings;
  onIr: (pantalla: string) => void;
}) {
  const piezas = piezasDe(buildings);

  // Un reino sin nada construido no tiene escena que enseñar, y un marco
  // vacío diciendo «aquí no hay nada» ocuparía sitio para no decir nada.
  if (piezas.length === 0) return null;

  return (
    <>
      <section className="escena-reino" aria-label="Tu reino">
      {piezas.map((p) => (
        <button
          key={p.building}
          type="button"
          className="escena__pieza"
          onClick={() => onIr(p.pantalla)}
        >
          {/* La figura es decoración: el nombre accesible lo lleva la placa,
              que es texto de verdad. */}
          <span className="escena__figura" aria-hidden="true">
            {PINTADAS.has(p.building) && (
              <img src={`/escena/${p.building}.webp`} width={46} height={46} alt="" />
            )}
          </span>
          <span className="escena__placa">{p.nombre}</span>
        </button>
      ))}
      </section>
      {/* **Fuera del paisaje, no encima.** Es texto explicativo y la regla 1
          de §6.5 no lo deja ir sobre una ilustración — y la excepción de la
          textura acotada no cubre un fondo pintado, que no se puede acotar
          sin dejar de ser un paisaje. */}
      <p className="escena__nota">
        La escena enseña <strong>qué</strong> has construido. Cuántos hay de cada uno está en la
        tabla.
      </p>
    </>
  );
}
