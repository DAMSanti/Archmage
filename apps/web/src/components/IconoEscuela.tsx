/**
 * El icono de una escuela.
 *
 * docs/ASSETS.md §3. **Solo aparece donde se habla de una escuela**
 * (docs/INTERFAZ.md §6.3): la ficha del mago, los filtros del libro, la
 * clasificación. Nunca como color de una barra, de un botón o de un estado —
 * es lo que deja libres el rojo y el verde para decir «vas mal» y «vas bien».
 *
 * **Y si no hay icono, no pasa nada.** De las seis escuelas hay dos generadas
 * (tanda 0 del 2026-09-22); las otras cuatro caen a un hueco vacío y el
 * nombre de la escuela, que va al lado, sigue diciendo cuál es. Es la regla 3
 * de docs/INTERFAZ.md §6.5 — la interfaz funciona entera sin ninguna imagen— y
 * aquí es el estado normal, no una degradación.
 *
 * Fuera de alcance:
 *  - **Decir nada con el icono que no diga el texto.** Va `aria-hidden`: el
 *    nombre de la escuela está siempre al lado, y un lector de pantalla no
 *    tiene por qué oírlo dos veces.
 */

/** Las que existen hoy. Las demás se añaden cuando se generen. */
const GENERADAS = new Set(['verdant', 'nether']);

export function IconoEscuela({ escuela, tam = 24 }: { escuela: string; tam?: number }) {
  // **El hueco se reserva aunque no haya icono.** Sin esto, en una lista
  // de seis escuelas las dos generadas salen indentadas y las cuatro que
  // faltan a ras, y la lista parece rota — lo enseñó la pasada de
  // navegador del portal. Reservar el sitio hace que ir añadiendo iconos
  // no mueva nada de lo que ya estaba.
  return (
    <span className="icono-escuela" style={{ width: tam, height: tam }} aria-hidden="true">
      {GENERADAS.has(escuela) && (
        <img src={`/escuelas/${escuela}.webp`} width={tam} height={tam} alt="" loading="lazy" />
      )}
    </span>
  );
}
