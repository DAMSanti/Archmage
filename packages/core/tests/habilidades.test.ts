import { describe, expect, test } from 'vitest';
import {
  DEFENSIVE_MULTIPLIERS,
  WEAKNESS_MULTIPLIER,
  casualties,
  defensiveMultiplier,
} from '../src/combat.js';
import type { UnitSpec } from '../src/units.js';

/**
 * Habilidades defensivas. docs/SISTEMAS.md §9.1, de la página *Damage
 * Formula* del original (docs/ORIGINAL.md §9.1, confianza alta).
 *
 * **Se multiplican entre sí**, no se suman. Eso las hace apilables sin
 * volverse absurdas: tres al 0,7-0,8 dejan el daño en 0,42, no en cero.
 */
const unidad = (abilities: string[], weaknesses: string[] = []) =>
  ({ id: 'u', abilities, weaknesses, resistances: {} } as unknown as UnitSpec);

const ataque = (types: string[], primary = true) =>
  ({ types, primary } as { types: readonly string[]; primary: boolean });

describe('cada habilidad, por separado', () => {
  test('los cinco multiplicadores son los publicados', () => {
    expect(DEFENSIVE_MULTIPLIERS.healing).toBe(0.7);
    expect(DEFENSIVE_MULTIPLIERS.scales).toBe(0.75);
    expect(DEFENSIVE_MULTIPLIERS.regeneration).toBe(0.8);
    expect(DEFENSIVE_MULTIPLIERS.charm).toBe(0.5);
    expect(DEFENSIVE_MULTIPLIERS.large_shield).toBe(0.5);
    expect(WEAKNESS_MULTIPLIER).toBe(2);
  });

  test('healing, scales y regeneration valen siempre', () => {
    const a = ataque(['melee']);
    expect(defensiveMultiplier(unidad(['healing']), a)).toBe(0.7);
    expect(defensiveMultiplier(unidad(['scales']), a)).toBe(0.75);
    expect(defensiveMultiplier(unidad(['regeneration']), a)).toBe(0.8);
  });

  test('sin habilidades el multiplicador es 1', () => {
    expect(defensiveMultiplier(unidad([]), ataque(['melee']))).toBe(1);
  });

  test('una habilidad que no es defensiva no cuenta', () => {
    expect(defensiveMultiplier(unidad(['flying', 'swift', 'pike']), ataque(['melee']))).toBe(1);
  });
});

describe('las tres condicionales', () => {
  test('charm solo protege del ataque PRIMARIO', () => {
    // Contra un ataque extra o un contraataque no hace nada.
    expect(defensiveMultiplier(unidad(['charm']), ataque(['melee'], true))).toBe(0.5);
    expect(defensiveMultiplier(unidad(['charm']), ataque(['melee'], false))).toBe(1);
  });

  test('large shield solo protege de ataques A DISTANCIA', () => {
    expect(defensiveMultiplier(unidad(['large_shield']), ataque(['ranged']))).toBe(0.5);
    expect(defensiveMultiplier(unidad(['large_shield']), ataque(['melee']))).toBe(1);
    // Basta con que el ataque contenga el tipo, aunque lleve varios.
    expect(defensiveMultiplier(unidad(['large_shield']), ataque(['magic', 'ranged']))).toBe(0.5);
  });

  test('la debilidad DUPLICA el daño si el ataque lleva su tipo', () => {
    const debil = unidad([], ['fire']);
    expect(defensiveMultiplier(debil, ataque(['fire']))).toBe(2);
    expect(defensiveMultiplier(debil, ataque(['melee']))).toBe(1);
    expect(defensiveMultiplier(debil, ataque(['melee', 'fire']))).toBe(2);
  });

  test('la debilidad NO se diluye con varios tipos, y la resistencia sí', () => {
    // **Ésta es la diferencia que importa**, y la razón de que la debilidad
    // sea un multiplicador y no un término de la media: basta con que el
    // ataque *contenga* el tipo. Un ataque Melee+Fire contra el Treant
    // aprovecha su debilidad entera, mientras su resistencia al melee se
    // queda a medias.
    const debil = unidad([], ['fire']);
    expect(defensiveMultiplier(debil, ataque(['melee', 'fire', 'cold']))).toBe(2);
  });
});

describe('se multiplican entre sí', () => {
  test('dos combinadas: healing × scales = 0,525', () => {
    expect(defensiveMultiplier(unidad(['healing', 'scales']), ataque(['melee']))).toBeCloseTo(
      0.525,
      10,
    );
  });

  test('tres combinadas: 0,7 × 0,75 × 0,8 = 0,42', () => {
    expect(
      defensiveMultiplier(unidad(['healing', 'scales', 'regeneration']), ataque(['melee'])),
    ).toBeCloseTo(0.42, 10);
  });

  test('una debilidad puede anular varias defensas', () => {
    // healing × regeneration = 0,56, y la debilidad lo sube a 1,12: el
    // defensor acaba recibiendo **más** daño del normal pese a tener dos
    // habilidades defensivas.
    const u = unidad(['healing', 'regeneration'], ['fire']);
    expect(defensiveMultiplier(u, ataque(['fire']))).toBeCloseTo(1.12, 10);
    expect(defensiveMultiplier(u, ataque(['melee']))).toBeCloseTo(0.56, 10);
  });

  test('el apilado no llega nunca a cero: es producto, no resta', () => {
    const todo = unidad(['healing', 'scales', 'regeneration', 'charm', 'large_shield']);
    const m = defensiveMultiplier(todo, ataque(['ranged'], true));
    expect(m).toBeCloseTo(0.7 * 0.75 * 0.8 * 0.5 * 0.5, 10);
    expect(m).toBeGreaterThan(0);
    expect(m).toBeCloseTo(0.105, 10);
  });
});

describe('cómo cae en la fórmula', () => {
  const base = {
    attackers: 1_000,
    attackPower: 4_200,
    accuracy: 30,
    randomFactor: 0.5,
    efficiency: 100,
    resistance: 0,
    defenderHitPoints: 70,
  };

  test('el mejor defensor posible recibe una décima parte', () => {
    const todo = unidad(['healing', 'scales', 'regeneration', 'charm', 'large_shield']);
    const m = defensiveMultiplier(todo, ataque(['ranged'], true));
    expect(casualties({ ...base, defensiveMultiplier: m })).toBe(945); // de 9.000
  });

  test('y el peor, el doble', () => {
    const debil = unidad([], ['fire']);
    const m = defensiveMultiplier(debil, ataque(['fire']));
    expect(casualties({ ...base, defensiveMultiplier: m })).toBe(18_000);
  });
});
