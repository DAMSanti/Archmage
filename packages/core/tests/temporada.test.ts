import { describe, expect, test } from 'vitest';
import {
  HALL_OF_FAME_SIZE,
  SEAL_COOLDOWN_HOURS,
  SEALS,
  SEASON_DAYS,
  canBreakSeal,
  deadlineOf,
  endReason,
  endedByDeadline,
  endedBySeals,
  hallOfFame,
  hallOfImmortals,
  nextSealAt,
  shouldEnd,
} from '../src/season.js';
import type { Season } from '../src/season.js';

/** La temporada y los siete sellos. docs/SISTEMAS.md §14.1, criterios 14-19. */
const T0 = 1_700_000_000_000;
const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

const temporada = (over: Partial<Season> = {}): Season => ({
  id: 's1',
  serverId: 'terra',
  startedAt: T0,
  seals: [],
  status: 'open',
  endedAt: null,
  ...over,
});

const sellos = (n: number, cada = 24 * HORA) =>
  Array.from({ length: n }, (_, i) => ({
    index: i + 1,
    mageId: `mago${i + 1}`,
    brokenAt: T0 + i * cada,
  }));

describe('criterio 14 — hacen falta siete magos DISTINTOS', () => {
  test('son siete sellos', () => {
    expect(SEALS).toBe(7);
  });

  test('el primero lo rompe cualquiera', () => {
    expect(canBreakSeal(temporada(), 'ana', T0)).toEqual({ ok: true, index: 1 });
  });

  test('EL MISMO MAGO NO ROMPE DOS', () => {
    // Por eso es una actividad de gremio y no de uno: el final de la
    // temporada lo deciden siete personas, no una.
    const t = temporada({ seals: sellos(1) });
    expect(canBreakSeal(t, 'mago1', T0 + 48 * HORA)).toMatchObject({
      error: { code: 'ya_rompiste_uno' },
    });
  });

  test('pero otro mago sí', () => {
    const t = temporada({ seals: sellos(1) });
    expect(canBreakSeal(t, 'ana', T0 + 25 * HORA)).toEqual({ ok: true, index: 2 });
  });

  test('en una temporada cerrada no se rompe nada', () => {
    expect(canBreakSeal(temporada({ status: 'ended' }), 'ana', T0)).toMatchObject({
      error: { code: 'temporada_cerrada' },
    });
  });
});

describe('criterio 15 — 24 horas entre sellos', () => {
  test('antes de las 24 horas, no', () => {
    expect(SEAL_COOLDOWN_HOURS).toBe(24);
    const t = temporada({ seals: sellos(1) });
    expect(canBreakSeal(t, 'ana', T0 + 23 * HORA)).toMatchObject({
      error: { code: 'demasiado_pronto' },
    });
  });

  test('justo a las 24, sí', () => {
    const t = temporada({ seals: sellos(1) });
    expect(canBreakSeal(t, 'ana', T0 + 24 * HORA)).toEqual({ ok: true, index: 2 });
  });

  test('y el mensaje dice cuánto falta', () => {
    const t = temporada({ seals: sellos(1) });
    const r = canBreakSeal(t, 'ana', T0 + 20 * HORA);
    expect((r as { error: { message: string } }).error.message).toContain('4 horas');
  });

  test('sin sellos, no hay espera', () => {
    expect(nextSealAt(temporada())).toBeNull();
  });

  test('romper los siete lleva al menos seis días', () => {
    // 24 horas entre cada uno: el final no puede improvisarse en una tarde.
    const t = temporada({ seals: sellos(7) });
    const primero = t.seals[0]!.brokenAt;
    const ultimo = t.seals[6]!.brokenAt;
    expect(ultimo - primero).toBeGreaterThanOrEqual(6 * DIA);
  });
});

