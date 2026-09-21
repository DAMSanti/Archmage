import { describe, expect, test } from 'vitest';
import { prepareBattle, resurrected } from '../src/prebattle.js';
import { makeRandom } from '../src/random.js';
import type { ItemSpec } from '../src/items.js';
import type { UnitSpec } from '../src/units.js';

/**
 * La pre-batalla. docs/SISTEMAS.md §9.1 y docs/ORIGINAL.md §9.4.
 *
 * **Lo que esta capa tiene que garantizar** es que un item cambia el
 * ejército y **no la fórmula de daño**: si se colara dentro de
 * `casualties()` haría un segundo redondeo y rompería el invariante 7.
 */
const u = (id: string, over: Partial<UnitSpec> = {}): UnitSpec =>
  ({
    id,
    name: id,
    race: 'human',
    specialty: 'plain',
    abilities: [],
    weaknesses: [],
    resistances: {},
    spellResistances: {},
    attack: { power: 1_000, types: ['melee'], initiative: 3 },
    counterAttack: 200,
    hitPoints: 100,
    powerRank: 10,
    ...over,
  } as UnitSpec);

const item = (effect: unknown, id = 'x'): ItemSpec =>
  ({ id, name: id, rarity: 'lesser', use: 'battle', effect, source: 'test' } as ItemSpec);

const ejercito = (unit: UnitSpec, count = 100) => [{ unit, count }];
const azar = () => makeRandom(7);

describe('las fichas no se mutan', () => {
  test('el catálogo sale de la batalla como entró', () => {
    // **El riesgo que más caro sale**: el catálogo es compartido, y una
    // batalla no puede dejar al Treant del mundo con un +20% permanente.
    const original = u('treant', { attack: { power: 4_200, types: ['melee'], initiative: 1 } });
    prepareBattle(
      ejercito(original),
      ejercito(u('otro')),
      [item({ kind: 'ap', side: 'friendly', multiplier: 2 })],
      [],
      azar(),
    );
    expect(original.attack.power).toBe(4_200);
  });
});

describe('criterio 8 ter — un item de batalla se aplica ANTES de la ronda', () => {
  test('los Tambores de Guerra bajan el ataque enemigo un 10%', () => {
    const r = prepareBattle(
      ejercito(u('mio')),
      ejercito(u('suyo')),
      [item({ kind: 'ap', side: 'enemy', multiplier: 0.9 }, 'drums_of_war')],
      [],
      azar(),
    );
    // **En la ficha, no en un golpe.** Por eso vale para toda la batalla y
    // no solo para la primera ronda.
    expect(r.defender.stacks[0]!.unit.attack.power).toBe(900);
    expect(r.defender.stacks[0]!.unit.counterAttack).toBe(180);
    expect(r.attacker.stacks[0]!.unit.attack.power).toBe(1_000);
  });

  test('y queda apuntado en el log de la pre-batalla', () => {
    const r = prepareBattle(
      ejercito(u('mio')),
      ejercito(u('suyo')),
      [item({ kind: 'ap', side: 'enemy', multiplier: 0.9 }, 'drums_of_war')],
      [],
      azar(),
    );
    expect(r.events[0]).toMatchObject({ itemId: 'drums_of_war' });
  });
});

