/**
 * El repositorio: cargar un mago, aplicarle una acción y guardar el resultado
 * **en una sola transacción**.
 *
 * Aquí viven dos invariantes de docs/SPECS.md §5 que fallan sin dar error:
 *
 *  - **4.** El estado y sus eventos se guardan juntos o no se guarda ninguno.
 *  - **6.** Dos acciones sobre el mismo mago se **serializan**. Se carga con
 *    `SELECT ... FOR UPDATE`. Sin eso, dos ataques simultáneos al mismo
 *    defensor resueltos sobre el mismo estado de partida duplican el botín
 *    **y el saldo cuadra igualmente**: no salta ninguna alarma.
 *
 * Y uno que no es invariante pero es la razón de ser del módulo: **aquí no
 * hay reglas de juego**. Se carga, se llama a `core.apply()`, se guarda.
 */

import { and, eq, inArray, ne, or, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  accrue,
  apply,
  canAlly,
  canBreakSeal,
  canFound,
  canJoin,
  canLeave,
  checkBid,
  endReason,
  hallOfFame,
  hallOfImmortals,
  isActive,
  settle,
  shouldEnd,
} from '@archmage/core';
import type { Alliance, Lot, Season } from '@archmage/core';
import type { Action, Ctx, GameEvent, MageState, Result, ServerConfig } from '@archmage/core';
import type { ApplyTuning } from '@archmage/core';
import {
  accounts,
  alliances,
  authTokens,
  battles,
  blocks,
  events,
  guildMembers,
  guilds,
  mages,
  marketLots,
  messages,
  outbox,
  rankingSnapshots,
  seals,
  seasons,
  sessions,
} from './schema.js';

type Db = PostgresJsDatabase<Record<string, never>>;
type Row = typeof mages.$inferSelect;

export function rowToState(row: Row): MageState {
  return {
    id: row.id,
    serverId: row.serverId,
    name: row.name,
    specialty: row.specialty as MageState['specialty'],
    turns: { current: row.turnsCurrent, lastAccrualAt: row.turnsLastAccrualAt },
    turnsSpent: row.turnsSpent,
    land: { total: row.landTotal, free: row.landFree },
    buildings: row.buildings,
    construction: row.construction,
    resources: { geld: row.geld, mana: row.mana, population: row.population },
    army: row.army,
    recruiting: row.recruiting ?? null,
    spellbook: row.spellbook,
    casting: row.casting ?? null,
    enchantments: row.enchantments,
    heroes: row.heroes,
    items: row.items,
    skills: row.skills,
  };
}

/**
 * El estado del mago, en fila.
 *
 * **`accountId` y `seasonId` no están aquí, y es a propósito.** De quién es
 * un mago y en qué temporada juega **no son parte de su estado de juego**
 * —`MageState` no los lleva, y el núcleo no debe saberlos—, así que se
 * escriben al crearlo y `stateToRow` no los toca: si estuvieran, cada
 * guardado los reescribiría y un día los borraría.
 */
function stateToRow(
  state: MageState,
): Omit<Row, 'createdAt' | 'updatedAt' | 'accountId' | 'seasonId'> {
  return {
    id: state.id,
    serverId: state.serverId,
    name: state.name,
    specialty: state.specialty,
    turnsCurrent: state.turns.current,
    turnsLastAccrualAt: state.turns.lastAccrualAt,
    turnsSpent: state.turnsSpent,
    landTotal: state.land.total,
    landFree: state.land.free,
    geld: state.resources.geld,
    mana: state.resources.mana,
    population: state.resources.population,
    buildings: state.buildings,
    construction: state.construction,
    army: state.army,
    recruiting: state.recruiting,
    spellbook: state.spellbook,
    casting: state.casting,
    enchantments: state.enchantments,
    heroes: state.heroes,
    items: state.items,
    skills: state.skills,
  };
}

/**
 * Guarda un mago nuevo.
 *
 * `accountId` es opcional porque **el mago de desarrollo no tiene cuenta**
 * (docs/SISTEMAS.md §12.1), y es el único parámetro que `stateToRow` no
 * produce: de quién es un mago no es parte de su estado de juego.
 */
export async function insertMage(
  db: Db,
  state: MageState,
  accountId?: string,
  seasonId?: string,
): Promise<void> {
  // **La temporada se sella al nacer**, no se deduce al mirar: si se
  // buscara «la abierta» cada vez, un mago creado en la temporada 1
  // pasaria a ser de la 2 en cuanto la 1 cerrara, y el Hall of Fame de
  // la 1 se quedaria sin el.
  await db
    .insert(mages)
    .values({ ...stateToRow(state), accountId: accountId ?? null, seasonId: seasonId ?? null });
}