describe('criterio 17 — la temporada acaba por las dos vías', () => {
  test('por el séptimo sello', () => {
    const t = temporada({ seals: sellos(7) });
    expect(endedBySeals(t)).toBe(true);
    expect(shouldEnd(t, T0 + 7 * DIA)).toBe(true);
    expect(endReason(t, T0 + 7 * DIA)).toBe('seals');
  });

  test('con seis no acaba', () => {
    expect(shouldEnd(temporada({ seals: sellos(6) }), T0 + 6 * DIA)).toBe(false);
  });

  test('y por la fecha tope, a los 90 días', () => {
    expect(SEASON_DAYS).toBe(90);
    const t = temporada();
    expect(deadlineOf(t)).toBe(T0 + 90 * DIA);
    expect(endedByDeadline(t, T0 + 90 * DIA)).toBe(true);
    expect(endReason(t, T0 + 90 * DIA)).toBe('deadline');
  });

  test('a los 89 días, no', () => {
    expect(shouldEnd(temporada(), T0 + 89 * DIA)).toBe(false);
  });

  test('LOS SELLOS MANDAN sobre la fecha', () => {
    // Si se rompió el séptimo, la temporada acabó por decisión de siete
    // magos y no por el reloj — y eso es lo que se cuenta.
    const t = temporada({ seals: sellos(7) });
    expect(endReason(t, T0 + 200 * DIA)).toBe('seals');
  });

  test('ES IDEMPOTENTE: una cerrada no vuelve a cerrarse', () => {
    // Lo que la hace apta para un proceso programado (docs/SPECS.md §3).
    const t = temporada({ seals: sellos(7), status: 'ended' });
    expect(shouldEnd(t, T0 + 200 * DIA)).toBe(false);
    expect(endReason(t, T0 + 200 * DIA)).toBeNull();
  });
});

describe('criterio 19 — los dos Halls', () => {
  const magos = Array.from({ length: 15 }, (_, i) => ({
    id: `m${i}`,
    name: `Mago ${i}`,
    netPower: (i + 1) * 1_000,
  }));

  test('el Hall of Fame son los diez primeros por net power', () => {
    expect(HALL_OF_FAME_SIZE).toBe(10);
    const h = hallOfFame(magos);
    expect(h).toHaveLength(10);
    expect(h[0]!.netPower).toBe(15_000);
    expect(h[0]!.rank).toBe(1);
    expect(h[9]!.netPower).toBe(6_000);
  });

  test('con menos de diez magos, entran los que haya', () => {
    expect(hallOfFame(magos.slice(0, 3))).toHaveLength(3);
    expect(hallOfFame([])).toEqual([]);
  });

  test('el empate se rompe de forma reproducible', () => {
    const empate = [
      { id: 'z', name: 'Z', netPower: 100 },
      { id: 'a', name: 'A', netPower: 100 },
    ];
    expect(hallOfFame(empate)).toEqual(hallOfFame(empate));
    expect(hallOfFame(empate)[0]!.mageId).toBe('a');
  });

  test('el Hall of Immortals va EN ORDEN DE SELLO, no por poder', () => {
    // El primero se la jugó cuando nadie sabía si habría siete.
    const t = temporada({ seals: sellos(7) });
    const h = hallOfImmortals(t);
    expect(h).toHaveLength(7);
    expect(h[0]).toEqual({ mageId: 'mago1', seal: 1 });
    expect(h[6]).toEqual({ mageId: 'mago7', seal: 7 });
  });

  test('sin sellos no hay inmortales: acabó el reloj, no nadie', () => {
    expect(hallOfImmortals(temporada())).toEqual([]);
  });
});

describe('hay que saber el hechizo', () => {
  test('sin investigar Armageddon no se rompe nada', () => {
    // **Se olvidó al escribir esto la primera vez**, y lo enseñó la pasada
    // de navegador: la pantalla ofrecía el botón a un mago que no lo había
    // investigado. Un test no lo habría visto, porque no había test que
    // preguntara por el libro de hechizos.
    expect(canBreakSeal(temporada(), 'ana', T0, false)).toMatchObject({
      error: { code: 'no_sabes_armageddon' },
    });
  });

  test('y sabiéndolo, sí', () => {
    expect(canBreakSeal(temporada(), 'ana', T0, true)).toEqual({ ok: true, index: 1 });
  });

  test('es lo primero que se comprueba, antes que la temporada cerrada', () => {
    // El mensaje más útil es el que te dice qué te falta a ti, no qué le
    // pasa al mundo.
    const cerrada = temporada({ status: 'ended' });
    expect(canBreakSeal(cerrada, 'ana', T0, false)).toMatchObject({
      error: { code: 'no_sabes_armageddon' },
    });
  });
});
