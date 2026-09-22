import { describe, expect, test } from 'vitest';
import type { Buildings } from '@archmage/core';
import { PIEZAS, piezasDe } from '../src/escena.js';

/**
 * El criterio 11 de docs/INTERFAZ.md §6.7: **la escena no inventa
 * edificios.**
 *
 * Es el criterio que caza el fallo más probable de esta pantalla: pintar una
 * escena bonita y fija que no se corresponde con el reino de nadie. Una
 * ilustración decorativa que enseña unos barracones a un mago que no tiene
 * ninguno no da ningún error — solo miente.
 */

const vacio: Buildings = {
  farms: 0,
  towns: 0,
  nodes: 0,
  workshops: 0,
  barracks: 0,
  guilds: 0,
  forts: 0,
  barriers: 0,
};

describe('criterio 11 — la escena no inventa edificios', () => {
  test('un reino sin nada no tiene escena', () => {
    expect(piezasDe(vacio)).toEqual([]);
  });

  test('un estado con barracks: 0 no produce pieza de barracks', () => {
    const piezas = piezasDe({ ...vacio, farms: 45, barracks: 0 });
    expect(piezas.map((p) => p.building)).toEqual(['farms']);
  });

  test('los ocho producen ocho', () => {
    const todos = Object.fromEntries(PIEZAS.map((p) => [p.building, 1])) as Buildings;
    expect(piezasDe(todos)).toHaveLength(8);
  });

  test('uno solo basta: la escena es emblemática, no cuantitativa', () => {
    // **La decisión que hace posible la escena** (§6.5). Un reino calibrado
    // llega a miles de acres; si la escena creciera, a partir de su tope un
    // mago con 200 farms y otro con 4.000 verían lo mismo y dejaría de decir
    // la verdad. Al no prometer cantidad, no puede incumplirla.
    const uno = piezasDe({ ...vacio, farms: 1 });
    const muchos = piezasDe({ ...vacio, farms: 4_000 });
    expect(uno).toEqual(muchos);
  });

  test('el orden es el del catálogo, no el de las llaves del objeto', () => {
    // Si dependiera del orden de inserción, la escena se recompondría sola
    // al llegar un estado del servidor con las llaves en otro orden.
    const revuelto = { barriers: 1, farms: 1, nodes: 1 } as unknown as Buildings;
    expect(piezasDe({ ...vacio, ...revuelto }).map((p) => p.building)).toEqual([
      'farms',
      'nodes',
      'barriers',
    ]);
  });

  test('toda pieza lleva nombre y ruta: no hay pieza muda', () => {
    // Criterio 14: son controles, así que necesitan nombre accesible. Y
    // criterio 12: cada una lleva a un sitio que existe.
    for (const pieza of PIEZAS) {
      expect(pieza.nombre.length).toBeGreaterThan(0);
      expect(pieza.pantalla.length).toBeGreaterThan(0);
    }
  });

  test('un número negativo no pinta pieza', () => {
    // No debería llegar nunca —el estado son enteros no negativos— pero el
    // día que llegue, la escena no es el sitio donde enterarse.
    expect(piezasDe({ ...vacio, farms: -1 })).toEqual([]);
  });
});

describe('la colocación en el mapa', () => {
  test('cada pieza tiene un sitio fijo, y ninguna se sale del paisaje', () => {
    // **El jugador no elige dónde va nada** (docs/INTERFAZ.md §6.8): la
    // composición es fija. Pero tiene que caber: el paisaje lleva montañas
    // y bosque en los bordes, así que las piezas viven en la franja central.
    for (const p of PIEZAS) {
      expect(p.x).toBeGreaterThanOrEqual(14);
      expect(p.x).toBeLessThanOrEqual(86);
      expect(p.y).toBeGreaterThanOrEqual(20);
      // **Y ninguna por debajo del 56%**, que es donde llega el panel de
      // «Gastar turnos» — flota sobre el mapa por decisión del usuario.
      //
      // No es una cifra estética: con las piezas a 76% el panel las tapaba y
      // **dejaban de poder pulsarse**. Lo cazó la pasada de navegador, que no
      // pudo ni pasarle el ratón por encima a Farms.
      //
      // El 66 tampoco bastó, y el motivo merece quedarse escrito: **`y` es el
      // centro de la pieza y el panel choca con su borde de abajo.** Una
      // pieza grande sobresale casi un 9% por debajo de su centro, así que el
      // límite se mide desde donde acaba, no desde donde está.
      expect(p.y).toBeLessThanOrEqual(56);
    }
  });

  test('no se solapan dos piezas', () => {
    // Un pueblo con dos edificios encima del otro no parece un pueblo, y
    // además el de abajo deja de poder tocarse.
    for (let i = 0; i < PIEZAS.length; i++) {
      for (let j = i + 1; j < PIEZAS.length; j++) {
        const a = PIEZAS[i]!;
        const b = PIEZAS[j]!;
        const d = Math.hypot(a.x - b.x, (a.y - b.y) * 0.55);
        expect(d).toBeGreaterThan(9);
      }
    }
  });

  test('lo que está más al fondo se pinta más pequeño', () => {
    // La profundidad es lo que hace que ocho piezas sueltas parezcan un
    // sitio y no una fila de iconos. Es la única regla «orgánica» que se
    // puede comprobar: a menos `y`, menos escala.
    const ordenadas = [...PIEZAS].sort((a, b) => a.y - b.y);
    for (let i = 1; i < ordenadas.length; i++) {
      expect(ordenadas[i]!.escala).toBeGreaterThanOrEqual(ordenadas[i - 1]!.escala);
    }
  });
});
