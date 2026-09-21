/** Punto de entrada del servidor de desarrollo. */
import { buildApp, makeRandom } from './app.js';
import { connect, ensureSchema } from './db.js';

const url = process.env.DATABASE_URL ?? 'postgres://archmage:archmage@localhost:5433/archmage';
const port = Number(process.env.PORT ?? 3001);

const { sql, db } = connect(url);
await ensureSchema(sql);

const app = buildApp({ db, now: () => Date.now(), random: () => makeRandom(Date.now() & 0xffffffff) });
await app.listen({ port, host: '127.0.0.1' });
console.log(`Archmage escuchando en http://127.0.0.1:${port}`);