/**
 * Lee el estado **ya devengado** (docs/SPECS.md §3) y persiste el devengo.
 *
 * El devengo se guarda aunque el jugador solo esté mirando: si no, el reloj
 * se recalcularía desde el mismo `lastAccrualAt` una y otra vez, y el resto
 * al llegar al tope nunca se tiraría.
 */
export async function loadAccrued(
  db: Db,
  mageId: string,
  now: number,
  server: ServerConfig,
): Promise<MageState | null> {
  return db.transaction(async (tx) => {
    const row = await lockRow(tx, mageId);
    if (!row) return null;
    const state = rowToState(row);
    const accrued = accrue(state.turns, now, server);
    if (accrued.turns.current !== state.turns.current || accrued.turns.lastAccrualAt !== state.turns.lastAccrualAt) {
      await tx
        .update(mages)
        .set({
          turnsCurrent: accrued.turns.current,
          turnsLastAccrualAt: accrued.turns.lastAccrualAt,
          updatedAt: new Date(),
        })
        .where(eq(mages.id, mageId));
    }
    return { ...state, turns: accrued.turns };
  });
}

async function lockRow(tx: Db, mageId: string): Promise<Row | undefined> {
  // `FOR UPDATE` es el invariante 6. Sin él, dos acciones simultáneas leen el
  // mismo estado y la segunda pisa a la primera sin que nada se queje.
  const rows = await tx.select().from(mages).where(eq(mages.id, mageId)).for('update');
  return rows[0];
}

export interface AppliedAction {
  state: MageState;
  events: GameEvent[];
}

/**
 * Carga con bloqueo, devenga, aplica **una** acción y guarda estado y eventos
 * juntos. Si la acción devuelve error de dominio, **no se escribe nada** y
 * sube para que la ruta lo convierta en un 422.
 */
export async function applyAction(
  db: Db,
  mageId: string,
  action: Action,
  ctx: Omit<Ctx, 'now'> & { now: number },
  tuning: ApplyTuning,
): Promise<AppliedAction | { error: NonNullable<Extract<Result, { ok: false }>['error']> } | null> {
  return db.transaction(async (tx) => {
    const row = await lockRow(tx, mageId);
    if (!row) return null;

    const cargado = rowToState(row);
    const accrued = accrue(cargado.turns, ctx.now, ctx.server);
    const state: MageState = { ...cargado, turns: accrued.turns };

    const result = apply(state, action, ctx, tuning);
    if (!result.ok) {
      // Ni siquiera el devengo se guarda: la transacción entera se deshace.
      // Volver a leer lo recalculará igual, porque es función del tiempo.
      return { error: result.error };
    }

    const nuevo = result.state;
    await tx.update(mages).set({ ...stateToRow(nuevo), updatedAt: new Date() }).where(eq(mages.id, mageId));

    if (result.events.length > 0) {
      const [{ siguiente } = { siguiente: 0 }] = await tx
        .select({ siguiente: sql<number>`coalesce(max(${events.seq}), -1) + 1` })
        .from(events)
        .where(eq(events.mageId, mageId));

      await tx.insert(events).values(
        result.events.map((e, i) => ({
          mageId,
          seq: siguiente + i,
          type: e.type,
          payload: e as unknown as Record<string, unknown>,
        })),
      );
    }

    return { state: nuevo, events: result.events };
  });
}

/** La crónica de un mago, de lo más reciente a lo más antiguo. */
export async function readChronicle(db: Db, mageId: string, limit = 100) {
  return db
    .select()
    .from(events)
    .where(eq(events.mageId, mageId))
    .orderBy(sql`${events.seq} desc`)
    .limit(limit);
}

// --- Batallas. Fase 3 ----------------------------------------------------

/**
 * Bloquea **dos** magos a la vez, siempre **por id ascendente**.
 *
 * Éste es el punto donde un servidor se cuelga de verdad. Si A ataca a B
 * mientras B ataca a A y cada transacción bloquea primero al suyo, las dos
 * se quedan esperando a la otra: interbloqueo. Postgres lo detecta y mata
 * una, pero el jugador ve un error que no entiende y el ataque se pierde.
 *
 * **Ordenar por id lo hace imposible**, y no por convención: las dos
 * transacciones piden las mismas filas en el mismo orden, así que la segunda
 * espera a la primera y luego sigue. Es la razón de que esta función exista
 * en vez de llamar dos veces a `lockRow`.
 */
async function lockTwoRows(
  tx: Db,
  a: string,
  b: string,
): Promise<{ [id: string]: Row } | undefined> {
  if (a === b) return undefined;
  const orden = [a, b].sort(); // ascendente, siempre
  const filas: Record<string, Row> = {};
  for (const id of orden) {
    const row = await lockRow(tx, id);
    if (!row) return undefined;
    filas[id] = row;
  }
  return filas;
}

export interface BattleWrite {
  serverId: string;
  attackerId: string;
  defenderId: string;
  attackType: string;
  seed: number;
  winner: string;
  rounds: number;
  landLost: number;
  landTaken: number;
  log: Record<string, unknown>[];
  summary: Record<string, unknown>;
}

