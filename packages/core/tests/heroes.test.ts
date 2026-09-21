import { describe, expect, test } from 'vitest';
import {
  BATTLE_ITEMS,
  type HeroSpec,
  applyItems,
  assignHeroes,
  assignmentTriggers,
  heroBonusFor,
  heroDies,
  resurrected,
} from '../src/heroes.js';
import type { UnitSpec } from '../src/units.js';

/** Héroes e items. docs/SISTEMAS.md §9.1. */
const u = (id: string, over: Partial<UnitSpec> = {}): UnitSpec =>
  ({
    id,
    name: id,
    race: 'treefolk',
    specialty: 'verdant',
    abilities: [],
    weaknesses: [],
    resistances: {},
    spellResistances: {},
    attack: { power: 1_000, types: ['melee'], initiative: 3 },
    counterAttack: 0,
    hitPoints: 100,
    powerRank: 10,
    ...over,
  } as UnitSpec);

const heroe = (id: string, level: number, over: Partial<HeroSpec> = {}): HeroSpec => ({
  id,
  name: id,
  level,
  race: 'treefolk',
  specialty: 'verdant',
  hitPoints: 500,
  ...over,
});

describe('el reparto de héroes', () => {
  test('el de mayor nivel lidera el stack más potente', () => {
    const stacks = [
      { unit: u('flojo'), count: 10 },
      { unit: u('fuerte'), count: 1_000 },
    ];
    const r = assignHeroes([heroe('bajo', 3), heroe('alto', 9)], stacks);
    expect(r.find((a) => a.heroId === 'alto')!.stackIndex).toBe(1);
    expect(r.find((a) => a.heroId === 'bajo')!.stackIndex).toBe(0);
  });

  test('el reparto es determinista: mismo entrada, mismo resultado', () => {
    // Si dependiera del azar haría falta otra semilla para poder repetir la
    // batalla (docs/SPECS.md §5, invariante 3).
    const stacks = [
      { unit: u('a'), count: 100 },
      { unit: u('b'), count: 100 },
    ];
    const heroes = [heroe('x', 5), heroe('y', 5)];
    expect(assignHeroes(heroes, stacks)).toEqual(assignHeroes(heroes, stacks));
  });

  test('sobran héroes o sobran stacks, y no revienta', () => {
    expect(assignHeroes([heroe('a', 1)], [])).toEqual([]);
    expect(assignHeroes([], [{ unit: u('x'), count: 1 }])).toEqual([]);
    expect(assignHeroes([heroe('a', 1), heroe('b', 2)], [{ unit: u('x'), count: 1 }])).toHaveLength(1);
  });
});

describe('el bonus solo se aplica con su raza y su color', () => {
  test('liderando lo suyo, el bonus es su nivel', () => {
    const r = assignHeroes([heroe('h', 7)], [{ unit: u('x'), count: 100 }]);
    expect(r[0]).toMatchObject({ preferred: true, efficiencyBonus: 7 });
  });

  test('liderando otra raza, va igual pero no aporta', () => {
    const otra = u('x', { race: 'human' });
    const r = assignHeroes([heroe('h', 7)], [{ unit: otra, count: 100 }]);
    expect(r[0]).toMatchObject({ preferred: false, efficiencyBonus: 0, stackIndex: 0 });
  });

  test('liderando otro color tampoco', () => {
    const otra = u('x', { specialty: 'nether' as never });
    expect(assignHeroes([heroe('h', 7)], [{ unit: otra, count: 100 }])[0]!.efficiencyBonus).toBe(0);
  });

  test('heroBonusFor devuelve 0 para un stack sin héroe', () => {
    const r = assignHeroes([heroe('h', 7)], [{ unit: u('x'), count: 100 }]);
    expect(heroBonusFor(r, 0)).toBe(7);
    expect(heroBonusFor(r, 1)).toBe(0);
  });
});

describe('cuándo muere un héroe', () => {
  test('hace falta que su stack caiga Y que sobre daño para sus HP', () => {
    const h = heroe('h', 5);
    expect(heroDies(h, true, 600)).toBe(true);
    expect(heroDies(h, true, 400)).toBe(false); // el stack cae, él no
    expect(heroDies(h, false, 10_000)).toBe(false); // el stack aguanta
  });

  test('por eso un héroe caro va en un stack grande', () => {
    // El matiz no es decorativo: es la razón de que proteger a un héroe sea
    // una decisión de composición.
    expect(heroDies(heroe('h', 20, { hitPoints: 5_000 }), true, 4_999)).toBe(false);
  });
});

