import { describe, expect, test } from 'vitest';
import { income, populationCapacity } from '../src/economy.js';
import { CATALOG, TUNING, mageWith } from './fixtures.js';

/**
 * La economía **publicada** del original. docs/ORIGINAL.md §4.2, confianza
 * alta, encontrada el 2026-09-21.
 *
 * Esto estaba en §11 como «sin verificar» y resultó estar publicado. Lo que
 * teníamos no era solo una escala distinta: era **la forma equivocada**.
 * Espacio y comida son dos topes **separados** —el espacio lo dan todos los
 * edificios y se **suma**, la comida solo las farms— y nosotros teníamos un
 * único `min()` con la farm haciendo de tope de comida.
 */
describe('el ingreso de geld es el publicado', () => {
  test('Pob × √((100 + 10×towns) / tierra) + 1.000', () => {
    const m = mageWith({ towns: 100, farms: 250 }, 1_000, { population: 10_000 });
    // (100 + 1.000) / 1.000 = 1,1 → √1,1 = 1,048808...
    const esperado = Math.floor(10_000 * Math.sqrt(1.1) + 1_000);
    expect(income(m, CATALOG, TUNING).geld).toBe(esperado);
  });

  test('hay suelo de 1.000 aunque no quede nadie', () => {
    const m = mageWith({ towns: 10, farms: 25 }, 1_000, { population: 0 });
    expect(income(m, CATALOG, TUNING).geld).toBe(1_000);
  });

  test('más towns sobre la misma tierra dan más geld por cabeza', () => {
    const pocos = mageWith({ towns: 50, farms: 250 }, 1_000, { population: 10_000 });
    const muchos = mageWith({ towns: 200, farms: 250 }, 1_000, { population: 10_000 });
    expect(income(muchos, CATALOG, TUNING).geld).toBeGreaterThan(
      income(pocos, CATALOG, TUNING).geld,
    );
  });

  test('pero con rendimiento decreciente: es una raíz, no una recta', () => {
    // Doblar los towns NO dobla el geld por cabeza. Es lo que hace que
    // volcarse a towns deje de compensar en algún punto.
    const base = mageWith({ towns: 100, farms: 250 }, 1_000, { population: 10_000 });
    const doble = mageWith({ towns: 200, farms: 250 }, 1_000, { population: 10_000 });
    const g1 = income(base, CATALOG, TUNING).geld - 1_000;
    const g2 = income(doble, CATALOG, TUNING).geld - 1_000;
    expect(g2).toBeLessThan(g1 * 2);
  });

  test('sin tierra no revienta', () => {
    const m = mageWith({}, 0, { population: 0 });
    expect(() => income(m, CATALOG, TUNING)).not.toThrow();
  });
});

describe('espacio y comida son dos topes separados', () => {
  test('el espacio lo dan town y farm, y se SUMAN: 1.000 y 100', () => {
    const cap = populationCapacity(mageWith({ towns: 10, farms: 25 }, 1_000), TUNING);
    expect(cap.space).toBe(10 * 1_000 + 25 * 100); // 12.500
  });

  test('la comida la dan solo las farms: 500 cada una', () => {
    const cap = populationCapacity(mageWith({ towns: 10, farms: 25 }, 1_000), TUNING);
    expect(cap.food).toBe(12_500);
  });

  test('el ejemplo trabajado de la wiki sale clavado', () => {
    // «10 towns = 10k de población máxima» · «25 farms = 2,5k de población
    // máxima + 12,5k de comida» (docs/ORIGINAL.md §4.2).
    const cap = populationCapacity(mageWith({ towns: 10, farms: 25 }, 1_000), TUNING);
    expect(cap.space).toBe(12_500);
    expect(cap.food).toBe(12_500);
    expect(cap.capacity).toBe(12_500);
  });

  test('2,5 farms por town es el reparto que iguala los dos topes', () => {
    // Y por eso es el que aconseja la wiki. Con menos manda la comida, con
    // más manda el espacio: en los dos casos sobra edificio.
    for (const [farms, manda] of [[200, 'food'], [250, 'igual'], [400, 'space']] as const) {
      const cap = populationCapacity(mageWith({ towns: 100, farms }, 1_000), TUNING);
      if (manda === 'food') expect(cap.food).toBeLessThan(cap.space);
      else if (manda === 'space') expect(cap.space).toBeLessThan(cap.food);
      else expect(cap.food).toBe(cap.space);
    }
  });
});

describe('el ejército compite por los dos topes', () => {
  test('come comida: todas las unidades, siempre', () => {
    // El ejército tiene que **atar el tope** para que se note; con sitio de
    // sobra los dos crecen igual, que es lo que hacía mal este test al
    // escribirlo. Con 124.000 de población y 125.000 de comida, 900
    // milicias se comen casi todo el margen que queda.
    const lleno = { population: 124_000 } as const;
    const sin = mageWith({ towns: 100, farms: 250 }, 1_000, lleno);
    const con = mageWith({ towns: 100, farms: 250 }, 1_000, {
      ...lleno,
      army: [{ unitId: 'militia', count: 900 }],
    });
    expect(income(con, CATALOG, TUNING).population).toBeLessThan(
      income(sin, CATALOG, TUNING).population,
    );
  });

  test('un ejército que se come la comida frena el crecimiento a cero', () => {
    const m = mageWith({ towns: 100, farms: 250 }, 1_000, {
      population: 0,
      army: [{ unitId: 'militia', count: 125_000 }],
    });
    expect(income(m, CATALOG, TUNING).population).toBe(0);
  });

  test('la población nunca crece por encima del tope que manda', () => {
    const m = mageWith({ towns: 100, farms: 200 }, 1_000, { population: 99_900 });
    const cap = populationCapacity(m, TUNING);
    expect(m.resources.population + income(m, CATALOG, TUNING).population).toBeLessThanOrEqual(
      cap.capacity,
    );
  });
});
