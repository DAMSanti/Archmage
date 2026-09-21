/**
 * El reloj del marco: cada cuánto entra un turno, y cuánto falta.
 *
 * docs/INTERFAZ.md §6.9. **El turno es la moneda del juego**
 * (docs/SISTEMAS.md §2), así que el marco lo enseña siempre y no comparte
 * fila con nada.
 *
 * **La cadencia se LEE DEL SERVIDOR, no se escribe aquí.** La referencia
 * visual de la que salió §6.9 decía `+1/15m` y ninguno de nuestros servidores
 * va a quince minutos: Terra va a **10** y Veloz a **5**
 * (docs/SISTEMAS.md §2 y §14.1). Una constante en la plantilla habría
 * funcionado en un servidor y mentido en el otro sin dar ningún error.
 *
 * Fuera de alcance aquí:
 *  - **Devengar.** Esto decora. Los turnos los cuenta el servidor y son suyos
 *    (docs/SPECS.md §5, invariante 5); `msToNextTurn` viene marcado como
 *    decoración en el propio contrato.
 *  - **Avisar de nada más que el tope.** El aviso de colapso es de la
 *    pantalla del reino, no del reloj.
 */

/**
 * Lo único que hace falta del servidor.
 *
 * **Estructural a propósito**: `packages/contract` no exporta un tipo para
 * `serverConfigSchema`, y esta spec no toca el contrato. Pedir solo el campo
 * que se usa es además lo que deja el test sin tener que construir un
 * servidor entero.
 */
interface ConCadencia {
  turnMinutes: number;
}

/** «+1 cada 10 min». El número sale del servidor del mago. */
export function cadencia(server: ConCadencia): string {
  return `+1 cada ${server.turnMinutes} min`;
}

/**
 * Cuánto falta para el turno siguiente.
 *
 * **Al tope no cuenta: avisa.** Que el almacén esté lleno es un aviso, porque
 * estás desperdiciando (docs/INTERFAZ.md §3) — seguir contando hacia un turno
 * que no va a llegar diría lo contrario de lo que pasa.
 */
export function cuentaAtras(ms: number, alTope: boolean): string {
  if (alTope) return 'al tope';
  if (ms <= 0) return 'ya';

  const total = Math.ceil(ms / 1_000);
  const minutos = Math.floor(total / 60);
  const segundos = total % 60;

  if (minutos === 0) return `${segundos} s`;
  // «1 min 0 s» es de robot igual que «1 minutos».
  if (segundos === 0) return `${minutos} min`;
  return `${minutos} min ${segundos} s`;
}
