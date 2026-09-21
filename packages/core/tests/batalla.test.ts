import { describe, expect, test } from 'vitest';
import { MAX_ROUNDS, armyPower, battleBonus, resolveBattle } from '../src/battle.js';
import { makeRandom } from '../src/random.js';
import type { UnitSpec } from '../src/units.js';

/**
 * La ronda y la batalla entera. docs/SISTEMAS.md §9.1.
 *
 * Aquí está el criterio 6: **misma semilla, log idéntico**. Sin eso la
 * repetición que se le enseña al jugador es una animación bonita, no lo que
 * pasó.
 */
const u = (id: string, over: Partial<UnitSpec> = {}): UnitSpec =>
  ({
    id,
    name: id,
    abilities: [],
    weaknesses: [],
    resistances: {},
    spellResistances: {},
    attack: { power: 100, types: ['melee'], initiative: 3 },
    counterAttack: 0,
    hitPoints: 100,
    powerRank: 10,
    populationSpace: 1,
    recruitPerBarracks: 0,
    cost: 0,
    costPopulation: 0,
    upkeepGeld: 0,
    upkeepMana: 0,
    ...over,
  } as UnitSpec);

const soldado = u('soldado');
const volador = u('volador', { abilities: ['flying'] });
const rapido = u('rapido', { attack: { power: 100, types: ['melee'], initiative: 5 } });
const pasivo = u('pasivo', { attack: { power: 0, types: ['melee'], initiative: 0 } });

const batalla = (a: UnitSpec, na: number, d: UnitSpec, nd: number, seed = 7, tipo: any = 'regular') =>
  resolveBattle(
    { stacks: [{ unit: a, count: na }] },
    { stacks: [{ unit: d, count: nd }] },
    { seed, random: makeRandom(seed), attackType: tipo },
  );

describe('criterio 6 — toda batalla es reproducible', () => {
  test('misma semilla, log idéntico golpe a golpe', () => {
    const a = batalla(soldado, 1_000, soldado, 1_000, 42);
    const b = batalla(soldado, 1_000, soldado, 1_000, 42);
    expect(a.log).toEqual(b.log);
    expect(a.attacker.survivors).toEqual(b.attacker.survivors);
    expect(a.defender.survivors).toEqual(b.defender.survivors);
  });

  test('semilla distinta, resultado distinto', () => {
    // Si no, el azar no estaría entrando: sería determinista de más.
    const a = batalla(soldado, 1_000, soldado, 1_000, 1);
    const b = batalla(soldado, 1_000, soldado, 1_000, 2);
    expect(a.log).not.toEqual(b.log);
  });

  test('la semilla se guarda con el resultado', () => {
    // docs/SPECS.md §5, invariante 3: sin esto la repetición no se puede
    // reconstruir aunque el log sea perfecto.
    expect(batalla(soldado, 100, soldado, 100, 99).seed).toBe(99);
  });

  test('cada golpe apunta los términos que se le aplicaron', () => {
    const r = batalla(soldado, 1_000, soldado, 1_000, 5);
    const g = r.log[0]!;
    expect(g).toMatchObject({ round: 0, kind: 'primary', accuracy: 30 });
    expect(g.randomFactor).toBeGreaterThanOrEqual(0.25);
    expect(g.randomFactor).toBeLessThanOrEqual(0.75);
    expect(g.efficiency).toBe(100);
    expect(typeof g.casualties).toBe('number');
  });
});

