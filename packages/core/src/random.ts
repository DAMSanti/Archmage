/**
 * El azar del juego.
 *
 * **Una sola implementación**, y vive aquí. docs/SPECS.md §5, invariante 3:
 * todo azar sale de un `RandomSource` con semilla, y la semilla se guarda con
 * el resultado, así que cualquier tirada se puede repetir exacta.
 *
 * **Por qué splitmix32 y no xorshift32 a pelo.** La primera versión era un
 * xorshift32 sembrado directamente con el número de la semilla, y tenía un
 * fallo que no da error: **con semillas pequeñas las primeras tiradas salen
 * casi cero**. Con semilla 1, la primera es 0,00006. Cualquier comprobación
 * del tipo «¿sale menos que el umbral?» —fallar un hechizo, acertar un
 * golpe— **se cumplía siempre**, y el juego parecía estar amañado en contra
 * del jugador. Descubierto el 2026-09-21 porque un hechizo fuera de color
 * fallaba cinco de cada cinco veces con un 30% de probabilidad.
 *
 * splitmix32 mezcla la semilla antes de usarla, así que la primera tirada ya
 * está bien distribuida. Es el generador de todo el proyecto: servidor,
 * simulador y tests.
 */

import type { RandomSource } from './types.js';

export function makeRandom(seed: number): RandomSource {
  let s = seed >>> 0;
  const next = (): number => {
    s = (s + 0x9e3779b9) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad) >>> 0;
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97) >>> 0;
    z = (z ^ (z >>> 15)) >>> 0;
    return z / 0x1_0000_0000;
  };
  return {
    next,
    nextInt: (maxExclusive: number) => Math.floor(next() * maxExclusive),
  };
}
