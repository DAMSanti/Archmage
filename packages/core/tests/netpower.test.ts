import { describe, expect, test } from 'vitest';
import { NET_POWER, netPower } from '../src/netpower.js';
import { CATALOG, mageWith } from './fixtures.js';

/**
 * Net power **con el ejército**. docs/SISTEMAS.md §9.1.
 *
 * Hasta la fase 3 `netPower()` dejaba el ejército fuera y lo decía, porque el
 * `powerRank` de cada unidad seguía `[abierto]`. La tarea 1 lo cerró: está
 * publicado en la ficha. Mientras no contara, **una unidad invocada era coste
 * puro** en la medida oficial del tamaño de un mago — y eso volvía inútil
 * cualquier calibración sobre si merece la pena invocar.
 */
describe('el ejército cuenta', () => {
  test('un stack suma número × rango de poder', () => {
    const sin = mageWith({ farms: 10 }, 100, { geld: 0, population: 0 });
    const con = mageWith({ farms: 10 }, 100, {
      geld: 0,
      population: 0,
      army: [{ unitId: 'militia', count: 1_000 }],
    });
    // Milicia: powerRank 9 (docs/ORIGINAL.md §9.5).
    expect(netPower(con, CATALOG) - netPower(sin, CATALOG)).toBe(9_000);
  });

  test('suma todos los stacks, cada uno con su rango', () => {
    const m = mageWith({ farms: 10 }, 100, {
      geld: 0,
      population: 0,
      army: [
        { unitId: 'militia', count: 100 }, // 9
        { unitId: 'dryad', count: 50 }, // 23
      ],
    });
    const sin = mageWith({ farms: 10 }, 100, { geld: 0, population: 0 });
    expect(netPower(m, CATALOG) - netPower(sin, CATALOG)).toBe(100 * 9 + 50 * 23);
  });

  test('una unidad que no está en el catálogo no revienta el cálculo', () => {
    const m = mageWith({ farms: 10 }, 100, {
      geld: 0,
      population: 0,
      army: [{ unitId: 'no-existe', count: 5 }],
    });
    expect(() => netPower(m, CATALOG)).not.toThrow();
  });

  test('sigue saliendo entero', () => {
    const m = mageWith({ towns: 40, farms: 120, nodes: 33 }, 1_250, {
      geld: 999_999,
      population: 33_333,
      mana: 12_345,
      army: [{ unitId: 'dryad', count: 777 }],
    });
    expect(Number.isInteger(netPower(m, CATALOG))).toBe(true);
  });

  test('la tierra sigue mandando: un acre vale más que mil milicias', () => {
    // 1 acre = 1.000 de net power; 1.000 milicias = 9.000. Comprobación de
    // escala, para que el ejército no se coma la medida.
    expect(NET_POWER.perAcre).toBe(1_000);
    const conAcre = mageWith({ farms: 10 }, 101, { geld: 0, population: 0 });
    const conTropa = mageWith({ farms: 10 }, 100, {
      geld: 0,
      population: 0,
      army: [{ unitId: 'militia', count: 100 }],
    });
    expect(netPower(conAcre, CATALOG)).toBeGreaterThan(netPower(conTropa, CATALOG));
  });
});