describe('cada familia de efecto', () => {
  test('ataque: multiplica primario, extra y contraataque', () => {
    const conExtra = u('m', { extraAttack: { power: 500, types: ['melee'], initiative: 5 } });
    const r = prepareBattle(
      ejercito(conExtra),
      ejercito(u('s')),
      [item({ kind: 'ap', side: 'friendly', multiplier: 1.2 })],
      [],
      azar(),
    );
    const x = r.attacker.stacks[0]!.unit;
    expect([x.attack.power, x.extraAttack!.power, x.counterAttack]).toEqual([1_200, 600, 240]);
  });

  test('ataque por tipo de daño: solo a quien lo tenga', () => {
    const psiquico = u('p', { attack: { power: 100, types: ['psychic'], initiative: 3 } });
    const r = prepareBattle(
      [{ unit: psiquico, count: 10 }, { unit: u('m'), count: 10 }],
      ejercito(u('s')),
      [item({ kind: 'ap', side: 'friendly', multiplier: 2, damageType: 'psychic' })],
      [],
      azar(),
    );
    const tocado = r.attacker.stacks.find((s) => s.unit.id === 'p')!;
    const intacto = r.attacker.stacks.find((s) => s.unit.id === 'm')!;
    expect(tocado.unit.attack.power).toBe(200);
    expect(intacto.unit.attack.power).toBe(1_000);
  });

  test('resistencia: sube con tope y baja sin él', () => {
    const duro = u('d', { resistances: { fire: 80, melee: 10 } });
    const conTope = prepareBattle(
      ejercito(duro),
      ejercito(u('s')),
      [item({ kind: 'resistance', side: 'friendly', damageType: 'fire', delta: 40, cap: 100 })],
      [],
      azar(),
    );
    expect(conTope.attacker.stacks[0]!.unit.resistances.fire).toBe(100);

    // **Sin tope por abajo**: los Frascos de Aceite pueden dejarla negativa,
    // y entonces el fuego hace más daño del normal.
    const sinTope = prepareBattle(
      ejercito(u('s')),
      ejercito(duro),
      [item({ kind: 'resistance', side: 'enemy', damageType: 'fire', delta: -40 })],
      [],
      azar(),
    );
    expect(sinTope.defender.stacks[0]!.unit.resistances.fire).toBe(40);
  });

  test('Pixie Dust se REPARTE entre los stacks', () => {
    // Contra cuatro stacks hace un 5% a cada uno. Premia atacar a quien
    // concentra su ejército en pocos stacks.
    const defensa = [1, 2, 3, 4].map((i) => ({ unit: u(`d${i}`, { resistances: { melee: 50 } }), count: 10 }));
    const r = prepareBattle(
      ejercito(u('m')),
      defensa,
      [item({ kind: 'resistanceSpread', side: 'enemy', delta: -20 })],
      [],
      azar(),
    );
    expect(r.defender.stacks[0]!.unit.resistances.melee).toBe(45);
  });

  test('iniciativa: se fija a todos, o a uno al azar', () => {
    const r = prepareBattle(
      ejercito(u('m')),
      ejercito(u('s')),
      [item({ kind: 'initiativeSet', side: 'friendly', value: 6 })],
      [],
      azar(),
    );
    expect(r.attacker.stacks[0]!.unit.attack.initiative).toBe(6);

    const uno = prepareBattle(
      ejercito(u('m')),
      [{ unit: u('a'), count: 5 }, { unit: u('b'), count: 5 }],
      [item({ kind: 'initiativeSet', side: 'enemy', value: 0, randomStack: true })],
      [],
      azar(),
    );
    const ceros = uno.defender.stacks.filter((s) => s.unit.attack.initiative === 0);
    expect(ceros).toHaveLength(1);
  });

  test('la iniciativa no baja de cero', () => {
    const lento = u('l', { attack: { power: 10, types: ['melee'], initiative: 0 } });
    const r = prepareBattle(
      ejercito(u('m')),
      ejercito(lento),
      [item({ kind: 'initiativeDelta', side: 'enemy', delta: -1 })],
      [],
      azar(),
    );
    expect(r.defender.stacks[0]!.unit.attack.initiative).toBe(0);
  });

  test('la Alfombra Voladora da Flying, y rompe el criterio 5', () => {
    // Es lo que convierte «el melee no toca voladores» en una regla que se
    // puede comprar, y por eso el item vale tanto.
    const r = prepareBattle(
      ejercito(u('m')),
      ejercito(u('s')),
      [item({ kind: 'grantFlying', side: 'friendly' })],
      [],
      azar(),
    );
    expect(r.attacker.stacks[0]!.unit.abilities).toContain('flying');
  });

  test('las Redes aterrizan un volador y lo ralentizan', () => {
    const volador = u('v', { abilities: ['flying'] });
    const r = prepareBattle(
      ejercito(u('m')),
      ejercito(volador),
      [item({ kind: 'ground', side: 'enemy', initiativeDelta: -1 })],
      [],
      azar(),
    );
    const x = r.defender.stacks[0]!.unit;
    expect(x.abilities).not.toContain('flying');
    expect(x.attack.initiative).toBe(2);
  });

  test('daño directo: base + [1-3 × unidades], y mata unidades enteras', () => {
    const r = prepareBattle(
      ejercito(u('m')),
      [{ unit: u('s', { hitPoints: 100 }), count: 5_000 }],
      [item({ kind: 'directDamage', damageType: 'cold', base: 100_000, perUnit: { min: 1, max: 3 } })],
      [],
      azar(),
    );
    const bajas = 5_000 - r.defender.stacks[0]!.count;
    // Con 100 de HP: (100.000 + [1-3]×5.000) / 100 → entre 1.050 y 1.150.
    expect(bajas).toBeGreaterThanOrEqual(1_050);
    expect(bajas).toBeLessThanOrEqual(1_150);
    expect(r.events[0]!.casualties).toBe(bajas);
  });

  test('el daño directo no mata más de los que hay', () => {
    const r = prepareBattle(
      ejercito(u('m')),
      [{ unit: u('s', { hitPoints: 1 }), count: 3 }],
      [item({ kind: 'directDamage', damageType: 'cold', base: 100_000, perUnit: { min: 1, max: 3 } })],
      [],
      azar(),
    );
    expect(r.defender.stacks[0]!.count).toBe(0);
    expect(r.events[0]!.casualties).toBe(3);
  });

  test('el Agua Bendita solo toca a los no muertos', () => {
    const r = prepareBattle(
      ejercito(u('m')),
      [
        { unit: u('z', { race: 'undead', hitPoints: 100 }), count: 5_000 },
        { unit: u('h', { race: 'human', hitPoints: 100 }), count: 5_000 },
      ],
      [item({ kind: 'damageToRace', damageType: 'holy', race: 'undead', damage: 100_000 })],
      [],
      azar(),
    );
    expect(r.defender.stacks.find((s) => s.unit.id === 'z')!.count).toBe(4_000);
    expect(r.defender.stacks.find((s) => s.unit.id === 'h')!.count).toBe(5_000);
  });

  test('la Cabeza de Medusa destruye entre 1 y 10 unidades', () => {
    const r = prepareBattle(
      ejercito(u('m')),
      [{ unit: u('s'), count: 1_000 }],
      [item({ kind: 'destroyUnits', side: 'enemy', amount: { min: 1, max: 10 } })],
      [],
      azar(),
    );
    const bajas = 1_000 - r.defender.stacks[0]!.count;
    expect(bajas).toBeGreaterThanOrEqual(1);
    expect(bajas).toBeLessThanOrEqual(10);
  });

  test('el Zurrón de Niebla baja el acierto de LOS DOS bandos', () => {
    // Un item que también te perjudica: sirve al que pega fuerte por golpe.
    const r = prepareBattle(
      ejercito(u('m')),
      ejercito(u('s')),
      [item({ kind: 'accuracy', side: 'enemy', delta: -10, bothSides: true })],
      [],
      azar(),
    );
    expect(r.attacker.accuracyDelta).toBe(-10);
    expect(r.defender.accuracyDelta).toBe(-10);
  });

  test('el Vial de Veneno añade Poison a quien pega en melee', () => {
    const r = prepareBattle(
      [{ unit: u('m'), count: 10 }, { unit: u('a', { attack: { power: 1, types: ['magic'], initiative: 3 } }), count: 10 }],
      ejercito(u('s')),
      [item({ kind: 'addDamageType', side: 'friendly', add: 'poison', ifHas: 'melee' })],
      [],
      azar(),
    );
    expect(r.attacker.stacks.find((s) => s.unit.id === 'm')!.unit.attack.types).toContain('poison');
    expect(r.attacker.stacks.find((s) => s.unit.id === 'a')!.unit.attack.types).not.toContain('poison');
  });
});

