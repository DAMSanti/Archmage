/**
 * Las rutas.
 *
 * **Ningún endpoint lleva reglas** (docs/SPECS.md §5, invariante 8): valida,
 * carga, llama a `core.apply()`, guarda, responde. Si te encuentras
 * calculando ingreso o daño aquí, esa función falta en `packages/core`.
 *
 * Y el servidor es **autoritativo** (invariante 5): lo que el cliente calcula
 * es previsión, y ninguna ruta acepta un resultado calculado por él.
 *
 * Fuera de alcance en la fase 1: autenticación. Hay **un mago fijo** de
 * desarrollo (docs/ARQUITECTURA.md §9.6). Sin esto no hay multijugador, y es
 * deuda declarada, no un olvido.
 */

import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCookie from '@fastify/cookie';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FastifyInstance } from 'fastify';
import {
  createMage,
  failureChance,
  income,
  isProtected,
  manaStorage,
  msToNextTurn,
  netIncome,
  netPower,
  populationCapacity,
  spellbookFor,
  upkeep,
} from '@archmage/core';
import { closesAt, makeRandom as _makeRandom, minimumBid, resolveAttack } from '@archmage/core';
import { PILLAGE_MIN_POWER_SHARE } from '@archmage/core';
import type { Ctx, MageState, RandomSource } from '@archmage/core';
import { CATALOG, ECONOMY, STARTING_KINGDOM, TERRA } from '@archmage/content';
import {
  actionRequestSchema,
  bidSchema,
  createLotSchema,
  createMageSchema,
  forgotSchema,
  loginSchema,
  registerSchema,
  resetSchema,
  tokenSchema,
} from '@archmage/contract';
import type { Db } from './db.js';
import {
  type Mailer,
  SESSION_COOKIE,
  SESSION_DAYS,
  hashPassword,
  newToken,
  normalizeEmail,
  sessionExpiry,
  tokenExpiry,
  verifyPassword,
} from './auth.js';
import {
  accountByEmail,
  accountOfSession,
  applyAction,
  applyBattle,
  insertMage,
  listBattles,
  listLots,
  listMages,
  listTargets,
  applyBid,
  createAccount,
  createLot,
  createSession,
  createToken,
  deleteSession,
  deleteSessionsOf,
  loadAccrued,
  mageOfAccount,
  markVerified,
  namesOf,
  outboxMailer,
  setPassword,
  settleLots,
  useToken,
  readBattle,
  readChronicle,
  rowToState,
} from './repository.js';

/**
 * La ficha de una batalla **sin el log**, que es lo que va en las listas.
 *
 * El log de una batalla grande son cientos de golpes; mandarlo en una lista
 * de veinte batallas sería megabytes para pintar veinte líneas.
 */
/** El `Mailer` que toque: el inyectado, o el de la tabla `outbox`. */
function mailerDe(deps: AppDeps): Mailer {
  return deps.mailer ?? outboxMailer(deps.db);
}

function sinLog(f: Record<string, unknown>) {
  const { log: _log, ...resto } = f as { log: unknown };
  return { ...resto, createdAt: String((f as { createdAt: Date }).createdAt) };
}

const TUNING = { ...ECONOMY };

/**
 * El mago de desarrollo.
 *
 * **Sobrevive a la fase 4 detrás de una bandera** (`allowDevMage`). Sin él,
 * la pasada de navegador —la comprobación más cara que tenemos— tendría que
 * registrarse y verificar un correo cada vez (docs/SISTEMAS.md §12.1).
 * Con la bandera apagada, **no hay forma de jugar sin sesión**.
 */
export const DEV_MAGE_ID = 'dev';

export interface AppDeps {
  db: Db;
  /**
   * Carpeta con el cliente ya construido. Si se pasa, **el servidor lo
   * sirve él mismo**: una sola aplicación, un solo puerto, un solo
   * contenedor. En desarrollo se deja vacío y el cliente lo sirve Vite con
   * su proxy a `/api`.
   */
  clientDir?: string;
  /** Inyectados para que los tests no dependan del reloj ni del azar. */
  now: () => number;
  random: () => RandomSource;
  /**
   * Cómo se manda el correo. Si no se pasa, los mensajes van a la tabla
   * `outbox` — que es la segunda implementación de la que habla la spec, y
   * la que impide que un test mande correo de verdad.
   */
  mailer?: Mailer;
  /**
   * Si se permite jugar **sin sesión** como el mago de desarrollo. Por
   * defecto **sí**, porque quitarlo rompería la pasada de navegador; en
   * producción se apaga.
   */
  allowDevMage?: boolean;
}

