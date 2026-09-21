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
import { makeRandom as _makeRandom, resolveAttack } from '@archmage/core';
import { PILLAGE_MIN_POWER_SHARE } from '@archmage/core';
import type { Ctx, MageState, RandomSource } from '@archmage/core';
import { CATALOG, ECONOMY, STARTING_KINGDOM, TERRA } from '@archmage/content';
import { actionRequestSchema } from '@archmage/contract';
import type { Db } from './db.js';
import {
  applyAction,
  applyBattle,
  insertMage,
  listBattles,
  listTargets,
  loadAccrued,
  namesOf,
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
function sinLog(f: Record<string, unknown>) {
  const { log: _log, ...resto } = f as { log: unknown };
  return { ...resto, createdAt: String((f as { createdAt: Date }).createdAt) };
}

const TUNING = { ...ECONOMY };

/** El mago de desarrollo. Fase 1: uno, fijo. */
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

export function buildApp(deps: AppDeps): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get('/api/health', async () => ({ ok: true }));

  app.get('/api/catalog', async () => CATALOG);

  app.get('/api/mage/me', async (_req, reply) => {
    const now = deps.now();
    let state = await loadAccrued(deps.db, DEV_MAGE_ID, now, TERRA);

    // Fase 1: si el mago de desarrollo no existe, se crea. En cuanto haya
    // cuentas, esto se va con la autenticación.
    if (!state) {
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

    return reply.send({ mage: state, derived: derive(state, now), server: TERRA });
  });

  /** Contra quién se puede luchar. */
  app.get('/api/war/targets', async (_req, reply) => {
    const now = deps.now();
    const yo = await loadAccrued(deps.db, DEV_MAGE_ID, now, TERRA);
    if (!yo) return reply.send({ targets: [] });
    const miPoder = netPower(yo, CATALOG);
    const filas = await listTargets(deps.db, TERRA.id, DEV_MAGE_ID);
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
  app.get('/api/war/battles', async (_req, reply) => {
    const filas = await listBattles(deps.db, DEV_MAGE_ID);
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

  app.post('/api/mage/me/actions', async (req, reply) => {
    const parsed = actionRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { code: 'invalid_request', message: parsed.error.issues[0]?.message ?? 'Petición inválida.' },
      });
    }

    const now = deps.now();
    const ctx: Ctx = { now, random: deps.random(), server: TERRA, catalog: CATALOG };

    // **Atacar no pasa por `apply()`**: toca a dos magos, así que va por su
    // propia vía, con las dos filas bloqueadas por id ascendente
    // (docs/SPECS.md §5, invariantes 6 y 8). La regla sigue en el núcleo;
    // aquí solo se carga, se llama y se guarda.
    if (parsed.data.action.type === 'attack') {
      const { targetId, attackType } = parsed.data.action;
      const res = await applyBattle(deps.db, DEV_MAGE_ID, targetId, now, TERRA, (a, d) => {
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

    const out = await applyAction(deps.db, DEV_MAGE_ID, parsed.data.action, ctx, TUNING);

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

  app.get('/api/mage/me/chronicle', async () => {
    const filas = await readChronicle(deps.db, DEV_MAGE_ID);
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
