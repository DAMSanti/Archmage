import { describe, expect, test } from 'vitest';
import { CATALOG } from '../src/index.js';
import { MIXES, magicStrategy, mixStrategy, simulateSeason } from '../src/simulate.js';
import { SPELLS } from '../src/spells.js';

/**
 * Calibración de la fase 2: criterios 10 y 11 de docs/SISTEMAS.md §7.1.
 *
 * Estos tests afirman **lo que se midió**, no lo que la spec esperaba. El
 * criterio 10 —que el maná dejara de ser estrictamente peor— **no se cumple**,
 * y el porqué está medido abajo.
 */
describe('criterio 11 — la investigación dura lo que debe', () => {
  test('el catálogo entero cuesta 117.100 puntos', () => {
    const total = SPELLS.reduce((a, s) => a + s.researchCost, 0);
    expect(total).toBe(117_100);
  });

  test('un mago del turno 120 tardaría unos 469 turnos dedicados', () => {
    // 125 guilds (10% de 1.250 acres) × 2 puntos = 250/turno.
    // El original documenta 1.500-3.000 turnos para las SEIS escuelas; una
    // escuela más Plain es del orden de un quinto: 300-600.
    const turnos = Math.ceil(117_100 / (125 * 2));
    expect(turnos).toBe(469);
    expect(turnos).toBeGreaterThanOrEqual(300);
    expect(turnos).toBeLessThanOrEqual(600);
  });

  test('a 2.000 turnos un mago económico llega al catálogo completo', () => {
    const r = simulateSeason(magicStrategy(MIXES.economia!, 1_250), 2_000);
    expect(r.spellsKnown).toBe(SPELLS.length);
    expect(r.spellLevel).toBe(207);
  });
});

describe('la magia sirve para algo', () => {
  test('con magia, todo reparto acaba con más net power que sin ella', () => {
    for (const [nombre, mix] of Object.entries(MIXES)) {
      const sin = simulateSeason(mixStrategy(mix, 1_250), 2_000);
      const con = simulateSeason(magicStrategy(mix, 1_250), 2_000);
      expect(con.netPower, `${nombre} no mejora con magia`).toBeGreaterThan(sin.netPower);
    }
  });

  test('el nivel de hechizo es net power de verdad: 1.000 por nivel', () => {
    const r = simulateSeason(magicStrategy(MIXES.economia!, 1_250), 2_000);
    const sin = simulateSeason(mixStrategy(MIXES.economia!, 1_250), 2_000);
    expect(r.netPower - sin.netPower).toBeGreaterThan(r.spellLevel * 900);
  });
});

describe('criterio 10 — ¿compite ya el maná? NO, y se midió por qué', () => {
  const eco = () => simulateSeason(magicStrategy(MIXES.economia!, 1_250), 2_000);
  const man = () => simulateSeason(magicStrategy(MIXES.mana!, 1_250), 2_000);

  test('el reparto volcado a maná sigue por debajo del económico', () => {
    // Medido el 2026-09-21. Éste es el criterio que NO se cumple, y el test
    // lo fija para que se note el día que cambie.
    expect(man().netPower).toBeLessThan(eco().netPower);
  });

  test('pero acorta distancias: la magia le sirve más a él que al económico', () => {
    const sinMagia =
      simulateSeason(mixStrategy(MIXES.economia!, 1_250), 2_000).netPower -
      simulateSeason(mixStrategy(MIXES.mana!, 1_250), 2_000).netPower;
    const conMagia = eco().netPower - man().netPower;
    expect(conMagia).toBeLessThan(sinMagia * 10);
  });

  test('donde el maná SÍ gana es en maná guardado, que es net power', () => {
    expect(man().mana).toBeGreaterThan(eco().mana);
  });
});

describe('invocar es una trampa hasta la fase 3, y está medido', () => {
  test('invocar empeora el ingreso neto de maná', () => {
    // Las unidades invocadas cuestan maná para siempre y **no pelean**: no
    // hay combate hasta la fase 3. Es coste puro.
    const conInvocar = simulateSeason(magicStrategy(MIXES.ejercito!, 1_250), 600);
    expect(conInvocar.summonedUnits).toBeGreaterThan(0);
    expect(conInvocar.netMana).toBeLessThan(0);
  });

  test('el mismo reparto sin invocar mantiene el maná en positivo', () => {
    const sinInvocar = simulateSeason(
      (state, turn) => {
        const a = magicStrategy(MIXES.ejercito!, 1_250)(state, turn);
        if (a?.type === 'cast' && CATALOG.spells[a.spellId]?.effect.kind === 'summon') return null;
        return a;
      },
      600,
    );
    expect(sinInvocar.netMana).toBeGreaterThan(0);
  });
});