describe('los items publicados', () => {
  test('sus números son los de la fuente', () => {
    expect(BATTLE_ITEMS.bubble_wine).toMatchObject({ attack: 1.1, hitPoints: 1.3 });
    expect(BATTLE_ITEMS.potion_of_valor!.attack).toBe(1.2);
    expect(BATTLE_ITEMS.ash_of_invisibility!.initiative).toBe(6);
    expect(BATTLE_ITEMS.strange_metallic_can!.resurrect).toBe(0.25);
  });

  test('aplicar uno modifica ataque y HP', () => {
    const r = applyItems(u('x'), [BATTLE_ITEMS.bubble_wine!]);
    expect(r.attack.power).toBe(1_100);
    expect(r.hitPoints).toBe(130);
  });

  test('dos se multiplican entre sí', () => {
    const r = applyItems(u('x'), [BATTLE_ITEMS.bubble_wine!, BATTLE_ITEMS.potion_of_valor!]);
    expect(r.attack.power).toBe(Math.floor(1_000 * 1.1 * 1.2)); // 1.320
    expect(r.hitPoints).toBe(130);
  });

  test('la iniciativa se FIJA al mayor, no se multiplica', () => {
    // No tiene sentido multiplicar una posición en una cola.
    const r = applyItems(u('x'), [BATTLE_ITEMS.ash_of_invisibility!]);
    expect(r.attack.initiative).toBe(6);
    // Y no la baja si ya era mayor.
    const rapido = u('r', { attack: { power: 100, types: ['melee'], initiative: 6 } });
    expect(applyItems(rapido, [BATTLE_ITEMS.ash_of_invisibility!]).attack.initiative).toBe(6);
  });

  test('el ataque extra también se modifica', () => {
    const conExtra = u('x', {
      extraAttack: { power: 500, types: ['melee'], initiative: 5 },
    });
    expect(applyItems(conExtra, [BATTLE_ITEMS.potion_of_valor!]).extraAttack!.power).toBe(600);
  });

  test('sin items, la ficha se devuelve tal cual', () => {
    const x = u('x');
    expect(applyItems(x, [])).toBe(x);
  });

  test('todo entero: un item no crea unidades fraccionarias', () => {
    const r = applyItems(u('x', { attack: { power: 7, types: ['melee'], initiative: 1 } }), [
      BATTLE_ITEMS.bubble_wine!,
    ]);
    expect(Number.isInteger(r.attack.power)).toBe(true);
    expect(Number.isInteger(r.hitPoints)).toBe(true);
  });
});

describe('la resurrección se combina multiplicando complementos', () => {
  test('el ejemplo de la fuente: 30% + 20% + 25% ≈ 58%', () => {
    // 1 − (0,70 × 0,80 × 0,75) = 0,58. NO es 75%.
    expect(resurrected(1_000, [0.3, 0.2, 0.25])).toBe(580);
  });

  test('uno solo resucita lo suyo', () => {
    expect(resurrected(1_000, [0.25])).toBe(250);
  });

  test('apilar efectos nunca resucita al ejército entero', () => {
    expect(resurrected(1_000, [0.5, 0.5, 0.5, 0.5])).toBeLessThan(1_000);
  });

  test('sin efectos no resucita nadie', () => {
    expect(resurrected(1_000, [])).toBe(0);
  });
});

describe('el assignment de defensa', () => {
  test('se dispara al llegar al porcentaje fijado', () => {
    expect(assignmentTriggers(500, 1_000, 0.5)).toBe(true);
    expect(assignmentTriggers(499, 1_000, 0.5)).toBe(false);
  });

  test('contra un defensor sin ejército, cualquier enemigo lo dispara', () => {
    expect(assignmentTriggers(1, 0, 0.5)).toBe(true);
    expect(assignmentTriggers(0, 0, 0.5)).toBe(false);
  });

  test('EN DEFENSA NO SE PUEDE BLOQUEAR: no hay parámetro para ello', () => {
    // El test es la firma: `assignmentTriggers` no admite nada que lo
    // impida, y es a propósito (docs/SISTEMAS.md §9.1).
    expect(assignmentTriggers.length).toBe(3);
  });
});
