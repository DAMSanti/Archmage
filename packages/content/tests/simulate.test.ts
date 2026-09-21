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
   * **Este criterio dejó de cumplirse en la fase 3, y el test lo dice.**
   *
   * Cumplía con un upkeep medio de 2 geld **que me inventé**. La ficha
   * publicada de la Milicia (docs/ORIGINAL.md §9.5) dice 0,32, y la media
   * real de la tropa reclutable es 0,914: 2,19 veces más barata. El mismo
   * ingreso sostiene ahora 29.838 unidades en vez de 13.636.
   *
   * No se arregla aquí. El upkeep es `[orig]` y no se toca; lo que sobra es
   * ingreso, y moverlo es una decisión del usuario (docs/SISTEMAS.md §17.2).
   */
  test('la media de upkeep sale del catálogo, no de una constante inventada', () => {
    expect(AVG_UPKEEP_CENT).toBeCloseTo(91.4, 1);
  });

  test('con los upkeeps reales el ejército sostenible SE SALE de la banda', () => {
    const r = simulateSeason(mixStrategy(MIXES.guia!, 1_250), 600);
    expect(r.sustainableArmy).toBe(29_838);
    expect(r.sustainableArmy).toBeGreaterThan(20_000); // la banda del original
  });

  test('y con milicia pura se dispara a 85.225', () => {
    const r = simulateSeason(mixStrategy(MIXES.guia!, 1_250), 600);
    expect(Math.floor(r.netGeld / 0.32)).toBe(85_225);
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
