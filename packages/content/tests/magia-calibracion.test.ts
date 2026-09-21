import { describe, expect, test } from 'vitest';
import { CATALOG } from '../src/index.js';
import { MIXES, magicStrategy, mixStrategy, simulateSeason } from '../src/simulate.js';
import { SPELLS } from '../src/spells.js';

/**
 * Calibración de la fase 2, **recalibrada en la fase 3**: criterios 10 y 11
 * de docs/SISTEMAS.md §7.1.
 *
 * Estos tests afirman **lo que se midió**, no lo que la spec esperaba.
 *
 * La fase 3 tumbó dos conclusiones de la fase 2, y las dos por la misma
 * causa: `netPower()` **dejaba el ejército fuera** porque el `powerRank`
 * estaba `[abierto]`. Una unidad invocada pagaba upkeep y no sumaba nada, así
 * que «invocar es una trampa» salía cierto **por construcción**, no por
 * balance. Con la ficha publicada (docs/ORIGINAL.md §9.5) el ejército cuenta,
 * y la respuesta se da la vuelta: invocar es **la jugada más fuerte** de las
 * cuatro medidas. Lo que decían antes está anotado test a test.
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

  test('y la magia NO acorta distancias: las abre', () => {
    // **Decía lo contrario hasta la fase 3**: «la magia le sirve más a él que
    // al económico», con la brecha creciendo menos de 10 veces. Medido ahora:
    // crece 35 veces, de 13.348 a 467.431. La causa no es el maná sino los
    // turnos — el reparto económico llega al catálogo entero (nivel 207 de
    // hechizo, 207.000 de net power) y el volcado a maná se queda en 20,
    // porque gasta sus turnos manteniendo encantamientos e invocando.
    const sinMagia =
      simulateSeason(mixStrategy(MIXES.economia!, 1_250), 2_000).netPower -
      simulateSeason(mixStrategy(MIXES.mana!, 1_250), 2_000).netPower;
    const conMagia = eco().netPower - man().netPower;
    expect(sinMagia).toBe(13_348);
    expect(conMagia).toBe(467_431);
    expect(conMagia).toBeGreaterThan(sinMagia * 30);
  });

  test('donde el maná SÍ gana es en maná guardado, que es net power', () => {
    expect(man().mana).toBeGreaterThan(eco().mana);
  });
});

describe('invocar YA NO es una trampa: la fase 3 le dio la vuelta', () => {
  /**
   * **Decía justo lo contrario.** La fase 2 midió «invocar empeora el ingreso
   * neto de maná» y lo fijó con un test. Se cayó por dos motivos, los dos
   * hallazgos de la fase 3:
   *
   *  1. Los upkeeps de maná que usaba **eran inventados**, entre 40 y 100
   *     veces más caros que los publicados (Dríade 1 contra 0,01).
   *  2. `netPower()` no contaba el ejército, así que lo invocado era coste
   *     puro en la única medida que el juego usa para decir quién es grande.
   */
  test('invocar ya no hunde el ingreso neto de maná', () => {
    const r = simulateSeason(magicStrategy(MIXES.ejercito!, 1_250), 600);
    expect(r.summonedUnits).toBeGreaterThan(0);
    expect(r.netMana).toBe(1_436); // era negativo con los upkeeps inventados
  });

  test('y a 2.000 turnos el reparto de ejército es el que MÁS net power saca', () => {
    const porMix = Object.fromEntries(
      Object.entries(MIXES).map(([n, mix]) => [
        n,
        simulateSeason(magicStrategy(mix, 1_250), 2_000).netPower,
      ]),
    );
    const mejor = Object.entries(porMix).sort((a, b) => b[1] - a[1])[0]!;
    expect(mejor[0]).toBe('ejercito');
    expect(porMix.ejercito).toBe(2_531_586);
    expect(porMix.economia).toBe(2_188_345);
  });

  test('el ejército pasa a ser la mitad del net power del reparto que lo busca', () => {
    // Criterio 13 de §17.2, aplazado desde la fase 1: el net power era ~98%
    // tierra y no distinguía estrategias. Ahora va del 50% al 79%.
    const r = simulateSeason(magicStrategy(MIXES.ejercito!, 1_250), 2_000);
    const ejercito = r.state.army.reduce(
      (a, st) => a + st.count * (CATALOG.units[st.unitId]?.powerRank ?? 0),
      0,
    );
    expect(ejercito / r.netPower).toBeGreaterThan(0.45);
    expect(r.state.land.total * 1_000 / r.netPower).toBeLessThan(0.55);
  });
});