/**
 * Resuelve un ataque: carga los dos magos con bloqueo, deja que `decide`
 * calcule, y guarda **los dos estados, la batalla y los eventos juntos**.
 *
 * `decide` es puro y vive fuera: aquí no hay reglas de juego (invariante 8).
 */
export async function applyBattle(
  db: Db,
  attackerId: string,
  defenderId: string,
  now: number,
  server: ServerConfig,
  decide: (
    attacker: MageState,
    defender: MageState,
  ) =>
    | {
        attacker: MageState;
        defender: MageState;
        battle: BattleWrite;
        events: { mageId: string; event: GameEvent }[];
      }
    | { error: NonNullable<Extract<Result, { ok: false }>['error']> },
): Promise<
  | { battleId: number; attacker: MageState; defender: MageState }
  | { error: NonNullable<Extract<Result, { ok: false }>['error']> }
  | null
> {
  return db.transaction(async (tx) => {
    const filas = await lockTwoRows(tx, attackerId, defenderId);
    if (!filas) return null;

    const conTurnos = (row: Row): MageState => {
      const s = rowToState(row);
      return { ...s, turns: accrue(s.turns, now, server).turns };
    };
    const atacante = conTurnos(filas[attackerId]!);
    const defensor = conTurnos(filas[defenderId]!);

    const r = decide(atacante, defensor);
    if ('error' in r) return { error: r.error };

    await tx
      .update(mages)
      .set({ ...stateToRow(r.attacker), updatedAt: new Date() })
      .where(eq(mages.id, attackerId));
    await tx
      .update(mages)
      .set({ ...stateToRow(r.defender), updatedAt: new Date() })
      .where(eq(mages.id, defenderId));

    const [fila] = await tx.insert(battles).values(r.battle).returning({ id: battles.id });

    // Los eventos van **en la misma transacción** (invariante 4), y cada uno
    // a la crónica de su mago: los dos tienen derecho a saber qué pasó.
    for (const mageId of [attackerId, defenderId]) {
      const suyos = r.events.filter((e) => e.mageId === mageId);
      if (suyos.length === 0) continue;
      const [{ siguiente } = { siguiente: 0 }] = await tx
        .select({ siguiente: sql<number>`coalesce(max(${events.seq}), -1) + 1` })
        .from(events)
        .where(eq(events.mageId, mageId));
      await tx.insert(events).values(
        suyos.map((e, i) => ({
          mageId,
          seq: siguiente + i,
          type: e.event.type,
          payload: e.event as unknown as Record<string, unknown>,
        })),
      );
    }

    return { battleId: fila!.id, attacker: r.attacker, defender: r.defender };
  });
}

/** Los magos a los que se puede atacar: los del servidor, menos uno mismo. */
export async function listTargets(db: Db, serverId: string, selfId: string) {
  return db
    .select()
    .from(mages)
    .where(and(eq(mages.serverId, serverId), ne(mages.id, selfId)));
}

/** Una batalla por su id, para la pantalla de repetición. */
export async function readBattle(db: Db, id: number) {
  const rows = await db.select().from(battles).where(eq(battles.id, id));
  return rows[0];
}

/** Las últimas batallas de un mago, ataque o defensa. */
export async function listBattles(db: Db, mageId: string, limit = 20) {
  return db
    .select()
    .from(battles)
    .where(or(eq(battles.attackerId, mageId), eq(battles.defenderId, mageId)))
    .orderBy(sql`${battles.id} desc`)
    .limit(limit);
}

/** Los nombres de unos magos, por id. La repetición dice nombres, no ids. */
export async function namesOf(db: Db, ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const filas = await db
    .select({ id: mages.id, name: mages.name })
    .from(mages)
    .where(inArray(mages.id, ids));
  return Object.fromEntries(filas.map((f) => [f.id, f.name]));
}

// --- Cuentas y sesiones. Fase 4 -----------------------------------------

/** La cuenta de una sesión, si la sesión existe y no ha caducado. */
export async function accountOfSession(db: Db, sessionId: string, now: Date) {
  const filas = await db
    .select({ accountId: sessions.accountId, expiresAt: sessions.expiresAt })
    .from(sessions)
    .where(eq(sessions.id, sessionId));
  const f = filas[0];
  if (!f) return null;
  // **Caducar se comprueba al leer, no con un proceso que barra la tabla.**
  // Una sesión vencida que siga en la fila no hace daño; una que se acepte,
  // sí. Es el mismo principio que el devengo de turnos (docs/SPECS.md §3).
  if (f.expiresAt.getTime() <= now.getTime()) return null;
  return f.accountId;
}

