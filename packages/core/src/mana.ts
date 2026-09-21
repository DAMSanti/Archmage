/**
 * El maná.
 *
 * La fórmula es del juego original y está **publicada**
 * (docs/ORIGINAL.md §3.1, confianza alta). Se copia exacta, con sus saltos:
 * no es una curva suave con un umbral, es una **sierra**.
 *
 * Fuera de alcance aquí: los modificadores por items y encantamientos
 * (*Alchemist* −10%, *Moon's Favour* +10%) son de la fase 2.
 */

/**
 * Maná producido por turno gastado.
 *
 *     X = floor(100·N / L)
 *     Y = X·L/100 + N·(100−X)/10
 *
 * Lo que esta fórmula hace, y es el corazón de la decisión económica:
 *
 *  - Dentro de cada punto porcentual, cada node nuevo **suma**.
 *  - El node que hace subir el porcentaje entero puede **restar**. El salto al
 *    cruzar al k% vale `L·(10−k)/1000 + (101−k)/10`.
 *  - Por eso el óptimo local está siempre en `k−1,99%`, y el global en ~56%.
 *  - **Y muerde según el tamaño**: con 200 acres el primer cruce que resta es
 *    el 41%; con 10.000, el 11%. La dificultad crece con el jugador sola,
 *    sin que ninguna regla lo diga.
 *
 * **El redondeo.** La fórmula no da enteros —con L=200 y N=3 produce 31,7— y
 * los recursos son enteros (docs/SPECS.md §5, invariante 7). Se trunca hacia
 * abajo **aquí y en ningún otro sitio**: nunca da al jugador más de lo que
 * dice la fórmula, y es la operación más fácil de reproducir igual en el
 * servidor y en el cliente, que es lo que ese invariante protege
 * (docs/ARQUITECTURA.md §9.2).
 */
export function manaIncome(nodes: number, land: number): number {
  if (nodes <= 0 || land <= 0) return 0;
  const x = Math.floor((100 * nodes) / land);
  // Se opera en décimas para que el único truncamiento sea el de abajo.
  const tenths = x * land * 10 + nodes * (100 - x) * 100;
  return Math.floor(tenths / 1000);
}

/**
 * El almacén **es el propio edificio**: 1.000 de maná por node, y lo que
 * sobra se pierde (docs/ORIGINAL.md §3, confianza alta). Querer guardar más
 * maná obliga a construir más nodes, lo que a su vez empuja contra la sierra.
 */
export function manaStorage(nodes: number, perNode: number): number {
  return nodes * perNode;
}
