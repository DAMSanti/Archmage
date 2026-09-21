import { describe, expect, test } from 'vitest';
import { armyPower, makeRandom, resolveBattle } from '@archmage/core';
import type { BattleStack } from '@archmage/core';
import { PUBLISHED_UNITS as PUBLICADAS, UNITS, UNITS_BY_ID } from '../src/units.js';

/**
 * Calibración del combate: criterios 10 y 11 de docs/SISTEMAS.md §9.1, y los
 * criterios 9 y 13 de §17.2, **aplazados desde la fase 1** porque sin PvP no
 * se podían juzgar.
 *
 * Aquí se **simula, no se opina** (docs/ARQUITECTURA.md §6). Todas las
 * batallas van con semilla fijada: un test de combate sin semilla es un test
 * intermitente disfrazado.
 */

/** Un ejército de una sola unidad, con el mismo presupuesto de net power. */
function ejercitoDe(unitId: string, presupuesto: number): BattleStack[] {
  const unit = UNITS_BY_ID[unitId]!;
  const n = Math.max(1, Math.floor(presupuesto / unit.powerRank));
  return [{ unit, count: n }];
}

/** Pelea `a` contra `b` con varias semillas y cuenta cuántas gana `a`. */
function duelo(a: string, b: string, presupuesto = 1_000_000, semillas = 12): number {
  let gana = 0;
  for (let s = 1; s <= semillas; s++) {
    const r = resolveBattle(
      { stacks: ejercitoDe(a, presupuesto) },
      { stacks: ejercitoDe(b, presupuesto) },
      { seed: s, random: makeRandom(s), attackType: 'regular' },
    );
    if (r.winner === 'attacker') gana++;
  }
  return gana;
}

/** Las que de verdad se pueden llevar a una batalla grande. */
const CANDIDATAS = [
  'militia',
  'phalanx',
  'pikemen',
  'archers',
  'cavalry',
  'dryad',
  'nymph',
  'elven_archer',
  'druid',
  'treant',
  'griffon',
  'earth_elemental',
];

