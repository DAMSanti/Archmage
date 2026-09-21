import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { createMage } from '@archmage/core';
import { STARTING_KINGDOM, TERRA } from '@archmage/content';
import { buildApp, DEV_MAGE_ID, makeRandom } from '../src/app.js';
import { connect, ensureSchema, truncateAll } from '../src/db.js';
import { insertMage, loadAccrued } from '../src/repository.js';
import type { FastifyInstance } from 'fastify';

/**
 * Tests del servidor contra un Postgres de verdad.
 *
 * Usan su **propia base de datos**, creada y borrada aquí: nunca la de
 * desarrollo (docs/AGENTES.md §2). Si no hay Postgres levantado, el fichero
 * falla en voz alta en vez de saltarse en silencio — un test que desaparece
 * es peor que uno que falla (CLAUDE.md).
 */
const BASE = process.env.DATABASE_URL ?? 'postgres://archmage:archmage@localhost:5433/archmage';
const TEST_DB = `archmage_test_${process.pid}`;
const TEST_URL = BASE.replace(/\/[^/]+$/, `/${TEST_DB}`);

let admin: ReturnType<typeof connect>;
let conn: ReturnType<typeof connect>;
let app: FastifyInstance;
const NOW = 1_700_000_000_000;
let ahora = NOW;

beforeAll(async () => {
  admin = connect(BASE, 1);
  await admin.sql.unsafe(`DROP DATABASE IF EXISTS ${TEST_DB}`);
  await admin.sql.unsafe(`CREATE DATABASE ${TEST_DB}`);
  conn = connect(TEST_URL, 8);
  await ensureSchema(conn.sql);
  app = buildApp({ db: conn.db, now: () => ahora, random: () => makeRandom(1) });
  await app.ready();
}, 60_000);

afterAll(async () => {
  await app?.close();
  await conn?.sql.end({ timeout: 5 });
  await admin?.sql.unsafe(`DROP DATABASE IF EXISTS ${TEST_DB}`);
  await admin?.sql.end({ timeout: 5 });
}, 60_000);

beforeEach(async () => {
  ahora = NOW;
  await truncateAll(conn.sql);
});

const nuevoMago = () =>
  createMage({
    id: DEV_MAGE_ID,
    name: 'Archimago',
    specialty: 'plain',
    server: TERRA,
    starting: STARTING_KINGDOM,
    now: NOW,
  });


describe('el esquema', () => {
  test('crearlo es idempotente: se puede correr dos veces', async () => {
    await ensureSchema(conn.sql);
    await ensureSchema(conn.sql);
    const [fila] = await conn.sql.unsafe(`SELECT count(*)::int AS n FROM mages`);
    expect(fila?.n).toBe(0);
  });
});

describe('ida y vuelta del estado', () => {
  test('lo que se guarda es exactamente lo que se lee', async () => {
    const mago = nuevoMago();
    await insertMage(conn.db, mago);
    const leido = await loadAccrued(conn.db, DEV_MAGE_ID, NOW, TERRA);
    expect(leido).toEqual(mago);
  });

  test('los recursos vuelven como números, no como texto', async () => {
    // `bigint` de Postgres llega como string si no se configura el modo.
    await insertMage(conn.db, nuevoMago());
    const leido = await loadAccrued(conn.db, DEV_MAGE_ID, NOW, TERRA);
    expect(typeof leido?.resources.geld).toBe('number');
    expect(typeof leido?.turns.lastAccrualAt).toBe('number');
  });
});

describe('el devengo se persiste al leer', () => {
  test('leer más tarde devenga turnos y los guarda', async () => {
    const mago = { ...nuevoMago(), turns: { current: 10, lastAccrualAt: NOW } };
    await insertMage(conn.db, mago);

    const treintaMin = NOW + 30 * 60_000;
    const leido = await loadAccrued(conn.db, DEV_MAGE_ID, treintaMin, TERRA);
    expect(leido?.turns.current).toBe(13);

    // Y quedó escrito: leer otra vez con el mismo `now` no vuelve a sumar.
    const otra = await loadAccrued(conn.db, DEV_MAGE_ID, treintaMin, TERRA);
    expect(otra?.turns.current).toBe(13);
  });
});

