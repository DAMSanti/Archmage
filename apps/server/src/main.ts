/**
 * Punto de entrada del servidor.
 *
 * Sirve el API y, si el cliente está construido, **también el cliente**: una
 * sola aplicación en un solo puerto, que es lo que permite meterla entera en
 * un contenedor (ver `Dockerfile` y `docker-compose.yml`).
 *
 * En desarrollo se usa Vite aparte, con su proxy a `/api`, para tener recarga
 * en caliente.
 */
import { buildApp, makeRandom } from './app.js';
import { connect, ensureSchema } from './db.js';

const url = process.env.DATABASE_URL ?? 'postgres://archmage:archmage@localhost:5433/archmage';
const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? '127.0.0.1';

const { sql, db } = connect(url);

// El contenedor puede arrancar antes que Postgres aunque `depends_on` espere
// al healthcheck: reintentar es más barato que depender de que nunca falle.
for (let intento = 1; ; intento++) {
  try {
    await ensureSchema(sql);
    break;
  } catch (e) {
    if (intento >= 30) throw e;
    console.log(`Esperando a la base de datos (${intento})…`);
    await new Promise((r) => setTimeout(r, 2000));
  }
}

const app = buildApp({ db, now: () => Date.now(), random: () => makeRandom(Date.now() & 0xffffffff) });
await app.listen({ port, host });
console.log(`Archmage escuchando en http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);

for (const senal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(senal, () => {
    void app.close().then(() => sql.end({ timeout: 5 })).then(() => process.exit(0));
  });
}
