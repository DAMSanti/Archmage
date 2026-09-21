import { describe, expect, test } from 'vitest';
import { BUILDINGS } from '@archmage/core';
import { BUILDING_SPECS, CATALOG, ECONOMY, STARTING_KINGDOM, UNIT_SPECS, catalogSchema } from '../src/index.js';

describe('el catálogo', () => {
  test('valida entero contra su esquema', () => {
    expect(() => catalogSchema.parse(CATALOG)).not.toThrow();
  });

  test('están los ocho edificios y ninguno más', () => {
    expect(Object.keys(BUILDING_SPECS).sort()).toEqual([...BUILDINGS].sort());
  });

  test('la proporción de coste sigue la del tiempo de construcción', () => {
    // docs/ORIGINAL.md §4: 1 fort = 10 nodes = 15 guilds = 30 workshops = 60 farms.
    const f = BUILDING_SPECS.farms.cost;
    expect(BUILDING_SPECS.forts.cost).toBe(60 * f);
    expect(BUILDING_SPECS.nodes.cost * 10).toBe(BUILDING_SPECS.forts.cost);
    expect(BUILDING_SPECS.guilds.cost * 15).toBe(BUILDING_SPECS.forts.cost);
    expect(BUILDING_SPECS.workshops.cost * 30).toBe(BUILDING_SPECS.forts.cost);
  });

  test('solo las barriers cuestan maná de mantener', () => {
    for (const [name, spec] of Object.entries(BUILDING_SPECS)) {
      if (name === 'barriers') expect(spec.upkeepMana).toBeGreaterThan(0);
      else expect(spec.upkeepMana).toBe(0);
    }
  });

  test('el upkeep medio de una unidad es 2 geld', () => {
    // El ancla de docs/SISTEMAS.md §8.1: con 2 de media, el ejército
    // sostenible al turno 120 cae dentro de las 10.000-20.000 del original.
    const units = Object.values(UNIT_SPECS);
    const media = units.reduce((s, u) => s + u.upkeepGeld, 0) / units.length;
    expect(media).toBeCloseTo(2.2, 1);
  });

  test('la tropa básica no tiene escuela', () => {
    for (const u of Object.values(UNIT_SPECS)) expect(u.specialty).toBe('plain');
  });

  test('300 por town y 100 por farm igualan los topes en 3:1', () => {
    // docs/SISTEMAS.md §5.4: la proporción recomendada sale sola.
    expect(ECONOMY.populationPerTown).toBe(3 * ECONOMY.populationPerFarm);
  });

  test('el reino de partida cabe en su tierra y arranca lleno de población', () => {
    const construidos = Object.values(STARTING_KINGDOM.buildings).reduce((a, b) => a + b, 0);
    expect(construidos).toBe(106);
    expect(STARTING_KINGDOM.land - construidos).toBe(94);
    const espacio = STARTING_KINGDOM.buildings.towns * ECONOMY.populationPerTown;
    const comida = STARTING_KINGDOM.buildings.farms * ECONOMY.populationPerFarm;
    expect(Math.min(espacio, comida)).toBe(STARTING_KINGDOM.population);
  });
});