describe('la ronda', () => {
  test('ataca antes quien tiene más iniciativa', () => {
    const r = resolveBattle(
      { stacks: [{ unit: soldado, count: 100 }] },
      { stacks: [{ unit: rapido, count: 100 }] },
      { seed: 3, random: makeRandom(3), attackType: 'regular' },
    );
    expect(r.log[0]!.attackerUnit).toBe('rapido');
  });

  test('con iniciativa 0 no se ataca', () => {
    const r = resolveBattle(
      { stacks: [{ unit: pasivo, count: 100 }] },
      { stacks: [{ unit: pasivo, count: 100 }] },
      { seed: 3, random: makeRandom(3), attackType: 'regular' },
    );
    expect(r.log).toHaveLength(0);
  });

  test('el ataque extra va con SU iniciativa, no con la del primario', () => {
    const fenix = u('fenix', {
      attack: { power: 100, types: ['melee'], initiative: 1 },
      extraAttack: { power: 100, types: ['melee'], initiative: 5 },
    });
    const r = resolveBattle(
      { stacks: [{ unit: fenix, count: 10 }] },
      { stacks: [{ unit: soldado, count: 10_000 }] },
      { seed: 3, random: makeRandom(3), attackType: 'regular' },
    );
    const primeros = r.log.filter((g) => g.side === 'attacker').slice(0, 2);
    expect(primeros[0]!.kind).toBe('extra');
  });

  test('la batalla para cuando un bando se queda sin nadie', () => {
    const r = batalla(soldado, 1_000_000, soldado, 10, 3);
    expect(r.defender.survivors.soldado).toBe(0);
    expect(r.rounds).toBeLessThan(MAX_ROUNDS);
  });

  test('las bajas se recortan a los que quedaban: nadie mata de más', () => {
    const r = batalla(soldado, 1_000_000, soldado, 10, 3);
    const muertos = r.log.reduce((a, g) => a + g.casualties, 0);
    expect(muertos).toBeLessThanOrEqual(1_000_010);
    expect(r.defender.losses).toBe(10);
  });

  test('termina cuando los dos bandos están agotados, no en el tope', () => {
    // **Se vio mirando la captura de la repetición, no en un test**: las
    // rondas 8, 9 y 10 eran todas «0 bajas, eficiencia 0». Ningún número
    // estaba mal; sobraban tres rondas de ruido. Con 15 de fatiga por
    // golpe, al séptimo nadie puede ya hacer nada.
    const duro = u('duro', { hitPoints: 10_000_000 });
    const r = batalla(duro, 10, duro, 10, 3);
    expect(r.rounds).toBe(7);
    expect(r.rounds).toBeLessThan(MAX_ROUNDS);
    expect(r.log.every((g) => g.efficiency > 0)).toBe(true);
  });

  test('y el tope de rondas sigue estando, por si acaso', () => {
    // Con Endurance se aguantan 10 golpes, así que ahí sí muerde el tope.
    const aguantador = u('aguantador', { hitPoints: 10_000_000, abilities: ['endurance'] });
    const r = batalla(aguantador, 10, aguantador, 10, 3);
    expect(r.rounds).toBe(MAX_ROUNDS);
  });
});

describe('criterio 5 en una batalla de verdad', () => {
  test('melee puro contra voladores puros no hace NADA', () => {
    const r = resolveBattle(
      { stacks: [{ unit: soldado, count: 100_000 }] },
      { stacks: [{ unit: volador, count: 100 }] },
      { seed: 3, random: makeRandom(3), attackType: 'regular' },
    );
    expect(r.defender.losses).toBe(0);
    expect(r.log.every((g) => g.side === 'defender')).toBe(true);
    // Y por tanto pierde el atacante, por muchos que sean.
    expect(r.winner).toBe('defender');
  });
});

describe('criterio 7 — quién gana', () => {
  test('gana quien pierde menos porcentaje de ejército', () => {
    const r = batalla(soldado, 5_000, soldado, 1_000, 11);
    expect(r.attacker.lossShare).toBeLessThan(r.defender.lossShare);
    expect(r.winner).toBe('attacker');
  });

  test('el empate lo gana el defensor', () => {
    // Atacar y no sacar ventaja es no haber conseguido nada.
    const r = resolveBattle(
      { stacks: [{ unit: pasivo, count: 100 }] },
      { stacks: [{ unit: pasivo, count: 100 }] },
      { seed: 3, random: makeRandom(3), attackType: 'regular' },
    );
    expect(r.attacker.lossShare).toBe(r.defender.lossShare);
    expect(r.winner).toBe('defender');
  });

  test('con 9% de bajas el defensor NO pierde tierra; con 11%, sí', () => {
    // El criterio tal cual: el umbral es el 10%.
    const construido = (share: number) => share > 0.1;
    expect(construido(0.09)).toBe(false);
    expect(construido(0.11)).toBe(true);
    // Y en una batalla de verdad:
    const flojo = batalla(soldado, 30, soldado, 100_000, 3);
    expect(flojo.defenderBreached).toBe(false);
    const fuerte = batalla(soldado, 100_000, soldado, 1_000, 3);
    expect(fuerte.defenderBreached).toBe(true);
  });
});

