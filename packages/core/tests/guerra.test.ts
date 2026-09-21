import { describe, expect, test } from 'vitest';
import { PILLAGE_MIN_POWER_SHARE, TURNS_PER_ATTACK, resolveAttack } from '../src/war.js';
import { netPower } from '../src/netpower.js';
import { CATALOG, TERRA, TUNING, mageWith, seededRandom } from './fixtures.js';
import type { Ctx, MageState } from '../src/types.js';

/**
 * Un ataque entero. docs/SISTEMAS.md §9.1.
 *
 * Los estados se **construyen**, no se juegan hasta ellos
 * (docs/ARQUITECTURA.md §6).
 */
void TUNING;

const ctx = (seed = 7): Ctx => ({
  now: 0,
  random: seededRandom(seed),
  server: TERRA,
  catalog: CATALOG,
});

const mago = (id: string, over: Partial<MageState> = {}): MageState => ({
  ...mageWith({ farms: 200, towns: 60, forts: 2 }, 1_000, {
    geld: 1_000_000,
    population: 50_000,
    army: [{ unitId: 'militia', count: 5_000 }],
  }),
  id,
  name: id,
  // Fuera de protección: ya gastó sus turnos iniciales.
  turnsSpent: TERRA.protectionTurns + 10,
  turns: { current: 100, lastAccrualAt: 0 },
  ...over,
});

describe('lo que impide atacar', () => {
  test('no puedes atacarte a ti mismo', () => {
    const a = mago('a');
    const r = resolveAttack(a, a, 'regular', ctx());
    expect(r).toMatchObject({ error: { code: 'objetivo_invalido' } });
  });

  test('sin turnos no se ataca', () => {
    const a = mago('a', { turns: { current: TURNS_PER_ATTACK - 1, lastAccrualAt: 0 } });
    expect(resolveAttack(a, mago('b'), 'regular', ctx())).toMatchObject({
      error: { code: 'sin_turnos' },
    });
  });

  test('un mago protegido no se puede tocar', () => {
    const b = mago('b', { turnsSpent: 0 });
    expect(resolveAttack(mago('a'), b, 'regular', ctx())).toMatchObject({
      error: { code: 'objetivo_protegido' },
    });
  });

  test('sin ejército no se ataca', () => {
    const a = mago('a', { army: [] });
    expect(resolveAttack(a, mago('b'), 'regular', ctx())).toMatchObject({
      error: { code: 'sin_ejercito' },
    });
  });

  test('sin geld para el upkeep del ejército entero, tampoco', () => {
    // **[orig]** Atacar cuesta el upkeep de TODO tu ejército por delante.
    const a = mago('a', { resources: { geld: 0, mana: 0, population: 50_000 } });
    expect(resolveAttack(a, mago('b'), 'regular', ctx())).toMatchObject({
      error: { code: 'sin_geld_para_upkeep' },
    });
  });

  test('todos son errores de dominio, no excepciones', () => {
    // Invariante 9: «no tienes turnos» es juego, no avería.
    expect(() => resolveAttack(mago('a', { army: [] }), mago('b'), 'regular', ctx())).not.toThrow();
  });
});

describe('el límite del 50% de net power para el saqueo', () => {
  test('no se puede saquear a quien tiene menos de la mitad de tu poder', () => {
    expect(PILLAGE_MIN_POWER_SHARE).toBe(0.5);
    const a = mago('a');
    const enano = mago('b', {
      ...mageWith({ farms: 5 }, 20, { geld: 10, population: 100, army: [] }),
      id: 'b',
      turnsSpent: TERRA.protectionTurns + 10,
    });
    expect(netPower(enano, CATALOG)).toBeLessThan(netPower(a, CATALOG) * 0.5);
    expect(resolveAttack(a, enano, 'pillage', ctx())).toMatchObject({
      error: { code: 'objetivo_debil' },
    });
  });

  test('pero SÍ se le puede atacar en regular: el límite es solo del saqueo', () => {
    // Sin esto, machacar novatos sería la estrategia óptima — el saqueo no
    // tiene coste de batalla. Conquistar tierra sí lo tiene.
    const enano = mago('b', {
      ...mageWith({ farms: 5 }, 20, { geld: 10, population: 100, army: [] }),
      id: 'b',
      turnsSpent: TERRA.protectionTurns + 10,
    });
    const r = resolveAttack(mago('a'), enano, 'regular', ctx());
    expect('error' in r).toBe(false);
  });
});

