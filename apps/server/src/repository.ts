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

import { eq, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { accrue, apply } from '@archmage/core';
import type { Action, Ctx, GameEvent, MageState, Result, ServerConfig } from '@archmage/core';
import type { ApplyTuning } from '@archmage/core';
import { events, mages } from './schema.js';

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

function stateToRow(state: MageState): Omit<Row, 'createdAt' | 'updatedAt'> {
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

export async function insertMage(db: Db, state: MageState): Promise<void> {
  await db.insert(mages).values(stateToRow(state));
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