describe('el bonus de batalla', () => {
  test('sin doblar al rival no hay bonus', () => {
    expect(battleBonus(100, 100)).toBe(0);
    expect(battleBonus(199, 100)).toBe(0);
    expect(battleBonus(200, 100)).toBe(0);
  });

  test('1% por cada 2% que se pase del doble', () => {
    // Cuadruplicar es pasarse un 100% del doble: 50% de bonus.
    expect(battleBonus(400, 100)).toBeCloseTo(0.5, 10);
    // Triplicar es pasarse un 50% del doble: 25%.
    expect(battleBonus(300, 100)).toBeCloseTo(0.25, 10);
  });

  test('el bonus está topado en el 50%', () => {
    expect(battleBonus(1_000_000, 1)).toBe(0.5);
  });

  test('el poder de un ejército es número × rango', () => {
    expect(armyPower([{ unit: soldado, count: 100 }])).toBe(1_000);
  });
});

describe('un defensor sin ejército', () => {
  test('NO se protege quedándose sin tropas', () => {
    // **Encontrado en la pasada de navegador de la fase 3.** Con los dos
    // bandos perdiendo el 0% de su ejército, el empate daba la victoria al
    // defensor — así que disolver el ejército protegía la tierra. Es el
    // exploit más fácil de descubrir que puede tener un juego así.
    const r = resolveBattle(
      { stacks: [{ unit: soldado, count: 1_000 }] },
      { stacks: [] },
      { seed: 3, random: makeRandom(3), attackType: 'siege' },
    );
    expect(r.winner).toBe('attacker');
    expect(r.defenderBreached).toBe(true);
    expect(r.rounds).toBe(0);
  });

  test('pero sin atacante tampoco se gana', () => {
    const r = resolveBattle(
      { stacks: [] },
      { stacks: [{ unit: soldado, count: 10 }] },
      { seed: 3, random: makeRandom(3), attackType: 'siege' },
    );
    expect(r.winner).toBe('defender');
    expect(r.defenderBreached).toBe(false);
  });
});

describe('la penalización de asedio es solo del que asedia', () => {
  test('el atacante pega con 20 y el defensor con 30', () => {
    // **Encontrado leyendo el log en la pasada de navegador**: los dos
    // bandos aparecían con acierto 20. El asedio es algo que se *hace*, no
    // algo que se sufre — la fuente dice «base 30 en defensa y ataque
    // regular, 20 en asedio» (docs/ORIGINAL.md §9.1).
    const r = resolveBattle(
      { stacks: [{ unit: soldado, count: 1_000 }] },
      { stacks: [{ unit: soldado, count: 1_000 }] },
      { seed: 9, random: makeRandom(9), attackType: 'siege' },
    );
    const delAtacante = r.log.filter((g) => g.side === 'attacker');
    const delDefensor = r.log.filter((g) => g.side === 'defender');
    expect(delAtacante.length).toBeGreaterThan(0);
    expect(delDefensor.length).toBeGreaterThan(0);
    expect(delAtacante.every((g) => g.accuracy === 20)).toBe(true);
    expect(delDefensor.every((g) => g.accuracy === 30)).toBe(true);
  });

  test('en un ataque regular los dos pegan con 30', () => {
    const r = resolveBattle(
      { stacks: [{ unit: soldado, count: 1_000 }] },
      { stacks: [{ unit: soldado, count: 1_000 }] },
      { seed: 9, random: makeRandom(9), attackType: 'regular' },
    );
    expect(r.log.every((g) => g.accuracy === 30)).toBe(true);
  });
});
