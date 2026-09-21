/**
 * El mercado negro: las reglas de la subasta, puras.
 *
 * **Todos los números están publicados** ([docs/ORIGINAL.md §7.1](../../../docs/ORIGINAL.md),
 * confianza alta): pujar cuesta **un turno**, la puja mínima siguiente es
 * **+5%**, hay **30 minutos** para superar una puja, un lote está a la venta
 * **al menos 2,5 horas**, y **no se puede cancelar**.
 *
 * **Que pujar cueste un turno es la pieza que lo ata todo.** Convierte el
 * mercado en una decisión del mismo tipo que explorar o lanzar un hechizo, y
 * no en una ventana aparte donde el dinero no compite con nada. Es coherente
 * con docs/SISTEMAS.md §2: el turno es la moneda.
 *
 * **El reloj entra por parámetro, siempre.** Un lote «está cerrado» es una
 * función de `(lote, now)`, nunca de `Date.now()` (docs/SPECS.md §5,
 * invariante 2) — y por eso los tests del mercado no dependen del día que se
 * ejecuten. El tiempo real **solo cierra plazos; no produce nada** (§5,
 * invariante 15).
 *
 * Fuera de alcance aquí:
 *  - **Guardar nada.** Bloquear la fila del lote y mover el geld es del
 *    servidor (invariante 14); aquí solo se decide.
 *  - **De dónde sale lo que se vende.** El mercado se llena con lo que
 *    ponen los jugadores, y en la fase 4 nadie pone lotes de la nada
 *    (docs/SISTEMAS.md §12.1).
 */

/** Minutos para superar una puja. docs/ORIGINAL.md §7.1. */
export const OUTBID_MINUTES = 30;
/** Lo que un lote está a la venta como mínimo, en horas. */
export const MIN_LISTING_HOURS = 2.5;
/** Lo que hay que subir sobre la puja anterior: **+5%**. */
export const MIN_BID_INCREMENT = 0.05;
/** Lo que cuesta pujar: **un turno**. */
export const TURNS_PER_BID = 1;

const MINUTO = 60_000;

/** Las cuatro secciones que entran. docs/SISTEMAS.md §12.1. */
export const MARKET_SECTIONS = ['antique', 'tavern', 'mageware', 'hatchery'] as const;
export type MarketSection = (typeof MARKET_SECTIONS)[number];

/** Lo que se vende en un lote. */
export type LotContent =
  | { kind: 'item'; itemId: string; count: number }
  | { kind: 'hero'; level: number }
  | { kind: 'spell'; spellId: string }
  | { kind: 'units'; unitId: string; count: number };

export interface Lot {
  id: number;
  sellerId: string;
  section: MarketSection;
  content: LotContent;
  /** Puja de salida. */
  minBid: number;
  /** Puja actual, o `null` si nadie ha pujado. */
  currentBid: number | null;
  currentBidderId: string | null;
  /** Cuándo se puso a la venta. */
  listedAt: number;
  /** Cuándo fue la última puja, o `null`. */
  lastBidAt: number | null;
  status: 'open' | 'sold' | 'expired';
}

export type BidError =
  | { code: 'lote_cerrado'; message: string }
  | { code: 'puja_baja'; message: string }
  | { code: 'sin_turnos'; message: string }
  | { code: 'sin_geld'; message: string }
  | { code: 'es_tuyo'; message: string };

/**
 * La puja mínima que aceptaría este lote ahora mismo.
 *
 * Sin pujas, la de salida. Con pujas, **un 5% por encima de la actual**, y
 * se **redondea hacia arriba**: si redondeara hacia abajo, una puja de 100
 * aceptaría 104 y el incremento publicado dejaría de cumplirse.
 */
export function minimumBid(lot: Lot): number {
  if (lot.currentBid === null) return lot.minBid;
  return Math.ceil(lot.currentBid * (1 + MIN_BID_INCREMENT));
}

/**
 * Cuándo se cierra un lote.
 *
 * Dos plazos, y manda **el más tardío**: el lote está a la venta al menos
 * 2,5 horas, y además se adjudica 30 minutos después de la última puja. Sin
 * el primero, pujar en el minuto uno cerraría la subasta en media hora y
 * nadie más la vería.
 */
export function closesAt(lot: Lot): number {
  const porListado = lot.listedAt + MIN_LISTING_HOURS * 60 * MINUTO;
  const porPuja = lot.lastBidAt === null ? 0 : lot.lastBidAt + OUTBID_MINUTES * MINUTO;
  return Math.max(porListado, porPuja);
}

/** Si el plazo del lote ya venció. */
export function isClosed(lot: Lot, now: number): boolean {
  return lot.status !== 'open' || now >= closesAt(lot);
}

export interface BidCheck {
  /** Geld que se le cobra al que puja. */
  charge: number;
  /** Geld que se le devuelve al que fue superado, y a quién. */
  refund: { to: string; amount: number } | null;
  turns: number;
}

/**
 * Comprueba una puja. **No la aplica**: eso es del servidor.
 *
 * **El geld se cobra al pujar, no al ganar**, y al ser superado vuelve
 * entero. Es lo que hace que una puja sea un compromiso y no una intención,
 * y es la razón de que no se pueda cancelar.
 */
export function checkBid(
  lot: Lot,
  bidderId: string,
  amount: number,
  bidderGeld: number,
  bidderTurns: number,
  now: number,
): BidCheck | { error: BidError } {
  if (isClosed(lot, now)) {
    return { error: { code: 'lote_cerrado', message: 'Ese lote ya está cerrado.' } };
  }
  if (lot.sellerId === bidderId) {
    return { error: { code: 'es_tuyo', message: 'No puedes pujar por tu propio lote.' } };
  }
  const minimo = minimumBid(lot);
  if (amount < minimo) {
    return {
      error: {
        code: 'puja_baja',
        message: `La puja mínima es ${minimo}: hay que subir un 5% sobre la anterior.`,
      },
    };
  }
  if (bidderTurns < TURNS_PER_BID) {
    return { error: { code: 'sin_turnos', message: 'Pujar cuesta un turno.' } };
  }
  if (bidderGeld < amount) {
    return { error: { code: 'sin_geld', message: 'No tienes ese geld.' } };
  }
  return {
    charge: amount,
    // **Al superado se le devuelve todo**, no la diferencia: nunca pierde
    // nada por haber pujado y perdido.
    refund:
      lot.currentBidderId !== null && lot.currentBid !== null
        ? { to: lot.currentBidderId, amount: lot.currentBid }
        : null,
    turns: TURNS_PER_BID,
  };
}

export interface Settlement {
  /** Quién se lleva el contenido, o `null` si nadie pujó. */
  winnerId: string | null;
  /** Geld que cobra el vendedor. */
  sellerGets: number;
  status: 'sold' | 'expired';
}

/**
 * Adjudica un lote vencido.
 *
 * **Idempotente por construcción**: solo mira lotes abiertos y vencidos, así
 * que correrla mil veces adjudica una. Es lo que la hace apta para un
 * proceso programado (docs/SPECS.md §3).
 */
export function settle(lot: Lot, now: number): Settlement | null {
  if (lot.status !== 'open') return null;
  if (now < closesAt(lot)) return null;
  if (lot.currentBidderId === null || lot.currentBid === null) {
    // Nadie pujó: vuelve al vendedor y nadie paga nada.
    return { winnerId: null, sellerGets: 0, status: 'expired' };
  }
  return { winnerId: lot.currentBidderId, sellerGets: lot.currentBid, status: 'sold' };
}
