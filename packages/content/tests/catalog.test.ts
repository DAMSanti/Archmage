import { describe, expect, test } from 'vitest';
import { BUILDINGS } from '@archmage/core';
import { BUILDING_SPECS, CATALOG, ECONOMY, STARTING_KINGDOM, catalogSchema } from '../src/index.js';

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

  test('los coeficientes son los publicados, no los que inventamos', () => {
    // docs/ORIGINAL.md §4.2, confianza alta.
    expect(ECONOMY.spacePerTown).toBe(1_000);
    expect(ECONOMY.spacePerFarm).toBe(100);
    expect(ECONOMY.foodPerFarm).toBe(500);
    expect(ECONOMY.geldFlat).toBe(1_000);
  });

  test('los topes se igualan en 2,5 farms por town, y eso explica el 3:1', () => {
    // Con T towns y 2,5T farms: espacio = 1.000T + 250T = 1.250T, y comida
    // = 2,5T × 500 = 1.250T. Iguales.
    //
    // **Y por eso las guías aconsejan 3:1 y no 2,5:1** (§4.1): a 3:1 el
    // espacio da 1.300T y la comida 1.500T, así que **sobran 200T de
    // comida** — que es justo lo que se come el ejército, porque todas las
    // unidades comen de las mismas farms. Las dos cifras de las fuentes no
    // se contradicen: una es el punto de equilibrio sin ejército y la otra
    // el reparto de alguien que piensa tener uno.
    const T = 100;
    const espacio = T * ECONOMY.spacePerTown + 2.5 * T * ECONOMY.spacePerFarm;
    const comida = 2.5 * T * ECONOMY.foodPerFarm;
    expect(espacio).toBe(comida);
  });

  test('el reino de partida cabe en su tierra y arranca lleno de población', () => {
    const construidos = Object.values(STARTING_KINGDOM.buildings).reduce((a, b) => a + b, 0);
    expect(construidos).toBe(106);
    expect(STARTING_KINGDOM.land - construidos).toBe(94);
    const espacio =
      STARTING_KINGDOM.buildings.towns * ECONOMY.spacePerTown +
      STARTING_KINGDOM.buildings.farms * ECONOMY.spacePerFarm;
    const comida = STARTING_KINGDOM.buildings.farms * ECONOMY.foodPerFarm;
    expect(espacio).toBe(19_500);
    expect(comida).toBe(22_500);
    expect(Math.min(espacio, comida)).toBe(STARTING_KINGDOM.population);
  });
});
