import { describe, expect, test } from 'vitest';
import {
  ATTACKER_LAND_SHARE,
  LAND_SHARE,
  PILLAGE_MAX_ACRES,
  SURVIVORS_PER_ACRE,
  landTaken,
  pillageTaken,
} from '../src/land.js';

/**
 * La tierra y los tres ataques. docs/SISTEMAS.md §9.1, de
 * docs/ORIGINAL.md §9.3.
 */
describe('criterio 8 — la tierra sale de los supervivientes', () => {
  test('el ejemplo trabajado del original sale clavado', () => {
    // «3.654 acres, asedio de 365 como máximo, hacen falta 18.250
    // supervivientes; el atacante se lleva 122 y se destruyen 243.»
    const r = landTaken(3_654, 18_250, 'siege');
    expect(r.lost).toBe(365);
    expect(r.taken).toBe(121); // ver abajo
    expect(r.taken + r.destroyed).toBe(365);
  });

  test('el «122» de la fuente es 121 al truncar, y se deja dicho', () => {
    // 365 / 3 = 121,67. La fuente dice 122 y nosotros truncamos, que es lo
    // que manda el invariante 7: los recursos son enteros y se redondea
    // hacia abajo. La diferencia es **un acre**, y la alternativa sería
    // redondear al alza solo aquí y que el atacante gane un acre que no
    // existe: 122 + 243 = 365 solo si `destroyed` se calcula por resta,
    // que es lo que hacemos.
    const r = landTaken(3_654, 18_250, 'siege');
    expect(r.taken).toBe(121);
    expect(r.destroyed).toBe(244);
  });

  test('hacen falta 50 supervivientes por acre', () => {
    expect(SURVIVORS_PER_ACRE).toBe(50);
    // Con la mitad de supervivientes, la mitad de tierra.
    expect(landTaken(3_654, 9_125, 'siege').lost).toBe(182);
    expect(landTaken(3_654, 9_125, 'siege').limitedBySurvivors).toBe(true);
  });

  test('un ejército diezmado no se lleva nada aunque gane', () => {
    expect(landTaken(3_654, 49, 'siege').lost).toBe(0);
    expect(landTaken(3_654, 0, 'siege').lost).toBe(0);
  });
});

describe('los tres ataques', () => {
  test('regular quita hasta el 5% y asedio hasta el 10%', () => {
    expect(LAND_SHARE.regular).toBe(0.05);
    expect(LAND_SHARE.siege).toBe(0.1);
    expect(landTaken(1_000, 1_000_000, 'regular').lost).toBe(50);
    expect(landTaken(1_000, 1_000_000, 'siege').lost).toBe(100);
  });

  test('el asedio saca el doble de tierra, y por eso pega dos tercios', () => {
    // La penalización de acierto (20 contra 30) es el precio de esto.
    const reg = landTaken(1_000, 1_000_000, 'regular').lost;
    const sit = landTaken(1_000, 1_000_000, 'siege').lost;
    expect(sit).toBe(reg * 2);
  });

  test('el saqueo NO quita tierra', () => {
    expect(LAND_SHARE.pillage).toBe(0);
    expect(landTaken(1_000, 1_000_000, 'pillage').lost).toBe(0);
  });

  test('en los dos que quitan tierra, el atacante se queda un tercio', () => {
    expect(ATTACKER_LAND_SHARE).toBeCloseTo(1 / 3, 10);
    for (const tipo of ['regular', 'siege'] as const) {
      const r = landTaken(3_000, 1_000_000, tipo);
      expect(r.taken).toBe(Math.floor(r.lost / 3));
      expect(r.destroyed).toBe(r.lost - r.taken);
    }
  });

  test('SE DESTRUYE MÁS DE LO QUE SE ROBA, siempre', () => {
    // Es la regla que impide que la guerra sea gratis a nivel de mundo.
    for (const acres of [200, 1_253, 3_421]) {
      const r = landTaken(acres, 1_000_000, 'siege');
      if (r.lost > 0) expect(r.destroyed).toBeGreaterThan(r.taken);
    }
  });
});

describe('el bonus de batalla sube la tierra', () => {
  test('un 50% de bonus arranca un 50% más', () => {
    expect(landTaken(1_000, 1_000_000, 'siege', 0.5).lost).toBe(150);
  });

  test('sin bonus no cambia nada', () => {
    expect(landTaken(1_000, 1_000_000, 'siege', 0).lost).toBe(100);
  });

  test('pero los supervivientes siguen mandando si son pocos', () => {
    // El bonus no crea tierra de la nada: sigue haciendo falta el ejército.
    const r = landTaken(1_000, 2_500, 'siege', 0.5);
    expect(r.lost).toBe(50);
    expect(r.limitedBySurvivors).toBe(true);
  });
});

describe('todo entero', () => {
  test('ninguna cantidad tiene decimales, y las tres cuadran', () => {
    for (const acres of [1, 7, 199, 1_253, 3_421]) {
      for (const supervivientes of [0, 51, 1_234, 999_999]) {
        const r = landTaken(acres, supervivientes, 'siege');
        expect(Number.isInteger(r.lost)).toBe(true);
        expect(Number.isInteger(r.taken)).toBe(true);
        expect(Number.isInteger(r.destroyed)).toBe(true);
        expect(r.taken + r.destroyed).toBe(r.lost);
        expect(r.lost).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('el saqueo', () => {
  test('roba el 10% del geld y de la población', () => {
    const r = pillageTaken(1_000_000, 50_000, 10_000);
    expect(r.geld).toBe(100_000);
    expect(r.population).toBe(5_000);
  });

  test('quema según el net power, no según el tamaño', () => {
    // docs/ORIGINAL.md §9.3: «depende del Net Power del ejército, no de su
    // tamaño». 1 acre por cada 200 de poder.
    expect(pillageTaken(0, 0, 2_000).burned).toBe(10);
    expect(pillageTaken(0, 0, 200).burned).toBe(1);
  });

  test('y no pasa de 100 acres quemados', () => {
    expect(PILLAGE_MAX_ACRES).toBe(100);
    expect(pillageTaken(0, 0, 100_000_000).burned).toBe(100);
  });

  test('contra un mago sin nada no saca nada, y no revienta', () => {
    expect(pillageTaken(0, 0, 0)).toEqual({ geld: 0, population: 0, burned: 0 });
  });
});