/** El mago que esa cuenta juega en ese servidor, si lo tiene. */
/**
 * **Un mago de una temporada cerrada es historia, no estado**
 * (docs/SPECS.md §5, invariante 17).
 *
 * Se filtra por la temporada **del mago**, no por «la temporada abierta»:
 * lo que lo saca del juego es que la suya cerrara. Un mago sin temporada
 * —el de desarrollo, y los que existian antes de la fase 5— sigue vivo,
 * porque nunca hubo una que le cerrara encima.
 *
 * Y se resuelve **en SQL, en la misma consulta**: hacerlo en memoria
 * despues obligaria a acordarse en cada sitio que lista magos, y
 * olvidarse no daria ningun error — solo un ranking con muertos dentro.
 */
const DE_TEMPORADA_VIVA = sql`(
  ${mages.seasonId} is null
  or exists (
    select 1 from seasons
    where seasons.id = ${mages.seasonId} and seasons.status = 'open'
  )
)`;

/**
 * El mago que esta cuenta juega **ahora** en este servidor.
 *
 * Si su temporada cerro, devuelve nada: la cuenta sigue, el mago no, y
 * por eso `POST /api/mage` la deja crear uno nuevo sin decirle que ya
 * tiene (criterio 18 de docs/SISTEMAS.md §14.1).
 */
export async function mageOfAccount(db: Db, accountId: string, serverId: string) {
  const filas = await db
    .select({ id: mages.id })
    .from(mages)
    .where(and(eq(mages.accountId, accountId), eq(mages.serverId, serverId), DE_TEMPORADA_VIVA));
  return filas[0]?.id;
}

