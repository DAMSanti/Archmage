import { describe, expect, test } from 'vitest';
import {
  RANKS,
  canResearch,
  castCost,
  relationTo,
  spellLevelGain,
  spellLevelOf,
  type SpellRank,
} from '../src/index.js';

/**
 * Criterios 1, 2 y 4 de docs/SISTEMAS.md §7.1.
 * La rueda, los multiplicadores y la escala son [orig]:
 * docs/ORIGINAL.md §5, §6.1 y §6.2, confianza alta.
 */
describe('criterio 1 — la rueda decide qué se investiga', () => {
  test('Verdant tiene a Ascendant y Eradication como adyacentes', () => {
    expect(relationTo('verdant', 'verdant')).toBe('own');
    expect(relationTo('verdant', 'ascendant')).toBe('adjacent');
    expect(relationTo('verdant', 'eradication')).toBe('adjacent');
    expect(relationTo('verdant', 'nether')).toBe('opposite');
    expect(relationTo('verdant', 'phantasm')).toBe('opposite');
  });

  test('la rueda es simétrica: si A es adyacente a B, B lo es a A', () => {
    const colores = ['ascendant', 'verdant', 'eradication', 'nether', 'phantasm'] as const;
    for (const a of colores) {
      for (const b of colores) {
        expect(relationTo(a, b), `${a} vs ${b}`).toBe(relationTo(b, a));
      }
    }
  });

  test('cada color tiene exactamente dos adyacentes y dos opuestas', () => {
    const colores = ['ascendant', 'verdant', 'eradication', 'nether', 'phantasm'] as const;
    for (const a of colores) {
      const otras = colores.filter((c) => c !== a);
      expect(otras.filter((b) => relationTo(a, b) === 'adjacent')).toHaveLength(2);
      expect(otras.filter((b) => relationTo(a, b) === 'opposite')).toHaveLength(2);
    }
  });

  test('un Verdant investiga Complex de su color y de las adyacentes, no de las opuestas', () => {
    // El criterio 1 de §7.1, literal.
    expect(canResearch('verdant', 'verdant', 'complex')).toBe(true);
    expect(canResearch('verdant', 'ascendant', 'complex')).toBe(true);
    expect(canResearch('verdant', 'eradication', 'complex')).toBe(true);
    expect(canResearch('verdant', 'nether', 'complex')).toBe(false);
    expect(canResearch('verdant', 'phantasm', 'complex')).toBe(false);
  });

  test('de las opuestas solo Simple y Average', () => {
    expect(canResearch('verdant', 'nether', 'simple')).toBe(true);
    expect(canResearch('verdant', 'nether', 'average')).toBe(true);
    expect(canResearch('verdant', 'nether', 'complex')).toBe(false);
    expect(canResearch('verdant', 'nether', 'ultimate')).toBe(false);
  });

  test('Ultimate solo en tu propio color', () => {
    expect(canResearch('verdant', 'verdant', 'ultimate')).toBe(true);
    expect(canResearch('verdant', 'ascendant', 'ultimate')).toBe(false);
  });

  test('Ancient no se investiga: se compra en el mercado negro', () => {
    // docs/ORIGINAL.md §6 [orig]. Fase 4.
    for (const esc of ['verdant', 'ascendant', 'nether'] as const) {
      expect(canResearch('verdant', esc, 'ancient')).toBe(false);
    }
  });

  test('Plain lo aprende todo el mundo, en su propio color', () => {
    // docs/SISTEMAS.md §6: neutra y accesible a todos.
    for (const mago of ['verdant', 'nether', 'phantasm', 'plain'] as const) {
      expect(relationTo(mago, 'plain')).toBe('own');
      expect(canResearch(mago, 'plain', 'complex')).toBe(true);
    }
  });

  test('un mago Plain no tiene escuela propia: todo lo demás le es opuesto', () => {
    expect(relationTo('plain', 'verdant')).toBe('opposite');
    expect(canResearch('plain', 'verdant', 'complex')).toBe(false);
    expect(canResearch('plain', 'verdant', 'average')).toBe(true);
  });
});

describe('criterio 2 — el coste fuera de color', () => {
  test('en tu color siempre cuesta el precio base', () => {
    for (const r of RANKS) {
      expect(castCost(10_000, r, 'own')).toBe(10_000);
    }
  });

  test('un Complex opuesto cuesta exactamente 6×', () => {
    // El criterio 2 de §7.1, literal.
    expect(castCost(30_000, 'complex', 'opposite')).toBe(180_000);
    expect(castCost(30_000, 'complex', 'adjacent')).toBe(60_000);
  });

  test('la tabla entera de docs/ORIGINAL.md §6.1', () => {
    const esperado: Record<SpellRank, [number, number]> = {
      simple: [1.25, 2],
      average: [1.5, 3.5],
      complex: [2, 6],
      ultimate: [0, 0], // no se puede lanzar fuera de color
      ancient: [1.25, 2],
    };
    for (const [rango, [adj, opp]] of Object.entries(esperado) as [SpellRank, [number, number]][]) {
      if (rango === 'ultimate') continue;
      expect(castCost(1_000, rango, 'adjacent'), rango).toBe(1_000 * adj);
      expect(castCost(1_000, rango, 'opposite'), rango).toBe(1_000 * opp);
    }
  });

  test('un Ultimate fuera de color no se puede lanzar', () => {
    expect(castCost(120_000, 'ultimate', 'adjacent')).toBeNull();
    expect(castCost(120_000, 'ultimate', 'opposite')).toBeNull();
    expect(castCost(120_000, 'ultimate', 'own')).toBe(120_000);
  });

  test('el coste sale entero aunque el multiplicador tenga decimales', () => {
    // 1,25 × 3.001 = 3.751,25 → se trunca una sola vez.
    expect(castCost(3_001, 'simple', 'adjacent')).toBe(3_751);
    expect(Number.isInteger(castCost(7_901, 'average', 'adjacent'))).toBe(true);
  });
});

describe('criterio 4 — el nivel de hechizo', () => {
  test('cada rango suma lo que dice la tabla', () => {
    // docs/ORIGINAL.md §6.2, confianza alta.
    expect(spellLevelGain('simple')).toBe(1);
    expect(spellLevelGain('average')).toBe(3);
    expect(spellLevelGain('complex')).toBe(7);
    expect(spellLevelGain('ultimate')).toBe(20);
    expect(spellLevelGain('ancient')).toBe(15);
  });

  test('el nivel es la suma de lo aprendido, y es reproducible', () => {
    const aprendidos: SpellRank[] = ['simple', 'simple', 'average', 'complex', 'ultimate'];
    expect(spellLevelOf(aprendidos)).toBe(1 + 1 + 3 + 7 + 20);
  });

  test('sin hechizos, nivel cero', () => {
    expect(spellLevelOf([])).toBe(0);
  });
});
