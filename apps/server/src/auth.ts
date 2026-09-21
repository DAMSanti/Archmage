/**
 * Cuentas, contraseñas y sesiones.
 *
 * **Esto no es una regla del juego, y por eso no está en `packages/core`.**
 * Una cuenta no produce, no gasta turnos y no se puede simular: es
 * infraestructura. El núcleo sigue sin importar nada
 * (docs/SPECS.md §5, invariante 1), y aquí sí se puede usar `node:crypto`.
 *
 * **La regla que sí importa vive en el invariante 13**: el id del mago sale
 * de la sesión y **nunca del cuerpo de la petición ni de la URL**. Es de los
 * que se rompen sin dar error — un endpoint que acepte un `mageId` por
 * parámetro funciona perfectamente y deja jugar el reino de cualquiera.
 *
 * Fuera de alcance aquí:
 *  - **Roles y permisos.** Una cuenta juega sus magos y nada más.
 *  - **OAuth y terceros.** Correo y contraseña, que es lo que un juego por
 *    temporadas necesita.
 *  - **Sesiones con expiración deslizante.** Caducan a plazo fijo; renovar
 *    es volver a entrar.
 */

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

/** Duración de una sesión: 30 días. Una temporada dura tres meses. */
export const SESSION_DAYS = 30;
/** Duración de un token de verificación o de recuperación: 24 horas. */
export const TOKEN_HOURS = 24;

const SCRYPT_KEYLEN = 64;

/**
 * Deriva una contraseña con **scrypt**, la función que Node recomienda para
 * esto y que además está en la biblioteca estándar: cero dependencias
 * nuevas.
 *
 * El formato guardado es `scrypt$<salt hex>$<hash hex>`. Lleva el algoritmo
 * dentro **a propósito**: el día que haya que cambiarlo, las contraseñas
 * viejas se pueden reconocer y migrar al entrar, en vez de invalidarlas
 * todas de golpe.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

/**
 * Comprueba una contraseña contra lo guardado.
 *
 * Compara con `timingSafeEqual`: una comparación normal tarda más cuanto
 * más se parecen las cadenas, y eso deja adivinar un hash byte a byte.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const partes = stored.split('$');
  if (partes.length !== 3 || partes[0] !== 'scrypt') return false;
  const salt = Buffer.from(partes[1]!, 'hex');
  const esperado = Buffer.from(partes[2]!, 'hex');
  if (esperado.length !== SCRYPT_KEYLEN) return false;
  const hash = await scrypt(password, salt, SCRYPT_KEYLEN);
  return timingSafeEqual(hash, esperado);
}

/** Un identificador opaco y aleatorio: sesiones y tokens. */
export function newToken(): string {
  return randomBytes(32).toString('hex');
}

/** Cuándo caduca una sesión abierta ahora. */
export function sessionExpiry(now: number): Date {
  return new Date(now + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

/** Cuándo caduca un token emitido ahora. */
export function tokenExpiry(now: number): Date {
  return new Date(now + TOKEN_HOURS * 60 * 60 * 1000);
}

/**
 * Normaliza un correo para compararlo: minúsculas y sin espacios.
 *
 * Sin esto, `Ana@ejemplo.com` y `ana@ejemplo.com` serían **dos cuentas**, y
 * la segunda persona en registrarse creería que le han robado el correo.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Lo mínimo que se le pide a una contraseña. */
export const MIN_PASSWORD = 8;

export function passwordIsValid(password: string): boolean {
  return password.length >= MIN_PASSWORD;
}

/**
 * El correo que se manda, sea por SMTP o a una tabla.
 *
 * **Dos implementaciones a propósito** (docs/SISTEMAS.md §12.1): una real y
 * otra que deja el mensaje guardado. La de la tabla es la que usan los tests
 * y el desarrollo, y evita atar el proyecto a un proveedor antes de tener
 * jugadores — y evita que un test mande correo de verdad, que es peor.
 */
export interface Mailer {
  send(to: string, subject: string, body: string): Promise<void>;
}

/** El que no manda nada y apunta lo que habría mandado. Para tests. */
export function memoryMailer(): Mailer & { sent: { to: string; subject: string; body: string }[] } {
  const sent: { to: string; subject: string; body: string }[] = [];
  return {
    sent,
    async send(to, subject, body) {
      sent.push({ to, subject, body });
    },
  };
}

/**
 * El nombre de la cookie de sesión.
 *
 * Lleva **un id de sesión, no el `mageId`**: así cerrar sesión es borrar una
 * fila y no esperar a que caduque un token que el cliente sigue teniendo.
 */
export const SESSION_COOKIE = 'archmage_sid';
