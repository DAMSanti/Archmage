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
import type { Buildings, Enchantment, Hero, Recruiting, Spellbook, Stack } from '@archmage/core';

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
    spellbook: jsonb('spellbook').$type<Spellbook>().notNull(),
    enchantments: jsonb('enchantments').$type<Enchantment[]>().notNull().default([]),
    heroes: jsonb('heroes').$type<Hero[]>().notNull().default([]),
    items: jsonb('items').$type<Record<string, number>>().notNull().default({}),
    skills: jsonb('skills').$type<Record<string, number>>().notNull().default({}),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    porServidor: index('mages_server_idx').on(t.serverId),
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