describe('estado y eventos en la misma transacción', () => {
  test('una acción válida escribe los dos', async () => {
    await insertMage(conn.db, nuevoMago());
    const r = await app.inject({
      method: 'POST',
      url: '/api/mage/me/actions',
      payload: { action: { type: 'explore', turns: 3 } },
    });
    expect(r.statusCode).toBe(200);

    const [filas] = await conn.sql.unsafe(`SELECT count(*)::int AS n FROM events WHERE mage_id = 'dev'`);
    expect(filas?.n).toBeGreaterThan(0);
  });

  test('un error de dominio NO escribe nada', async () => {
    const enElTope = { ...nuevoMago(), land: { total: 3_500, free: 3_394 } };
    await insertMage(conn.db, enElTope);

    const r = await app.inject({
      method: 'POST',
      url: '/api/mage/me/actions',
      payload: { action: { type: 'explore', turns: 1 } },
    });
    // docs/SPECS.md §5, invariante 9.
    expect(r.statusCode).toBe(422);
    expect(r.json().error.code).toBe('exploration_exhausted');

    const [filas] = await conn.sql.unsafe(`SELECT count(*)::int AS n FROM events`);
    expect(filas?.n).toBe(0);
    const leido = await loadAccrued(conn.db, DEV_MAGE_ID, NOW, TERRA);
    expect(leido?.turns.current).toBe(TERRA.turnCap);
  });

  test('los eventos se numeran en orden por mago', async () => {
    await insertMage(conn.db, nuevoMago());
    for (let i = 0; i < 3; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/mage/me/actions',
        payload: { action: { type: 'explore', turns: 1 } },
      });
    }
    const filas = await conn.sql.unsafe(`SELECT seq FROM events WHERE mage_id='dev' ORDER BY seq`);
    const seqs = filas.map((f) => f.seq as number);
    expect(seqs).toEqual([...seqs].sort((a, b) => a - b));
    expect(new Set(seqs).size).toBe(seqs.length);
  });
});

describe('invariante 6 — dos acciones sobre el mismo mago se serializan', () => {
  test('diez exploraciones a la vez gastan diez turnos, no uno', async () => {
    // Sin `SELECT ... FOR UPDATE` las diez leerían el mismo estado y nueve se
    // pisarían: el saldo cuadraría igualmente y no saltaría ninguna alarma.
    await insertMage(conn.db, nuevoMago());

    const peticiones = Array.from({ length: 10 }, () =>
      app.inject({
        method: 'POST',
        url: '/api/mage/me/actions',
        payload: { action: { type: 'explore', turns: 1 } },
      }),
    );
    const respuestas = await Promise.all(peticiones);
    expect(respuestas.every((r) => r.statusCode === 200)).toBe(true);

    const leido = await loadAccrued(conn.db, DEV_MAGE_ID, NOW, TERRA);
    expect(leido?.turnsSpent).toBe(10);
    expect(leido?.turns.current).toBe(TERRA.turnCap - 10);
  });
});

describe('las rutas', () => {
  test('GET /api/mage/me crea el mago de desarrollo si no existe', async () => {
    const r = await app.inject({ method: 'GET', url: '/api/mage/me' });
    expect(r.statusCode).toBe(200);
    const body = r.json();
    expect(body.mage.land.total).toBe(200);
    // 22.106 desde el 2026-09-21: economía publicada (docs/ORIGINAL.md §4.2).
    expect(body.derived.net.geld).toBe(22_106);
    expect(body.derived.populationCapacity.capacity).toBe(19_500);
    expect(body.server.turnCap).toBe(180);
  });

  test('devuelve el ingreso neto ya calculado: el cliente no lo recalcula', async () => {
    const r = await app.inject({ method: 'GET', url: '/api/mage/me' });
    const d = r.json().derived;
    expect(d.net.geld).toBe(d.income.geld - d.upkeep.geld);
    expect(d.net.mana).toBe(d.income.mana - d.upkeep.mana);
  });

  test('una petición mal formada es 400, no 500', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/api/mage/me/actions',
      payload: { action: { type: 'build', building: 'castillo', turns: 1 } },
    });
    expect(r.statusCode).toBe(400);
  });

  test('turnos no enteros los rechaza el contrato, no el núcleo', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/api/mage/me/actions',
      payload: { action: { type: 'explore', turns: 1.5 } },
    });
    expect(r.statusCode).toBe(400);
  });

  test('la acción devuelve estado nuevo Y eventos', async () => {
    await insertMage(conn.db, nuevoMago());
    const r = await app.inject({
      method: 'POST',
      url: '/api/mage/me/actions',
      payload: { action: { type: 'build', building: 'farms', turns: 2 } },
    });
    expect(r.statusCode).toBe(200);
    const body = r.json();
    expect(body.mage.buildings.farms).toBeGreaterThan(45);
    expect(Array.isArray(body.events)).toBe(true);
    expect(body.events.length).toBeGreaterThan(0);
  });

  test('la crónica se lee, y lo más reciente va primero', async () => {
    await insertMage(conn.db, nuevoMago());
    await app.inject({
      method: 'POST',
      url: '/api/mage/me/actions',
      payload: { action: { type: 'explore', turns: 2 } },
    });
    const r = await app.inject({ method: 'GET', url: '/api/mage/me/chronicle' });
    const filas = r.json() as { seq: number }[];
    expect(filas.length).toBeGreaterThan(0);
    expect(filas[0]!.seq).toBeGreaterThanOrEqual(filas[filas.length - 1]!.seq);
  });

  test('el catálogo se sirve entero', async () => {
    const r = await app.inject({ method: 'GET', url: '/api/catalog' });
    expect(r.statusCode).toBe(200);
    expect(Object.keys(r.json().buildings)).toHaveLength(8);
    // 5 de barracks + 15 invocables de Verdant (fase 2).
    expect(Object.keys(r.json().units)).toHaveLength(20);
  });
});