export async function createAccount(db: Db, email: string, passwordHash: string) {
  const id = `a_${email.length}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  try {
    await db.insert(accounts).values({ id, email, passwordHash });
    return id;
  } catch {
    // El índice único del correo. Se deja que la base de datos decida en vez
    // de consultar antes: entre la consulta y el insert cabe otro registro.
    return null;
  }
}

export async function accountByEmail(db: Db, email: string) {
  const filas = await db.select().from(accounts).where(eq(accounts.email, email));
  return filas[0];
}

export async function setPassword(db: Db, accountId: string, passwordHash: string) {
  await db.update(accounts).set({ passwordHash }).where(eq(accounts.id, accountId));
}

export async function markVerified(db: Db, accountId: string, at: Date) {
  await db.update(accounts).set({ verifiedAt: at }).where(eq(accounts.id, accountId));
}

export async function createSession(db: Db, id: string, accountId: string, expiresAt: Date) {
  await db.insert(sessions).values({ id, accountId, expiresAt });
}

export async function deleteSession(db: Db, id: string) {
  await db.delete(sessions).where(eq(sessions.id, id));
}

export async function deleteSessionsOf(db: Db, accountId: string) {
  await db.delete(sessions).where(eq(sessions.accountId, accountId));
}

export async function createToken(
  db: Db,
  id: string,
  accountId: string,
  kind: string,
  expiresAt: Date,
) {
  await db.insert(authTokens).values({ id, accountId, kind, expiresAt });
}

/**
 * Gasta un token y devuelve su cuenta, o `null`.
 *
 * **Marcar usado y comprobar van en la misma transacción**: si no, dos
 * peticiones con el mismo token lo gastarían las dos. Un token es de un solo
 * uso o no es nada.
 */
export async function useToken(db: Db, id: string, kind: string, now: Date) {
  return db.transaction(async (tx) => {
    const filas = await tx
      .select()
      .from(authTokens)
      .where(and(eq(authTokens.id, id), eq(authTokens.kind, kind)))
      .for('update');
    const t = filas[0];
    if (!t) return null;
    if (t.usedAt !== null) return null;
    if (t.expiresAt.getTime() <= now.getTime()) return null;
    await tx.update(authTokens).set({ usedAt: now }).where(eq(authTokens.id, id));
    return t.accountId;
  });
}

/** El `Mailer` de la tabla: la segunda implementación de la que habla §12.1. */
export function outboxMailer(db: Db) {
  return {
    async send(to: string, subject: string, body: string) {
      await db.insert(outbox).values({ recipient: to, subject, body });
    },
  };
}

// --- Mercado negro. Fase 4 ----------------------------------------------

function rowToLot(f: typeof marketLots.$inferSelect): Lot {
  return {
    id: f.id,
    sellerId: f.sellerId,
    section: f.section as Lot['section'],
    content: f.content as unknown as Lot['content'],
    minBid: f.minBid,
    currentBid: f.currentBid,
    currentBidderId: f.currentBidderId,
    listedAt: f.listedAt,
    lastBidAt: f.lastBidAt,
    status: f.status as Lot['status'],
  };
}

/** Los lotes abiertos de un servidor. */
export async function listLots(db: Db, serverId: string) {
  const filas = await db
    .select()
    .from(marketLots)
    .where(and(eq(marketLots.serverId, serverId), eq(marketLots.status, 'open')))
    .orderBy(marketLots.id);
  return filas.map(rowToLot);
}

export async function createLot(
  db: Db,
  serverId: string,
  sellerId: string,
  section: string,
  content: Record<string, unknown>,
  minBid: number,
  now: number,
) {
  const [fila] = await db
    .insert(marketLots)
    .values({ serverId, sellerId, section, content, minBid, listedAt: now })
    .returning({ id: marketLots.id });
  return fila!.id;
}

/**
 * Puja por un lote.
 *
 * **La fila del lote va bloqueada** (docs/SPECS.md §5, invariante 14). Es el
 * mismo problema que las dos filas de una batalla con otra cara: dos pujas
 * simultáneas leen el mismo importe y la segunda pisa a la primera **sin que
 * nada se queje** — y el que perdió la puja se queda además sin su geld.
 *
 * Y **cobrar, devolver y guardar son una transacción**, no tres.
 */
export async function applyBid(
  db: Db,
  lotId: number,
  bidderId: string,
  amount: number,
  now: number,
  server: ServerConfig,
): Promise<{ ok: true; lot: Lot } | { error: { code: string; message: string } } | null> {
  return db.transaction(async (tx) => {
    const filas = await tx.select().from(marketLots).where(eq(marketLots.id, lotId)).for('update');
    const fila = filas[0];
    if (!fila) return null;
    const lot = rowToLot(fila);

    const pujador = await lockRow(tx, bidderId);
    if (!pujador) return null;
    const estado = rowToState(pujador);
    const turnos = accrue(estado.turns, now, server).turns;

    const r = checkBid(lot, bidderId, amount, estado.resources.geld, turnos.current, now);
    if ('error' in r) return { error: r.error };

    // Al que fue superado se le devuelve **todo** lo suyo.
    if (r.refund) {
      await tx
        .update(mages)
        .set({ geld: sql`${mages.geld} + ${r.refund.amount}` })
        .where(eq(mages.id, r.refund.to));
    }

    await tx
      .update(mages)
      .set({
        geld: estado.resources.geld - r.charge,
        turnsCurrent: turnos.current - r.turns,
        turnsSpent: estado.turnsSpent + r.turns,
        turnsLastAccrualAt: turnos.lastAccrualAt,
        updatedAt: new Date(),
      })
      .where(eq(mages.id, bidderId));

    await tx
      .update(marketLots)
      .set({ currentBid: amount, currentBidderId: bidderId, lastBidAt: now })
      .where(eq(marketLots.id, lotId));

    return { ok: true as const, lot: { ...lot, currentBid: amount, currentBidderId: bidderId, lastBidAt: now } };
  });
}

/**
 * Resuelve las subastas vencidas. **Idempotente**: solo lotes abiertos y
 * vencidos, así que correrla mil veces adjudica una vez
 * (docs/SPECS.md §3).
 */
export async function settleLots(db: Db, serverId: string, now: number): Promise<number> {
  return db.transaction(async (tx) => {
    const filas = await tx
      .select()
      .from(marketLots)
      .where(and(eq(marketLots.serverId, serverId), eq(marketLots.status, 'open')))
      .for('update');

    let resueltos = 0;
    for (const fila of filas) {
      const lot = rowToLot(fila);
      const s = settle(lot, now);
      if (!s) continue;

      if (s.winnerId) {
        // El vendedor cobra. El comprador **ya pagó al pujar**, así que
        // aquí no se le cobra otra vez: ése es el sentido de cobrar por
        // delante.
        await tx
          .update(mages)
          .set({ geld: sql`${mages.geld} + ${s.sellerGets}` })
          .where(eq(mages.id, lot.sellerId));
        // Y el comprador recibe lo comprado, **en la misma transacción**.
        const ganador = await lockRow(tx, s.winnerId);
        if (ganador) {
          const estado = rowToState(ganador);
          await tx
            .update(mages)
            .set({ ...stateToRow(entregar(estado, lot.content)), updatedAt: new Date() })
            .where(eq(mages.id, s.winnerId));
        }
      }
      await tx.update(marketLots).set({ status: s.status }).where(eq(marketLots.id, lot.id));
      resueltos++;
    }
    return resueltos;
  });
}

// --- Ranking. Fase 4 -----------------------------------------------------

/** Todos los magos de un servidor, para el ranking. */
export async function listMages(db: Db, serverId: string) {
  // **Los de la temporada cerrada no salen** (criterio 20): un ranking
  // con los campeones del mundo anterior dentro le diria al recien
  // llegado que ya perdio.
  return db.select().from(mages).where(and(eq(mages.serverId, serverId), DE_TEMPORADA_VIVA));
}

/** Congela la clasificación del día. */
export async function saveRankingSnapshot(
  db: Db,
  serverId: string,
  takenAt: number,
  rows: Record<string, unknown>[],
) {
  await db.insert(rankingSnapshots).values({ serverId, takenAt, rows });
}

/**
 * Mete en el estado del comprador lo que traía el lote.
 *
 * **Vive aquí y no en el núcleo** porque no es una regla de juego: es la
 * entrega de una compra. La regla —quién gana y por cuánto— está en
 * `market.ts` y es pura.
 */
function entregar(state: MageState, content: Lot['content']): MageState {
  switch (content.kind) {
    case 'item':
      return {
        ...state,
        items: { ...state.items, [content.itemId]: (state.items[content.itemId] ?? 0) + content.count },
      };
    case 'units': {
      const army = [...state.army];
      const i = army.findIndex((s) => s.unitId === content.unitId);
      if (i >= 0) army[i] = { ...army[i]!, count: army[i]!.count + content.count };
      else army.push({ unitId: content.unitId, count: content.count });
      return { ...state, army };
    }
    case 'spell':
      // **No se duplica un hechizo**: en el original no se puede tener dos
      // copias (docs/SISTEMAS.md §7). Comprar uno que ya sabes no hace nada,
      // y eso es cosa del que puja.
      if (state.spellbook.known.includes(content.spellId)) return state;
      return {
        ...state,
        spellbook: { ...state.spellbook, known: [...state.spellbook.known, content.spellId] },
      };
    case 'hero':
      return {
        ...state,
        heroes: [
          ...state.heroes,
          { id: `h_${Date.now().toString(36)}_${state.heroes.length}`, level: content.level, experience: 0 },
        ],
      };
  }
}


// --- Gremios. Fase 5 -----------------------------------------------------

/** En qué gremio está un mago, o `null`. */
export async function guildOf(db: Db, mageId: string): Promise<string | null> {
  const filas = await db
    .select({ guildId: guildMembers.guildId })
    .from(guildMembers)
    .where(eq(guildMembers.mageId, mageId));
  return filas[0]?.guildId ?? null;
}

export async function readGuild(db: Db, guildId: string) {
  const g = (await db.select().from(guilds).where(eq(guilds.id, guildId)))[0];
  if (!g) return null;
  const miembros = await db
    .select({ mageId: guildMembers.mageId, role: guildMembers.role, name: mages.name })
    .from(guildMembers)
    .innerJoin(mages, eq(mages.id, guildMembers.mageId))
    .where(eq(guildMembers.guildId, guildId));
  return { ...g, members: miembros };
}

/**
 * Funda un gremio con sus cinco.
 *
 * **Todo en una transacción**: si el tercer fundador ya estuviera en otro
 * gremio, no puede quedar un gremio a medio fundar con dos miembros.
 */
export async function foundGuild(
  db: Db,
  serverId: string,
  name: string,
  leaderId: string,
  founderIds: readonly string[],
  now: number,
): Promise<{ id: string } | { error: { code: string; message: string } }> {
  return db.transaction(async (tx) => {
    const yaEn = await tx
      .select({ mageId: guildMembers.mageId })
      .from(guildMembers)
      .where(inArray(guildMembers.mageId, [...founderIds]));
    const r = canFound(founderIds, (id) => yaEn.some((x) => x.mageId === id));
    if ('error' in r) return { error: r.error };

    const id = `g_${now.toString(36)}_${leaderId.slice(0, 6)}`;
    await tx.insert(guilds).values({ id, serverId, name, leaderId });
    await tx.insert(guildMembers).values(
      founderIds.map((mageId) => ({
        guildId: id,
        mageId,
        role: mageId === leaderId ? 'leader' : 'member',
      })),
    );
    return { id };
  });
}

export async function joinGuild(
  db: Db,
  guildId: string,
  mageId: string,
): Promise<{ ok: true } | { error: { code: string; message: string } }> {
  return db.transaction(async (tx) => {
    const g = await readGuild(tx, guildId);
    if (!g) return { error: { code: 'no_existe', message: 'No existe ese gremio.' } };
    const ya = await guildOf(tx, mageId);
    const r = canJoin(mageId, { ...g, enemies: g.enemies, serverId: g.serverId } as never, ya !== null);
    if ('error' in r) return { error: r.error };
    await tx.insert(guildMembers).values({ guildId, mageId, role: 'member' });
    return { ok: true as const };
  });
}

export async function leaveGuild(
  db: Db,
  mageId: string,
): Promise<{ ok: true } | { error: { code: string; message: string } } | null> {
  return db.transaction(async (tx) => {
    const guildId = await guildOf(tx, mageId);
    if (!guildId) return null;
    const g = await readGuild(tx, guildId);
    if (!g) return null;
    const r = canLeave(mageId, { ...g, enemies: g.enemies } as never);
    if ('error' in r) return { error: r.error };
    await tx
      .delete(guildMembers)
      .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.mageId, mageId)));
    // El último que sale se lleva el gremio con él: un gremio vacío no es
    // nada, y dejarlo haría que el nombre quedara cogido para siempre.
    const quedan = await tx
      .select({ mageId: guildMembers.mageId })
      .from(guildMembers)
      .where(eq(guildMembers.guildId, guildId));
    if (quedan.length === 0) await tx.delete(guilds).where(eq(guilds.id, guildId));
    return { ok: true as const };
  });
}

// --- Alianzas. Fase 5 ----------------------------------------------------

function rowToAlliance(f: typeof alliances.$inferSelect): Alliance {
  return {
    id: f.id,
    serverId: f.serverId,
    a: f.mageA,
    b: f.mageB,
    breakRequestedAt: f.breakRequestedAt,
  };
}

/** Las alianzas de un mago, rotas o no. */
export async function alliancesOf(db: Db, mageId: string): Promise<Alliance[]> {
  const filas = await db
    .select()
    .from(alliances)
    .where(or(eq(alliances.mageA, mageId), eq(alliances.mageB, mageId)));
  return filas.map(rowToAlliance);
}

/** Los aliados **activos ahora** de un mago. El plazo de ruptura cuenta. */
export async function activeAlliesOf(db: Db, mageId: string, now: number): Promise<string[]> {
  const todas = await alliancesOf(db, mageId);
  return todas
    .filter((a) => isActive(a, now))
    .map((a) => (a.a === mageId ? a.b : a.a));
}

export async function createAlliance(
  db: Db,
  serverId: string,
  a: string,
  b: string,
  now: number,
): Promise<{ id: string } | { error: { code: string; message: string } }> {
  return db.transaction(async (tx) => {
    const mias = await activeAlliesOf(tx, a, now);
    const suyas = await activeAlliesOf(tx, b, now);
    const r = canAlly(a, b, mias.length, suyas.length, mias.includes(b), serverId);
    if ('error' in r) return { error: r.error };
    const id = `al_${now.toString(36)}_${a.slice(0, 4)}${b.slice(0, 4)}`;
    await tx.insert(alliances).values({ id, serverId, mageA: a, mageB: b });
    return { id };
  });
}

/** Pide romper. **No la rompe**: eso lo hace el plazo. */
export async function requestBreak(db: Db, allianceId: string, now: number) {
  await db
    .update(alliances)
    .set({ breakRequestedAt: now })
    .where(eq(alliances.id, allianceId));
}

/**
 * Borra las alianzas cuyo plazo venció. **Idempotente**: las que siguen
 * activas no se tocan, así que correrla mil veces no rompe ninguna de más.
 */
export async function settleBrokenAlliances(db: Db, now: number): Promise<number> {
  const todas = await db.select().from(alliances);
  let rotas = 0;
  for (const f of todas) {
    const a = rowToAlliance(f);
    if (a.breakRequestedAt === null || isActive(a, now)) continue;
    await db.delete(alliances).where(eq(alliances.id, a.id));
    rotas++;
  }
  return rotas;
}

// --- Mensajes. Fase 5 ----------------------------------------------------

export async function isBlocked(db: Db, blockerId: string, blockedId: string) {
  const filas = await db
    .select({ x: blocks.blockedId })
    .from(blocks)
    .where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId)));
  return filas.length > 0;
}

export async function sendDirect(
  db: Db,
  serverId: string,
  fromId: string,
  toId: string,
  body: string,
  now: number,
): Promise<{ ok: true }> {
  // **El bloqueado no escribe, y el que bloquea no se entera de que lo
  // intentó** (criterio 9). Por eso esto devuelve `ok` igualmente: decirle
  // «te han bloqueado» convertiría el bloqueo en una notificación para
  // quien acosa.
  if (await isBlocked(db, toId, fromId)) return { ok: true };
  await db.insert(messages).values({ serverId, fromId, toId, body, createdAt: now });
  return { ok: true };
}

export async function postToGuild(
  db: Db,
  serverId: string,
  fromId: string,
  guildId: string,
  body: string,
  now: number,
) {
  await db.insert(messages).values({ serverId, fromId, guildId, body, createdAt: now });
}

/** La bandeja de un mago: **solo la suya**. */
export async function inboxOf(db: Db, mageId: string, limit = 50) {
  return db
    .select({
      id: messages.id,
      fromId: messages.fromId,
      body: messages.body,
      createdAt: messages.createdAt,
      readAt: messages.readAt,
    })
    .from(messages)
    .where(eq(messages.toId, mageId))
    .orderBy(sql`${messages.id} desc`)
    .limit(limit);
}

export async function guildBoard(db: Db, guildId: string, limit = 50) {
  return db
    .select({
      id: messages.id,
      fromId: messages.fromId,
      body: messages.body,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.guildId, guildId))
    .orderBy(sql`${messages.id} desc`)
    .limit(limit);
}

export async function blockMage(db: Db, blockerId: string, blockedId: string) {
  try {
    await db.insert(blocks).values({ blockerId, blockedId });
  } catch {
    // Ya estaba bloqueado. Bloquear dos veces no es un error.
  }
}

// --- Temporadas y sellos. Fase 5 -----------------------------------------

export async function currentSeason(db: Db, serverId: string): Promise<Season | null> {
  const f = (
    await db
      .select()
      .from(seasons)
      .where(and(eq(seasons.serverId, serverId), eq(seasons.status, 'open')))
  )[0];
  if (!f) return null;
  const s = await db.select().from(seals).where(eq(seals.seasonId, f.id));
  return {
    id: f.id,
    serverId: f.serverId,
    startedAt: f.startedAt,
    seals: s
      .map((x) => ({ index: x.idx, mageId: x.mageId, brokenAt: x.brokenAt }))
      .sort((a, b) => a.index - b.index),
    status: f.status as Season['status'],
    endedAt: f.endedAt,
  };
}

/** Abre una temporada si el servidor no tiene ninguna. Idempotente. */
export async function ensureSeason(db: Db, serverId: string, now: number): Promise<Season> {
  const ya = await currentSeason(db, serverId);
  if (ya) return ya;

  // **El id es el ordinal, no el reloj.** La primera version lo sacaba de
  // `now`, y la temporada que se abre justo detras de una que acaba de
  // cerrar nacia con el id de la anterior y reventaba contra la clave
  // primaria — un 500, no un error de dominio. Lo enseño el test del
  // criterio 18, que cierra y reabre con el reloj inyectado quieto.
  const cuantas = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(seasons)
    .where(eq(seasons.serverId, serverId));
  const id = `t_${serverId}_${(cuantas[0]?.n ?? 0) + 1}`;

  try {
    await db.insert(seasons).values({ id, serverId, startedAt: now });
  } catch {
    // Dos peticiones abriendo temporada a la vez: la que pierde **relee**,
    // que es lo que queria de entrada. Deja que la clave primaria decida
    // en vez de preguntar antes, porque entre la pregunta y el insert
    // cabe la otra.
    const otra = await currentSeason(db, serverId);
    if (otra) return otra;
    throw new Error(`No se pudo abrir temporada en ${serverId}.`);
  }
  return { id, serverId, startedAt: now, seals: [], status: 'open', endedAt: null };
}

/**
 * Rompe un sello.
 *
 * **La fila de la temporada va bloqueada**: dos magos rompiendo a la vez
 * leerían el mismo número de sellos y los dos romperían el séptimo.
 */
export async function breakSeal(
  db: Db,
  serverId: string,
  mageId: string,
  now: number,
): Promise<{ index: number } | { error: { code: string; message: string } } | null> {
  return db.transaction(async (tx) => {
    const t = await currentSeason(tx, serverId);
    if (!t) return null;
    await tx.select().from(seasons).where(eq(seasons.id, t.id)).for('update');

    // **Hay que saber el hechizo.** Se lee del libro del mago, que es donde
    // vive: el núcleo decide, el servidor aporta el dato.
    const fila = await lockRow(tx, mageId);
    const sabe = fila ? rowToState(fila).spellbook.known.includes('armageddon') : false;
    const r = canBreakSeal(t, mageId, now, sabe);
    if ('error' in r) return { error: r.error };
    await tx.insert(seals).values({ seasonId: t.id, idx: r.index, mageId, brokenAt: now });
    return { index: r.index };
  });
}

/**
 * Cierra las temporadas que tocan. **Idempotente** (docs/SPECS.md §3).
 *
 * **Cerrar es una escritura, no miles**: se marca la fila de la temporada y
 * los magos se quedan como están, apuntando a ella. Es el invariante 17.
 */
export async function settleSeasons(
  db: Db,
  serverId: string,
  now: number,
  netPowerOf: (row: Row) => number,
): Promise<{ ended: boolean; reason: string | null }> {
  return db.transaction(async (tx) => {
    const t = await currentSeason(tx, serverId);
    if (!t || !shouldEnd(t, now)) return { ended: false, reason: null };

    const filas = await tx
      .select()
      .from(mages)
      .where(and(eq(mages.serverId, serverId), eq(mages.seasonId, t.id)));
    const fame = hallOfFame(
      filas.map((f) => ({ id: f.id, name: f.name, netPower: netPowerOf(f) })),
    );
    const immortals = hallOfImmortals(t);

    await tx
      .update(seasons)
      .set({
        status: 'ended',
        endedAt: now,
        endReason: endReason(t, now),
        halls: { fame, immortals },
      })
      .where(eq(seasons.id, t.id));

    return { ended: true, reason: endReason(t, now) };
  });
}

export async function readSeasons(db: Db, serverId: string) {
  return db
    .select()
    .from(seasons)
    .where(eq(seasons.serverId, serverId))
    .orderBy(sql`${seasons.startedAt} desc`);
}
