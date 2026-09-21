import { describe, expect, test } from 'vitest';
import { makeRandom, rollRange } from '@archmage/core';
import { BATTLE_ITEM_IDS, ITEMS, ITEMS_BY_ID, USABLE_ITEM_IDS } from '../src/items.js';

/**
 * El catálogo de items. docs/SISTEMAS.md §12.1, de docs/ORIGINAL.md §7.2
 * (publicado, confianza alta).
 *
 * **Lo que más importa: que los publicados salgan clavados.** El día que
 * alguien «redondee» un número, el catálogo deja de poder rastrearse hasta
 * la fuente — que es exactamente lo que pasó con los upkeeps de unidad en
 * la fase 1 y costó una recalibración entera.
 */
describe('criterio 8 bis — los items publicados salen clavados', () => {
  test('la Piedra del Sabio da entre 1 y 2 millones de geld', () => {
    expect(ITEMS_BY_ID.sage_stone!.effect).toEqual({
      kind: 'grantGeld',
      amount: { min: 1_000_000, max: 2_000_000 },
    });
  });

  test('el Muñeco Vudú destruye entre 2 y 8 turnos', () => {
    // **Los turnos son un objetivo militar**, y eso solo tiene sentido
    // porque el turno es la moneda (docs/SISTEMAS.md §2).
    expect(ITEMS_BY_ID.voodoo_doll!.effect).toEqual({
      kind: 'enemyTurns',
      amount: { min: 2, max: 8 },
    });
    expect(ITEMS_BY_ID.voodoo_doll!.targeted).toBe(true);
  });

  test('la Figurilla de la Reina de Hielo hace 100.000 + [1-3 × unidades]', () => {
    expect(ITEMS_BY_ID.figurine_ice_queen!.effect).toEqual({
      kind: 'directDamage',
      damageType: 'cold',
      base: 100_000,
      perUnit: { min: 1, max: 3 },
    });
  });

  test('el Barril de Pólvora NO lleva el base de 100.000', () => {
    // La fuente lo dice así, y es lo que lo distingue de sus tres hermanos:
    // solo `1-3 × unidades`.
    expect((ITEMS_BY_ID.powder_keg!.effect as { base: number }).base).toBe(0);
  });

  test('las Flautas de la Cloaca destruyen EXACTAMENTE 500.000 y 7.500', () => {
    // El único de los cuatro ataques sin batalla que no tira dado.
    expect(ITEMS_BY_ID.pipes_of_the_sewer!.effect).toEqual({
      kind: 'enemyGeldAndPopulation',
      geld: 500_000,
      population: 7_500,
    });
  });

  test('el Escudo contra Proyectiles topa la resistencia en 100', () => {
    expect(ITEMS_BY_ID.missile_shield!.effect).toMatchObject({ delta: 50, cap: 100 });
  });

  test('los Frascos de Aceite NO topan por abajo: pueden dejarla negativa', () => {
    const e = ITEMS_BY_ID.oil_flasks!.effect as { delta: number; cap?: number };
    expect(e.delta).toBe(-40);
    expect(e.cap).toBeUndefined();
  });

  test('el Cofre del Tesoro da un unique el 2% de las veces', () => {
    const e = ITEMS_BY_ID.treasure_chest!.effect as {
      options: { weight: number; effect: { kind: string } | null }[];
    };
    const unique = e.options.find((o) => o.effect?.kind === 'grantUniqueItem');
    expect(unique!.weight).toBe(0.02);
    // Y los pesos suman 1, o habría resultados imposibles.
    expect(e.options.reduce((a, o) => a + o.weight, 0)).toBeCloseTo(1, 10);
  });
});

describe('la forma del catálogo', () => {
  test('ningún id se repite', () => {
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
  });

  test('cada item dice de dónde sale su número', () => {
    for (const i of ITEMS) expect(i.source, i.id).toContain('[orig]');
  });

  test('hay items de batalla y de fuera, y las dos listas no se solapan', () => {
    expect(BATTLE_ITEM_IDS.length).toBeGreaterThan(15);
    expect(USABLE_ITEM_IDS.length).toBeGreaterThan(10);
    for (const id of BATTLE_ITEM_IDS) expect(USABLE_ITEM_IDS).not.toContain(id);
  });

  test('los tres deshabilitados en el original NO están', () => {
    // *Bottle of Eversmoking*, *Cosmetics* y *Dozens of Silver-tipped
    // Arrows* están apagados en el propio juego. Meterlos sería copiar mal.
    for (const id of ['bottle_of_eversmoking', 'cosmetics', 'silver_tipped_arrows']) {
      expect(ITEMS_BY_ID[id]).toBeUndefined();
    }
  });

  test('los tres que no se pueden implementar entran como dato y dicen por qué', () => {
    // Un hueco declarado es deuda; uno callado es un fallo esperando.
    for (const id of ['crystal_ball', 'minor_indulgence', 'blood_stained_map']) {
      const e = ITEMS_BY_ID[id]!.effect as { kind: string; why?: string };
      expect(e.kind, id).toBe('notImplemented');
      expect(e.why!.length, id).toBeGreaterThan(20);
    }
    // Y no aparecen entre los usables, así que nadie los ofrece.
    expect(USABLE_ITEM_IDS).not.toContain('crystal_ball');
  });

  test('todos los rangos van de menos a más, y son enteros', () => {
    const rangos: { min: number; max: number }[] = [];
    const buscar = (e: unknown) => {
      if (!e || typeof e !== 'object') return;
      for (const [k, v] of Object.entries(e as Record<string, unknown>)) {
        if (k === 'amount' || k === 'perUnit') rangos.push(v as { min: number; max: number });
        else if (typeof v === 'object') buscar(v);
      }
    };
    for (const i of ITEMS) buscar(i.effect);
    expect(rangos.length).toBeGreaterThan(10);
    for (const r of rangos) {
      expect(Number.isInteger(r.min)).toBe(true);
      expect(Number.isInteger(r.max)).toBe(true);
      expect(r.max).toBeGreaterThanOrEqual(r.min);
    }
  });
});

describe('tirar un rango', () => {
  test('es inclusivo en los dos extremos', () => {
    // «2-8 turnos» incluye el 2 y el 8. Un rango que no llegase a su máximo
    // haría que el item publicado no fuera el publicado.
    const vistos = new Set<number>();
    for (let s = 1; s <= 400; s++) vistos.add(rollRange({ min: 2, max: 8 }, makeRandom(s)));
    expect(vistos.has(2)).toBe(true);
    expect(vistos.has(8)).toBe(true);
    expect([...vistos].every((v) => v >= 2 && v <= 8)).toBe(true);
  });

  test('un rango de un solo valor no revienta', () => {
    expect(rollRange({ min: 5, max: 5 }, makeRandom(1))).toBe(5);
  });
});
