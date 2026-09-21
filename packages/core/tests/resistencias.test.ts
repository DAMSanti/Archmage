import { describe, expect, test } from 'vitest';
import { WEAKNESS_PENALTY, casualties, resistanceAgainst } from '../src/combat.js';
import type { UnitSpec } from '../src/units.js';

/**
 * Resistencias por tipo de daño. docs/SISTEMAS.md §9.1, de
 * docs/ORIGINAL.md §9.1 (publicada).
 *
 * Es lo que convierte la elección de escuela en una decisión táctica: llevar
 * las unidades adecuadas contra las del rival **es** el juego (§9.1).
 */
const treant = {
  id: 'treant',
  resistances: { melee: 67, ranged: 67, fire: 0, cold: 50, magic: 40 },
  weaknesses: ['fire'],
} as unknown as UnitSpec;

const sinNada = { id: 'x', resistances: {} } as unknown as UnitSpec;

describe('criterio 4 — las resistencias por tipo cambian el resultado', () => {
  test('el Treant recibe tres veces más daño de fuego que de melee', () => {
    // Resiste 67% a melee y 0% al fuego: (1 − 0,67) = 0,33 contra 1,00.
    // Tres veces más, que es el criterio tal cual está escrito.
    const melee = resistanceAgainst(treant, ['melee']);
    const fuego = resistanceAgainst({ ...treant, weaknesses: [] } as UnitSpec, ['fire']);
    expect(melee).toBe(67);
    expect(fuego).toBe(0);

    const base = {
      attackers: 1_000,
      attackPower: 4_200,
      accuracy: 30,
      randomFactor: 0.5,
      efficiency: 100,
      defensiveMultiplier: 1,
      defenderHitPoints: 4_200,
    };
    // El multiplicador de daño pasa de 0,33 a 1,00: **exactamente 100/33**,
    // que son 3,0303… «Tres veces más» es eso; el criterio está redondeado
    // al hablar, no al calcular.
    expect((1 - fuego / 100) / (1 - melee / 100)).toBeCloseTo(100 / 33, 10);

    const porMelee = casualties({ ...base, resistance: melee });
    const porFuego = casualties({ ...base, resistance: fuego });
    expect(porMelee).toBe(49); // 49,5 truncado
    expect(porFuego).toBe(150);
    // En bajas el cociente sale 3,06 y no 3,03, porque el truncado de 49,5
    // a 49 se come medio punto. Es el redondeo haciendo su trabajo, no un
    // error: por eso el test fija los dos números y no solo el cociente.
    expect(porFuego / porMelee).toBeGreaterThan(3);
    expect(porFuego / porMelee).toBeLessThan(3.1);
  });

  test('y su debilidad al fuego lo empeora otro tanto', () => {
    // La debilidad mete −50 en la media, así que un 0% de resistencia pasa
    // a **−50%**: recibe un 50% más de daño del que ya recibía.
    expect(resistanceAgainst(treant, ['fire'])).toBe(-50);
    expect(WEAKNESS_PENALTY).toBe(50);
  });
});

describe('con varios tipos de daño se hace la media', () => {
  test('el ejemplo de la fuente: Fire Ranged = (30 + 75) / 2 = 52,5', () => {
    // docs/ORIGINAL.md §9.1, citado literal.
    const u = { id: 'u', resistances: { fire: 30, ranged: 75 } } as unknown as UnitSpec;
    expect(resistanceAgainst(u, ['fire', 'ranged'])).toBe(52.5);
  });

  test('un tipo que no está en la ficha cuenta como 0', () => {
    const u = { id: 'u', resistances: { fire: 80 } } as unknown as UnitSpec;
    expect(resistanceAgainst(u, ['fire'])).toBe(80);
    expect(resistanceAgainst(u, ['melee'])).toBe(0);
    expect(resistanceAgainst(u, ['fire', 'melee'])).toBe(40);
  });

  test('sin resistencias, cualquier tipo da 0', () => {
    expect(resistanceAgainst(sinNada, ['melee', 'fire', 'magic'])).toBe(0);
  });

  test('la media DILUYE una resistencia alta, y eso es la decisión táctica', () => {
    // Un ataque de dos tipos contra un defensor que solo resiste uno le
    // saca la mitad del provecho. Por eso llevar el tipo adecuado importa:
    // el Treant, con 67% a melee, cae al 33,5% si el ataque es Melee+Fire.
    expect(resistanceAgainst({ ...treant, weaknesses: [] } as UnitSpec, ['melee'])).toBe(67);
    expect(resistanceAgainst({ ...treant, weaknesses: [] } as UnitSpec, ['melee', 'fire'])).toBe(33.5);
  });

  test('la debilidad entra en la media como un término más', () => {
    // Melee (67) + Fire, con debilidad al fuego (−50): (67 − 50) / 2 = 8,5.
    expect(resistanceAgainst(treant, ['melee', 'fire'])).toBe(8.5);
  });

  test('sin tipos de daño no hay resistencia que aplicar', () => {
    expect(resistanceAgainst(treant, [])).toBe(0);
  });
});

describe('los topes', () => {
  test('una resistencia del 100% anula el daño', () => {
    const inmune = { id: 'i', resistances: { fire: 100 } } as unknown as UnitSpec;
    expect(resistanceAgainst(inmune, ['fire'])).toBe(100);
    expect(
      casualties({
        attackers: 1_000,
        attackPower: 4_200,
        accuracy: 30,
        randomFactor: 0.5,
        efficiency: 100,
        resistance: 100,
        defensiveMultiplier: 1,
        defenderHitPoints: 70,
      }),
    ).toBe(0);
  });

  test('la debilidad puede dejar la resistencia en negativo, y debe poder', () => {
    // Un negativo en `(1 − resistencia/100)` da un multiplicador **mayor
    // que 1**: es exactamente lo que una debilidad tiene que hacer. Si se
    // topara en 0 la debilidad no serviría de nada contra alguien que ya no
    // resiste el tipo — que es el caso del Fénix y el fuego.
    expect(resistanceAgainst(treant, ['fire'])).toBeLessThan(0);
    const base = {
      attackers: 1_000,
      attackPower: 4_200,
      accuracy: 30,
      randomFactor: 0.5,
      efficiency: 100,
      defensiveMultiplier: 1,
      defenderHitPoints: 70,
    };
    expect(casualties({ ...base, resistance: -50 })).toBe(13_500);
    expect(casualties({ ...base, resistance: 0 })).toBe(9_000);
  });
});
