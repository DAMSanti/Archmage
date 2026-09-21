import { describe, expect, test } from 'vitest';
import { cadencia, cuentaAtras } from '../src/reloj.js';

/**
 * El criterio 15 de docs/INTERFAZ.md §6.7: **el marco no miente sobre el
 * reloj.**
 *
 * La referencia visual de la que salió §6.9 decía `+1/15m`, y ninguno de
 * nuestros servidores va a quince minutos. Es el fallo exacto que este test
 * existe para impedir: escribir la cadencia en la plantilla en vez de leerla
 * del servidor del mago.
 */

const TERRA = { id: 'terra', turnMinutes: 10, turnCap: 180, protectionTurns: 120 };
const VELOZ = { id: 'veloz', turnMinutes: 5, turnCap: 200, protectionTurns: 60 };

describe('criterio 15 — la cadencia sale del servidor', () => {
  test('el mismo estado dice 10 minutos en Terra y 5 en Veloz', () => {
    expect(cadencia(TERRA)).toBe('+1 cada 10 min');
    expect(cadencia(VELOZ)).toBe('+1 cada 5 min');
  });
});

describe('la cuenta atrás', () => {
  test('menos de un minuto se dice en segundos', () => {
    expect(cuentaAtras(45_000, false)).toBe('45 s');
  });

  test('y a partir de un minuto, en minutos y segundos', () => {
    expect(cuentaAtras(605_000, false)).toBe('10 min 5 s');
  });

  test('«1 minutos» es de robot', () => {
    expect(cuentaAtras(60_000, false)).toBe('1 min');
  });

  test('al tope no hay cuenta atrás: hay un aviso', () => {
    // docs/INTERFAZ.md §3: que el almacén esté lleno **es un aviso**, porque
    // estás desperdiciando. Seguir contando hacia un turno que no va a
    // llegar sería decir lo contrario de lo que pasa.
    expect(cuentaAtras(120_000, true)).toBe('al tope');
  });

  test('cero o negativo no cuenta hacia atrás', () => {
    // El devengo se calcula en el servidor y el cliente solo decora
    // (`msToNextTurn` es decoración, dice el contrato). Un reloj local que
    // se adelante no debe enseñar tiempos negativos.
    expect(cuentaAtras(0, false)).toBe('ya');
    expect(cuentaAtras(-5_000, false)).toBe('ya');
  });
});
