import { describe, expect, test } from 'vitest';
import { casualties, resistanceAgainst } from '../src/combat.js';
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
    const fuego = resistanceAgainst(treant, ['fire']);
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

  test('y la debilidad NO está aquí: es un multiplicador, no un término', () => {
    // **Este test decía lo contrario el mismo día**: que la debilidad metía
    // −50 en la media y dejaba la resistencia en −50. Al implementar las
    // habilidades defensivas apareció que la debilidad estaba en **las dos
    // listas** de la fuente, y la página *Damage Formula* es explícita:
    // `weakness (2.0 if the attack contains the attack type matching the
    // weakness)`. La media de resistencias es solo de resistencias.
    //
    // Lo que cambia: como multiplicador **no se diluye** al mezclar tipos, y
    // el tope pasa de ×1,5 a ×2,0. Está en habilidades.test.ts.
    expect(resistanceAgainst(treant, ['fire'])).toBe(0);
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
    expect(resistanceAgainst(treant, ['melee'])).toBe(67);
    expect(resistanceAgainst(treant, ['melee', 'fire'])).toBe(33.5);
  });

  test('la debilidad no toca la media, aunque el tipo coincida', () => {
    // Melee (67) + Fire (0) = 33,5, sin importar que sea débil al fuego.
    expect(resistanceAgainst(treant, ['melee', 'fire'])).toBe(33.5);
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

  test('una resistencia negativa sigue siendo posible y hace más daño', () => {
    // Ninguna ficha publicada la tiene, pero un encantamiento podría, y la
    // fórmula tiene que aguantarlo: un negativo en `(1 − resistencia/100)`
    // da un multiplicador mayor que 1.
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
