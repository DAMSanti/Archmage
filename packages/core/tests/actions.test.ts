import { describe, expect, test } from 'vitest';
import {
  apply,
  buildRateFp,
  exploreYield,
  landIsConsistent,
  CONSTRUCTION_SCALE,
  type Action,
  type Ctx,
  type MageState,
} from '../src/index.js';
import { CATALOG, TERRA, TUNING, mageWith, seededRandom } from './fixtures.js';

const TUNE = { ...TUNING, exploreFactor: 22, exploreLandCap: 3_500 };

const ctx = (seed = 1): Ctx => ({
  now: 0,
  random: seededRandom(seed),
  server: TERRA,
  catalog: CATALOG,
});

const run = (s: MageState, a: Action, seed = 1) => apply(s, a, ctx(seed), TUNE);

describe('apply, el despachador', () => {
  test('una acción desconocida devuelve error de dominio, no una excepción', () => {
    const r = run(mageWith({ farms: 10 }, 100), { type: 'nope' } as unknown as Action);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('unknown_action');
  });

  test('no muta el estado que recibe', () => {
    const m = mageWith({ farms: 10, workshops: 10 }, 100, { geld: 500_000 });
    const antes = JSON.parse(JSON.stringify(m));
    run(m, { type: 'build', building: 'farms', turns: 3 });
    expect(m).toEqual(antes);
  });

  test('sin turnos suficientes no hace nada', () => {
    const m = { ...mageWith({ farms: 10 }, 100), turns: { current: 2, lastAccrualAt: 0 } };
    const r = run(m, { type: 'build', building: 'farms', turns: 5 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('not_enough_turns');
  });

  test('gastar turnos los descuenta y sube turnsSpent', () => {
    const m = mageWith({ farms: 10, workshops: 10 }, 100, { geld: 500_000 });
    const r = run(m, { type: 'build', building: 'farms', turns: 4 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.turns.current).toBe(m.turns.current - 4);
      expect(r.state.turnsSpent).toBe(4);
    }
  });
});

describe('velocidad de construcción', () => {
  test('299 workshops construyen exactamente un fort por turno', () => {
    // docs/SISTEMAS.md §4.1 [orig], el corolario publicado.
    expect(buildRateFp('forts', 299)).toBe(CONSTRUCTION_SCALE);
  });

  test('299 workshops construyen 30 workshops por turno', () => {
    expect(buildRateFp('workshops', 299) / CONSTRUCTION_SCALE).toBe(30);
  });

  test('las barriers van a 1 por turno, haya los workshops que haya', () => {
    for (const w of [0, 10, 299, 5_000]) {
      expect(buildRateFp('barriers', w)).toBe(CONSTRUCTION_SCALE);
    }
  });

  test('la proporción entre edificios es la del original', () => {
    const w = 299;
    const farms = buildRateFp('farms', w);
    expect(farms / buildRateFp('workshops', w)).toBe(2);
    expect(farms / buildRateFp('guilds', w)).toBe(4);
    expect(farms / buildRateFp('nodes', w)).toBe(6);
    expect(farms / buildRateFp('forts', w)).toBe(60);
  });
});

describe('construir', () => {
  test('las fracciones se acumulan entre turnos, no se pierden', () => {
    // docs/SISTEMAS.md §4.1 [nuestro]. Con 0 workshops el ritmo de nodes es
    // 0,0333 por turno: hacen falta 30 turnos para el primero.
    const m = mageWith({ farms: 10 }, 100, { geld: 500_000 });
    const r = run(m, { type: 'build', building: 'nodes', turns: 29 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.buildings.nodes).toBe(0);
      expect(r.state.construction.nodes).toBeGreaterThan(0);
      const r2 = apply(r.state, { type: 'build', building: 'nodes', turns: 2 }, ctx(), TUNE);
      expect(r2.ok).toBe(true);
      if (r2.ok) expect(r2.state.buildings.nodes).toBe(1);
    }
  });

  test('no se construye sin tierra libre', () => {
    const m = mageWith({ farms: 100, workshops: 299 }, 399, { geld: 5_000_000 });
    // 399 acres, 399 construidos → 0 libres.
    expect(m.land.free).toBe(0);
    const r = run(m, { type: 'build', building: 'farms', turns: 5 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.buildings.farms).toBe(100);
  });

  test('no se construye si el geld no llega al coste', () => {
    // Con 900 de geld no se paga una farm (1.000), pero sí el mantenimiento
    // (75/turno), así que NO colapsa: simplemente no construye.
    const m = mageWith({ farms: 10, workshops: 5 }, 1_000, { geld: 900, population: 0 });
    const r = run(m, { type: 'build', building: 'farms', turns: 1 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.buildings.farms).toBe(10);
      expect(r.state.resources.geld).toBe(825);
    }
  });

  test('con geld a cero el reino SÍ colapsa y pierde edificios', () => {
    // docs/SISTEMAS.md §5.6 [orig]. Lo descubrió el test anterior al fallar:
    // no construir y no colapsar son cosas distintas.
    const m = mageWith({ farms: 10, workshops: 299 }, 1_000, { geld: 0, population: 0 });
    const r = run(m, { type: 'build', building: 'farms', turns: 1 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.buildings.workshops).toBeLessThan(299);
      expect(r.state.resources.geld).toBe(0);
      expect(landIsConsistent(r.state)).toBe(true);
      expect(r.events.some((e) => e.type === 'collapse.geld')).toBe(true);
    }
  });

  test('demoler libera el acre y no devuelve geld', () => {
    const m = mageWith({ farms: 100, workshops: 299 }, 1_000, { geld: 1_000 });
    const r = run(m, { type: 'demolish', building: 'farms', turns: 1 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.buildings.farms).toBeLessThan(100);
      expect(r.state.resources.geld).toBeLessThanOrEqual(m.resources.geld + 4_050);
      expect(landIsConsistent(r.state)).toBe(true);
    }
  });
});

describe('explorar', () => {
  test('la curva pasa por los extremos medidos del original', () => {
    expect(exploreYield(200, TUNE)).toBe(21); // el original mide 18-26
    expect(exploreYield(1_250, TUNE)).toBe(14);
    expect(exploreYield(3_000, TUNE)).toBe(3);
    expect(exploreYield(3_400, TUNE)).toBe(1);
    expect(exploreYield(3_500, TUNE)).toBe(0);
  });

  test('criterio 6 — a tope de exploración NO se gasta el turno', () => {
    // docs/SISTEMAS.md §17.1: el juego no te deja tirar un turno sin avisar.
    const m = mageWith({ farms: 10 }, 3_500, { geld: 1_000 });
    const r = run(m, { type: 'explore', turns: 5 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('exploration_exhausted');
  });

  test('explorar suma acres y los deja libres', () => {
    const m = mageWith({ farms: 10 }, 200, { geld: 1_000 });
    const r = run(m, { type: 'explore', turns: 10 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.land.total).toBeGreaterThan(400);
      expect(landIsConsistent(r.state)).toBe(true);
    }
  });
});

describe('cargar', () => {
  test('cargar maná duplica el maná de ese turno', () => {
    const m = mageWith({ nodes: 20, farms: 45, towns: 15 }, 200, { mana: 0, population: 4_500 });
    const normal = run(m, { type: 'build', building: 'farms', turns: 1 });
    const cargado = run(m, { type: 'chargeMana', turns: 1 });
    expect(normal.ok && cargado.ok).toBe(true);
    if (normal.ok && cargado.ok) {
      expect(cargado.state.resources.mana).toBe(normal.state.resources.mana * 2);
    }
  });
});

describe('reclutar', () => {
  test('fijar el reclutamiento NO cuesta turnos, y cobra el geld por delante', () => {
    const m = mageWith({ barracks: 10, farms: 100, towns: 40 }, 500, { geld: 100_000, population: 10_000 });
    const r = run(m, { type: 'setRecruit', unitId: 'phalanx', count: 300 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.turns.current).toBe(m.turns.current);
      expect(r.state.resources.geld).toBe(100_000 - 300 * 45); // 45, no 100: ficha real
      expect(r.state.recruiting).toEqual({ unitId: 'phalanx', remaining: 300, perTurn: 30 });
    }
  });

  test('la tropa llega escalonada al gastar turnos', () => {
    const m = mageWith({ barracks: 10, farms: 100, towns: 40 }, 500, { geld: 100_000, population: 10_000 });
    const puesto = run(m, { type: 'setRecruit', unitId: 'phalanx', count: 300 });
    expect(puesto.ok).toBe(true);
    if (!puesto.ok) return;

    const tras5 = apply(puesto.state, { type: 'explore', turns: 5 }, ctx(), TUNE);
    expect(tras5.ok).toBe(true);
    if (tras5.ok) {
      expect(tras5.state.army).toEqual([{ unitId: 'phalanx', count: 150 }]);
      expect(tras5.state.recruiting?.remaining).toBe(150);
    }
  });

  test('una unidad que no existe da error de dominio', () => {
    const m = mageWith({ barracks: 10, farms: 10 }, 100, { geld: 100_000 });
    const r = run(m, { type: 'setRecruit', unitId: 'dragon', count: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('unknown_unit');
  });

  test('sin geld no se puede fijar', () => {
    const m = mageWith({ barracks: 10, farms: 10 }, 100, { geld: 10 });
    const r = run(m, { type: 'setRecruit', unitId: 'phalanx', count: 1_000 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('not_enough_geld');
  });
});

describe('invariante 11 — la tierra cuadra siempre', () => {
  test('tras cualquier secuencia de construir, demoler y explorar', () => {
    // Test de propiedad de docs/SPECS.md §5, invariante 11.
    const acciones: Action[] = [
      { type: 'build', building: 'farms', turns: 3 },
      { type: 'explore', turns: 4 },
      { type: 'build', building: 'workshops', turns: 5 },
      { type: 'demolish', building: 'farms', turns: 2 },
      { type: 'build', building: 'nodes', turns: 6 },
      { type: 'explore', turns: 2 },
      { type: 'demolish', building: 'workshops', turns: 1 },
      { type: 'build', building: 'towns', turns: 9 },
    ];
    let s = mageWith({ farms: 20, workshops: 20, towns: 10 }, 300, { geld: 10_000_000 });
    for (const a of acciones) {
      const r = apply(s, a, ctx(7), TUNE);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      s = r.state;
      expect(landIsConsistent(s)).toBe(true);
      expect(s.land.free).toBeGreaterThanOrEqual(0);
    }
  });
});
