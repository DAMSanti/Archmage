/**
 * Los tokens de color y tipografía.
 *
 * docs/INTERFAZ.md §6.2, §6.3 y §6.4. **Ningún componente escribe un color a
 * mano**: si un color no está aquí, no existe.
 *
 * Los contrastes están **calculados**, no elegidos a ojo: `tokens.test.ts`
 * comprueba los criterios 1, 2 y 3 de §6.7 sin abrir el navegador.
 *
 * Fuera de alcance: el tema claro (docs/INTERFAZ.md §6.8). La forma de este
 * fichero deja la puerta abierta; no se promete.
 */

/** Paleta de la interfaz. docs/INTERFAZ.md §6.2. */
export const UI = {
  fondo: '#14100c',
  panel: '#1e1813',
  panelAlto: '#2a211a',
  marco: '#6b5537',
  marcoLuz: '#8a6f47',
  texto: '#ece0cb',
  textoTenue: '#a8987e',
  textoApagado: '#7a6d59',
  acento: '#d4a638',
  positivo: '#7fa66b',
  negativo: '#d4605e',
  aviso: '#d08b3c',
} as const;

/**
 * Los cinco colores de escuela. docs/INTERFAZ.md §6.3.
 *
 * **No pintan la interfaz.** Solo aparecen donde se habla de una escuela:
 * iconos de hechizo y de unidad, filtros del libro, la ficha del mago. Nunca
 * como color de una barra de recursos, de un botón o de un estado.
 *
 * Nether se separa de su color nominal porque **el negro sobre fondo oscuro
 * no se ve**: su token es violeta ceniza, y la identidad de «negro» la llevan
 * la forma del icono y un reborde claro.
 */
export const ESCUELA = {
  ascendant: '#f2ead8',
  verdant: '#4e9e4a',
  eradication: '#d1442c',
  phantasm: '#3f7fc4',
  nether: '#8574a0',
  plain: UI.textoTenue,
} as const;

/** docs/INTERFAZ.md §6.4. */
export const TIPO = {
  /** Solo títulos cortos y nombres propios. Nunca datos. */
  display: "'Cinzel', 'Times New Roman', serif",
  /** Datos y prosa. */
  texto: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  base: 16,
  /** Mínimo absoluto para cualquier dato. Nada de 12px «porque cabe más». */
  minimoDato: 14,
} as const;

/**
 * Formatea un número grande.
 *
 * docs/INTERFAZ.md §4: separador de miles **siempre**. No se abrevia aquí
 * a propósito: abreviar solo vale donde no quepa, y nunca en un campo donde
 * el jugador tenga que comparar dos cifras.
 */
export function num(n: number): string {
  // `useGrouping: 'always'` a propósito. El español no separa los miles en
  // números de cuatro cifras, así que por defecto saldría «almacén 20.000»
  // junto a «5200» en el mismo panel — y esta interfaz es sobre todo
  // columnas de cifras que hay que comparar de un vistazo. La spec dice
  // «separador de miles siempre» y gana la spec.
  return n.toLocaleString('es-ES', { useGrouping: 'always' });
}

/** Porcentaje con un decimal, como lo pide §4: siempre junto al absoluto. */
export function pct(parte: number, total: number): string {
  if (total <= 0) return '0,0 %';
  return `${((100 * parte) / total).toLocaleString('es-ES', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} %`;
}

/**
 * Un número con signo, para ingresos netos.
 *
 * docs/INTERFAZ.md §4: **el color no es la única señal**. Aquí va el signo; el
 * color lo pone el componente. Por dos motivos: hay daltónicos jugando, y en
 * este juego rojo y verde ya significan Eradication y Verdant.
 */
export function conSigno(n: number): string {
  return n > 0 ? `+${num(n)}` : num(n);
}

export const CSS_VARS = `
:root {
  --fondo: ${UI.fondo};
  --panel: ${UI.panel};
  --panel-alto: ${UI.panelAlto};
  --marco: ${UI.marco};
  --marco-luz: ${UI.marcoLuz};
  --texto: ${UI.texto};
  --texto-tenue: ${UI.textoTenue};
  --texto-apagado: ${UI.textoApagado};
  --acento: ${UI.acento};
  --positivo: ${UI.positivo};
  --negativo: ${UI.negativo};
  --aviso: ${UI.aviso};
  --escuela-ascendant: ${ESCUELA.ascendant};
  --escuela-verdant: ${ESCUELA.verdant};
  --escuela-eradication: ${ESCUELA.eradication};
  --escuela-phantasm: ${ESCUELA.phantasm};
  --escuela-nether: ${ESCUELA.nether};
}
`;
