import { describe, expect, test } from 'vitest';
import { landIsConsistent, resolveTurn } from '../src/index.js';
import { CATALOG, TUNING, mageWith, seededRandom } from './fixtures.js';

/**
 * Criterio 7 de docs/SISTEMAS.md §17.1: el colapso es en cascada y **en orden**,
 * y los tres recursos se sienten distintos (docs/SISTEMAS.md §5.6 [orig]).
 *
 * Todos los estados se **construyen**, no se juegan hasta ellos
 * (docs/ARQUITECTURA.md §6).
 */
const tick = (m: Parameters<typeof resolveTurn>[0], seed = 1) =>
  resolveTurn(m, CATALOG, TUNING, seededRandom(seed));

describe('colapso de geld', () => {
  test('los forts se reducen a la mitad', () => {
    const m = mageWith({ forts: 20, farms: 10 }, 1_000, { geld: 0, population: 0 });
    const r = tick(m);
    expect(r.state.buildings.forts).toBe(10);
    const evento = r.events.find((e) => e.type === 'collapse.geld');
    expect(evento).toMatchObject({ fortsLost: 10 });
  });

  test('las unidades desertan antes de perder edificios', () => {
    const m = mageWith({ farms: 200, towns: 60 }, 1_000, {
      geld: 0,
      population: 5_000,
      army: [{ unitId: 'phalanx', count: 5_000 }],
    });
    const r = tick(m);
    const total = r.state.army.reduce((a, s) => a + s.count, 0);
    expect(total).toBeLessThan(5_000);
    expect(r.state.buildings.farms).toBe(200); // no hizo falta tocarlos
  });

  test('un fort solo cae a cero: es la muerte del mago', () => {
    // docs/SISTEMAS.md §4 [orig]: con 0 forts el mago muere.
    const m = mageWith({ forts: 1, farms: 10 }, 1_000, { geld: 0, population: 0 });
    expect(tick(m).state.buildings.forts).toBe(0);
  });

  test('la tierra sigue cuadrando después del colapso', () => {
    const m = mageWith({ forts: 20, farms: 300, workshops: 100, guilds: 50 }, 1_000, {
      geld: 0,
      population: 0,
    });
    const r = tick(m);
    expect(landIsConsistent(r.state)).toBe(true);
    expect(r.state.land.free).toBeGreaterThanOrEqual(0);
  });
});

describe('colapso de maná', () => {
  test('las barriers se deshacen y sus acres vuelven a estar libres', () => {
    const m = mageWith({ barriers: 25, farms: 100, nodes: 0 }, 1_000, { mana: 0, geld: 1_000_000 });
    const libresAntes = m.land.free;
    const r = tick(m);
    expect(r.state.buildings.barriers).toBe(0);
    expect(r.state.land.free).toBe(libresAntes + 25);
    expect(landIsConsistent(r.state)).toBe(true);
  });

  test('se disuelve un stack, y cuál es reproducible con la semilla', () => {
    const m = mageWith({ barriers: 25, farms: 100 }, 1_000, {
      mana: 0,
      geld: 1_000_000,
      army: [
        { unitId: 'militia', count: 100 },
        { unitId: 'phalanx', count: 100 },
        { unitId: 'cavalry', count: 100 },
      ],
    });
    const a = tick(m, 42).state.army.map((s) => s.unitId);
    const b = tick(m, 42).state.army.map((s) => s.unitId);
    // Misma semilla, mismo resultado: la repetición no miente
    // (docs/SPECS.md §5, invariante 3).
    expect(a).toEqual(b);
    expect(a).toHaveLength(2);
  });

  test('los encantamientos se caen', () => {
    const m = mageWith({ barriers: 10, farms: 100 }, 1_000, { mana: 0, geld: 1_000_000 });
    const conEncantamientos = { ...m, enchantments: [{ spellId: 'x', upkeepMana: 10 }] };
    const r = tick(conEncantamientos);
    expect(r.state.enchantments).toEqual([]);
    expect(r.events.find((e) => e.type === 'collapse.mana')).toMatchObject({ enchantmentsLost: 1 });
  });
});

describe('el maná se derrama al llenar el almacén', () => {
  test('lo que pasa de nodes × 1.000 se pierde, y queda anotado', () => {
    // docs/ORIGINAL.md §3 [orig]: el almacén ES el edificio.
    const m = mageWith({ nodes: 10, farms: 100, towns: 30 }, 1_000, {
      mana: 9_990,
      geld: 1_000_000,
      population: 5_000,
    });
    const r = tick(m);
    expect(r.state.resources.mana).toBeLessThanOrEqual(10_000);
    expect(r.events.some((e) => e.type === 'mana.overflowed')).toBe(true);
  });
});

describe('ningún recurso queda en negativo', () => {
  test('ni con el reino entero sin pagar', () => {
    const m = mageWith({ forts: 5, farms: 50, guilds: 200, barriers: 30 }, 1_000, {
      geld: 0,
      mana: 0,
      population: 0,
    });
    const r = tick(m);
    for (const v of Object.values(r.state.resources)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});
