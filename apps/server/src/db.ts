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

    -- Fase 2, 2026-09-21. Aditiva y anulable: una base de datos de la fase 1
    -- sigue funcionando sin tocar nada (docs/SPECS.md §4).
    ALTER TABLE mages ADD COLUMN IF NOT EXISTS casting jsonb;

    -- Fase 3, 2026-09-21. Tabla nueva: nadie la necesita para leer lo de
    -- antes, así que la migración es aditiva (docs/SPECS.md §4).
    CREATE TABLE IF NOT EXISTS battles (
      id          serial PRIMARY KEY,
      server_id   text NOT NULL,
      attacker_id text NOT NULL REFERENCES mages(id),
      defender_id text NOT NULL REFERENCES mages(id),
      attack_type text NOT NULL,
      -- Lo que hace la batalla repetible (docs/SPECS.md §5, invariante 3).
      seed        bigint NOT NULL,
      winner      text NOT NULL,
      rounds      integer NOT NULL DEFAULT 0,
      land_lost   integer NOT NULL DEFAULT 0,
      land_taken  integer NOT NULL DEFAULT 0,
      log         jsonb NOT NULL DEFAULT '[]'::jsonb,
      summary     jsonb NOT NULL,
      created_at  timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS battles_attacker_idx ON battles (attacker_id, created_at);
    CREATE INDEX IF NOT EXISTS battles_defender_idx ON battles (defender_id, created_at);
    CREATE INDEX IF NOT EXISTS battles_server_idx   ON battles (server_id, created_at);

    -- Fase 4, 2026-09-21. Cuentas y sesiones. Todo aditivo: la columna
    -- mages.account_id es ANULABLE a propósito, porque el mago de
    -- desarrollo no tiene cuenta y tiene que seguir funcionando
    -- (docs/SISTEMAS.md §12.1).
    CREATE TABLE IF NOT EXISTS accounts (
      id            text PRIMARY KEY,
      email         text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      verified_at   timestamptz,
      created_at    timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id         text PRIMARY KEY,
      account_id text NOT NULL REFERENCES accounts(id),
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS sessions_account_idx ON sessions (account_id);

    -- Tokens de verificacion y de recuperacion. La columna kind los
    -- distingue y used_at impide reutilizar uno: un token gastado no
    -- vale dos veces.
    CREATE TABLE IF NOT EXISTS auth_tokens (
      id         text PRIMARY KEY,
      account_id text NOT NULL REFERENCES accounts(id),
      kind       text NOT NULL,
      expires_at timestamptz NOT NULL,
      used_at    timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS auth_tokens_account_idx ON auth_tokens (account_id, kind);

    -- El correo que se habría mandado, cuando no hay SMTP. Es la segunda
    -- implementacion del Mailer, y la que usan los tests.
    CREATE TABLE IF NOT EXISTS outbox (
      id         serial PRIMARY KEY,
      recipient  text NOT NULL,
      subject    text NOT NULL,
      body       text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    ALTER TABLE mages ADD COLUMN IF NOT EXISTS account_id text REFERENCES accounts(id);
    CREATE INDEX IF NOT EXISTS mages_account_idx ON mages (account_id);

    -- Un mago por cuenta y servidor. En el original es norma de
    -- convivencia; aquí es regla del código, porque si el juego lo permite
    -- alguien lo usa (docs/SISTEMAS.md §13).
    CREATE UNIQUE INDEX IF NOT EXISTS mages_account_server_uniq
      ON mages (account_id, server_id) WHERE account_id IS NOT NULL;

    -- Fase 4. El mercado negro y el ranking. Aditivo.
    CREATE TABLE IF NOT EXISTS market_lots (
      id                serial PRIMARY KEY,
      server_id         text NOT NULL,
      seller_id         text NOT NULL REFERENCES mages(id),
      section           text NOT NULL,
      content           jsonb NOT NULL,
      min_bid           bigint NOT NULL,
      current_bid       bigint,
      current_bidder_id text REFERENCES mages(id),
      listed_at         bigint NOT NULL,
      last_bid_at       bigint,
      status            text NOT NULL DEFAULT 'open',
      created_at        timestamptz NOT NULL DEFAULT now()
    );

    -- El indice que usa la resolucion programada: solo lotes abiertos.
    CREATE INDEX IF NOT EXISTS market_open_idx
      ON market_lots (server_id, status);

    CREATE TABLE IF NOT EXISTS ranking_snapshots (
      id         serial PRIMARY KEY,
      server_id  text NOT NULL,
      taken_at   bigint NOT NULL,
      rows       jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS ranking_server_idx
      ON ranking_snapshots (server_id, taken_at);

    -- Fase 5, 2026-09-22. Gremios, alianzas, mensajes y temporadas.
    -- Todo aditivo.
    CREATE TABLE IF NOT EXISTS guilds (
      id         text PRIMARY KEY,
      server_id  text NOT NULL,
      name       text NOT NULL,
      leader_id  text NOT NULL REFERENCES mages(id),
      enemies    jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS guild_members (
      guild_id text NOT NULL REFERENCES guilds(id),
      mage_id  text NOT NULL REFERENCES mages(id),
      role     text NOT NULL DEFAULT 'member',
      PRIMARY KEY (guild_id, mage_id)
    );

    -- Un mago, un gremio. Es regla del codigo y por eso es un indice
    -- unico y no una comprobacion en la aplicacion.
    CREATE UNIQUE INDEX IF NOT EXISTS guild_one_per_mage
      ON guild_members (mage_id);

    CREATE TABLE IF NOT EXISTS alliances (
      id                  text PRIMARY KEY,
      server_id           text NOT NULL,
      mage_a              text NOT NULL REFERENCES mages(id),
      mage_b              text NOT NULL REFERENCES mages(id),
      break_requested_at  bigint,
      created_at          timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS alliances_a_idx ON alliances (mage_a);
    CREATE INDEX IF NOT EXISTS alliances_b_idx ON alliances (mage_b);

    CREATE TABLE IF NOT EXISTS messages (
      id         serial PRIMARY KEY,
      server_id  text NOT NULL,
      from_id    text NOT NULL REFERENCES mages(id),
      -- Nulo cuando el mensaje va al tablon de un gremio.
      to_id      text REFERENCES mages(id),
      guild_id   text REFERENCES guilds(id),
      body       text NOT NULL,
      read_at    bigint,
      created_at bigint NOT NULL
    );

    CREATE INDEX IF NOT EXISTS messages_to_idx    ON messages (to_id, created_at);
    CREATE INDEX IF NOT EXISTS messages_guild_idx ON messages (guild_id, created_at);

    CREATE TABLE IF NOT EXISTS blocks (
      blocker_id text NOT NULL REFERENCES mages(id),
      blocked_id text NOT NULL REFERENCES mages(id),
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (blocker_id, blocked_id)
    );

    CREATE TABLE IF NOT EXISTS seasons (
      id         text PRIMARY KEY,
      server_id  text NOT NULL,
      started_at bigint NOT NULL,
      status     text NOT NULL DEFAULT 'open',
      ended_at   bigint,
      end_reason text,
      halls      jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS seasons_server_idx ON seasons (server_id, status);

    CREATE TABLE IF NOT EXISTS seals (
      season_id  text NOT NULL REFERENCES seasons(id),
      idx        integer NOT NULL,
      mage_id    text NOT NULL REFERENCES mages(id),
      broken_at  bigint NOT NULL,
      PRIMARY KEY (season_id, idx)
    );

    -- Un mago rompe un sello, y solo uno. Igual que el gremio: si el
    -- juego lo permitiera, alguien lo usaria.
    CREATE UNIQUE INDEX IF NOT EXISTS seals_one_per_mage
      ON seals (season_id, mage_id);

    ALTER TABLE mages ADD COLUMN IF NOT EXISTS season_id text REFERENCES seasons(id);
    CREATE INDEX IF NOT EXISTS mages_season_idx ON mages (season_id);
  `);
}

/** Solo para los tests: vacía las tablas sin tocar el esquema. */
export async function truncateAll(sql: postgres.Sql): Promise<void> {
  await sql.unsafe('TRUNCATE seals, seasons, blocks, messages, alliances, guild_members, guilds, ranking_snapshots, market_lots, outbox, auth_tokens, sessions, battles, events, mages, accounts RESTART IDENTITY CASCADE;');
}
