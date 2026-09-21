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
