import { describe, expect, test } from 'vitest';
import {
  MIN_BID_INCREMENT,
  MIN_LISTING_HOURS,
  OUTBID_MINUTES,
  TURNS_PER_BID,
  checkBid,
  closesAt,
  isClosed,
  minimumBid,
  settle,
} from '../src/market.js';
import type { Lot } from '../src/market.js';

/**
 * El mercado negro. docs/SISTEMAS.md §12.1, criterios 3, 4 y 6.
 *
 * **El reloj entra por parámetro.** Un lote «está cerrado» es función de
 * `(lote, now)`, nunca de `Date.now()` — y por eso estos tests no dependen
 * del día que se ejecuten (docs/SPECS.md §5, invariante 2).
 */
const T0 = 1_700_000_000_000;
const MIN = 60_000;

const lote = (over: Partial<Lot> = {}): Lot => ({
  id: 1,
  sellerId: 'vendedor',
  section: 'antique',
  content: { kind: 'item', itemId: 'sage_stone', count: 1 },
  minBid: 1_000,
  currentBid: null,
  currentBidderId: null,
  listedAt: T0,
  lastBidAt: null,
  status: 'open',
  ...over,
});

describe('criterio 3 — pujar cuesta un turno y el geld se cobra al pujar', () => {
  test('cuesta exactamente un turno', () => {
    expect(TURNS_PER_BID).toBe(1);
    const r = checkBid(lote(), 'ana', 1_000, 100_000, 5, T0);
    expect(r).toMatchObject({ turns: 1, charge: 1_000 });
  });

  test('sin turnos no se puja, por mucho geld que haya', () => {
    // **Es lo que ata el mercado al resto del juego**: pujar compite con
    // explorar y con lanzar, no es una ventana aparte.
    expect(checkBid(lote(), 'ana', 1_000, 999_999_999, 0, T0)).toMatchObject({
      error: { code: 'sin_turnos' },
    });
  });

  test('sin geld tampoco', () => {
    expect(checkBid(lote(), 'ana', 1_000, 999, 5, T0)).toMatchObject({
      error: { code: 'sin_geld' },
    });
  });

  test('al superado se le devuelve TODO, no la diferencia', () => {
    // Nunca pierde nada por haber pujado y perdido.
    const l = lote({ currentBid: 1_000, currentBidderId: 'bruno', lastBidAt: T0 });
    const r = checkBid(l, 'ana', 1_050, 100_000, 5, T0 + MIN);
    expect(r).toMatchObject({ refund: { to: 'bruno', amount: 1_000 } });
  });

  test('sin puja previa no hay a quién devolver', () => {
    expect(checkBid(lote(), 'ana', 1_000, 100_000, 5, T0)).toMatchObject({ refund: null });
  });

  test('no se puja por lo propio', () => {
    expect(checkBid(lote(), 'vendedor', 5_000, 100_000, 5, T0)).toMatchObject({
      error: { code: 'es_tuyo' },
    });
  });
});

describe('criterio 4 — la puja mínima es +5%', () => {
  test('sin pujas, la de salida', () => {
    expect(MIN_BID_INCREMENT).toBe(0.05);
    expect(minimumBid(lote())).toBe(1_000);
  });

  test('con pujas, un 5% por encima', () => {
    expect(minimumBid(lote({ currentBid: 1_000, currentBidderId: 'b' }))).toBe(1_050);
  });

  test('redondea HACIA ARRIBA', () => {
    // Hacia abajo, una puja de 101 aceptaría 106 y el +5% publicado dejaría
    // de cumplirse.
    expect(minimumBid(lote({ currentBid: 101, currentBidderId: 'b' }))).toBe(107);
  });

  test('una puja que no llega es error de dominio', () => {
    const l = lote({ currentBid: 1_000, currentBidderId: 'b', lastBidAt: T0 });
    expect(checkBid(l, 'ana', 1_049, 100_000, 5, T0)).toMatchObject({
      error: { code: 'puja_baja' },
    });
    expect(checkBid(l, 'ana', 1_050, 100_000, 5, T0)).not.toHaveProperty('error');
  });
});

describe('cuándo se cierra un lote', () => {
  test('está a la venta al menos 2,5 horas', () => {
    expect(MIN_LISTING_HOURS).toBe(2.5);
    expect(closesAt(lote())).toBe(T0 + 150 * MIN);
  });

  test('y 30 minutos después de la última puja', () => {
    expect(OUTBID_MINUTES).toBe(30);
    // Una puja en la hora 3 empuja el cierre a la 3,5.
    const l = lote({ currentBid: 1_000, currentBidderId: 'b', lastBidAt: T0 + 180 * MIN });
    expect(closesAt(l)).toBe(T0 + 210 * MIN);
  });

  test('manda el MÁS TARDÍO de los dos plazos', () => {
    // Sin el mínimo de 2,5 horas, pujar en el minuto uno cerraría la
    // subasta en media hora y nadie más la vería.
    const l = lote({ currentBid: 1_000, currentBidderId: 'b', lastBidAt: T0 + 1 * MIN });
    expect(closesAt(l)).toBe(T0 + 150 * MIN);
  });

  test('un lote vencido no acepta pujas', () => {
    expect(isClosed(lote(), T0 + 151 * MIN)).toBe(true);
    expect(checkBid(lote(), 'ana', 5_000, 100_000, 5, T0 + 151 * MIN)).toMatchObject({
      error: { code: 'lote_cerrado' },
    });
  });

  test('uno ya vendido tampoco', () => {
    expect(isClosed(lote({ status: 'sold' }), T0)).toBe(true);
  });
});

describe('criterio 6 — la adjudicación', () => {
  test('no adjudica antes de tiempo', () => {
    const l = lote({ currentBid: 5_000, currentBidderId: 'ana', lastBidAt: T0 });
    expect(settle(l, T0 + 149 * MIN)).toBeNull();
  });

  test('adjudica al que pujó, y el vendedor cobra', () => {
    const l = lote({ currentBid: 5_000, currentBidderId: 'ana', lastBidAt: T0 });
    expect(settle(l, T0 + 151 * MIN)).toEqual({
      winnerId: 'ana',
      sellerGets: 5_000,
      status: 'sold',
    });
  });

  test('sin pujas, vuelve al vendedor y nadie paga', () => {
    expect(settle(lote(), T0 + 151 * MIN)).toEqual({
      winnerId: null,
      sellerGets: 0,
      status: 'expired',
    });
  });

  test('ES IDEMPOTENTE: un lote ya cerrado no se adjudica dos veces', () => {
    // Lo que la hace apta para un proceso programado (docs/SPECS.md §3).
    const l = lote({ status: 'sold', currentBid: 5_000, currentBidderId: 'ana' });
    expect(settle(l, T0 + 999 * MIN)).toBeNull();
  });
});
