import { describe, expect, test } from 'vitest';
import { FOUNDERS_NEEDED, canAttack, canFound, canJoin, canLeave, sameGuild } from '../src/guild.js';
import type { Guild } from '../src/guild.js';
import { resolveAttack } from '../src/war.js';
import { CATALOG, TERRA, mageWith, seededRandom } from './fixtures.js';
import type { Ctx, MageState } from '../src/types.js';

/** Gremios. docs/SISTEMAS.md §14.1, criterios 1, 2 y 3. */
const gremio = (over: Partial<Guild> = {}): Guild => ({
  id: 'g1',
  serverId: 'terra',
  name: 'Los Cinco',
  leaderId: 'a',
  members: [
    { mageId: 'a', role: 'leader' },
    { mageId: 'b', role: 'member' },
  ],
  enemies: [],
  ...over,
});

describe('criterio 1 — hacen falta cinco fundadores', () => {
  test('con cuatro no se funda', () => {
    expect(FOUNDERS_NEEDED).toBe(5);
    expect(canFound(['a', 'b', 'c', 'd'], () => false)).toMatchObject({
      error: { code: 'faltan_fundadores' },
    });
  });

  test('con cinco sí', () => {
    expect(canFound(['a', 'b', 'c', 'd', 'e'], () => false)).toEqual({ ok: true });
  });

  test('y tienen que ser cinco DISTINTOS', () => {
    // Repetir un id para llegar a cinco es el atajo obvio, y sin
    // comprobarlo funcionaría.
    expect(canFound(['a', 'a', 'a', 'a', 'a'], () => false)).toMatchObject({
      error: { code: 'faltan_fundadores' },
    });
  });

  test('ninguno puede estar ya en otro gremio', () => {
    expect(canFound(['a', 'b', 'c', 'd', 'e'], (id) => id === 'c')).toMatchObject({
      error: { code: 'ya_tienes_gremio' },
    });
  });
});

describe('criterio 3 — un mago, un gremio', () => {
  test('el que ya tiene uno no entra en otro', () => {
    expect(canJoin('z', gremio(), true)).toMatchObject({ error: { code: 'ya_tienes_gremio' } });
  });

  test('el que no tiene, entra', () => {
    expect(canJoin('z', gremio(), false)).toEqual({ ok: true });
  });

  test('y no se entra dos veces en el mismo', () => {
    expect(canJoin('b', gremio(), false)).toMatchObject({ error: { code: 'ya_tienes_gremio' } });
  });
});

describe('salirse', () => {
  test('el que no está dentro no puede salir', () => {
    expect(canLeave('z', gremio())).toMatchObject({ error: { code: 'no_eres_miembro' } });
  });

  test('un miembro normal sale', () => {
    expect(canLeave('b', gremio())).toEqual({ ok: true });
  });

  test('EL LÍDER NO SALE sin pasar antes el liderazgo', () => {
    // Dejaría el gremio sin quien lo lleve y sin forma de nombrar a otro.
    expect(canLeave('a', gremio())).toMatchObject({ error: { code: 'el_lider_no_sale' } });
  });

  test('salvo que sea el último que queda', () => {
    expect(canLeave('a', gremio({ members: [{ mageId: 'a', role: 'leader' }] }))).toEqual({
      ok: true,
    });
  });
});

describe('criterio 2 — a un compañero no se le ataca', () => {
  test('mismo gremio, no se puede', () => {
    expect(canAttack('g1', 'g1')).toBe(false);
  });

  test('gremios distintos, sí', () => {
    expect(canAttack('g1', 'g2')).toBe(true);
  });

  test('sin gremio, sí — y dos magos SIN gremio no son compañeros', () => {
    // Si `sameGuild(null, null)` diera `true`, **nadie podría atacar a
    // nadie** hasta que hubiera gremios. Es el fallo obvio de comparar
    // ausencias.
    expect(canAttack(null, null)).toBe(true);
    expect(sameGuild(null, null)).toBe(false);
    expect(canAttack('g1', null)).toBe(true);
  });

  test('y en un ataque de verdad es un error de dominio con su código', () => {
    const ctx: Ctx = { now: 0, random: seededRandom(3), server: TERRA, catalog: CATALOG };
    const mago = (id: string): MageState => ({
      ...mageWith({ farms: 200, towns: 60 }, 1_000, {
        geld: 1_000_000,
        population: 50_000,
        army: [{ unitId: 'militia', count: 5_000 }],
      }),
      id,
      name: id,
      turnsSpent: TERRA.protectionTurns + 10,
    });
    const r = resolveAttack(mago('a'), mago('b'), 'regular', ctx, {
      attacker: 'g1',
      defender: 'g1',
    });
    expect(r).toMatchObject({ error: { code: 'es_de_tu_gremio' } });
  });

  test('sin pasar gremios, el ataque se comporta como en la fase 3', () => {
    // **El canario**: los tests de la fase 3 no pasan gremios, y tienen
    // que seguir dando lo mismo.
    const ctx: Ctx = { now: 0, random: seededRandom(3), server: TERRA, catalog: CATALOG };
    const mago = (id: string): MageState => ({
      ...mageWith({ farms: 200, towns: 60 }, 1_000, {
        geld: 1_000_000,
        population: 50_000,
        army: [{ unitId: 'militia', count: 5_000 }],
      }),
      id,
      name: id,
      turnsSpent: TERRA.protectionTurns + 10,
    });
    const r = resolveAttack(mago('a'), mago('b'), 'regular', ctx);
    expect('error' in r).toBe(false);
  });
});
