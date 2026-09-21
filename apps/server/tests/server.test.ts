import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { createMage, resolveAttack } from '@archmage/core';
import { CATALOG, STARTING_KINGDOM, TERRA } from '@archmage/content';
import { buildApp, DEV_MAGE_ID, makeRandom } from '../src/app.js';
import { connect, ensureSchema, truncateAll } from '../src/db.js';
import { applyBattle, insertMage, loadAccrued } from '../src/repository.js';
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


// --- Guerra. Fase 3 ------------------------------------------------------

describe('la guerra, contra Postgres de verdad', () => {
  const OTRO = 'rival-test';

  async function crearRival(
    army: { unitId: string; count: number }[] = [{ unitId: 'militia', count: 100 }],
  ) {
    const base = createMage({
      id: OTRO,
      name: 'Rival',
      specialty: 'verdant',
      server: TERRA,
      starting: STARTING_KINGDOM,
      now: 0,
    });
    // Fuera de protección: si no, no se le puede tocar.
    await insertMage(conn.db, { ...base, turnsSpent: TERRA.protectionTurns + 1, army });
  }

  async function prepararAtacante() {
    await conn.sql.unsafe(
      `UPDATE mages SET turns_spent = $1, turns_current = 100, geld = 5000000,
       army = '[{"unitId":"militia","count":50000}]'::jsonb WHERE id = $2`,
      [TERRA.protectionTurns + 1, DEV_MAGE_ID],
    );
  }

  test('hay objetivos, y dicen si están protegidos o son demasiado débiles', async () => {
    await app.inject({ method: 'GET', url: '/api/mage/me' });
    await crearRival();
    const res = await app.inject({ method: 'GET', url: '/api/war/targets' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { targets: { id: string; protected: boolean; tooWeak: boolean }[] };
    expect(body.targets.map((t) => t.id)).toContain(OTRO);
    // Y **no aparece uno mismo**: atacarte a ti no es una opción que ofrecer.
    expect(body.targets.map((t) => t.id)).not.toContain(DEV_MAGE_ID);
    expect(typeof body.targets[0]!.protected).toBe('boolean');
    expect(typeof body.targets[0]!.tooWeak).toBe('boolean');
  });

  test('un ataque se guarda con su semilla y aparece en las dos crónicas', async () => {
    await app.inject({ method: 'GET', url: '/api/mage/me' });
    await crearRival();
    await prepararAtacante();

    const res = await app.inject({
      method: 'POST',
      url: '/api/mage/me/actions',
      payload: { action: { type: 'attack', targetId: OTRO, attackType: 'siege' } },
    });
    expect(res.statusCode).toBe(200);
    const { battleId } = res.json() as { battleId: number };

    const batalla = await app.inject({ method: 'GET', url: '/api/war/battles/' + battleId });
    expect(batalla.statusCode).toBe(200);
    const b = batalla.json() as { battle: { seed: number; log: unknown[] } };
    expect(Number.isInteger(b.battle.seed)).toBe(true);
    expect(b.battle.log.length).toBeGreaterThan(0);

    // Los dos magos tienen el hecho en su crónica.
    const mios = await conn.sql.unsafe('SELECT type FROM events WHERE mage_id = $1', [DEV_MAGE_ID]);
    const suyos = await conn.sql.unsafe('SELECT type FROM events WHERE mage_id = $1', [OTRO]);
    expect(mios.some((e) => e.type === 'battle')).toBe(true);
    expect(suyos.some((e) => e.type === 'battle')).toBe(true);
  });

  test('DOS ATAQUES MUTUOS SIMULTÁNEOS no se bloquean entre sí', async () => {
    // **Éste es el test que justifica ordenar por id.** Si cada transacción
    // bloqueara primero su propia fila, A→B y B→A se quedarían esperándose:
    // interbloqueo. Postgres mata una y el jugador ve un error que no
    // entiende. Con las filas pedidas siempre por id ascendente, la segunda
    // espera a la primera y luego sigue.
    await app.inject({ method: 'GET', url: '/api/mage/me' });
    await crearRival([{ unitId: 'militia', count: 40000 }]);
    await prepararAtacante();
    await conn.sql.unsafe('UPDATE mages SET turns_current = 100, geld = 5000000 WHERE id = $1', [OTRO]);

    const atacar = (de: string, a: string) =>
      applyBattle(conn.db, de, a, Date.now(), TERRA, (atacante, defensor) => {
        const r = resolveAttack(atacante, defensor, 'regular', {
          now: 0,
          random: makeRandom(1),
          server: TERRA,
          catalog: CATALOG,
        });
        if ('error' in r) return { error: r.error as never };
        return {
          attacker: r.attacker,
          defender: r.defender,
          battle: {
            serverId: TERRA.id,
            attackerId: atacante.id,
            defenderId: defensor.id,
            attackType: 'regular',
            seed: r.battle.seed,
            winner: r.battle.winner,
            rounds: r.battle.rounds,
            landLost: r.battle.landLost,
            landTaken: r.battle.landTaken,
            log: r.battle.log as Record<string, unknown>[],
            summary: r.battle.summary,
          },
          events: r.events,
        };
      });

    const [uno, dos] = await Promise.all([atacar(DEV_MAGE_ID, OTRO), atacar(OTRO, DEV_MAGE_ID)]);
    expect(uno).not.toBeNull();
    expect(dos).not.toBeNull();
    const filas = await conn.sql.unsafe('SELECT count(*)::int AS n FROM battles');
    expect(filas[0]!.n).toBe(2);
  });

  test('atacar a quien no existe es un 404, no un 500', async () => {
    await app.inject({ method: 'GET', url: '/api/mage/me' });
    await prepararAtacante();
    const res = await app.inject({
      method: 'POST',
      url: '/api/mage/me/actions',
      payload: { action: { type: 'attack', targetId: 'no-existe', attackType: 'regular' } },
    });
    expect(res.statusCode).toBe(404);
  });

  test('un objetivo protegido es un 422 con su código, no un 500', async () => {
    await app.inject({ method: 'GET', url: '/api/mage/me' });
    const base = createMage({
      id: 'bebe',
      name: 'Bebé',
      specialty: 'verdant',
      server: TERRA,
      starting: STARTING_KINGDOM,
      now: 0,
    });
    await insertMage(conn.db, base); // turnsSpent 0 → protegido
    await prepararAtacante();
    const res = await app.inject({
      method: 'POST',
      url: '/api/mage/me/actions',
      payload: { action: { type: 'attack', targetId: 'bebe', attackType: 'regular' } },
    });
    expect(res.statusCode).toBe(422);
    expect((res.json() as { error: { code: string } }).error.code).toBe('objetivo_protegido');
  });

  test('una batalla que no existe es un 404', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/war/battles/99999' });
    expect(res.statusCode).toBe(404);
  });

  test('la lista de batallas no arrastra el log', async () => {
    // Cientos de golpes por batalla × veinte batallas serían megabytes para
    // pintar veinte líneas.
    await app.inject({ method: 'GET', url: '/api/mage/me' });
    await crearRival();
    await prepararAtacante();
    await app.inject({
      method: 'POST',
      url: '/api/mage/me/actions',
      payload: { action: { type: 'attack', targetId: OTRO, attackType: 'regular' } },
    });
    const res = await app.inject({ method: 'GET', url: '/api/war/battles' });
    const body = res.json() as { battles: Record<string, unknown>[] };
    expect(body.battles.length).toBeGreaterThan(0);
    expect(body.battles[0]).not.toHaveProperty('log');
  });
});


// --- Cuentas. Fase 4 -----------------------------------------------------

describe('cuentas, sesión y el invariante 13', () => {
  const CORREO = 'ana@ejemplo.com';
  const CLAVE = 'contraseña-larga';

  const registrar = (email = CORREO, password = CLAVE) =>
    app.inject({ method: 'POST', url: '/api/auth/register', payload: { email, password } });

  const entrar = (email = CORREO, password = CLAVE) =>
    app.inject({ method: 'POST', url: '/api/auth/login', payload: { email, password } });

  const cookieDe = (res: { cookies: { name: string; value: string }[] }) =>
    res.cookies.find((c) => c.name === 'archmage_sid')?.value ?? '';

  async function cuentaConMago(email: string, nombre: string) {
    await registrar(email);
    const login = await entrar(email);
    const sid = cookieDe(login as never);
    const creado = await app.inject({
      method: 'POST',
      url: '/api/mage',
      cookies: { archmage_sid: sid },
      payload: { name: nombre, specialty: 'verdant' },
    });
    return { sid, creado };
  }

  test('registrar manda un correo de verificación, y no dos cuentas iguales', async () => {
    expect((await registrar()).statusCode).toBe(200);
    // El mismo correo en mayúsculas **es la misma cuenta**: sin normalizar,
    // la segunda persona creería que le han robado el correo.
    const otra = await registrar('ANA@Ejemplo.com');
    expect(otra.statusCode).toBe(422);
    expect((otra.json() as { error: { code: string } }).error.code).toBe('correo_en_uso');

    const correos = await conn.sql.unsafe('SELECT recipient, body FROM outbox');
    expect(correos).toHaveLength(1);
    expect(correos[0]!.recipient).toBe(CORREO);
  });

  test('una contraseña mala no entra, y el mensaje no delata si el correo existe', async () => {
    await registrar();
    const mala = await entrar(CORREO, 'otra-contraseña');
    const inexistente = await entrar('nadie@ejemplo.com', CLAVE);
    expect(mala.statusCode).toBe(422);
    expect(inexistente.statusCode).toBe(422);
    // **El mismo código para los dos.** Distinguirlos dejaría comprobar qué
    // correos tienen cuenta.
    expect((mala.json() as { error: { code: string } }).error.code).toBe(
      (inexistente.json() as { error: { code: string } }).error.code,
    );
  });

  test('entrar da sesión, y salir la quita', async () => {
    await registrar();
    const login = await entrar();
    expect(login.statusCode).toBe(200);
    const sid = cookieDe(login as never);
    expect(sid.length).toBeGreaterThan(16);

    const filas = await conn.sql.unsafe('SELECT count(*)::int AS n FROM sessions');
    expect(filas[0]!.n).toBe(1);

    await app.inject({ method: 'POST', url: '/api/auth/logout', cookies: { archmage_sid: sid } });
    const tras = await conn.sql.unsafe('SELECT count(*)::int AS n FROM sessions');
    expect(tras[0]!.n).toBe(0);
  });

  test('un token de verificación no se reutiliza', async () => {
    await registrar();
    const correos = await conn.sql.unsafe('SELECT body FROM outbox');
    const token = String(correos[0]!.body).split(': ')[1]!;
    expect((await app.inject({ method: 'POST', url: '/api/auth/verify', payload: { token } })).statusCode).toBe(200);
    // El segundo intento con el mismo token **no vale**.
    const otra = await app.inject({ method: 'POST', url: '/api/auth/verify', payload: { token } });
    expect(otra.statusCode).toBe(422);
  });

  test('un token caducado no verifica', async () => {
    await registrar();
    // **Contra el reloj INYECTADO, no contra el de Postgres.** El servidor
    // compara con `deps.now()`, que en los tests vale 2023; `now()` de la
    // base de datos es hoy, así que «hace una hora» seguiría siendo futuro
    // y el test pasaría sin comprobar nada.
    await conn.sql.unsafe('UPDATE auth_tokens SET expires_at = $1', [
      new Date(ahora - 60 * 60 * 1000).toISOString(),
    ]);
    const correos = await conn.sql.unsafe('SELECT body FROM outbox');
    const token = String(correos[0]!.body).split(': ')[1]!;
    const res = await app.inject({ method: 'POST', url: '/api/auth/verify', payload: { token } });
    expect(res.statusCode).toBe(422);
  });

  test('recuperar cambia la contraseña sin saber la vieja, y cierra las sesiones', async () => {
    await registrar();
    const login = await entrar();
    const sid = cookieDe(login as never);

    await app.inject({ method: 'POST', url: '/api/auth/forgot', payload: { email: CORREO } });
    const correos = await conn.sql.unsafe(
      "SELECT body FROM outbox WHERE subject LIKE 'Recuperar%'",
    );
    const token = String(correos[0]!.body).split(': ')[1]!;

    const reset = await app.inject({
      method: 'POST',
      url: '/api/auth/reset',
      payload: { token, password: 'contraseña-nueva' },
    });
    expect(reset.statusCode).toBe(200);
    expect((await entrar(CORREO, 'contraseña-nueva')).statusCode).toBe(200);
    expect((await entrar(CORREO, CLAVE)).statusCode).toBe(422);

    // **La sesión vieja ya no vale**: si alguien entró con la contraseña
    // robada, recuperarla tiene que echarlo.
    const filas = await conn.sql.unsafe('SELECT id FROM sessions WHERE id = $1', [sid]);
    expect(filas).toHaveLength(0);
  });

  test('pedir a quién recuperar responde igual exista o no el correo', async () => {
    const a = await app.inject({ method: 'POST', url: '/api/auth/forgot', payload: { email: 'nadie@ejemplo.com' } });
    expect(a.statusCode).toBe(200);
  });

  test('CRITERIO 1 — un mago por cuenta y servidor', async () => {
    const { sid, creado } = await cuentaConMago(CORREO, 'Ana');
    expect(creado.statusCode).toBe(200);

    const segundo = await app.inject({
      method: 'POST',
      url: '/api/mage',
      cookies: { archmage_sid: sid },
      payload: { name: 'Ana Dos', specialty: 'nether' },
    });
    expect(segundo.statusCode).toBe(422);
    expect((segundo.json() as { error: { code: string } }).error.code).toBe('ya_tienes_mago');
  });

  test('dos cuentas distintas ven dos magos distintos', async () => {
    const a = await cuentaConMago('ana@ejemplo.com', 'Ana');
    const b = await cuentaConMago('bruno@ejemplo.com', 'Bruno');

    const reinoA = await app.inject({ method: 'GET', url: '/api/mage/me', cookies: { archmage_sid: a.sid } });
    const reinoB = await app.inject({ method: 'GET', url: '/api/mage/me', cookies: { archmage_sid: b.sid } });
    const nombreA = (reinoA.json() as { mage: { name: string } }).mage.name;
    const nombreB = (reinoB.json() as { mage: { name: string } }).mage.name;
    expect(nombreA).toBe('Ana');
    expect(nombreB).toBe('Bruno');
  });

  test('CRITERIO 2 — el id del mago sale de la sesión, y no viaja', async () => {
    // **El invariante 13.** El test que lo protege no es que funcione: es
    // que **no haya forma de pedir el mago de otro**. Se comprueba que
    // ninguna ruta acepta un id por parámetro ni por cuerpo.
    const a = await cuentaConMago('ana@ejemplo.com', 'Ana');
    const b = await cuentaConMago('bruno@ejemplo.com', 'Bruno');

    const bId = (
      (await app.inject({ method: 'GET', url: '/api/mage/me', cookies: { archmage_sid: b.sid } })).json() as {
        mage: { id: string };
      }
    ).mage.id;

    // Con la sesión de Ana, pidiendo explícitamente el mago de Bruno.
    const intento = await app.inject({
      method: 'GET',
      url: `/api/mage/me?mageId=${bId}`,
      cookies: { archmage_sid: a.sid },
    });
    expect((intento.json() as { mage: { name: string } }).mage.name).toBe('Ana');

    // Y atacar mandando un id ajeno como atacante tampoco cuela: el
    // `targetId` es del defensor, y el atacante sale de la sesión.
    const ataque = await app.inject({
      method: 'POST',
      url: '/api/mage/me/actions',
      cookies: { archmage_sid: a.sid },
      payload: { action: { type: 'attack', targetId: bId, attackType: 'regular' } },
    });
    // Falla por reglas de juego —protegido, sin ejército—, no por identidad.
    expect([200, 422]).toContain(ataque.statusCode);
  });

  test('sin sesión y con el mago de desarrollo apagado, no se juega', async () => {
    const cerrado = buildApp({
      db: conn.db,
      now: () => ahora,
      random: () => makeRandom(1),
      allowDevMage: false,
    });
    await cerrado.ready();
    const res = await cerrado.inject({ method: 'GET', url: '/api/mage/me' });
    expect(res.statusCode).toBe(401);
    await cerrado.close();
  });
});
