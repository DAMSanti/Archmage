import { describe, expect, test } from 'vitest';
import { exploreYield, landIsConsistent } from '@archmage/core';
import { ECONOMY } from '../src/index.js';
import { AVG_UPKEEP_CENT, MIXES, mixStrategy, simulateSeason } from '../src/simulate.js';

/**
 * Calibración: docs/SISTEMAS.md §17.2.
 *
 * Aquí solo están los criterios que **se pueden juzgar en la fase 1**. Los que
 * dependen de que el maná y el combate sirvan para algo están declarados
 * abajo, y esperan a las fases 2 y 3.
 */
describe('criterio 10 — la curva de crecimiento se parece a la del original', () => {
  test('llegar a 1.250 acres cuesta 61 turnos de exploración', () => {
    let land = 200;
    let turnos = 0;
    while (land < 1_250) {
      const y = exploreYield(land, ECONOMY);
      expect(y).toBeGreaterThan(0);
      land += y;
      turnos++;
    }
    expect(turnos).toBe(61);
  });

  test('un mago que reparte sus 120 primeros turnos cae en 1.200-1.300 acres', () => {
    // docs/ORIGINAL.md §4.1: «por turno 120, 1.200-1.300 acres». Un jugador
    // real no explora 120 turnos seguidos: también construye.
    const r = simulateSeason(mixStrategy(MIXES.guia!, 1_250), 120);
    expect(r.land).toBeGreaterThanOrEqual(1_200);
    expect(r.land).toBeLessThanOrEqual(1_300);
  });

  test('la exploración se agota: no se pasa de ~3.421 acres', () => {
    let land = 200;
    for (let i = 0; i < 5_000; i++) {
      const y = exploreYield(land, ECONOMY);
      if (y <= 0) break;
      land += y;
    }
    expect(land).toBe(3_421);
    expect(exploreYield(land, ECONOMY)).toBe(0);
  });
});

describe('criterio 11 — el geld sostiene un ejército del orden del original', () => {
  /**
   * **Vuelve a cumplirse**, y con dos correcciones encima, las dos del
   * 2026-09-21:
   *
   *  1. El upkeep medio real es **0,914**, no los 2 geld que me inventé
   *     (docs/ORIGINAL.md §9.5).
   *  2. La economía entera pasó a ser la **publicada** (§4.2), que aloja
   *     4,3 veces más población en la misma tierra.
   *
   * Y con una tercera corrección que no es de número sino **de dónde se
   * mide**: el ancla del original es **el turno 120**, y este criterio se
   * había movido al 600 en la fase 1. Medir un mago en un punto que no es
   * el suyo es comparar dos cosas distintas.
   */
  test('la media de upkeep sale del catálogo, no de una constante inventada', () => {
    expect(AVG_UPKEEP_CENT).toBeCloseTo(91.4, 1);
  });

  test('en el turno 120 —donde mide el original— la banda se cumple', () => {
    // docs/ORIGINAL.md §4.1: «ejército esperable al turno 120:
    // 10.000-20.000 unidades», con ~1.250 acres.
    const r = simulateSeason(mixStrategy(MIXES.ejercito!, 1_250), 120);
    expect(r.land).toBeGreaterThanOrEqual(1_200);
    expect(r.land).toBeLessThanOrEqual(1_300);
    expect(r.sustainableArmy).toBe(19_242);
    expect(r.sustainableArmy).toBeGreaterThanOrEqual(10_000);
    expect(r.sustainableArmy).toBeLessThanOrEqual(20_000);
  });

  test('los cuatro repartos caen alrededor de la banda, no lejos de ella', () => {
    // guías 9.592 · maná 9.725 · economía 22.937 · ejército 19.242.
    // Los dos volcados a crecer se pasan poco y los otros dos se quedan
    // poco cortos: la banda queda **bracketeada**, que es lo que se le
    // puede pedir a un ancla de confianza media.
    const v = Object.fromEntries(
      Object.entries(MIXES).map(([n, mix]) => [
        n,
        simulateSeason(mixStrategy(mix, 1_250), 120).sustainableArmy,
      ]),
    );
    expect(v).toEqual({ guia: 9_592, mana: 9_725, economia: 22_937, ejercito: 19_242 });
    for (const [n, x] of Object.entries(v)) {
      expect(x, n).toBeGreaterThan(8_000);
      expect(x, n).toBeLessThan(25_000);
    }
  });

  test('a 600 turnos se dispara, y por eso el punto es el turno 120', () => {
    // 181.644 con el reparto de las guías. No es un fallo: es que a 600
    // turnos un mago ha construido cinco veces más. El original no dice
    // nada de ese punto, así que no se puede comparar contra nada.
    const r = simulateSeason(mixStrategy(MIXES.guia!, 1_250), 600);
    expect(r.sustainableArmy).toBe(181_644);
  });
});

describe('criterio 12 — ningún reparto es una trampa', () => {
  test('ninguno acaba con ingreso neto de geld negativo', () => {
    for (const [nombre, mix] of Object.entries(MIXES)) {
      const r = simulateSeason(mixStrategy(mix, 1_250), 600);
      expect(r.netGeld, `${nombre} se arruina`).toBeGreaterThan(0);
    }
  });

  test('ninguno acaba con ingreso neto de maná negativo', () => {
    for (const [nombre, mix] of Object.entries(MIXES)) {
      const r = simulateSeason(mixStrategy(mix, 1_250), 600);
      expect(r.netMana, `${nombre} pierde maná`).toBeGreaterThan(0);
    }
  });

  test('volcarse a maná SÍ da más maná que volcarse a economía', () => {
    const mana = simulateSeason(mixStrategy(MIXES.mana!, 1_250), 600);
    const eco = simulateSeason(mixStrategy(MIXES.economia!, 1_250), 600);
    expect(mana.netMana).toBeGreaterThan(eco.netMana);
    // Y al revés con el geld: las dos decisiones existen.
    expect(eco.netGeld).toBeGreaterThan(mana.netGeld);
  });
});

describe('una temporada larga no rompe ningún invariante', () => {
  test('la tierra cuadra y todo sigue entero tras 2.000 turnos', () => {
    for (const mix of Object.values(MIXES)) {
      const r = simulateSeason(mixStrategy(mix, 3_400), 2_000);
      expect(landIsConsistent(r.state)).toBe(true);
      expect(r.state.land.free).toBeGreaterThanOrEqual(0);
      for (const v of Object.values(r.state.resources)) {
        expect(Number.isInteger(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('es reproducible: misma semilla, mismo resultado', () => {
    const a = simulateSeason(mixStrategy(MIXES.guia!, 1_250), 500, 42);
    const b = simulateSeason(mixStrategy(MIXES.guia!, 1_250), 500, 42);
    expect(a.netPower).toBe(b.netPower);
    expect(a.land).toBe(b.land);
  });
});
