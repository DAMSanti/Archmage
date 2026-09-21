import { describe, expect, test } from 'vitest';
import {
  HERO_XP_PER_BATTLE,
  HERO_XP_PER_TURN,
  HIRED_HERO_LEVEL,
  gainExperience,
  levelUpCost,
} from '../src/heroes.js';

/** Héroes que crecen. docs/SISTEMAS.md §12.1, criterios 12 y 13. */
describe('criterio 13 — liderar aporta más que esperar', () => {
  test('una batalla vale veinte turnos', () => {
    // Un héroe que sube solo con el tiempo es un contador; uno que sube
    // peleando es una razón para pelear.
    expect(HERO_XP_PER_BATTLE / HERO_XP_PER_TURN).toBe(20);
  });

  test('subir del 8 al 9 cuesta 800 turnos de espera o 40 batallas', () => {
    const coste = levelUpCost(8);
    expect(coste).toBe(8_000);
    expect(coste / HERO_XP_PER_TURN).toBe(800);
    expect(coste / HERO_XP_PER_BATTLE).toBe(40);
  });
});

describe('subir de nivel', () => {
  test('cuesta 1.000 × el nivel actual', () => {
    expect(levelUpCost(1)).toBe(1_000);
    expect(levelUpCost(8)).toBe(8_000);
    expect(levelUpCost(20)).toBe(20_000);
  });

  test('los comprables empiezan en nivel 8', () => {
    expect(HIRED_HERO_LEVEL).toBe(8);
  });

  test('sube cuando llega, y guarda el resto', () => {
    expect(gainExperience({ level: 1, experience: 0 }, 1_000)).toEqual({
      level: 2,
      experience: 0,
    });
    expect(gainExperience({ level: 1, experience: 0 }, 1_500)).toEqual({
      level: 2,
      experience: 500,
    });
  });

  test('sube VARIOS niveles de golpe si da para ello', () => {
    // Un bucle y no un `if`: si una batalla larga da para dos niveles se
    // dan los dos. Lo contrario perdería experiencia sin avisar.
    const r = gainExperience({ level: 1, experience: 0 }, 1_000 + 2_000 + 3_000);
    expect(r.level).toBe(4);
    expect(r.experience).toBe(0);
  });

  test('subir es cada vez más caro, así que un veterano vale algo', () => {
    let h = { level: 8, experience: 0 };
    const costes: number[] = [];
    for (let i = 0; i < 5; i++) {
      costes.push(levelUpCost(h.level));
      h = gainExperience(h, levelUpCost(h.level));
    }
    expect(costes).toEqual([8_000, 9_000, 10_000, 11_000, 12_000]);
    expect(h.level).toBe(13);
  });

  test('experiencia negativa no baja de nivel', () => {
    expect(gainExperience({ level: 5, experience: 100 }, -9_999)).toEqual({
      level: 5,
      experience: 100,
    });
  });

  test('sin experiencia no pasa nada', () => {
    expect(gainExperience({ level: 5, experience: 100 }, 0)).toEqual({
      level: 5,
      experience: 100,
    });
  });
});

describe('criterio 12 — cuánto crece en una temporada', () => {
  test('un héroe que lidera una temporada llega a 12 o más, y no a 20', () => {
    // 2.000 turnos, liderando una batalla cada 20 turnos: 100 batallas
    // más la experiencia del tiempo.
    let h = { level: HIRED_HERO_LEVEL, experience: 0 };
    h = gainExperience(h, 2_000 * HERO_XP_PER_TURN + 100 * HERO_XP_PER_BATTLE);
    expect(h.level).toBeGreaterThanOrEqual(12);
    expect(h.level).toBeLessThan(20);
  });

  test('y uno que solo espera se queda muy por detrás', () => {
    let quieto = { level: HIRED_HERO_LEVEL, experience: 0 };
    quieto = gainExperience(quieto, 2_000 * HERO_XP_PER_TURN);
    let peleon = { level: HIRED_HERO_LEVEL, experience: 0 };
    peleon = gainExperience(peleon, 2_000 * HERO_XP_PER_TURN + 100 * HERO_XP_PER_BATTLE);
    expect(peleon.level).toBeGreaterThan(quieto.level);
  });
});
