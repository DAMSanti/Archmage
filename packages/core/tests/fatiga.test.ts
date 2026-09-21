import { describe, expect, test } from 'vitest';
import {
  FATIGUE_PER_ATTACK,
  FATIGUE_PER_ATTACK_ENDURANCE,
  casualties,
  efficiencyAfter,
  fatigueCost,
} from '../src/combat.js';
import type { UnitSpec } from '../src/units.js';

/**
 * La fatiga. docs/SISTEMAS.md §9.1, de docs/ORIGINAL.md §9.1 y §9.2.
 *
 * **No depende del tamaño del stack**, y ésa es la regla que crea una
 * táctica entera: stacks diminutos de alta iniciativa que existen solo para
 * hacer fatigar al rival antes de que pegue en serio.
 */
const normal = { id: 'n', abilities: [] } as unknown as UnitSpec;
const aguantador = { id: 'a', abilities: ['endurance'] } as unknown as UnitSpec;

describe('criterio 3 — la fatiga se acumula y el tamaño no importa', () => {
  test('tras tres ataques primarios la eficiencia es 55', () => {
    expect(FATIGUE_PER_ATTACK).toBe(15);
    expect(efficiencyAfter(normal, 3)).toBe(55);
  });

  test('con Endurance, 70', () => {
    expect(FATIGUE_PER_ATTACK_ENDURANCE).toBe(10);
    expect(efficiencyAfter(aguantador, 3)).toBe(70);
  });

  test('un stack de 1 y uno de 20.000 fatigan LO MISMO', () => {
    // La fatiga es del stack, no de la unidad, y no se reparte. Es lo que
    // hace rentable un stack de una sola unidad muy rápida: gasta una
    // eficiencia entera del rival por el precio de una unidad.
    expect(fatigueCost(normal, 1)).toBe(15);
    expect(fatigueCost(normal, 20_000)).toBe(15);
  });

  test('sin haber atacado, la eficiencia es 100', () => {
    expect(efficiencyAfter(normal, 0)).toBe(100);
  });
});

describe('qué fatiga y qué no', () => {
  test('el ataque primario y el contraataque fatigan; los extra no', () => {
    // docs/ORIGINAL.md §9.1: «los ataques secundarios **no** la bajan».
    expect(fatigueCost(normal, 1, 'primary')).toBe(15);
    expect(fatigueCost(normal, 1, 'counter')).toBe(15);
    expect(fatigueCost(normal, 1, 'extra')).toBe(0);
  });

  test('Endurance abarata el primario y el contraataque, no el extra', () => {
    expect(fatigueCost(aguantador, 1, 'primary')).toBe(10);
    expect(fatigueCost(aguantador, 1, 'counter')).toBe(10);
    expect(fatigueCost(aguantador, 1, 'extra')).toBe(0);
  });

  test('el contraataque cuenta aparte, y se acumula con el propio ataque', () => {
    // Una unidad que ataca y además contraataca gasta las dos: 100 − 30.
    expect(efficiencyAfter(normal, 2)).toBe(70);
  });
});

describe('los topes', () => {
  test('la eficiencia no baja de cero por muchos ataques que haya', () => {
    expect(efficiencyAfter(normal, 7)).toBe(0);
    expect(efficiencyAfter(normal, 100)).toBe(0);
    expect(efficiencyAfter(aguantador, 100)).toBe(0);
  });

  test('a los 7 ataques el normal está a cero y el aguantador todavía pega', () => {
    // 100 / 15 = 6,67 → el séptimo lo deja seco. Con Endurance hacen falta
    // 10. Ésa es la ventaja real de la habilidad: **dos ataques más**.
    expect(efficiencyAfter(normal, 6)).toBe(10);
    expect(efficiencyAfter(normal, 7)).toBe(0);
    expect(efficiencyAfter(aguantador, 7)).toBe(30);
    expect(efficiencyAfter(aguantador, 10)).toBe(0);
  });

  test('una unidad seca no hace daño, aunque le quede ataque', () => {
    const base = {
      attackers: 1_000,
      attackPower: 4_200,
      accuracy: 30,
      randomFactor: 0.5,
      resistance: 0,
      defensiveMultiplier: 1,
      defenderHitPoints: 70,
    };
    expect(casualties({ ...base, efficiency: efficiencyAfter(normal, 7) })).toBe(0);
    expect(casualties({ ...base, efficiency: efficiencyAfter(normal, 0) })).toBe(9_000);
  });
});

describe('lo que la fatiga hace al daño', () => {
  test('cada ataque cuesta un 15% del daño del siguiente', () => {
    const base = {
      attackers: 1_000,
      attackPower: 4_200,
      accuracy: 30,
      randomFactor: 0.5,
      resistance: 0,
      defensiveMultiplier: 1,
      defenderHitPoints: 70,
    };
    expect(casualties({ ...base, efficiency: efficiencyAfter(normal, 1) })).toBe(7_650);
    expect(casualties({ ...base, efficiency: efficiencyAfter(normal, 2) })).toBe(6_300);
    expect(casualties({ ...base, efficiency: efficiencyAfter(normal, 3) })).toBe(4_950);
  });
});