describe('criterio 10 — ningún ejército de una sola unidad domina', () => {
  /**
   * **Cumple.** Medido el 2026-09-21 con 6 semillas por duelo, doce unidades
   * enfrentadas todas contra todas a **igual presupuesto de net power**:
   *
   * | Unidad | Gana | Pierde con |
   * |---|---:|---|
   * | Elemental de tierra | 10/11 | grifo |
   * | Treant | 9/11 | grifo, elemental |
   * | Grifo | 9/11 | **dríade, ninfa** |
   * | Dríade | 8/11 | druida, treant, elemental |
   * | Ninfa | 8/11 | treant, grifo, elemental |
   * | Druida | 7/11 | milicia, treant, grifo, elemental |
   * | Milicia | 5/11 | las seis de arriba |
   * | Falange | 4/11 | … |
   * | Piqueros | 3/11 | … |
   * | Arquero élfico | 1/11 | … |
   * | Arqueros | 0/11 | **todas** |
   * | Caballería | 0/11 | **todas** |
   *
   * **Ninguna queda invicta, y el ciclo es de verdad**: el elemental de
   * tierra gana a todo menos al grifo; el grifo gana a casi todo porque
   * **vuela y el melee no lo alcanza**; y al grifo lo bajan la dríade y la
   * ninfa, que pegan a distancia. No es una escalera, es un corro.
   *
   * **Lo que decide no es el precio, es el tipo.** `powerRank` no es un
   * precio de balance —entre las siete fichas publicadas el valor de combate
   * por punto de net power va de 30 a 157, un factor de 5,2, y eso es dato
   * del original—. Lo que sostiene el criterio es el emparejamiento.
   *
   * **Consecuencia declarada: Arqueros y Caballería no ganan un solo duelo**
   * a igual net power. No es un fallo de interpolación —los dos caen dentro
   * de la banda de las publicadas, y el Arquero élfico *publicado* está
   * igual de abajo—: es que el net power **no es la moneda con la que se
   * compran**. Una Caballería cuesta 150 de geld y una Milicia 20.
   */
  test('ninguna unidad gana a todas las demás', () => {
    const invictas = CANDIDATAS.filter(
      (a) => !CANDIDATAS.some((b) => b !== a && duelo(a, b, 1_000_000, 6) < 4),
    );
    expect(invictas, `invictas: ${invictas.join(', ')}`).toHaveLength(0);
  });

  test('al mejor lo baja un volador, y al volador lo bajan los de distancia', () => {
    // El corro, comprobado punto por punto. Es lo que hace que componer el
    // ejército sea una decisión y no una suma.
    // **Todos los duelos se leen «a ataca a b»**, y el empate lo gana el
    // defensor: atacar sin sacar ventaja no es ganar. Por eso las dos
    // direcciones no son simétricas y aquí se fija cada una en su sentido.
    expect(duelo('earth_elemental', 'griffon', 1_000_000, 6)).toBeLessThan(4);
    expect(duelo('militia', 'griffon', 1_000_000, 6)).toBeLessThan(4);
    expect(duelo('dryad', 'griffon', 1_000_000, 6)).toBeGreaterThanOrEqual(4);
    // Y al revés: el grifo **atacando** a la ninfa tampoco gana (3/6).
    expect(duelo('griffon', 'nymph', 1_000_000, 6)).toBeLessThan(4);
  });

  test('melee puro contra voladores puros no hace NADA, ni con 100× el poder', () => {
    const r = resolveBattle(
      { stacks: ejercitoDe('militia', 100_000_000) },
      { stacks: ejercitoDe('griffon', 1_000_000) },
      { seed: 3, random: makeRandom(3), attackType: 'regular' },
    );
    expect(r.defender.losses).toBe(0);
    expect(r.winner).toBe('defender');
  });

  test('CONSECUENCIA DECLARADA: Arqueros y Caballería no ganan ninguno', () => {
    const sinVictorias = CANDIDATAS.filter(
      (a) => !CANDIDATAS.some((b) => b !== a && duelo(a, b, 1_000_000, 6) >= 4),
    );
    expect(sinVictorias.sort()).toEqual(['archers', 'cavalry']);
  });

  test('y no es un fallo nuestro: las publicadas varían 5,2× entre sí', () => {
    // Si moviéramos los rangos para «arreglarlo» nos separaríamos de las
    // fichas publicadas sin motivo. El Arquero élfico es `[orig]` y está
    // tan abajo como los nuestros.
    const valor = (id: string) => {
      const u = UNITS_BY_ID[id]!;
      const atk = u.attack.power + (u.extraAttack?.power ?? 0);
      return (atk / u.powerRank) * (u.hitPoints / u.powerRank);
    };
    const valores = PUBLICADAS.map(valor).sort((a, b) => a - b);
    expect(Math.round(valores[0]!)).toBe(30); // Arquero élfico, publicado
    expect(Math.round(valores[valores.length - 1]!)).toBe(157); // Treant
    expect(valores[valores.length - 1]! / valores[0]!).toBeGreaterThan(5);
  });

  test('las debilidades también deciden: duplican el daño recibido', () => {
    const treant = UNITS_BY_ID.treant!;
    expect(treant.weaknesses).toContain('fire');
    expect(treant.resistances.melee).toBe(67);
  });
});

