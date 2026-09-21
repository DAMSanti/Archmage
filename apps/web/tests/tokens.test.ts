import { describe, expect, test } from 'vitest';
import { ESCUELA, UI, conSigno, num, pct } from '../src/tokens.js';

/**
 * Los criterios 1, 2 y 3 de docs/INTERFAZ.md §6.7, **calculados sobre los
 * tokens**: no hace falta abrir el navegador para saber si la paleta cumple.
 *
 * Dos de los tokens y uno de los criterios se corrigieron gracias a este
 * cálculo al escribir la spec: el rojo de estado no llegaba a 4,5:1, el
 * violeta de Nether no llegaba a 3:1, y el criterio de «escuelas
 * distinguibles» estaba escrito con razón de contraste, que mide claridad y
 * no tono.
 */
function luminancia(hex: string): number {
  const h = hex.replace('#', '');
  const canal = (i: number): number => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(0) + 0.7152 * canal(2) + 0.0722 * canal(4);
}

function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)];
  const [alto, bajo] = x > y ? [x, y] : [y, x];
  return (alto + 0.05) / (bajo + 0.05);
}

function tono(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let t: number;
  if (max === r) t = ((g - b) / d) % 6;
  else if (max === g) t = (b - r) / d + 2;
  else t = (r - g) / d + 4;
  return ((t * 60) % 360 + 360) % 360;
}

const separacion = (a: string, b: string): number => {
  const d = Math.abs(tono(a) - tono(b));
  return Math.min(d, 360 - d);
};

describe('criterio 1 — contraste sobre --panel', () => {
  const casos: [string, string, number][] = [
    ['texto', UI.texto, 7],
    ['texto-tenue', UI.textoTenue, 4.5],
    ['acento', UI.acento, 4.5],
    ['positivo', UI.positivo, 4.5],
    ['negativo', UI.negativo, 4.5],
    ['aviso', UI.aviso, 4.5],
  ];
  for (const [nombre, color, minimo] of casos) {
    test(`${nombre} llega a ${minimo}:1`, () => {
      expect(contraste(color, UI.panel)).toBeGreaterThanOrEqual(minimo);
    });
  }
});

describe('criterio 2 — Nether se ve', () => {
  test('el negro de Nether no puede ser negro de verdad sobre fondo oscuro', () => {
    expect(contraste(ESCUELA.nether, UI.panel)).toBeGreaterThanOrEqual(3);
  });
});

describe('criterio 3 — las escuelas se distinguen entre sí', () => {
  test('Ascendant se distingue por claridad: es casi blanco', () => {
    expect(contraste(ESCUELA.ascendant, UI.panel)).toBeGreaterThanOrEqual(10);
  });

  test('las cuatro cromáticas están separadas al menos 50° de tono', () => {
    // La razón de contraste NO sirve para esto: dice que Eradication y
    // Phantasm se parecen (1,10:1) siendo rojo y azul.
    const cromaticas = ['verdant', 'eradication', 'phantasm', 'nether'] as const;
    for (let i = 0; i < cromaticas.length; i++) {
      for (let j = i + 1; j < cromaticas.length; j++) {
        const a = cromaticas[i]!;
        const b = cromaticas[j]!;
        expect(separacion(ESCUELA[a], ESCUELA[b]), `${a} vs ${b}`).toBeGreaterThanOrEqual(50);
      }
    }
  });
});

describe('formato de números', () => {
  test('siempre con separador de miles', () => {
    expect(num(1_234_567)).toBe('1.234.567');
  });

  test('el signo va en el texto, no solo en el color', () => {
    expect(conSigno(3_355)).toBe('+3.355');
    expect(conSigno(-461)).toBe('-461');
  });

  test('el porcentaje lleva un decimal', () => {
    expect(pct(2_250, 5_000)).toBe('45,0 %');
    expect(pct(0, 0)).toBe('0,0 %');
  });
});