describe('un ataque que sale bien', () => {
  const r = resolveAttack(
    mago('a', { army: [{ unitId: 'militia', count: 50_000 }] }),
    mago('b', { army: [{ unitId: 'militia', count: 100 }] }),
    'siege',
    ctx(3),
  );
  if ('error' in r) throw new Error('el ataque de referencia falló: ' + r.error.code);

  test('cuesta turnos, y los cuenta como gastados', () => {
    expect(r.attacker.turns.current).toBe(100 - TURNS_PER_ATTACK);
    expect(r.attacker.turnsSpent).toBe(TERRA.protectionTurns + 10 + TURNS_PER_ATTACK);
  });

  test('cobra el upkeep del ejército por delante', () => {
    expect(r.attacker.resources.geld).toBeLessThan(1_000_000);
  });

  test('la tierra que gana el atacante es la que pierde el defensor, menos lo destruido', () => {
    expect(r.battle.landTaken).toBeLessThanOrEqual(r.battle.landLost);
    expect(r.attacker.land.total).toBe(1_000 + r.battle.landTaken);
    expect(r.defender.land.total).toBe(1_000 - r.battle.landLost);
  });

  test('se destruye más de lo que se roba', () => {
    if (r.battle.landLost > 0) {
      expect(r.battle.summary.landDestroyed as number).toBeGreaterThan(r.battle.landTaken);
    }
  });

  test('la semilla se guarda con la batalla', () => {
    expect(Number.isInteger(r.battle.seed)).toBe(true);
    expect(r.battle.seed).toBeGreaterThanOrEqual(0);
  });

  test('LOS DOS magos reciben el evento en su crónica', () => {
    // El defensor tiene derecho a saber que le han atacado sin tener que
    // deducirlo de que le falta tierra.
    expect(r.events.map((e) => e.mageId).sort()).toEqual(['a', 'b']);
  });

  test('el ejército que queda es el que sobrevivió', () => {
    const vivos = r.attacker.army.reduce((a, s) => a + s.count, 0);
    expect(vivos).toBeLessThanOrEqual(50_000);
    expect(vivos).toBeGreaterThan(0);
  });

  test('todo entero: ninguna batalla deja unidades fraccionarias', () => {
    for (const st of [...r.attacker.army, ...r.defender.army]) {
      expect(Number.isInteger(st.count)).toBe(true);
    }
    expect(Number.isInteger(r.attacker.land.total)).toBe(true);
    expect(Number.isInteger(r.defender.land.total)).toBe(true);
  });
});

describe('el ataque es reproducible de punta a punta', () => {
  test('misma semilla, mismo resultado completo', () => {
    const uno = resolveAttack(mago('a'), mago('b'), 'regular', ctx(11));
    const dos = resolveAttack(mago('a'), mago('b'), 'regular', ctx(11));
    expect(uno).toEqual(dos);
  });
});

describe('el saqueo', () => {
  test('roba geld y no quita tierra', () => {
    const a = mago('a', { army: [{ unitId: 'militia', count: 50_000 }] });
    const b = mago('b', { army: [{ unitId: 'militia', count: 100 }] });
    const r = resolveAttack(a, b, 'pillage', ctx(5));
    if ('error' in r) throw new Error(r.error.code);
    expect(r.battle.landLost).toBe(0);
    expect(r.defender.land.total).toBe(1_000);
    if ((r.battle.summary as { breached?: boolean }).breached) {
      expect(r.attacker.resources.geld).toBeGreaterThan(a.resources.geld - 100_000);
      expect(r.defender.resources.geld).toBeLessThan(b.resources.geld);
    }
  });
});

describe('los items de batalla se aplican en un ataque de VERDAD', () => {
  /**
   * **Ésta era la deuda de la fase 4.** `war.ts` llamaba a
   * `resolveBattle()` directamente y nunca a `prepareBattle()`: la capa
   * estaba escrita, probada con 21 tests y **desconectada**. Un ataque
   * real no aplicaba ni un item.
   *
   * El canario del arreglo: **sin items, el resultado es el mismo que
   * antes**. Los 568 tests de las fases 1-4 lo comprobaron al enchufarla.
   */
  const conItems = (items: Record<string, number>) =>
    mago('a', { army: [{ unitId: 'militia', count: 50_000 }], items });

  test('sin items, el ataque da exactamente lo mismo', () => {
    const sin = resolveAttack(conItems({}), mago('b'), 'regular', ctx(21));
    const otra = resolveAttack(conItems({}), mago('b'), 'regular', ctx(21));
    expect(sin).toEqual(otra);
  });

  test('el log de pre-batalla aparece en el resumen', () => {
    const r = resolveAttack(conItems({ potion_of_valor: 1 }), mago('b'), 'regular', ctx(21));
    if ('error' in r) throw new Error(r.error.code);
    expect(Array.isArray(r.battle.summary.preBattle)).toBe(true);
  });

  test('un item de batalla CAMBIA el resultado', () => {
    // Con la Poción de Valor el atacante pega un 20% más, así que el
    // defensor pierde más unidades con la misma semilla.
    //
    // **El defensor tiene que poder sobrevivir**, o la diferencia no se
    // ve: con 5.000 contra 50.000 muere entero en los dos casos y el test
    // pasaría por el motivo equivocado. Le pasó a la primera versión.
    const gordo = mago('b', { army: [{ unitId: 'militia', count: 400_000 }] });
    const sin = resolveAttack(conItems({}), gordo, 'regular', ctx(21));
    const con = resolveAttack(conItems({ potion_of_valor: 1 }), gordo, 'regular', ctx(21));
    if ('error' in sin || 'error' in con) throw new Error('el ataque falló');
    expect(con.battle.summary.defenderLosses).toBeGreaterThan(
      sin.battle.summary.defenderLosses as number,
    );
  });

  test('y la resurrección de post-batalla se apunta', () => {
    const r = resolveAttack(conItems({ strange_metallic_can: 1 }), mago('b'), 'regular', ctx(21));
    if ('error' in r) throw new Error(r.error.code);
    expect(typeof r.battle.summary.attackerResurrected).toBe('number');
  });
});
