import { describe, expect, test } from 'vitest';
import { RANKS, canResearch, isCastable, isEnchantment, spellLevelOf } from '@archmage/core';
import type { SpellRank } from '@archmage/core';
import { SPELLS, SPELLS_BY_ID } from '../src/spells.js';
import { UNITS_BY_ID } from '../src/units.js';

/**
 * El catálogo de Plain y Verdant. Spec en docs/SISTEMAS.md §7.1.
 *
 * Lo que más importa aquí: **que las fichas publicadas salgan clavadas**. Si
 * alguien «redondea» una de ellas, el catálogo deja de poder rastrearse hasta
 * docs/ORIGINAL.md y la fidelidad se pierde en silencio.
 */
describe('las fichas publicadas salen clavadas', () => {
  test('Summon Dryad — Simple, 1 turno, 3.000 de maná, 900 de investigación', () => {
    const s = SPELLS_BY_ID.summon_dryad!;
    expect([s.rank, s.castTurns, s.castMana, s.researchCost]).toEqual(['simple', 1, 3_000, 900]);
  });

  test('Summon Nymph — la ficha completa, cantidad incluida', () => {
    const s = SPELLS_BY_ID.summon_nymph!;
    expect([s.rank, s.castTurns, s.castMana, s.researchCost]).toEqual(['average', 2, 7_900, 1_400]);
    expect(s.effect).toEqual({ kind: 'summon', unitId: 'nymph', min: 1_700, max: 2_400 });
  });

  test('Regeneration — Complex, 30.000 de maná, 3.000 de investigación', () => {
    const s = SPELLS_BY_ID.regeneration!;
    expect([s.rank, s.castMana, s.researchCost]).toEqual(['complex', 30_000, 3_000]);
  });

  test('los costes publicados de los hechizos de batalla se respetan aunque rompan la escala', () => {
    // Web of the Spider Woman cuesta 600, muy por debajo de la escala Simple
    // de 3.000. El original manda.
    expect(SPELLS_BY_ID.web_of_the_spider_woman!.castMana).toBe(600);
    expect(SPELLS_BY_ID.call_hurricane!.castMana).toBe(20_000);
    expect(SPELLS_BY_ID.sunray!.upkeepMana).toBe(100);
  });
});

describe('la forma del catálogo', () => {
  test('todos los ids son únicos', () => {
    const ids = SPELLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('solo hay hechizos de Plain y Verdant', () => {
    for (const s of SPELLS) expect(['plain', 'verdant']).toContain(s.school);
  });

  test('todos los números son enteros y no negativos', () => {
    for (const s of SPELLS) {
      for (const v of [s.castTurns, s.castMana, s.researchCost, s.upkeepMana]) {
        expect(Number.isInteger(v), s.id).toBe(true);
        expect(v, s.id).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('cada hechizo dice de dónde sale su número', () => {
    for (const s of SPELLS) {
      expect(s.source, s.id).toMatch(/\[orig\]|\[nuestro\]/);
    }
  });

  test('solo los encantamientos tienen upkeep', () => {
    for (const s of SPELLS) {
      if (s.upkeepMana > 0) {
        expect(['enchantment', 'combat'], s.id).toContain(s.effect.kind);
      }
    }
  });

  test('toda invocación apunta a una unidad que existe', () => {
    for (const s of SPELLS) {
      if (s.effect.kind === 'summon') {
        expect(UNITS_BY_ID[s.effect.unitId], s.id).toBeDefined();
        expect(s.effect.max).toBeGreaterThan(s.effect.min);
      }
    }
  });

  test('ningún hechizo es Ancient: ésos se compran, no se investigan', () => {
    for (const s of SPELLS) expect(s.rank).not.toBe('ancient');
  });
});

describe('lo que espera a la fase 3', () => {
  test('los hechizos de combate se investigan pero NO se lanzan', () => {
    const combate = SPELLS.filter((s) => s.effect.kind === 'combat');
    expect(combate.length).toBeGreaterThan(0);
    for (const s of combate) {
      expect(isCastable(s), s.id).toBe(false);
      // Pero sí se pueden aprender: están en el libro.
      expect(canResearch('verdant', s.school, s.rank), s.id).toBe(true);
    }
  });

  test('Plant Growth está en el catálogo: es el encantamiento insignia de Verdant', () => {
    const s = SPELLS_BY_ID.plant_growth!;
    expect(s.rank).toBe('ultimate');
    expect(isCastable(s)).toBe(false);
  });

  test('todo lo que no es de combate sí se puede lanzar', () => {
    for (const s of SPELLS) {
      if (s.effect.kind !== 'combat') expect(isCastable(s), s.id).toBe(true);
    }
  });
});

describe('la escala por rango', () => {
  test('el coste crece con el rango, mirando solo las invocaciones', () => {
    // Los hechizos de batalla rompen la escala a propósito (Web of the Spider
    // Woman cuesta 600), así que se comparan solo las invocaciones.
    const porRango = (r: SpellRank) =>
      SPELLS.filter((s) => s.rank === r && s.effect.kind === 'summon').map((s) => s.castMana);
    const media = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(media(porRango('simple'))).toBeLessThan(media(porRango('average')));
    expect(media(porRango('average'))).toBeLessThan(media(porRango('complex')));
    expect(media(porRango('complex'))).toBeLessThan(media(porRango('ultimate')));
  });

  test('invocar más caro trae menos unidades: el coste va con el poder', () => {
    // docs/ORIGINAL.md §6.3: Nymph 1700-2400 por 7.900; Vampire ~295 por 77.700.
    const invocaciones = SPELLS.filter((s) => s.effect.kind === 'summon').map((s) => ({
      mana: s.castMana,
      max: (s.effect as { max: number }).max,
    }));
    const ordenadas = [...invocaciones].sort((a, b) => a.mana - b.mana);
    const barata = ordenadas[0]!;
    const cara = ordenadas[ordenadas.length - 1]!;
    expect(cara.max).toBeLessThan(barata.max);
  });
});

describe('el nivel de hechizo del catálogo', () => {
  test('aprenderlo todo da un nivel concreto y reproducible', () => {
    const nivel = spellLevelOf(SPELLS.map((s) => s.rank));
    // El máximo de NUESTRO catálogo, que es el que escala las invocaciones
    // (docs/SISTEMAS.md §7.1). Muy por debajo del 624 del original, y por eso
    // el nivel de referencia tiene que ser éste.
    expect(nivel).toBe(207);
    expect(nivel).toBeLessThan(624);
  });

  test('hay hechizos de los cuatro rangos investigables', () => {
    for (const r of RANKS) {
      if (r === 'ancient') continue;
      expect(SPELLS.some((s) => s.rank === r), r).toBe(true);
    }
  });

  test('hay encantamientos económicos lanzables ya', () => {
    const lanzables = SPELLS.filter((s) => isEnchantment(s) && isCastable(s));
    expect(lanzables.length).toBeGreaterThanOrEqual(5);
  });
});
