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
import type { FastifyInstance } from 'fastify';
import {
  createMage,
  income,
  isProtected,
  manaStorage,
  msToNextTurn,
  netIncome,
  netPower,
  populationCapacity,
  upkeep,
} from '@archmage/core';
import type { Ctx, MageState, RandomSource } from '@archmage/core';
import { CATALOG, ECONOMY, STARTING_KINGDOM, TERRA } from '@archmage/content';
import { actionRequestSchema } from '@archmage/contract';
import type { Db } from './db.js';
import { applyAction, insertMage, loadAccrued, readChronicle } from './repository.js';

const TUNING = { ...ECONOMY };

/** El mago de desarrollo. Fase 1: uno, fijo. */
export const DEV_MAGE_ID = 'dev';

export interface AppDeps {
  db: Db;
  /** Inyectados para que los tests no dependan del reloj ni del azar. */
  now: () => number;
  random: () => RandomSource;
}

/** Azar por defecto del servidor. La semilla se guarda con cada resultado. */
export function makeRandom(seed: number): RandomSource {
  let s = seed >>> 0 || 1;
  const next = (): number => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 0x1_0000_0000;
  };
  return { next, nextInt: (max: number) => Math.floor(next() * max) };
}

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
    netPower: netPower(state),
    msToNextTurn: msToNextTurn(state.turns, now, TERRA),
    turnsAtCap: state.turns.current >= TERRA.turnCap,
    protectedUntilTurn: isProtected(state, TERRA) ? TERRA.protectionTurns : 0,
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
        specialty: 'plain',
        server: TERRA,
        starting: STARTING_KINGDOM,
        now,
      });
      await insertMage(deps.db, nuevo);
      state = nuevo;
    }

    return reply.send({ mage: state, derived: derive(state, now), server: TERRA });
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

  return app;
}
