/**
 * El esquema de base de datos.
 *
 * docs/SPECS.md §4: **las migraciones son aditivas**. Se añaden columnas con
 * su `DEFAULT`, no se rompe hacia atrás, y lo que deja de usarse no se borra
 * durante una temporada viva.
 *
 * Qué va en columna y qué en `jsonb`:
 *  - **Columna** lo que se consulta o se ordena: la tierra, los recursos, los
 *    turnos. El ranking de la fase 4 los va a necesitar indexables.
 *  - **`jsonb`** lo que solo se lee entero con el mago: edificios, ejército,
 *    libro de hechizos. Añadir un campo ahí no es una migración.
 *
 * Fuera de alcance en la fase 1: cuentas, gremios, mercado y temporadas.
 * Tendrán sus propias tablas (docs/SPECS.md §1).
 */

import { bigint, index, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import type { Buildings, Casting, Enchantment, Hero, Recruiting, Spellbook, Stack } from '@archmage/core';

export const mages = pgTable(
  'mages',
  {
    id: text('id').primaryKey(),
    serverId: text('server_id').notNull(),
    name: text('name').notNull(),
    specialty: text('specialty').notNull(),

    // El reloj solo toca esto (docs/SPECS.md §3).
    turnsCurrent: integer('turns_current').notNull().default(0),
    turnsLastAccrualAt: bigint('turns_last_accrual_at', { mode: 'number' }).notNull(),
    turnsSpent: integer('turns_spent').notNull().default(0),

    landTotal: integer('land_total').notNull(),
    landFree: integer('land_free').notNull(),

    // Enteros, siempre (docs/SPECS.md §4). `bigint` en modo número: el geld
    // de una temporada larga pasa de 2^31 pero no se acerca a 2^53.
    geld: bigint('geld', { mode: 'number' }).notNull().default(0),
    mana: bigint('mana', { mode: 'number' }).notNull().default(0),
    population: bigint('population', { mode: 'number' }).notNull().default(0),

    buildings: jsonb('buildings').$type<Buildings>().notNull(),
    construction: jsonb('construction').$type<Buildings>().notNull(),
    army: jsonb('army').$type<Stack[]>().notNull().default([]),
    recruiting: jsonb('recruiting').$type<Recruiting | null>(),
    /** Fase 2. Migración aditiva y anulable. */
    casting: jsonb('casting').$type<Casting | null>(),
    spellbook: jsonb('spellbook').$type<Spellbook>().notNull(),
    enchantments: jsonb('enchantments').$type<Enchantment[]>().notNull().default([]),
    heroes: jsonb('heroes').$type<Hero[]>().notNull().default([]),
    items: jsonb('items').$type<Record<string, number>>().notNull().default({}),
    skills: jsonb('skills').$type<Record<string, number>>().notNull().default({}),

    /**
     * La cuenta que juega este mago. **Anulable a propósito**: el mago de
     * desarrollo no tiene cuenta (docs/SISTEMAS.md §12.1), y la migración
     * es aditiva.
     */
    accountId: text('account_id'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    porServidor: index('mages_server_idx').on(t.serverId),
    porCuenta: index('mages_account_idx').on(t.accountId),
  }),
);

/**
 * La crónica.
 *
 * docs/SPECS.md §5, invariante 4: **el estado y sus eventos se guardan en la
 * misma transacción**. Si se guardara el estado sin los eventos, la crónica
 * perdería un hecho y nadie se enteraría hasta que un jugador preguntase por
 * qué perdió un ejército.
 */
export const events = pgTable(
  'events',
  {
    id: serial('id').primaryKey(),
    mageId: text('mage_id')
      .notNull()
      .references(() => mages.id),
    /** Orden dentro del mago: el `id` global no basta para reconstruir. */
    seq: integer('seq').notNull(),
    type: text('type').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    porMago: index('events_mage_idx').on(t.mageId, t.seq),
  }),
);

/**
 * Las batallas. Fase 3.
 *
 * Migración **aditiva**: tabla nueva, nadie la necesita para leer lo de
 * antes (docs/SPECS.md §5).
 *
 * **La semilla se guarda aquí y no en el log** (invariante 3). El log es
 * grande y podría regenerarse; la semilla es lo que hace que regenerarlo dé
 * exactamente lo mismo. Si un día el log se poda por tamaño, la repetición
 * se sigue pudiendo reconstruir.
 */
export const battles = pgTable(
  'battles',
  {
    id: serial('id').primaryKey(),
    serverId: text('server_id').notNull(),
    attackerId: text('attacker_id')
      .notNull()
      .references(() => mages.id),
    defenderId: text('defender_id')
      .notNull()
      .references(() => mages.id),
    attackType: text('attack_type').notNull(),
    /** Lo que hace la batalla repetible. */
    seed: bigint('seed', { mode: 'number' }).notNull(),
    winner: text('winner').notNull(),
    rounds: integer('rounds').notNull().default(0),
    landLost: integer('land_lost').notNull().default(0),
    landTaken: integer('land_taken').notNull().default(0),
    /** El log golpe a golpe, con los términos que se aplicaron. */
    log: jsonb('log').$type<Record<string, unknown>[]>().notNull().default([]),
    summary: jsonb('summary').$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    porAtacante: index('battles_attacker_idx').on(t.attackerId, t.createdAt),
    porDefensor: index('battles_defender_idx').on(t.defenderId, t.createdAt),
    porServidor: index('battles_server_idx').on(t.serverId, t.createdAt),
  }),
);

// --- Cuentas y sesiones. Fase 4 -----------------------------------------

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  /** Normalizado a minúsculas antes de guardar: ver `normalizeEmail`. */
  email: text('email').notNull().unique(),
  /** `scrypt$<salt>$<hash>`. El algoritmo va dentro para poder migrarlo. */
  passwordHash: text('password_hash').notNull(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Tokens de verificación y de recuperación. `usedAt` impide reutilizarlos. */
export const authTokens = pgTable('auth_tokens', {
  id: text('id').primaryKey(),
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id),
  kind: text('kind').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** El correo que se habría mandado. La segunda implementación del `Mailer`. */
export const outbox = pgTable('outbox', {
  id: serial('id').primaryKey(),
  recipient: text('recipient').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
