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
  targetsResponseSchema,
  mageResponseSchema,
  actionResponseSchema,
  type ActionInput,
  type ActionResponse,
  type CatalogResponse,
  type Battle,
  type MageResponse,
  type Target,
} from '@archmage/contract';

export type { Battle, Target };

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
