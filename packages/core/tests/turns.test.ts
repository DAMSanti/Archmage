import { describe, expect, test } from 'vitest';
import { accrue } from '../src/index.js';
import { TERRA } from './fixtures.js';

const MIN = 60_000;

describe('devengo de turnos', () => {
  test('sin tiempo transcurrido no se devenga nada', () => {
    const r = accrue({ current: 10, lastAccrualAt: 1_000 }, 1_000, TERRA);
    expect(r.turns.current).toBe(10);
    expect(r.gained).toBe(0);
  });

  test('un turno cada 10 minutos', () => {
    const r = accrue({ current: 0, lastAccrualAt: 0 }, 30 * MIN, TERRA);
    expect(r.gained).toBe(3);
    expect(r.turns.current).toBe(3);
  });

  test('el resto no se pierde: 25 minutos dan 2 turnos y guardan 5 minutos', () => {
    const r = accrue({ current: 0, lastAccrualAt: 0 }, 25 * MIN, TERRA);
    expect(r.gained).toBe(2);
    // lastAccrualAt avanza solo lo devengado, no hasta `now`.
    expect(r.turns.lastAccrualAt).toBe(20 * MIN);
  });

  test('el devengo se topa, y dice cuánto se desperdició', () => {
    const r = accrue({ current: 175, lastAccrualAt: 0 }, 100 * 10 * MIN, TERRA);
    expect(r.turns.current).toBe(TERRA.turnCap);
    expect(r.gained).toBe(5);
    expect(r.wastedAtCap).toBe(95);
  });

  test('AL TOPE, lastAccrualAt salta a ahora — si no, se acumula un resto enorme', () => {
    // docs/ARQUITECTURA.md §9.4, detalle con trampa 1.
    // Un mago tres días al tope: si el resto se guardara, al gastar un turno
    // le entrarían decenas de golpe.
    const tresDias = 3 * 24 * 60 * MIN;
    const r = accrue({ current: 180, lastAccrualAt: 0 }, tresDias, TERRA);
    expect(r.turns.current).toBe(180);
    expect(r.turns.lastAccrualAt).toBe(tresDias);

    // Y ahora gasta uno: solo debería recuperar lo que marque el reloj.
    const gastado = { current: 179, lastAccrualAt: r.turns.lastAccrualAt };
    const r2 = accrue(gastado, tresDias + 10 * MIN, TERRA);
    expect(r2.gained).toBe(1);
    expect(r2.turns.current).toBe(180);
  });

  test('el reloj hacia atrás no regala ni quita turnos', () => {
    const r = accrue({ current: 50, lastAccrualAt: 10 * MIN }, 5 * MIN, TERRA);
    expect(r.gained).toBe(0);
    expect(r.turns.current).toBe(50);
    expect(r.turns.lastAccrualAt).toBe(10 * MIN);
  });

  test('empezar por encima del tope no sube más', () => {
    const r = accrue({ current: 200, lastAccrualAt: 0 }, 60 * MIN, TERRA);
    expect(r.turns.current).toBe(200);
    expect(r.gained).toBe(0);
  });

  test('es una función pura: no toca el estado que recibe', () => {
    const original = { current: 5, lastAccrualAt: 0 };
    accrue(original, 60 * MIN, TERRA);
    expect(original).toEqual({ current: 5, lastAccrualAt: 0 });
  });
});
