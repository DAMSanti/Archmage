/**
 * El cliente del API.
 *
 * El servidor es **autoritativo** (docs/SPECS.md §5, invariante 5): lo que
 * aquí se pide es la verdad, y nada de lo que el navegador calcule se manda
 * de vuelta como resultado.
 *
 * Las respuestas se validan con los esquemas de `@archmage/contract`, los
 * mismos que usa el servidor para validar la entrada.
 */

import {
  battleSchema,
  catalogResponseSchema,
  guildResponseSchema,
  marketResponseSchema,
  messagesResponseSchema,
  rankingResponseSchema,
  seasonResponseSchema,
  targetsResponseSchema,
  mageResponseSchema,
  actionResponseSchema,
  type ActionInput,
  type ActionResponse,
  type CatalogResponse,
  type Battle,
  type GuildResponse,
  type Lot,
  type MessagesResponse,
  type MageResponse,
  type RankingRow,
  type SeasonResponse,
  type Target,
} from '@archmage/contract';

export type { Battle, Lot, RankingRow, Target };

export class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

async function leerError(res: Response): Promise<never> {
  let code = `http_${res.status}`;
  let message = 'Algo ha ido mal.';
  try {
    const body = (await res.json()) as { error?: { code?: string; message?: string } };
    if (body.error?.code) code = body.error.code;
    if (body.error?.message) message = body.error.message;
  } catch {
    // Sin cuerpo JSON: nos quedamos con el código HTTP.
  }
  throw new DomainError(code, message);
}

export async function fetchMage(): Promise<MageResponse> {
  const res = await fetch('/api/mage/me');
  if (!res.ok) return leerError(res);
  return mageResponseSchema.parse(await res.json());
}

export async function fetchCatalog(): Promise<CatalogResponse> {
  const res = await fetch('/api/catalog');
  if (!res.ok) return leerError(res);
  return catalogResponseSchema.parse(await res.json());
}

/**
 * Manda **una** acción. Si el servidor responde 422, es juego —«no tienes
 * maná»—, no una avería (docs/SPECS.md §5, invariante 9).
 */
export async function sendAction(action: ActionInput): Promise<ActionResponse> {
  const res = await fetch('/api/mage/me/actions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) return leerError(res);
  return actionResponseSchema.parse(await res.json());
}

export interface ChronicleRow {
  seq: number;
  type: string;
  payload: Record<string, unknown>;
  at: string;
}

export async function fetchChronicle(): Promise<ChronicleRow[]> {
  const res = await fetch('/api/mage/me/chronicle');
  if (!res.ok) return leerError(res);
  return (await res.json()) as ChronicleRow[];
}

// --- Guerra. Fase 3 ------------------------------------------------------

/** Contra quién se puede luchar. */
export async function fetchTargets(): Promise<Target[]> {
  const res = await fetch('/api/war/targets');
  if (!res.ok) return leerError(res);
  return targetsResponseSchema.parse(await res.json()).targets;
}

/**
 * Una batalla con su log, para la repetición.
 *
 * Se pide **de una en una** y no con la lista: el log de una batalla grande
 * son cientos de golpes, y la lista solo pinta una línea por batalla.
 */
export async function fetchBattle(id: number): Promise<Battle> {
  const res = await fetch(`/api/war/battles/${id}`);
  if (!res.ok) return leerError(res);
  const body = (await res.json()) as { battle: unknown };
  return battleSchema.parse(body.battle);
}

// --- Cuentas, mercado y ranking. Fase 4 ---------------------------------

async function post(url: string, body?: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    // `exactOptionalPropertyTypes` no deja pasar `undefined` como cuerpo, y
    // tiene razón: una petición sin cuerpo y una con cuerpo `undefined` son
    // dos cosas distintas para el servidor.
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!res.ok) return leerError(res);
  return res.json();
}

export const registrar = (email: string, password: string) =>
  post('/api/auth/register', { email, password }) as Promise<void>;
export const verificar = (token: string) => post('/api/auth/verify', { token }) as Promise<void>;
export const entrar = (email: string, password: string) =>
  post('/api/auth/login', { email, password }) as Promise<void>;
export const salir = () => post('/api/auth/logout') as Promise<void>;
export const recuperar = (email: string) => post('/api/auth/forgot', { email }) as Promise<void>;
export const crearMago = (name: string, specialty: string) =>
  post('/api/mage', { name, specialty }) as Promise<void>;

export async function fetchRanking(): Promise<RankingRow[]> {
  const res = await fetch('/api/ranking');
  if (!res.ok) return leerError(res);
  return rankingResponseSchema.parse(await res.json()).rows;
}

export async function fetchMarket(): Promise<Lot[]> {
  // Se resuelven las subastas vencidas al mirar: es idempotente, así que
  // llamarla de más no hace daño y evita un proceso periódico
  // (docs/SPECS.md §3).
  await fetch('/api/market/settle', { method: 'POST' }).catch(() => undefined);
  const res = await fetch('/api/market');
  if (!res.ok) return leerError(res);
  return marketResponseSchema.parse(await res.json()).lots;
}

export const sendBid = (lotId: number, amount: number) =>
  post(`/api/market/lots/${lotId}/bids`, { amount }) as Promise<void>;

// --- Gremios, mensajes y temporada. Fase 5 ------------------------------

export type GuildInfo = GuildResponse;
export type MessagesInfo = MessagesResponse;
export type SeasonInfo = SeasonResponse;

export async function fetchGuild(): Promise<GuildInfo> {
  const res = await fetch('/api/guild');
  if (!res.ok) return leerError(res);
  return guildResponseSchema.parse(await res.json());
}

export async function fetchMessages(): Promise<MessagesInfo> {
  const res = await fetch('/api/messages');
  if (!res.ok) return leerError(res);
  return messagesResponseSchema.parse(await res.json());
}

export const enviarMensaje = (m: { toId?: string; toGuild?: boolean; body: string }) =>
  post('/api/messages', m) as Promise<void>;

export const bloquear = (mageId: string) =>
  post('/api/messages/block', { mageId }) as Promise<void>;

export async function fetchSeason(): Promise<SeasonInfo> {
  // Se cierra lo que toque al mirar: es idempotente, así que llamarla de
  // más no hace daño y evita un proceso periódico (docs/SPECS.md §3).
  await fetch('/api/season/settle', { method: 'POST' }).catch(() => undefined);
  const res = await fetch('/api/season');
  if (!res.ok) return leerError(res);
  return seasonResponseSchema.parse(await res.json());
}

export const romperSello = () => post('/api/season/seal') as Promise<void>;
