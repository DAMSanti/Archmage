import { describe, expect, test } from 'vitest';
import {
  ALLY_HOME_STACKS,
  BREAK_DELAY_HOURS,
  breaksAt,
  canAlly,
  isActive,
  maxAllies,
  reinforcements,
  splitSurvivors,
} from '../src/alliance.js';
import type { Alliance } from '../src/alliance.js';
import type { UnitSpec } from '../src/units.js';

/** Alianzas y refuerzos. docs/SISTEMAS.md §14.1, criterios 4 a 7. */
const u = (id: string, rank: number): UnitSpec =>
  ({ id, name: id, powerRank: rank, abilities: [], weaknesses: [], resistances: {} } as unknown as UnitSpec);

const T0 = 1_700_000_000_000;
const HORA = 60 * 60 * 1000;

const alianza = (over: Partial<Alliance> = {}): Alliance => ({
  id: 'x',
  serverId: 'terra',
  a: 'ana',
  b: 'bruno',
  breakRequestedAt: null,
  ...over,
});

describe('cuántos aliados se pueden tener', () => {
  test('dos en el normal, uno en el rápido', () => {
    // En un servidor que va al doble de ritmo, dos aliados mandando
    // refuerzos harían que defender fuera casi gratis.
    expect(maxAllies('terra')).toBe(2);
    expect(maxAllies('veloz')).toBe(1);
  });

  test('el tercero no entra', () => {
    expect(canAlly('ana', 'z', 2, 0, false, 'terra')).toMatchObject({
      error: { code: 'demasiados_aliados' },
    });
  });

  test('y se mira a LOS DOS, no solo a quien propone', () => {
    // Si solo se mirara a quien propone, el que acepta podría acabar con
    // tres aliados aceptando tres propuestas.
    expect(canAlly('ana', 'z', 0, 2, false, 'terra')).toMatchObject({
      error: { code: 'demasiados_aliados' },
    });
  });

  test('no se alía uno consigo mismo', () => {
    expect(canAlly('ana', 'ana', 0, 0, false, 'terra')).toMatchObject({
      error: { code: 'contigo_no' },
    });
  });

  test('ni dos veces con el mismo', () => {
    expect(canAlly('ana', 'bruno', 0, 0, true, 'terra')).toMatchObject({
      error: { code: 'ya_sois_aliados' },
    });
  });

  test('y si hay sitio, se alían', () => {
    expect(canAlly('ana', 'bruno', 1, 0, false, 'terra')).toEqual({ ok: true });
  });
});

describe('criterio 7 — romper tarda 24 horas', () => {
  test('sin pedirlo, sigue activa para siempre', () => {
    expect(BREAK_DELAY_HOURS).toBe(24);
    expect(isActive(alianza(), T0 + 1_000 * HORA)).toBe(true);
    expect(breaksAt(alianza())).toBeNull();
  });

  test('DURANTE EL PLAZO los refuerzos siguen yendo', () => {
    // Sin esto, aliarse sería gratis: te ayudo mientras me conviene y me
    // borro justo antes de que me toque ayudar.
    const a = alianza({ breakRequestedAt: T0 });
    expect(isActive(a, T0 + 1 * HORA)).toBe(true);
    expect(isActive(a, T0 + 23 * HORA)).toBe(true);
  });

  test('y a las 24 horas se acabó', () => {
    const a = alianza({ breakRequestedAt: T0 });
    expect(isActive(a, T0 + 24 * HORA)).toBe(false);
    expect(breaksAt(a)).toBe(T0 + 24 * HORA);
  });
});

describe('criterio 5 — los dos stacks más potentes se quedan en casa', () => {
  const ejercito = [
    { unit: u('flojo', 1), count: 100 }, // 100
    { unit: u('medio', 10), count: 100 }, // 1.000
    { unit: u('fuerte', 100), count: 100 }, // 10.000
    { unit: u('elite', 1_000), count: 100 }, // 100.000
    { unit: u('tropa', 5), count: 100 }, // 500
  ];

  test('manda todos menos los dos mejores', () => {
    expect(ALLY_HOME_STACKS).toBe(2);
    const r = reinforcements(ejercito);
    expect(r.map((s) => s.unit.id).sort()).toEqual(['flojo', 'medio', 'tropa']);
  });

  test('y los que manda son los MENOS potentes', () => {
    const r = reinforcements(ejercito);
    expect(r.map((s) => s.unit.id)).not.toContain('elite');
    expect(r.map((s) => s.unit.id)).not.toContain('fuerte');
  });

  test('con dos stacks o menos no manda nada', () => {
    // Así una alianza no convierte a dos magos en uno: el que ayuda
    // siempre se queda con algo con que defenderse.
    expect(reinforcements(ejercito.slice(0, 2))).toEqual([]);
    expect(reinforcements([])).toEqual([]);
  });

  test('los stacks vacíos no cuentan como stack', () => {
    const conVacios = [
      { unit: u('a', 10), count: 0 },
      { unit: u('b', 10), count: 100 },
      { unit: u('c', 5), count: 100 },
      { unit: u('d', 1), count: 100 },
    ];
    // De los tres con unidades, se quedan los dos mejores y manda uno.
    expect(reinforcements(conVacios).map((s) => s.unit.id)).toEqual(['d']);
  });

  test('el orden es reproducible a igual poder', () => {
    const empate = [
      { unit: u('z', 10), count: 100 },
      { unit: u('a', 10), count: 100 },
      { unit: u('m', 10), count: 100 },
    ];
    expect(reinforcements(empate)).toEqual(reinforcements(empate));
  });
});

describe('criterio 9 — al aliado se le devuelve lo suyo', () => {
  test('el reparto es proporcional a lo que cada uno puso', () => {
    // **Sin esto, el defensor se queda con el ejército de su aliado** y
    // ayudar pasa a ser un negocio. Es el bug fácil de escribir y difícil
    // de ver de toda la fase.
    const r = splitSurvivors({ militia: 250 }, { militia: 100 }, { militia: 400 });
    expect(r.defender.militia).toBe(50);
    expect(r.ally.militia).toBe(200);
  });

  test('todo lo que sobrevive se reparte, sin perder ni inventar', () => {
    for (const vivos of [1, 7, 99, 1_001]) {
      const r = splitSurvivors({ m: vivos }, { m: 300 }, { m: 700 });
      expect((r.defender.m ?? 0) + (r.ally.m ?? 0)).toBe(vivos);
    }
  });

  test('el resto del redondeo se lo queda el defensor', () => {
    // Es quien eligió la batalla; el aliado solo pasaba por allí.
    const r = splitSurvivors({ m: 3 }, { m: 1 }, { m: 1 });
    expect(r.defender.m).toBe(2);
    expect(r.ally.m).toBe(1);
  });

  test('sin aliado, todo es del defensor', () => {
    const r = splitSurvivors({ m: 100 }, { m: 100 }, {});
    expect(r.defender.m).toBe(100);
    expect(r.ally.m).toBeUndefined();
  });

  test('una unidad que nadie puso no aparece', () => {
    expect(splitSurvivors({ fantasma: 10 }, {}, {})).toEqual({ defender: {}, ally: {} });
  });

  test('todo entero', () => {
    const r = splitSurvivors({ m: 777 }, { m: 123 }, { m: 456 });
    expect(Number.isInteger(r.defender.m)).toBe(true);
    expect(Number.isInteger(r.ally.m)).toBe(true);
  });
});
