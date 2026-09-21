/**
 * La conexión, y **el esquema creado a mano**.
 *
 * Por qué SQL a mano y no `drizzle-kit`: la fase 1 tiene dos tablas y ningún
 * despliegue. Una carpeta de migraciones generadas y un binario más que
 * instalar no compran nada todavía, y el requisito de docs/SPECS.md §4 —que
 * las migraciones sean **aditivas**— se cumple igual: cada sentencia de aquí
 * es `CREATE ... IF NOT EXISTS` o `ADD COLUMN ... IF NOT EXISTS` con su
 * `DEFAULT`, y ninguna borra nada.
 *
 * En cuanto haya un despliegue de verdad, esto se cambia por migraciones
 * versionadas. Queda declarado como deuda.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export type Db = PostgresJsDatabase<Record<string, never>>;

export function connect(url: string, max = 10): { sql: postgres.Sql; db: Db } {
  const sql = postgres(url, {
    max,
    // `ensureSchema` es idempotente a propósito, así que Postgres avisa con
    // un NOTICE por cada `IF NOT EXISTS` que ya existía. Son esperados: si se
    // dejan salir, cada arranque imprime un muro de lo que parecen errores y
    // el día que haya uno de verdad nadie lo verá.
    onnotice: (aviso) => {
      if (aviso.code !== '42P07' && aviso.code !== '42710') console.warn(aviso.message);
    },
  });
  return { sql, db: drizzle(sql) };
}

/** Aditivo y idempotente: se puede correr mil veces. */
export async function ensureSchema(sql: postgres.Sql): Promise<void> {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS mages (
      id                      text PRIMARY KEY,
      server_id               text NOT NULL,
      name                    text NOT NULL,
      specialty               text NOT NULL,
      turns_current           integer NOT NULL DEFAULT 0,
      turns_last_accrual_at   bigint  NOT NULL,
      turns_spent             integer NOT NULL DEFAULT 0,
      land_total              integer NOT NULL,
      land_free               integer NOT NULL,
      geld                    bigint  NOT NULL DEFAULT 0,
      mana                    bigint  NOT NULL DEFAULT 0,
      population              bigint  NOT NULL DEFAULT 0,
      buildings               jsonb   NOT NULL,
      construction            jsonb   NOT NULL,
      army                    jsonb   NOT NULL DEFAULT '[]'::jsonb,
      recruiting              jsonb,
      spellbook               jsonb   NOT NULL,
      enchantments            jsonb   NOT NULL DEFAULT '[]'::jsonb,
      heroes                  jsonb   NOT NULL DEFAULT '[]'::jsonb,
      items                   jsonb   NOT NULL DEFAULT '{}'::jsonb,
      skills                  jsonb   NOT NULL DEFAULT '{}'::jsonb,
      created_at              timestamptz NOT NULL DEFAULT now(),
      updated_at              timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS mages_server_idx ON mages (server_id);

    CREATE TABLE IF NOT EXISTS events (
      id         serial PRIMARY KEY,
      mage_id    text NOT NULL REFERENCES mages(id),
      seq        integer NOT NULL,
      type       text NOT NULL,
      payload    jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS events_mage_idx ON events (mage_id, seq);
  `);
}

/** Solo para los tests: vacía las tablas sin tocar el esquema. */
export async function truncateAll(sql: postgres.Sql): Promise<void> {
  await sql.unsafe('TRUNCATE events, mages RESTART IDENTITY CASCADE;');
}
