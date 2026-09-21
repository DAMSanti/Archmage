/**
 * El devengo de turnos.
 *
 * **Lo único que hace el reloj en este juego es producir turnos**
 * (docs/ARQUITECTURA.md §4). Todo lo demás avanza al gastarlos. Por eso no
 * hay ningún proceso periódico recorriendo magos: esto es una función del
 * tiempo transcurrido, y se calcula al leer el estado.
 *
 * Fuera de alcance: los items que destruyen turnos del enemigo
 * (docs/ORIGINAL.md §7) son de la fase 4.
 */

import type { ServerConfig, Turns } from './types.js';

export interface AccrualResult {
  turns: Turns;
  /** Turnos que entraron de verdad. */
  gained: number;
  /**
   * Turnos que el reloj produjo y **se perdieron por estar al tope**. Es el
   * número que la interfaz usa para avisar de que estás desperdiciando
   * (docs/INTERFAZ.md §3).
   */
  wastedAtCap: number;
}

/**
 * docs/SPECS.md §3. Función pura: no muta lo que recibe.
 *
 * El detalle que no es obvio está en el tope. Si `lastAccrualAt` avanzara
 * siempre en múltiplos exactos de la cadencia, un mago que lleva tres días al
 * tope guardaría un resto enorme y, al gastar un turno, le entrarían veinte de
 * golpe. Así que **al llegar al tope, `lastAccrualAt` pasa a ser `now`** y el
 * resto se tira — que es justo lo que significa desperdiciar regeneración
 * (docs/SISTEMAS.md §2).
 */
export function accrue(turns: Turns, now: number, server: ServerConfig): AccrualResult {
  const period = server.turnMinutes * 60_000;
  const elapsed = now - turns.lastAccrualAt;

  // El reloj hacia atrás (ajuste de hora, reloj de otra máquina) no regala ni
  // quita nada: se queda como estaba.
  if (elapsed < period) {
    return { turns: { ...turns }, gained: 0, wastedAtCap: 0 };
  }

  const produced = Math.floor(elapsed / period);
  const room = Math.max(0, server.turnCap - turns.current);
  const gained = Math.min(produced, room);
  const wastedAtCap = produced - gained;
  const current = turns.current + gained;

  // Si acabamos en el tope, el resto no se guarda. Si no, se conserva
  // avanzando solo lo devengado.
  const lastAccrualAt =
    current >= server.turnCap ? now : turns.lastAccrualAt + produced * period;

  return { turns: { current, lastAccrualAt }, gained, wastedAtCap };
}

/**
 * Cuánto falta (en ms) para el siguiente turno. Solo para que la interfaz
 * pinte una cuenta atrás — **es decoración**: los turnos que tienes los dice
 * el servidor (docs/INTERFAZ.md §4).
 */
export function msToNextTurn(turns: Turns, now: number, server: ServerConfig): number {
  if (turns.current >= server.turnCap) return 0;
  const period = server.turnMinutes * 60_000;
  const elapsed = Math.max(0, now - turns.lastAccrualAt);
  return period - (elapsed % period);
}