/**
 * Azar del servidor. Viene del núcleo: **una sola implementación** para
 * servidor, simulador y tests (docs/SPECS.md §5, invariante 3).
 */
export { makeRandom } from '@archmage/core';

/** Todo lo que la interfaz necesita y que **no debe recalcular por su cuenta**. */
function derive(state: MageState, now: number) {
  const inc = income(state, CATALOG, TUNING);
  const up = upkeep(state, CATALOG);
  const net = netIncome(state, CATALOG, TUNING);
  return {
    income: inc,
    upkeep: up,
    net,
    manaStorage: manaStorage(state.buildings.nodes, TUNING.manaStoragePerNode),
    populationCapacity: populationCapacity(state, TUNING),
    netPower: netPower(state, CATALOG),
    msToNextTurn: msToNextTurn(state.turns, now, TERRA),
    turnsAtCap: state.turns.current >= TERRA.turnCap,
    protectedUntilTurn: isProtected(state, TERRA) ? TERRA.protectionTurns : 0,
    // El libro ya resuelto: la pantalla no recalcula la rueda ni el recargo.
    spellbook: spellbookFor(state.specialty, state.spellbook.known, CATALOG).map((e) => ({
      id: e.spell.id,
      name: e.spell.name,
      school: e.spell.school,
      rank: e.spell.rank,
      castTurns: e.spell.castTurns,
      researchCost: e.spell.researchCost,
      upkeepMana: e.spell.upkeepMana,
      effectKind: e.spell.effect.kind,
      known: e.known,
      researchable: e.researchable,
      castable: e.castable,
      castMana: e.castMana,
      relation: e.relation,
      failureChance: failureChance(
        e.spell,
        state.specialty,
        state.spellbook.level,
        CATALOG.maxSpellLevel,
      ),
    })),
    maxSpellLevel: CATALOG.maxSpellLevel,
  };
}

/**
 * El mago de quien pide, **sacado de la sesión**.
 *
 * Invariante 13 de docs/SPECS.md: el id **no viaja** en el cuerpo ni en la
 * URL. Una ruta que lo aceptara por parámetro funcionaría perfectamente y
 * dejaría leer y jugar el reino de cualquiera, sin dar un solo error.
 *
 * Devuelve `null` si no hay sesión válida. El mago de desarrollo solo entra
 * si la bandera lo permite, y **después** de haber mirado la sesión: una
 * sesión de verdad siempre manda sobre la bandera.
 */
async function mageOf(
  deps: AppDeps,
  req: { cookies?: Record<string, string | undefined> },
): Promise<string | null> {
  const sid = req.cookies?.[SESSION_COOKIE];
  if (sid) {
    const cuenta = await accountOfSession(deps.db, sid, new Date(deps.now()));
    if (cuenta) {
      const mago = await mageOfAccount(deps.db, cuenta, TERRA.id);
      return mago ?? null;
    }
  }
  return deps.allowDevMage === false ? null : DEV_MAGE_ID;
}

/** El 401 de siempre, en un sitio. */
function sinSesion(reply: { code: (n: number) => { send: (b: unknown) => unknown } }) {
  return reply
    .code(401)
    .send({ error: { code: 'sin_sesion', message: 'Entra con tu cuenta para jugar.' } });
}