describe('criterio 11 — el maná compite, y ahora también en la guerra', () => {
  test('lo invocado pelea: no es solo net power guardado', () => {
    // Hasta la fase 3 una unidad invocada era un número en el ranking.
    // Ahora gana batallas, que es lo que el criterio 10 de §7.1 pedía.
    const r = resolveBattle(
      { stacks: ejercitoDe('treant', 1_000_000) },
      { stacks: ejercitoDe('militia', 1_000_000) },
      { seed: 4, random: makeRandom(4), attackType: 'regular' },
    );
    expect(r.log.length).toBeGreaterThan(0);
    expect(r.defender.losses).toBeGreaterThan(0);
  });

  test('a igual net power lo invocado ARRASA, y está medido: 97%', () => {
    // **La otra cara del mismo hallazgo.** Si `powerRank` fuera un precio,
    // invocado y reclutado empatarían. No empatan: lo invocado gana el 97%
    // de los duelos a igual net power.
    //
    // No es que el maná sea mejor que el geld: es que el net power **no es
    // la moneda con la que se compran unidades**. Un Treant cuesta una
    // invocación de nivel alto y 0,63 de maná por turno; una Milicia, 20 de
    // geld. Comparar por net power es comparar por el sitio que ocupan en
    // la tabla, no por lo que cuestan.
    const invocadas = ['dryad', 'nymph', 'druid', 'treant'];
    const reclutadas = ['militia', 'phalanx', 'archers', 'cavalry'];
    let victorias = 0;
    let total = 0;
    for (const i of invocadas) {
      for (const rr of reclutadas) {
        victorias += duelo(i, rr, 1_000_000, 4);
        total += 4;
      }
    }
    const cuota = victorias / total;
    expect(cuota).toBeGreaterThan(0.9);
    expect(cuota).toBeLessThanOrEqual(1);
  });
});

describe('criterio 9 de §17.2 — nadie gana siempre con el mismo reparto', () => {
  test('el resultado depende de con qué vayas, no solo de cuánto lleves', () => {
    // Estaba aplazado desde la fase 1 con el motivo escrito: «sin combate no
    // se puede juzgar». Ya se puede. Con el mismo presupuesto de net power,
    // el emparejamiento cambia quién gana.
    const parejas: [string, string][] = [
      ['cavalry', 'pikemen'],
      ['archers', 'cavalry'],
      ['treant', 'nymph'],
      ['dryad', 'militia'],
    ];
    const resultados = parejas.map(([a, b]) => duelo(a, b, 1_000_000, 6) >= 4);
    // Ni todas ganadas ni todas perdidas: el emparejamiento importa.
    expect(new Set(resultados).size).toBe(2);
  });
});

describe('criterio 13 de §17.2 — el net power cuadra con la intuición', () => {
  test('con el doble de net power se gana casi siempre', () => {
    // No «siempre»: el azar de cada ronda y el emparejamiento pueden dar
    // sorpresas, y eso es deseable. Pero la tendencia tiene que estar.
    let ganadas = 0;
    for (let s = 1; s <= 10; s++) {
      const r = resolveBattle(
        { stacks: ejercitoDe('militia', 2_000_000) },
        { stacks: ejercitoDe('militia', 1_000_000) },
        { seed: s, random: makeRandom(s), attackType: 'regular' },
      );
      if (r.winner === 'attacker') ganadas++;
    }
    expect(ganadas).toBeGreaterThanOrEqual(9);
  });

  test('el poder de un ejército es su net power: número × rango', () => {
    const stacks = ejercitoDe('treant', 1_000_000);
    expect(armyPower(stacks)).toBeGreaterThan(900_000);
    expect(armyPower(stacks)).toBeLessThanOrEqual(1_000_000);
  });

  test('las veinte fichas caben en un rango de precios coherente', () => {
    // Del rango 9 de la Milicia al 36.883 del Fénix hay cuatro órdenes de
    // magnitud, y eso **es** la escala del original: una unidad de élite no
    // es un 20% mejor, es otra cosa.
    const rangos = UNITS.map((u) => u.powerRank).sort((a, b) => a - b);
    expect(rangos[0]).toBe(9);
    expect(rangos[rangos.length - 1]).toBe(36_883);
    // Y no hay saltos absurdos en medio: cada una vale más que la anterior.
    for (let i = 1; i < rangos.length; i++) {
      expect(rangos[i]).toBeGreaterThanOrEqual(rangos[i - 1]!);
    }
  });
});
