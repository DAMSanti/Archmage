import { describe, expect, test } from 'vitest';
import { canResearchLast, spellLevelGain, spellLevelOf } from '@archmage/core';
import { ARMAGEDDON, MAX_SPELL_LEVEL, SPELLS } from '../src/spells.js';

// **Este test vive en `content` y no en `core`** porque compara el catálogo
// con las reglas, y el núcleo no importa nada (docs/SPECS.md §5,
// invariante 1). Ponerlo en `core` fue el primer intento y falló al
// importar, que es exactamente lo que el invariante tiene que hacer.

/** El hechizo Armageddon. docs/SISTEMAS.md §14.1, criterio 16. */
describe('criterio 16 — Armageddon no es un hechizo normal', () => {
  test('NO suma nivel de hechizo', () => {
    // **Es el único del catálogo que no te hace más fuerte.** Aprenderlo
    // solo sirve para acabar el mundo.
    expect(ARMAGEDDON.noSpellLevel).toBe(true);
    expect(spellLevelGain('ultimate', true)).toBe(0);
    expect(spellLevelGain('ultimate')).toBe(20);
  });

  test('y el nivel del mago no se mueve al aprenderlo', () => {
    // Comprobable porque el nivel es un número reproducible desde la fase 2.
    const sin = spellLevelOf([{ rank: 'ultimate' as const }, { rank: 'complex' as const }]);
    const con = spellLevelOf([
      { rank: 'ultimate' as const },
      { rank: 'complex' as const },
      { rank: 'ultimate' as const, noSpellLevel: true },
    ]);
    expect(con).toBe(sin);
    expect(sin).toBe(27);
  });

  test('se investiga DESPUÉS de todos los demás', () => {
    expect(ARMAGEDDON.researchLast).toBe(true);
    const todos = ['a', 'b', 'armageddon'];
    expect(canResearchLast(['a'], todos, 'armageddon')).toBe(false);
    expect(canResearchLast(['a', 'b'], todos, 'armageddon')).toBe(true);
  });

  test('cuesta el doble del Ultimate más caro del catálogo', () => {
    // **[nuestro]** El coste no está publicado. Romper un sello tiene que
    // ser un esfuerzo de mago grande y no un trámite.
    const masCaro = Math.max(...SPELLS.filter((s) => s.rank === 'ultimate').map((s) => s.castMana));
    expect(ARMAGEDDON.castMana).toBe(masCaro * 2);
  });

  test('no está en el catálogo normal: no se investiga por la rueda', () => {
    // Se llega a él por la temporada, no por la escuela.
    expect(SPELLS.find((s) => s.id === 'armageddon')).toBeUndefined();
  });

  test('y el nivel máximo del catálogo no cambia por su culpa', () => {
    // Si sumara, el 207 medido en la fase 2 dejaría de ser cierto.
    expect(MAX_SPELL_LEVEL).toBe(207);
  });
});

describe('la función antigua sigue funcionando', () => {
  test('acepta rangos sueltos, como siempre', () => {
    // **El cambio fue aditivo**: nada de lo que ya llamaba a
    // `spellLevelOf()` con rangos tuvo que tocarse.
    expect(spellLevelOf(['simple', 'average', 'complex', 'ultimate'])).toBe(31);
  });
});
