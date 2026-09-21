import { describe, expect, test } from 'vitest';
import { PUBLISHED_UNITS, UNITS, UNITS_BY_ID } from '../src/units.js';

/**
 * Las fichas de unidad. Spec en docs/SISTEMAS.md §9.1.
 *
 * Lo que más importa: **que las siete publicadas salgan clavadas**. Si
 * alguien las «redondea», el catálogo deja de poder rastrearse hasta
 * docs/ORIGINAL.md §9.5 y la fidelidad se pierde en silencio — que es
 * exactamente lo que pasó con los upkeeps de la fase 1.
 */
describe('las siete fichas publicadas salen clavadas', () => {
  test('Milicia — 80/20, HP 80, iniciativa 1, rank 9, recluta 20 y cuesta 0,32', () => {
    const u = UNITS_BY_ID.militia!;
    expect([u.attack.power, u.counterAttack, u.hitPoints, u.attack.initiative]).toEqual([80, 20, 80, 1]);
    expect(u.powerRank).toBe(9);
    expect(u.cost).toBe(20);
    expect(u.costPopulation).toBe(1);
    expect(u.upkeepGeld).toBe(32); // centésimas: 0,32
  });

  test('Dríade — 240 Magic+Ranged, HP 70, rank 23, 0,80 geld y 0,01 maná', () => {
    const u = UNITS_BY_ID.dryad!;
    expect(u.attack).toEqual({ power: 240, types: ['magic', 'ranged'], initiative: 3 });
    expect([u.hitPoints, u.powerRank, u.upkeepGeld, u.upkeepMana]).toEqual([70, 23, 80, 1]);
    expect(u.abilities).toEqual(['beauty', 'charm']);
  });

  test('Ninfa — 940 Psychic+Ranged, HP 150, rank 62', () => {
    const u = UNITS_BY_ID.nymph!;
    expect([u.attack.power, u.hitPoints, u.powerRank]).toEqual([940, 150, 62]);
    expect(u.attack.types).toEqual(['psychic', 'ranged']);
  });

  test('Arquero élfico — 120 Missile+Ranged, HP 100, rank 20, 1,04 de geld', () => {
    const u = UNITS_BY_ID.elven_archer!;
    expect([u.attack.power, u.hitPoints, u.powerRank, u.upkeepGeld]).toEqual([120, 100, 20, 104]);
    expect(u.abilities).toContain('marksmanship');
  });

  test('Druida — 440/60, HP 180, rank 40', () => {
    const u = UNITS_BY_ID.druid!;
    expect([u.attack.power, u.counterAttack, u.hitPoints, u.powerRank]).toEqual([440, 60, 180, 40]);
  });

  test('Treant — 4.200/1.680, extra 2.500, HP 4.200, rank 423, débil al fuego', () => {
    const u = UNITS_BY_ID.treant!;
    expect([u.attack.power, u.counterAttack, u.hitPoints, u.powerRank]).toEqual([4_200, 1_680, 4_200, 423]);
    expect(u.extraAttack?.power).toBe(2_500);
    expect(u.upkeepMana).toBe(63); // 0,63
    expect(u.resistances.fire).toBe(0);
    expect(u.resistances.melee).toBe(67);
    expect(u.spellResistances.phantasm).toBe(80);
  });

  test('Fénix — 200.000, extra 600.000 con iniciativa 5, rank 36.883', () => {
    const u = UNITS_BY_ID.phoenix!;
    expect([u.attack.power, u.hitPoints, u.powerRank]).toEqual([200_000, 70_000, 36_883]);
    expect(u.extraAttack).toEqual({ power: 600_000, types: ['magic', 'ranged'], initiative: 5 });
    expect(u.upkeepMana).toBe(6_000); // 60,00
    expect(u.resistances.fire).toBe(100);
  });

  test('las siete dicen que su ficha es del original', () => {
    for (const id of PUBLISHED_UNITS) {
      expect(UNITS_BY_ID[id]!.source, id).toContain('[orig] FICHA PUBLICADA');
    }
  });
});