describe('la resurrección combina complementos', () => {
  test('el ejemplo de la fuente: 30% + 20% + 25% ≈ 58%', () => {
    expect(resurrected(1_000, [0.3, 0.2, 0.25])).toBe(580);
  });

  test('apilar efectos nunca resucita al ejército entero', () => {
    expect(resurrected(1_000, [0.5, 0.5, 0.5, 0.5])).toBeLessThan(1_000);
  });

  test('se acumulan en el bando que los lleva', () => {
    const r = prepareBattle(
      ejercito(u('m')),
      ejercito(u('s')),
      [item({ kind: 'resurrect', share: 0.25 }), item({ kind: 'resurrect', share: 0.15 })],
      [],
      azar(),
    );
    expect(r.attacker.resurrectShares).toEqual([0.25, 0.15]);
    expect(r.defender.resurrectShares).toEqual([]);
  });
});

describe('la pre-batalla es reproducible', () => {
  test('misma semilla, mismo resultado', () => {
    const hacer = () =>
      prepareBattle(
        ejercito(u('m')),
        [{ unit: u('a'), count: 100 }, { unit: u('b'), count: 100 }],
        [item({ kind: 'destroyUnits', side: 'enemy', amount: { min: 1, max: 10 } })],
        [],
        makeRandom(42),
      );
    expect(hacer().defender.stacks.map((s) => s.count)).toEqual(
      hacer().defender.stacks.map((s) => s.count),
    );
  });
});
