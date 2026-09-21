import { describe, expect, test } from 'vitest';
import { manaIncome } from '../src/index.js';

/**
 * Los criterios 1, 2 y 3 de docs/SISTEMAS.md §17.1, tal cual.
 * La fórmula es [orig]: docs/ORIGINAL.md §3.1, confianza alta.
 */
describe('la sierra del maná', () => {
  test('criterio 1 — 39,8% produce MÁS que 40,0% con menos nodes', () => {
    expect(manaIncome(3_980, 10_000)).toBe(28_178);
    expect(manaIncome(4_000, 10_000)).toBe(28_000);
    expect(manaIncome(3_980, 10_000)).toBeGreaterThan(manaIncome(4_000, 10_000));
  });

  test('criterio 1 bis — lo mismo en el 30%, que es la cita de la wiki', () => {
    // «29.99% will usually generate more mana than 30%».
    expect(manaIncome(2_999, 10_000)).toBe(24_192);
    expect(manaIncome(3_000, 10_000)).toBe(24_000);
  });

  /** Dónde está el máximo, y en cuántos sitios. Truncar crea empates. */
  const argmax = (land: number): number[] => {
    let mejor = 0;
    for (let n = 1; n < land; n++) mejor = Math.max(mejor, manaIncome(n, land));
    const donde: number[] = [];
    for (let n = 1; n < land; n++) if (manaIncome(n, land) === mejor) donde.push(n);
    return donde;
  };

  test('criterio 2 — el máximo está en ~56%, y es una MESETA, no un punto', () => {
    // La fórmula exacta tiene un único máximo en 55,99%. Al truncar
    // (docs/ARQUITECTURA.md §9.2) empatan varios valores: el pico es algo más
    // indulgente de lo que la fórmula sugiere, y eso es consecuencia medida de
    // la decisión de redondeo, no un fallo.
    expect(manaIncome(5_599, 10_000)).toBe(30_695);
    expect(argmax(10_000)).toEqual([5_499, 5_599]); // 54,99% y 55,99%
  });

  test('criterio 2 bis — con 200 acres la meseta es de tres valores', () => {
    expect(argmax(200)).toEqual([109, 111, 113]); // 54,50%, 55,50%, 56,50%
    expect(manaIncome(111, 200)).toBe(609);
  });

  test('criterio 3 — la sierra muerde según el tamaño del mago', () => {
    // docs/SISTEMAS.md §17.1: primer cruce de porcentaje entero que RESTA.
    const primerCruceQueResta = (land: number): number => {
      for (let k = 1; k < 100; k++) {
        const n = Math.floor((k * land) / 100);
        if (n >= 1 && manaIncome(n, land) < manaIncome(n - 1, land)) return k;
      }
      return 100;
    };
    expect(primerCruceQueResta(200)).toBe(41);
    // Con 1.000 acres el truncamiento lo mueve un punto: la fórmula exacta
    // decía 19%, y con enteros es 20%. Medido el 2026-09-21.
    expect(primerCruceQueResta(1_000)).toBe(20);
    expect(primerCruceQueResta(3_500)).toBe(13);
    expect(primerCruceQueResta(10_000)).toBe(11);
    expect(primerCruceQueResta(20_000)).toBe(11);
  });

  test('dentro de una banda de porcentaje, cada node suma', () => {
    for (let n = 4_001; n < 4_099; n++) {
      expect(manaIncome(n, 10_000)).toBeGreaterThan(manaIncome(n - 1, 10_000));
    }
  });

  test('siempre devuelve un entero: la fórmula NO lo es', () => {
    // docs/ARQUITECTURA.md §9.2: 7.789 combinaciones no enteras en el rango
    // probado. Se trunca hacia abajo, una sola vez.
    expect(manaIncome(3, 200)).toBe(31); // 31,7 sin truncar
    expect(manaIncome(2, 200)).toBe(21); // 21,8 sin truncar
    for (const land of [200, 250, 1_250]) {
      for (let n = 0; n <= land; n++) {
        expect(Number.isInteger(manaIncome(n, land))).toBe(true);
      }
    }
  });

  test('sin nodes no hay maná, y sin tierra tampoco', () => {
    expect(manaIncome(0, 1_000)).toBe(0);
    expect(manaIncome(10, 0)).toBe(0);
  });

  test('el mago de partida produce 200 de maná por turno', () => {
    // 20 nodes sobre 200 acres = 10%. docs/SISTEMAS.md §15.
    expect(manaIncome(20, 200)).toBe(200);
  });

  test('el mago de 5.000 acres del cuadro de §4.2 produce 14.625', () => {
    expect(manaIncome(2_250, 5_000)).toBe(14_625);
  });
});
