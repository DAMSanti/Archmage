import { describe, expect, test } from 'vitest';
import { useItem } from '../src/useitem.js';
import { makeRandom } from '../src/random.js';
import type { ItemSpec } from '../src/items.js';
import { mageWith } from './fixtures.js';

/** Usar un item fuera de batalla. docs/SISTEMAS.md §12.1, criterio 10. */
const spec = (over: Partial<ItemSpec>): ItemSpec =>
  ({ id: 'x', name: 'x', rarity: 'lesser', use: 'outOfBattle', source: 't', ...over } as ItemSpec);

const mago = (items: Record<string, number> = { x: 1 }) =>
  mageWith({ farms: 100, towns: 40 }, 500, {
    geld: 10_000,
    mana: 5_000,
    population: 20_000,
    items,
  });

describe('lo que impide usar un item', () => {
  test('no tenerlo', () => {
    const r = useItem(
      mago({}),
      spec({ effect: { kind: 'grantGeld', amount: { min: 1, max: 1 } } }),
      makeRandom(1),
    );
    expect(r).toMatchObject({ error: { code: 'no_tienes' } });
  });

  test('que sea de batalla', () => {
    const r = useItem(
      mago(),
      spec({ use: 'battle', effect: { kind: 'ap', side: 'friendly', multiplier: 2 } }),
      makeRandom(1),
    );
    expect(r).toMatchObject({ error: { code: 'es_de_batalla' } });
  });

  test('que esté declarado sin implementar, y DICE por qué', () => {
    // Un hueco declarado es deuda; uno callado es un fallo esperando.
    const r = useItem(
      mago(),
      spec({ effect: { kind: 'notImplemented', why: 'Los Griales no existen en este juego.' } }),
      makeRandom(1),
    );
    expect(r).toMatchObject({ error: { code: 'no_implementado' } });
    expect((r as { error: { message: string } }).error.message).toContain('Griales');
  });

  test('que sea dirigido y no haya objetivo', () => {
    const r = useItem(
      mago(),
      spec({ targeted: true, effect: { kind: 'enemyTurns', amount: { min: 2, max: 8 } } }),
      makeRandom(1),
    );
    expect(r).toMatchObject({ error: { code: 'sin_objetivo' } });
  });
});

describe('los que te dan algo', () => {
  test('la Piedra del Sabio da geld dentro de su rango', () => {
    const r = useItem(
      mago(),
      spec({ effect: { kind: 'grantGeld', amount: { min: 1_000_000, max: 2_000_000 } } }),
      makeRandom(5),
    );
    if ('error' in r) throw new Error(r.error.code);
    const ganado = r.self.resources.geld - 10_000;
    expect(ganado).toBeGreaterThanOrEqual(1_000_000);
    expect(ganado).toBeLessThanOrEqual(2_000_000);
  });

  test('el Vino de los Tres Látigos sube un 10% la población', () => {
    const r = useItem(
      mago(),
      spec({ effect: { kind: 'grantPopulationShare', share: 0.1 } }),
      makeRandom(5),
    );
    if ('error' in r) throw new Error(r.error.code);
    expect(r.self.resources.population).toBe(22_000);
  });

  test('los que dan unidades las suman al stack que ya hubiera', () => {
    const conEjercito = mageWith({ farms: 10 }, 200, {
      items: { x: 1 },
      army: [{ unitId: 'militia', count: 100 }],
    });
    const r = useItem(
      conEjercito,
      spec({ effect: { kind: 'grantUnits', unitId: 'militia', amount: { min: 50, max: 50 } } }),
      makeRandom(1),
    );
    if ('error' in r) throw new Error(r.error.code);
    expect(r.self.army).toEqual([{ unitId: 'militia', count: 150 }]);
  });
});