export function buildApp(deps: AppDeps): FastifyInstance {
  const app = Fastify({ logger: false });

  // La sesión viaja en una cookie **opaca**: dentro solo hay un id, nunca el
  // `mageId` (docs/SPECS.md §5, invariante 13). Cerrar sesión es borrar una
  // fila, no esperar a que caduque algo que el cliente sigue teniendo.
  void app.register(fastifyCookie);

  app.get('/api/health', async () => ({ ok: true }));

  app.get('/api/catalog', async () => CATALOG);

  app.get('/api/mage/me', async (req, reply) => {
    const now = deps.now();
    const yoId = await mageOf(deps, req);
    if (!yoId) return sinSesion(reply);
    let state = await loadAccrued(deps.db, yoId, now, TERRA);

    // Si el mago no existe **y es el de desarrollo**, se crea. Un jugador de
    // verdad crea el suyo en `POST /api/mage`, eligiendo nombre y escuela;
    // esto es solo para que la pasada de navegador no tenga que registrarse.
    if (!state && yoId === DEV_MAGE_ID) {
      const nuevo = createMage({
        id: DEV_MAGE_ID,
        name: 'Archimago',
        // Verdant porque es la escuela que implementa la fase 2. Un mago
        // Plain solo vería Simple y Average de todo, y el libro quedaría
        // cojo. **La escuela no cambia en la temporada** (invariante 10), así
        // que un mago de desarrollo creado antes sigue siendo Plain hasta un
        // `pnpm db:reset`.
        specialty: 'verdant',
        server: TERRA,
        starting: STARTING_KINGDOM,
        now,
      });
      await insertMage(deps.db, nuevo);
      state = nuevo;
    }

    // Una cuenta sin mago todavía. El cliente lo lee y manda al portal a
    // crearlo: **no es un error**, es un estado normal del primer día.
    if (!state) {
      return reply
        .code(404)
        .send({ error: { code: 'sin_mago', message: 'Todavía no tienes mago en este servidor.' } });
    }

    return reply.send({ mage: state, derived: derive(state, now), server: TERRA });
  });

  /** Contra quién se puede luchar. */
  app.get('/api/war/targets', async (_req: { cookies?: Record<string, string | undefined> }, reply) => {
    const now = deps.now();
    const yoId = await mageOf(deps, _req);
    if (!yoId) return sinSesion(reply);
    const yo = await loadAccrued(deps.db, yoId, now, TERRA);
    if (!yo) return reply.send({ targets: [] });
    const miPoder = netPower(yo, CATALOG);
    const filas = await listTargets(deps.db, TERRA.id, yoId);
    return reply.send({
      targets: filas.map((f) => {
        const s = rowToState(f);
        const np = netPower(s, CATALOG);
        return {
          id: s.id,
          name: s.name,
          specialty: s.specialty,
          land: s.land.total,
          netPower: np,
          protected: isProtected(s, TERRA),
          // El 50% del saqueo, dicho antes de pinchar: la interfaz no
          // esconde por qué algo no se puede (docs/INTERFAZ.md).
          tooWeak: np < miPoder * PILLAGE_MIN_POWER_SHARE,
        };
      }),
    });
  });

  /** Las últimas batallas del mago, atacadas y sufridas. */
  app.get('/api/war/battles', async (req, reply) => {
    const yoId = await mageOf(deps, req);
    if (!yoId) return sinSesion(reply);
    const filas = await listBattles(deps.db, yoId);
    const ids = [...new Set(filas.flatMap((f) => [f.attackerId, f.defenderId]))];
    const nombres = await namesOf(deps.db, ids);
    return reply.send({
      battles: filas.map((f) => ({
        ...sinLog(f),
        attackerName: nombres[f.attackerId] ?? f.attackerId,
        defenderName: nombres[f.defenderId] ?? f.defenderId,
      })),
    });
  });

  /** Una batalla entera, con su log, para la repetición. */
  app.get('/api/war/battles/:id', async (req, reply) => {
    const id = Number((req.params as { id: string }).id);
    if (!Number.isInteger(id)) {
      return reply
        .code(400)
        .send({ error: { code: 'invalid_request', message: 'Id de batalla inválido.' } });
    }
    const fila = await readBattle(deps.db, id);
    if (!fila) {
      return reply
        .code(404)
        .send({ error: { code: 'battle_not_found', message: 'No existe esa batalla.' } });
    }
    // Los nombres van resueltos: la repetición dice «Malakar», no un id.
    const nombres = await namesOf(deps.db, [fila.attackerId, fila.defenderId]);
    return reply.send({
      battle: {
        ...sinLog(fila),
        attackerName: nombres[fila.attackerId] ?? fila.attackerId,
        defenderName: nombres[fila.defenderId] ?? fila.defenderId,
        log: fila.log,
      },
    });
  });

  // --- Mercado y ranking. Fase 4 -----------------------------------------

  /** Los lotes a la venta, con su cierre ya calculado. */
  app.get('/api/market', async (req, reply) => {
    const yoId = await mageOf(deps, req);
    const lotes = await listLots(deps.db, TERRA.id);
    return reply.send({
      lots: lotes.map((l) => ({
        id: l.id,
        section: l.section,
        content: l.content,
        minBid: l.minBid,
        currentBid: l.currentBid,
        // **La puja mínima va calculada aquí**, no en el cliente: es una
        // regla y el cliente no recalcula reglas (docs/SPECS.md, invariante 5).
        nextBid: minimumBid(l),
        closesAt: closesAt(l),
        mine: l.sellerId === yoId,
        winning: l.currentBidderId === yoId,
      })),
    });
  });

  app.post('/api/market/lots', async (req, reply) => {
    const yoId = await mageOf(deps, req);
    if (!yoId) return sinSesion(reply);
    const parsed = createLotSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { code: 'invalid_request', message: 'Datos inválidos.' } });
    }
    const now = deps.now();
    const estado = await loadAccrued(deps.db, yoId, now, TERRA);
    if (!estado) return reply.code(404).send({ error: { code: 'sin_mago', message: 'No tienes mago.' } });

    // **Vender lo que no se tiene es un error de dominio**, no un 500.
    const c = parsed.data.content;
    if (c.kind === 'item' && (estado.items[c.itemId] ?? 0) < c.count) {
      return reply
        .code(422)
        .send({ error: { code: 'no_lo_tienes', message: 'No tienes ese item.' } });
    }
    if (c.kind === 'units') {
      const tiene = estado.army.find((st) => st.unitId === c.unitId)?.count ?? 0;
      if (tiene < c.count) {
        return reply
          .code(422)
          .send({ error: { code: 'no_lo_tienes', message: 'No tienes esas unidades.' } });
      }
    }

    const id = await createLot(deps.db, TERRA.id, yoId, parsed.data.section, c, parsed.data.minBid, now);
    return reply.send({ lotId: id });
  });

  app.post('/api/market/lots/:id/bids', async (req, reply) => {
    const yoId = await mageOf(deps, req);
    if (!yoId) return sinSesion(reply);
    const id = Number((req.params as { id: string }).id);
    const parsed = bidSchema.safeParse(req.body);
    if (!Number.isInteger(id) || !parsed.success) {
      return reply
        .code(400)
        .send({ error: { code: 'invalid_request', message: 'Puja inválida.' } });
    }
    const r = await applyBid(deps.db, id, yoId, parsed.data.amount, deps.now(), TERRA);
    if (r === null) {
      return reply.code(404).send({ error: { code: 'lote_no_existe', message: 'No existe ese lote.' } });
    }
    if ('error' in r) return reply.code(422).send({ error: r.error });
    return reply.send({ lot: { id: r.lot.id, currentBid: r.lot.currentBid, closesAt: closesAt(r.lot) } });
  });

  /**
   * Resuelve las subastas vencidas. **Idempotente**, así que se puede llamar
   * mil veces (docs/SPECS.md §3). Sin cron todavía: la llama quien mira el
   * mercado, que es lo que evita un proceso periódico que recorra magos.
   */
  app.post('/api/market/settle', async (_req, reply) => {
    const n = await settleLots(deps.db, TERRA.id, deps.now());
    return reply.send({ settled: n });
  });

  /** La clasificación del servidor. */
  app.get('/api/ranking', async (_req, reply) => {
    const filas = await listMages(deps.db, TERRA.id);
    const rows = filas
      .map((f) => {
        const st = rowToState(f);
        return {
          id: st.id,
          name: st.name,
          specialty: st.specialty,
          land: st.land.total,
          // **Del núcleo, sin recalcular nada** (invariante 5).
          netPower: netPower(st, CATALOG),
          // **Un mago protegido aparece, marcado.** Esconderlo haría que la
          // lista mintiera sobre cuánta gente hay jugando.
          protected: isProtected(st, TERRA),
        };
      })
      .sort((a, b) => b.netPower - a.netPower);
    return reply.send({ rows });
  });

  // --- Cuentas. Fase 4 ---------------------------------------------------

  app.post('/api/auth/register', async (req, reply) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { code: 'invalid_request', message: parsed.error.issues[0]?.message ?? 'Datos inválidos.' },
      });
    }
    const email = normalizeEmail(parsed.data.email);
    const out = await createAccount(deps.db, email, await hashPassword(parsed.data.password));
    if (!out) {
      // **El mismo mensaje que si el correo estuviera libre no serviría**:
      // el registro tiene que decir que está cogido, o la persona no sabe
      // si ya tiene cuenta. Es información suya, no de un tercero.
      return reply
        .code(422)
        .send({ error: { code: 'correo_en_uso', message: 'Ya hay una cuenta con ese correo.' } });
    }
    const token = newToken();
    await createToken(deps.db, token, out, 'verify', tokenExpiry(deps.now()));
    await mailerDe(deps).send(
      email,
      'Verifica tu cuenta de Archmage',
      `Tu código de verificación es: ${token}`,
    );
    return reply.send({ accountId: out, verificationSent: true });
  });

  app.post('/api/auth/verify', async (req, reply) => {
    const parsed = tokenSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { code: 'invalid_request', message: 'Token inválido.' } });
    const ok = await useToken(deps.db, parsed.data.token, 'verify', new Date(deps.now()));
    if (!ok) {
      return reply
        .code(422)
        .send({ error: { code: 'token_invalido', message: 'Ese código no vale o ya se usó.' } });
    }
    await markVerified(deps.db, ok, new Date(deps.now()));
    return reply.send({ verified: true });
  });

  app.post('/api/auth/login', async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { code: 'invalid_request', message: 'Datos inválidos.' } });
    const cuenta = await accountByEmail(deps.db, normalizeEmail(parsed.data.email));
    // **Un solo mensaje para «no existe» y «contraseña mala».** Distinguirlos
    // deja comprobar qué correos tienen cuenta.
    const malo = { code: 'credenciales', message: 'Correo o contraseña incorrectos.' };
    if (!cuenta || !(await verifyPassword(parsed.data.password, cuenta.passwordHash))) {
      return reply.code(422).send({ error: malo });
    }
    const sid = newToken();
    await createSession(deps.db, sid, cuenta.id, sessionExpiry(deps.now()));
    void reply.setCookie(SESSION_COOKIE, sid, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DAYS * 24 * 60 * 60,
    });
    return reply.send({ accountId: cuenta.id, verified: cuenta.verifiedAt !== null });
  });

  app.post('/api/auth/logout', async (req, reply) => {
    const sid = req.cookies?.[SESSION_COOKIE];
    if (sid) await deleteSession(deps.db, sid);
    void reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return reply.send({ ok: true });
  });

  app.post('/api/auth/forgot', async (req, reply) => {
    const parsed = forgotSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { code: 'invalid_request', message: 'Datos inválidos.' } });
    const cuenta = await accountByEmail(deps.db, normalizeEmail(parsed.data.email));
    // **Responde igual exista o no.** Si dijera «ese correo no está
    // registrado», cualquiera podría averiguar quién juega.
    if (cuenta) {
      const token = newToken();
      await createToken(deps.db, token, cuenta.id, 'reset', tokenExpiry(deps.now()));
      await mailerDe(deps).send(
        cuenta.email,
        'Recuperar tu cuenta de Archmage',
        `Tu código para cambiar la contraseña es: ${token}`,
      );
    }
    return reply.send({ ok: true });
  });

  app.post('/api/auth/reset', async (req, reply) => {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { code: 'invalid_request', message: 'Datos inválidos.' } });
    const cuenta = await useToken(deps.db, parsed.data.token, 'reset', new Date(deps.now()));
    if (!cuenta) {
      return reply
        .code(422)
        .send({ error: { code: 'token_invalido', message: 'Ese código no vale o ya se usó.' } });
    }
    await setPassword(deps.db, cuenta, await hashPassword(parsed.data.password));
    // **Cambiar la contraseña cierra todas las sesiones.** Si alguien entró
    // con la vieja, recuperarla tiene que echarlo.
    await deleteSessionsOf(deps.db, cuenta);
    return reply.send({ ok: true });
  });

  /** Crear el mago de esta cuenta en este servidor. Uno, y solo uno. */
  app.post('/api/mage', async (req, reply) => {
    const sid = req.cookies?.[SESSION_COOKIE];
    const cuenta = sid ? await accountOfSession(deps.db, sid, new Date(deps.now())) : null;
    if (!cuenta) return sinSesion(reply);

    const parsed = createMageSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { code: 'invalid_request', message: 'Datos inválidos.' } });

    const ya = await mageOfAccount(deps.db, cuenta, TERRA.id);
    if (ya) {
      // Criterio 1 de docs/SISTEMAS.md §12.1: **un mago por cuenta y
      // servidor**, y es regla del código, no norma de foro.
      return reply.code(422).send({
        error: { code: 'ya_tienes_mago', message: 'Ya tienes un mago en este servidor.' },
      });
    }

    const now = deps.now();
    const nuevo = createMage({
      id: `m_${newToken().slice(0, 16)}`,
      name: parsed.data.name,
      specialty: parsed.data.specialty,
      server: TERRA,
      starting: STARTING_KINGDOM,
      now,
    });
    await insertMage(deps.db, nuevo, cuenta);
    return reply.send({ mage: nuevo, derived: derive(nuevo, now), server: TERRA });
  });

  app.post('/api/mage/me/actions', async (req, reply) => {
    const parsed = actionRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { code: 'invalid_request', message: parsed.error.issues[0]?.message ?? 'Petición inválida.' },
      });
    }

    const now = deps.now();
    const yoId = await mageOf(deps, req);
    if (!yoId) return sinSesion(reply);
    const ctx: Ctx = { now, random: deps.random(), server: TERRA, catalog: CATALOG };

    // **Atacar no pasa por `apply()`**: toca a dos magos, así que va por su
    // propia vía, con las dos filas bloqueadas por id ascendente
    // (docs/SPECS.md §5, invariantes 6 y 8). La regla sigue en el núcleo;
    // aquí solo se carga, se llama y se guarda.
    if (parsed.data.action.type === 'attack') {
      const { targetId, attackType } = parsed.data.action;
      const res = await applyBattle(deps.db, yoId, targetId, now, TERRA, (a, d) => {
        const r = resolveAttack(a, d, attackType, ctx);
        if ('error' in r) return { error: r.error as never };
        return {
          attacker: r.attacker,
          defender: r.defender,
          battle: {
            serverId: TERRA.id,
            attackerId: a.id,
            defenderId: d.id,
            attackType,
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
      if (res === null) {
        return reply
          .code(404)
          .send({ error: { code: 'mage_not_found', message: 'No existe ese objetivo.' } });
      }
      if ('error' in res) return reply.code(422).send({ error: res.error });
      // **La misma forma que cualquier otra acción**, más `battleId`: el
      // cliente parsea una sola cosa (docs/SPECS.md §6).
      return reply.send({
        mage: res.attacker,
        derived: derive(res.attacker, now),
        server: TERRA,
        events: [],
        battleId: res.battleId,
      });
    }

    const out = await applyAction(deps.db, yoId, parsed.data.action, ctx, TUNING);

    if (out === null) {
      return reply.code(404).send({ error: { code: 'mage_not_found', message: 'No existe ese mago.' } });
    }
    if ('error' in out) {
      // docs/SPECS.md §5, invariante 9: «no tienes maná» es juego, no avería.
      return reply.code(422).send({ error: out.error });
    }

    return reply.send({
      mage: out.state,
      derived: derive(out.state, now),
      server: TERRA,
      events: out.events,
    });
  });

  app.get('/api/mage/me/chronicle', async (req, reply) => {
    const yoId = await mageOf(deps, req);
    if (!yoId) return sinSesion(reply);
    const filas = await readChronicle(deps.db, yoId);
    return filas.map((f) => ({ seq: f.seq, type: f.type, payload: f.payload, at: f.createdAt }));
  });

  // El cliente, servido por el mismo servidor. Va **después** de las rutas
  // del API para que `/api/*` nunca caiga en el catch-all.
  const dir = deps.clientDir ?? defaultClientDir();
  if (dir && existsSync(join(dir, 'index.html'))) {
    void app.register(fastifyStatic, { root: dir });

    // Todo lo que no sea API es la aplicación: se devuelve el index y que
    // decida el cliente. Hoy no hay rutas profundas, pero las habrá.
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api/')) {
        return reply.code(404).send({
          error: { code: 'not_found', message: `No existe ${req.url}.` },
        });
      }
      return reply.sendFile('index.html');
    });
  }

  return app;
}

/** `apps/web/dist` relativo a este fichero, si existe. */
function defaultClientDir(): string | null {
  const aqui = dirname(fileURLToPath(import.meta.url));
  const candidato = resolve(aqui, '../../web/dist');
  return existsSync(candidato) ? candidato : null;
}
