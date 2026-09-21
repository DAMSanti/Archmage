import { describe, expect, test } from 'vitest';
import { makeRandom } from '../src/index.js';

/**
 * El generador de azar. docs/SPECS.md §5, invariante 3.
 *
 * Estos tests existen por un fallo real: la primera versión era un xorshift32
 * sembrado directamente, y **con semillas pequeñas las primeras tiradas salían
 * casi cero**. Un hechizo con 30% de fallo fallaba cinco de cada cinco veces.
 * No daba error, no rompía ningún test de entonces, y habría hecho que el
 * juego pareciera amañado.
 */
describe('reproducibilidad', () => {
  test('misma semilla, misma secuencia', () => {
    const a = makeRandom(42);
    const b = makeRandom(42);
    for (let i = 0; i < 50; i++) expect(a.next()).toBe(b.next());
  });

  test('semillas distintas, secuencias distintas', () => {
    expect(makeRandom(1).next()).not.toBe(makeRandom(2).next());
  });
});

describe('la primera tirada ya está bien distribuida', () => {
  test('ninguna semilla pequeña arranca pegada a cero', () => {
    // El fallo de la versión anterior, fijado para que no vuelva.
    for (let seed = 1; seed <= 200; seed++) {
      const primera = makeRandom(seed).next();
      expect(primera, `semilla ${seed}`).toBeGreaterThan(0.001);
      expect(primera, `semilla ${seed}`).toBeLessThan(0.999);
    }
  });

  test('las primeras tiradas de semillas consecutivas cubren todo el rango', () => {
    const primeras = Array.from({ length: 200 }, (_, i) => makeRandom(i + 1).next());
    const bajas = primeras.filter((x) => x < 0.25).length;
    const altas = primeras.filter((x) => x > 0.75).length;
    // Con 200 muestras, cada cuarto debería llevarse unas 50.
    expect(bajas).toBeGreaterThan(25);
    expect(altas).toBeGreaterThan(25);
  });

  test('un umbral del 30% se cumple aproximadamente el 30% de las veces', () => {
    // El caso exacto que falló: `nextInt(100) < 30`.
    let veces = 0;
    for (let seed = 1; seed <= 1_000; seed++) {
      if (makeRandom(seed).nextInt(100) < 30) veces++;
    }
    expect(veces).toBeGreaterThan(230);
    expect(veces).toBeLessThan(370);
  });
});

describe('los rangos', () => {
  test('next() se queda en [0, 1)', () => {
    const r = makeRandom(7);
    for (let i = 0; i < 5_000; i++) {
      const x = r.next();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  test('nextInt(n) se queda en [0, n) y los toca todos', () => {
    const r = makeRandom(11);
    const vistos = new Set<number>();
    for (let i = 0; i < 5_000; i++) {
      const x = r.nextInt(6);
      expect(Number.isInteger(x)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(6);
      vistos.add(x);
    }
    expect(vistos.size).toBe(6);
  });

  test('una secuencia larga no se queda pegada en un valor', () => {
    const r = makeRandom(3);
    const cuentas = new Array(10).fill(0) as number[];
    for (let i = 0; i < 10_000; i++) cuentas[r.nextInt(10)]! += 1;
    for (const c of cuentas) {
      expect(c).toBeGreaterThan(800);
      expect(c).toBeLessThan(1_200);
    }
  });
});