describe('los que atacan sin batalla', () => {
  test('el Muñeco Vudú destruye turnos del enemigo', () => {
    // **Los turnos son un objetivo militar**, y eso solo tiene sentido
    // porque el turno es la moneda (docs/SISTEMAS.md §2).
    const yo = mago();
    const el = { ...mago({}), id: 'otro', turns: { current: 50, lastAccrualAt: 0 } };
    const r = useItem(
      yo,
      spec({ targeted: true, effect: { kind: 'enemyTurns', amount: { min: 2, max: 8 } } }),
      makeRandom(3),
      el,
    );
    if ('error' in r) throw new Error(r.error.code);
    const perdidos = 50 - r.target!.turns.current;
    expect(perdidos).toBeGreaterThanOrEqual(2);
    expect(perdidos).toBeLessThanOrEqual(8);
    // Y a mí no me pasa nada.
    expect(r.self.turns.current).toBe(yo.turns.current);
  });

  test('las Flautas destruyen exactamente lo que dicen, y no bajan de cero', () => {
    const el = { ...mago({}), id: 'otro' };
    const r = useItem(
      mago(),
      spec({
        targeted: true,
        effect: { kind: 'enemyGeldAndPopulation', geld: 500_000, population: 7_500 },
      }),
      makeRandom(1),
      el,
    );
    if ('error' in r) throw new Error(r.error.code);
    expect(r.target!.resources.population).toBe(12_500);
    // Tenía 10.000 de geld y le quitan 500.000: queda en 0, no en negativo.
    expect(r.target!.resources.geld).toBe(0);
  });

  test('robar le quita al otro lo que me da a mí', () => {
    const el = { ...mago({}), id: 'otro', resources: { geld: 1_000_000, mana: 0, population: 0 } };
    const r = useItem(
      mago(),
      spec({ targeted: true, effect: { kind: 'stealFromEnemy' } }),
      makeRandom(1),
      el,
    );
    if ('error' in r) throw new Error(r.error.code);
    expect(r.self.resources.geld - 10_000).toBe(50_000);
    expect(r.target!.resources.geld).toBe(950_000);
  });
});

describe('el item se gasta', () => {
  test('se descuenta al usarlo', () => {
    const r = useItem(
      mago({ x: 3 }),
      spec({ effect: { kind: 'grantGeld', amount: { min: 1, max: 1 } } }),
      makeRandom(1),
    );
    if ('error' in r) throw new Error(r.error.code);
    expect(r.self.items.x).toBe(2);
  });

  test('el último desaparece del inventario, no queda en cero', () => {
    const r = useItem(
      mago({ x: 1 }),
      spec({ effect: { kind: 'grantGeld', amount: { min: 1, max: 1 } } }),
      makeRandom(1),
    );
    if ('error' in r) throw new Error(r.error.code);
    expect(r.self.items.x).toBeUndefined();
  });

  test('se gasta AUNQUE no salga nada', () => {
    // El Cofre del Tesoro puede no dar nada, y eso es parte de lo que se
    // compra.
    const r = useItem(
      mago({ x: 1 }),
      spec({ effect: { kind: 'weighted', options: [{ weight: 1, effect: null }] } }),
      makeRandom(1),
    );
    if ('error' in r) throw new Error(r.error.code);
    expect(r.self.items.x).toBeUndefined();
    expect(r.detail).toBe('nada');
  });
});

describe('todo entero, y nada negativo', () => {
  test('ningún recurso queda fraccionario ni bajo cero', () => {
    const el = { ...mago({}), id: 'otro', resources: { geld: 7, mana: 3, population: 11 } };
    for (const s of [1, 2, 3, 4, 5]) {
      const r = useItem(
        mago(),
        spec({
          targeted: true,
          effect: { kind: 'enemyPopulation', amount: { min: 5_000, max: 15_000 } },
        }),
        makeRandom(s),
        el,
      );
      if ('error' in r) continue;
      expect(Number.isInteger(r.target!.resources.population)).toBe(true);
      expect(r.target!.resources.population).toBeGreaterThanOrEqual(0);
    }
  });
});