describe('lo que esto corrige de las fases 1 y 2', () => {
  test('los upkeeps inventados eran entre 40 y 100 veces más caros', () => {
    // La fase 2 puso 1 de maná a la Dríade (100 centésimas) y 24 al Treant
    // (2.400). Los reales son 1 y 63 centésimas.
    expect(UNITS_BY_ID.dryad!.upkeepMana).toBe(1);
    expect(UNITS_BY_ID.treant!.upkeepMana).toBe(63);
    expect(100 / UNITS_BY_ID.dryad!.upkeepMana).toBe(100);
  });

  test('la Milicia costaba 60 de geld y cuesta 20', () => {
    expect(UNITS_BY_ID.militia!.cost).toBe(20);
  });

  test('varias invocadas cuestan geld ADEMÁS de maná', () => {
    // La fase 2 asumía que lo invocado solo costaba maná. Es falso, y lo
    // dicen las **fichas publicadas**: el Arquero élfico cuesta 1,04 de geld
    // y 0,005 de maná. Las tres publicadas son la prueba; las otras dos
    // están interpoladas con la misma regla.
    for (const id of ['dryad', 'druid', 'elven_archer'] as const) {
      expect(UNITS_BY_ID[id]!.upkeepGeld, id).toBeGreaterThan(0);
      expect(UNITS_BY_ID[id]!.source, id).toContain('[orig]');
    }
    const conGeld = UNITS.filter((u) => u.recruitPerBarracks === 0 && u.upkeepGeld > 0);
    expect(conGeld.map((u) => u.id).sort()).toEqual([
      'creeping_vines',
      'druid',
      'dryad',
      'elven_archer',
      'gorilla',
    ]);
  });
});

describe('la forma del catálogo', () => {
  test('veinte unidades, con ids únicos', () => {
    expect(UNITS).toHaveLength(20);
    expect(new Set(UNITS.map((u) => u.id)).size).toBe(20);
  });

  test('todos los números son enteros y no negativos', () => {
    for (const u of UNITS) {
      for (const [k, v] of Object.entries({
        ataque: u.attack.power,
        contra: u.counterAttack,
        hp: u.hitPoints,
        rank: u.powerRank,
        geld: u.upkeepGeld,
        mana: u.upkeepMana,
        coste: u.cost,
      })) {
        expect(Number.isInteger(v), `${u.id}.${k}`).toBe(true);
        expect(v, `${u.id}.${k}`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('la iniciativa está entre 0 y 5', () => {
    // docs/SISTEMAS.md §9.1 [nuestro]: las fuentes dan 0-7, 0-6 y «1-5»;
    // las fichas reales usan 1, 3 y 5.
    for (const u of UNITS) {
      expect(u.attack.initiative, u.id).toBeGreaterThanOrEqual(0);
      expect(u.attack.initiative, u.id).toBeLessThanOrEqual(5);
      if (u.extraAttack) expect(u.extraAttack.initiative, u.id).toBeLessThanOrEqual(5);
    }
  });

  test('cada unidad dice de dónde salen sus números', () => {
    for (const u of UNITS) expect(u.source, u.id).toMatch(/\[orig\]|\[nuestro\]/);
  });

  test('el powerRank crece con el poder de la unidad', () => {
    const ordenadas = [...UNITS].sort((a, b) => a.powerRank - b.powerRank);
    expect(ordenadas[0]!.id).toBe('militia');
    expect(ordenadas[ordenadas.length - 1]!.id).toBe('phoenix');
  });

  test('solo la tropa de barracks se recluta; lo demás se invoca', () => {
    const reclutables = UNITS.filter((u) => u.recruitPerBarracks > 0).map((u) => u.id);
    expect(reclutables.sort()).toEqual(['archers', 'cavalry', 'militia', 'phalanx', 'pikemen']);
    for (const u of UNITS) {
      if (u.recruitPerBarracks === 0) expect(u.cost, u.id).toBe(0);
    }
  });

  test('toda unidad con ataque extra lo tiene declarado con su iniciativa', () => {
    for (const u of UNITS) {
      if (!u.extraAttack) continue;
      expect(u.extraAttack.power, u.id).toBeGreaterThan(0);
      expect(u.extraAttack.types.length, u.id).toBeGreaterThan(0);
    }
  });
});