describe('la magia por el API (fase 2)', () => {
  test('el libro llega ya resuelto, con el precio que pagaría ÉL', () => {
    // El mago de desarrollo es Verdant.
    return app.inject({ method: 'GET', url: '/api/mage/me' }).then((r) => {
      const libro = r.json().derived.spellbook as {
        id: string;
        castMana: number | null;
        relation: string;
        castable: boolean;
      }[];
      expect(libro.length).toBeGreaterThan(0);

      const propio = libro.find((e) => e.id === 'summon_dryad')!;
      expect(propio.relation).toBe('own');
      expect(propio.castMana).toBe(3_000);

      // Los de combate llegan marcados: se investigan, no se lanzan.
      expect(libro.find((e) => e.id === 'plant_growth')!.castable).toBe(false);
    });
  });

  test('investigar por el API avanza y queda en el estado', async () => {
    await insertMage(conn.db, { ...nuevoMago(), specialty: 'verdant' });
    const r = await app.inject({
      method: 'POST',
      url: '/api/mage/me/actions',
      payload: { action: { type: 'research', spellId: 'summon_dryad', turns: 2 } },
    });
    expect(r.statusCode).toBe(200);
    const body = r.json();
    // 5 guilds de partida × 2 = 10/turno; Summon Dryad cuesta 900.
    expect(body.mage.spellbook.researching).toMatchObject({ spellId: 'summon_dryad' });
    expect(body.events.some((e: { type: string }) => e.type === 'research.started')).toBe(true);
  });

  test('lanzar un hechizo que no sabes es 422, no 500', async () => {
    await insertMage(conn.db, { ...nuevoMago(), specialty: 'verdant' });
    const r = await app.inject({
      method: 'POST',
      url: '/api/mage/me/actions',
      payload: { action: { type: 'cast', spellId: 'summon_dryad', turns: 1 } },
    });
    expect(r.statusCode).toBe(422);
    expect(r.json().error.code).toBe('spell_not_learned');
  });

  test('un hechizo de combate es 422 con su código', async () => {
    const m = nuevoMago();
    await insertMage(conn.db, {
      ...m,
      specialty: 'verdant',
      spellbook: { known: ['plant_growth'], researching: null, level: 20 },
    });
    const r = await app.inject({
      method: 'POST',
      url: '/api/mage/me/actions',
      payload: { action: { type: 'cast', spellId: 'plant_growth', turns: 1 } },
    });
    expect(r.statusCode).toBe(422);
    expect(r.json().error.code).toBe('spell_not_castable');
  });

  test('el estado con magia sobrevive la ida y vuelta a Postgres', async () => {
    const m = nuevoMago();
    await insertMage(conn.db, {
      ...m,
      specialty: 'verdant',
      spellbook: { known: ['weather_summoning'], researching: { spellId: 'summon_dryad', progress: 400 }, level: 3 },
      casting: { spellId: 'summon_dryad', turnsRemaining: 2 },
      enchantments: [{ spellId: 'weather_summoning', upkeepMana: 60, modifiers: { farmOutput: 125 } }],
    });
    const leido = await loadAccrued(conn.db, DEV_MAGE_ID, NOW, TERRA);
    expect(leido?.spellbook.researching).toEqual({ spellId: 'summon_dryad', progress: 400 });
    expect(leido?.casting).toEqual({ spellId: 'summon_dryad', turnsRemaining: 2 });
    expect(leido?.enchantments[0]?.modifiers).toEqual({ farmOutput: 125 });
  });
});
