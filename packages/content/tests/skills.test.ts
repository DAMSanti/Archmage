import { describe, expect, test } from 'vitest';
import {
  MAX_SKILL_COST,
  MAX_SKILL_LEVEL,
  skillMultiplier,
  skillPointsPerTurn,
  totalCost,
  trainCost,
} from '@archmage/core';
import { SKILLS, SKILLS_BY_ID, SPECIALTY_SKILL_IDS } from '../src/skills.js';

/**
 * Las diez habilidades. docs/SISTEMAS.md §12.1.
 *
 * Cierran la marca `[abierto]` que llevaba desde la fase 1. El único efecto
 * publicado es el de *Spell Mastery*, y de fuente floja: sirve de **ancla de
 * escala**, no para copiarlo.
 */
describe('criterio 14 — el efecto de cada habilidad', () => {
  test('las diez están, y cinco son de especialidad', () => {
    expect(SKILLS).toHaveLength(10);
    expect(SPECIALTY_SKILL_IDS).toHaveLength(5);
  });

  test('AL NIVEL 0 NO CAMBIA NADA, las diez', () => {
    // **Éste es el canario del riesgo 1 del plan.** Enchufar las
    // habilidades toca nueve fórmulas ya calibradas en las fases 1 a 3; si
    // una al nivel 0 moviera un solo número, estaría mal enchufada.
    for (const s of SKILLS) {
      expect(skillMultiplier(s, 0), s.id).toBe(1);
    }
  });

  test('al nivel 20 cambian su magnitud un 20% exacto', () => {
    for (const s of SKILLS) {
      const m = skillMultiplier(s, MAX_SKILL_LEVEL);
      expect(m, s.id).toBeCloseTo(s.reduces ? 0.8 : 1.2, 10);
    }
  });

  test('y es lineal: +1% por rango', () => {
    const conquistador = SKILLS_BY_ID.grand_conqueror!;
    for (let n = 0; n <= 20; n++) {
      expect(skillMultiplier(conquistador, n)).toBeCloseTo(1 + n * 0.01, 10);
    }
  });

  test('las que reducen, reducen', () => {
    // Bajar un coste de maná un 20% y subir un ataque un 20% son el mismo
    // +1% por rango mirado al revés.
    expect(skillMultiplier(SKILLS_BY_ID.spell_mastery!, 20)).toBeCloseTo(0.8, 10);
    expect(skillMultiplier(SKILLS_BY_ID.grand_enchanter!, 20)).toBeCloseTo(0.8, 10);
    expect(skillMultiplier(SKILLS_BY_ID.animal_mastery!, 20)).toBeCloseTo(1.2, 10);
  });

  test('no se pasa del nivel 20 ni baja de 0', () => {
    const s = SKILLS_BY_ID.grand_conqueror!;
    expect(skillMultiplier(s, 999)).toBe(skillMultiplier(s, 20));
    expect(skillMultiplier(s, -5)).toBe(1);
  });

  test('cada una dice de dónde sale su número', () => {
    for (const s of SKILLS) {
      expect(s.source, s.id).toContain('[orig]');
      // Nueve son deducción nuestra y lo dicen; la décima trae su cifra.
      if (s.id !== 'spell_mastery') expect(s.source, s.id).toContain('[nuestro]');
    }
  });

  test('las diez tocan magnitudes distintas', () => {
    // Si dos tocaran la misma, una sería redundante y el jugador no tendría
    // diez decisiones sino nueve.
    expect(new Set(SKILLS.map((s) => s.target)).size).toBe(10);
  });
});

describe('criterio 15 — lo que cuesta llegar al 20', () => {
  test('210 puntos en tu color', () => {
    expect(MAX_SKILL_COST).toBe(210);
    expect(totalCost(SKILLS_BY_ID.grand_conqueror!, 20, 'verdant')).toBe(210);
  });

  test('420 fuera de tu color, y solo las cinco de especialidad', () => {
    // *Animal Mastery* es de Verdant: a un mago Nether le cuesta el doble.
    expect(totalCost(SKILLS_BY_ID.animal_mastery!, 20, 'nether')).toBe(420);
    expect(totalCost(SKILLS_BY_ID.animal_mastery!, 20, 'verdant')).toBe(210);
    // Una neutra cuesta lo mismo a todos.
    expect(totalCost(SKILLS_BY_ID.grand_conqueror!, 20, 'nether')).toBe(210);
  });

  test('un mago Plain paga el doble por todas las de especialidad', () => {
    // No tiene color propio, así que ninguna es suya. Es coherente con que
    // Plain no sea una escuela sino la ausencia de una.
    for (const id of SPECIALTY_SKILL_IDS) {
      expect(totalCost(SKILLS_BY_ID[id]!, 20, 'plain'), id).toBe(420);
    }
  });

  test('el rango N cuesta N', () => {
    const s = SKILLS_BY_ID.grand_conqueror!;
    expect(trainCost(s, 0, 'verdant')).toBe(1);
    expect(trainCost(s, 19, 'verdant')).toBe(20);
  });

  test('pasado el 20 no se puede subir más', () => {
    expect(trainCost(SKILLS_BY_ID.grand_conqueror!, 20, 'verdant')).toBe(Infinity);
  });
});

describe('criterio 16 — cuántos puntos se generan', () => {
  test('5.000 de tierra al 5% de guilds da un punto cada 34 turnos, ±2', () => {
    // El ancla publicada (docs/ORIGINAL.md §8). **El test comprueba el
    // ancla, no el coeficiente**: si un día cambia la forma, lo que tiene
    // que seguir cuadrando es este mago.
    const guilds = 250; // 5% de 5.000
    const turnos = 1 / skillPointsPerTurn(guilds);
    expect(turnos).toBeGreaterThan(32);
    expect(turnos).toBeLessThan(36);
  });

  test('sale de la RAÍZ de los guilds, no de los guilds', () => {
    // Cuadruplicar los guilds solo dobla los puntos. Es lo que impide que
    // un mago enorme acumule las diez habilidades en una temporada.
    const uno = skillPointsPerTurn(250);
    const cuatro = skillPointsPerTurn(1_000);
    expect(cuatro / uno).toBeCloseTo(2, 5);
  });

  test('sin guilds no se genera ninguno', () => {
    expect(skillPointsPerTurn(0)).toBe(0);
    expect(skillPointsPerTurn(-10)).toBe(0);
  });

  test('devuelve fracción, y eso es a propósito', () => {
    // Los puntos son enteros pero tardan decenas de turnos en salir;
    // redondear cada turno los dejaría en cero para siempre.
    expect(skillPointsPerTurn(250)).toBeLessThan(1);
    expect(skillPointsPerTurn(250)).toBeGreaterThan(0);
  });
});
