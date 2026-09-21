import { describe, expect, test } from 'vitest';
import { ITEM_TURNS_AT_5_PERCENT, itemsPerTurn, itemsPillaged } from '../src/items.js';
import type { ItemSpec } from '../src/items.js';

/** Generación y robo de items. docs/SISTEMAS.md §12.1, criterios 8 y 9. */
const cat: Record<string, ItemSpec> = {
  lesser_a: { id: 'lesser_a', name: 'a', rarity: 'lesser' } as ItemSpec,
  lesser_b: { id: 'lesser_b', name: 'b', rarity: 'lesser' } as ItemSpec,
  unico: { id: 'unico', name: 'u', rarity: 'unique' } as ItemSpec,
};

describe('criterio 8 — la generación depende del % de guilds', () => {
  test('al 5% sale un item cada 40 turnos', () => {
    expect(ITEM_TURNS_AT_5_PERCENT).toBe(40);
    expect(1 / itemsPerTurn(250, 5_000)).toBeCloseTo(40, 6);
  });

  test('al 10% el DOBLE de ritmo que al 5%', () => {
    expect(itemsPerTurn(500, 5_000) / itemsPerTurn(250, 5_000)).toBeCloseTo(2, 10);
  });

  test('sin guilds no sale ninguno', () => {
    expect(itemsPerTurn(0, 5_000)).toBe(0);
    expect(itemsPerTurn(-5, 5_000)).toBe(0);
    expect(itemsPerTurn(250, 0)).toBe(0);
  });

  test('es el PORCENTAJE, no el número: el tamaño no premia', () => {
    // Un mago de 500 acres al 5% saca lo mismo que uno de 5.000 al 5%. Así
    // el item es una decisión de reparto y no un premio por ser grande, que
    // ya lo es todo lo demás.
    expect(itemsPerTurn(25, 500)).toBeCloseTo(itemsPerTurn(250, 5_000), 10);
  });

  test('Legendary Artificer sube el ritmo', () => {
    expect(itemsPerTurn(250, 5_000, 1.2) / itemsPerTurn(250, 5_000)).toBeCloseTo(1.2, 10);
  });

  test('devuelve fracción, que se acumula', () => {
    expect(itemsPerTurn(250, 5_000)).toBeLessThan(1);
    expect(itemsPerTurn(250, 5_000)).toBeGreaterThan(0);
  });
});

describe('criterio 9 — el saqueo roba lesser y DEJA los uniques', () => {
  test('se lleva lesser y no toca el unique', () => {
    const r = itemsPillaged({ lesser_a: 8, lesser_b: 4, unico: 1 }, cat);
    expect(r).toEqual({ lesser_a: 2, lesser_b: 1 });
    expect(r.unico).toBeUndefined();
  });

  test('roba un cuarto, redondeando hacia abajo', () => {
    // Robar a quien tiene tres items se lleva cero: hay que atacar a quien
    // de verdad acumula.
    expect(itemsPillaged({ lesser_a: 3 }, cat)).toEqual({});
    expect(itemsPillaged({ lesser_a: 4 }, cat)).toEqual({ lesser_a: 1 });
  });

  test('un item que no está en el catálogo se ignora', () => {
    expect(itemsPillaged({ fantasma: 100 }, cat)).toEqual({});
  });

  test('un inventario vacío no revienta', () => {
    expect(itemsPillaged({}, cat)).toEqual({});
  });

  test('nunca devuelve cantidades fraccionarias ni negativas', () => {
    for (const n of [1, 7, 13, 99, 1_000]) {
      const r = itemsPillaged({ lesser_a: n }, cat);
      const v = r.lesser_a ?? 0;
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(n);
    }
  });
});
