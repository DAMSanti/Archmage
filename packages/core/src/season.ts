/**
 * La temporada: los siete sellos, la fecha tope y el final.
 *
 * **[orig]** Armageddon **no es un hechizo que se lanza una vez, es una
 * carrera de siete** ([docs/ORIGINAL.md §10.1](../../../docs/ORIGINAL.md),
 * confianza alta). Cada lanzamiento con éxito rompe un sello; roto el
 * séptimo, la ronda acaba. Un sello cada **24 horas** como mínimo, y **un
 * mago solo puede romper uno**: hacen falta **siete magos distintos**.
 *
 * **Lo que esto dice del diseño, y es lo que más importa de la fase 5:** el
 * final de la temporada **no es una fecha, es una decisión colectiva**. El
 * reloj solo pone el tope.
 *
 * **Y por qué la temporada existe**: es la respuesta a que un veterano sea
 * inalcanzable (docs/SISTEMAS.md §14). Sin reset, el que empezó primero
 * gana para siempre y el que llega tarde no tiene partida.
 *
 * Fuera de alcance aquí:
 *  - **Qué destruye el evento** al dispararse. La fuente no lo publica, y
 *    la temporada acaba igual: no hace falta inventar una catástrofe para
 *    que el reset ocurra.
 *  - **Guardar nada.** El servidor persiste; aquí se decide.
 */

/** Sellos que hay que romper. docs/ORIGINAL.md §10.1. */
export const SEALS = 7;

/** Horas mínimas entre dos sellos. */
export const SEAL_COOLDOWN_HOURS = 24;

/** Días que dura una temporada como mucho. docs/SISTEMAS.md §14 y §14.1. */
export const SEASON_DAYS = 90;

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

export interface Seal {
  /** Del 1 al 7. */
  index: number;
  mageId: string;
  brokenAt: number;
}

export interface Season {
  id: string;
  serverId: string;
  startedAt: number;
  seals: readonly Seal[];
  status: 'open' | 'ended';
  endedAt: number | null;
}

export type SealError =
  | { code: 'temporada_cerrada'; message: string }
  | { code: 'ya_rompiste_uno'; message: string }
  | { code: 'demasiado_pronto'; message: string };

/** Cuándo vence la temporada por reloj, sin sellos de por medio. */
export function deadlineOf(season: Season): number {
  return season.startedAt + SEASON_DAYS * DIA;
}

/** Cuándo se puede romper el siguiente sello, o `null` si se puede ya. */
export function nextSealAt(season: Season): number | null {
  const ultimo = season.seals[season.seals.length - 1];
  if (!ultimo) return null;
  return ultimo.brokenAt + SEAL_COOLDOWN_HOURS * HORA;
}

/**
 * Si un mago puede romper el siguiente sello **ahora**.
 *
 * Tres cosas, y las tres son del original:
 *  - La temporada tiene que estar abierta.
 *  - **Un mago solo rompe uno.** Por eso hacen falta siete magos
 *    distintos, y por eso esto es una actividad de gremio y no de uno.
 *  - **24 horas desde el anterior.** El reloj entra por parámetro
 *    (docs/SPECS.md §5, invariante 2).
 */
export function canBreakSeal(
  season: Season,
  mageId: string,
  now: number,
): { ok: true; index: number } | { error: SealError } {
  if (season.status !== 'open') {
    return { error: { code: 'temporada_cerrada', message: 'Esta temporada ya terminó.' } };
  }
  if (season.seals.some((s) => s.mageId === mageId)) {
    return {
      error: {
        code: 'ya_rompiste_uno',
        message: 'Solo puedes romper un sello: el resto los tienen que romper otros magos.',
      },
    };
  }
  const desde = nextSealAt(season);
  if (desde !== null && now < desde) {
    const horas = Math.ceil((desde - now) / HORA);
    return {
      error: {
        code: 'demasiado_pronto',
        message: `Falta${horas === 1 ? '' : 'n'} ${horas} hora${horas === 1 ? '' : 's'} para el siguiente sello.`,
      },
    };
  }
  return { ok: true, index: season.seals.length + 1 };
}

/** Si la temporada termina por haberse roto el séptimo sello. */
export function endedBySeals(season: Season): boolean {
  return season.seals.length >= SEALS;
}

/** Si la temporada termina por haber llegado al tope de días. */
export function endedByDeadline(season: Season, now: number): boolean {
  return now >= deadlineOf(season);
}

/**
 * Si la temporada tiene que cerrarse **ahora**, por cualquiera de las dos
 * vías.
 *
 * **Idempotente por construcción**: una ya cerrada devuelve `false`, así que
 * el proceso programado que la llama puede correr mil veces
 * (docs/SPECS.md §3).
 */
export function shouldEnd(season: Season, now: number): boolean {
  if (season.status !== 'open') return false;
  return endedBySeals(season) || endedByDeadline(season, now);
}

/** Por qué acabó, para contarlo. */
export function endReason(season: Season, now: number): 'seals' | 'deadline' | null {
  if (!shouldEnd(season, now)) return null;
  // **Los sellos mandan sobre la fecha**: si se rompió el séptimo, la
  // temporada acabó por decisión de siete magos, no por el reloj — y eso
  // es lo que se cuenta.
  return endedBySeals(season) ? 'seals' : 'deadline';
}

export interface HallEntry {
  mageId: string;
  name: string;
  netPower: number;
  rank: number;
}

/** Cuántos entran en el Hall of Fame. docs/ORIGINAL.md §1. */
export const HALL_OF_FAME_SIZE = 10;

/**
 * Los diez primeros por net power.
 *
 * **Se congela al cerrar**, no se calcula al mirar: el mago deja de jugar
 * y su net power deja de tener sentido, pero el puesto que sacó no cambia.
 */
export function hallOfFame(
  mages: readonly { id: string; name: string; netPower: number }[],
): HallEntry[] {
  return [...mages]
    .sort((a, b) => b.netPower - a.netPower || a.id.localeCompare(b.id))
    .slice(0, HALL_OF_FAME_SIZE)
    .map((m, i) => ({ mageId: m.id, name: m.name, netPower: m.netPower, rank: i + 1 }));
}

/**
 * Los siete que rompieron sello.
 *
 * **En el orden en que los rompieron**, no por poder: el primero se la jugó
 * cuando nadie sabía si habría siete.
 */
export function hallOfImmortals(season: Season): { mageId: string; seal: number }[] {
  return [...season.seals]
    .sort((a, b) => a.index - b.index)
    .map((s) => ({ mageId: s.mageId, seal: s.index }));
}
