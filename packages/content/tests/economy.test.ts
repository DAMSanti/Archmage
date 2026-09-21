import { describe, expect, test } from 'vitest';
import { createMage, emptyBuildings, emptyConstruction, income, netIncome, populationCapacity, upkeep } from '@archmage/core';
import type { Buildings, MageState } from '@archmage/core';
import { CATALOG, ECONOMY, STARTING_KINGDOM, TERRA } from '../src/index.js';

/**
 * Las cifras que docs/SISTEMAS.md afirma, comprobadas contra los datos de
 * verdad. Este fichero vive en `content` y no en `core` porque es el único
 * sitio donde se ven las reglas Y los datos: el núcleo no puede importar el
 * contenido (docs/SPECS.md §5, invariante 1).
 */
const TUNING = ECONOMY;

function mageWith(buildings: Partial<Buildings>, land: number, population: number): MageState {
  const b: Buildings = { ...emptyBuildings(), ...buildings };
  const construidos = Object.values(b).reduce((a, v) => a + v, 0);
  return {
    id: 'test', serverId: TERRA.id, name: 'Test', specialty: 'plain',
    turns: { current: 100, lastAccrualAt: 0 }, turnsSpent: 0,
    land: { total: land, free: land - construidos },
    buildings: b, construction: emptyConstruction(),
    resources: { geld: 0, mana: 0, population },
    army: [], recruiting: null,
    spellbook: { known: [], researching: null, level: 0 },
    enchantments: [], heroes: [], items: {}, skills: {},
  };
}

describe('el mago de partida de SISTEMAS §15', () => {
  const m = createMage({
    id: 'm1', name: 'Prueba', specialty: 'plain',
    server: TERRA, starting: STARTING_KINGDOM, now: 0,
  });

  test('produce 200 de maná por turno', () => {
    expect(income(m, CATALOG, TUNING).mana).toBe(200);
  });

  test('produce 4.050 de geld brutos y 3.355 netos, con 695 de mantenimiento', () => {
    expect(income(m, CATALOG, TUNING).geld).toBe(4_050);
    expect(upkeep(m, CATALOG).geld).toBe(695);
    expect(netIncome(m, CATALOG, TUNING).geld).toBe(3_355);
  });

  test('arranca justo lleno de población, así que no crece', () => {
    expect(populationCapacity(m, TUNING).capacity).toBe(4_500);
    expect(income(m, CATALOG, TUNING).population).toBe(0);
  });

  test('los 100.000 de geld dan para unos 60 edificios baratos', () => {
    expect(Math.floor(m.resources.geld / CATALOG.buildings.farms.cost)).toBe(100);
    expect(m.resources.geld).toBeGreaterThan(60 * CATALOG.buildings.farms.cost);
  });
});

describe('el cuadro del mago de 5.000 acres de SISTEMAS §4.2', () => {
  const m = mageWith(
    { nodes: 2_250, guilds: 1_000, workshops: 300, forts: 20, barriers: 125, towns: 326, farms: 979 },
    5_000,
    97_800,
  );

  test('la población máxima es 97.800', () => {
    expect(populationCapacity(m, TUNING).capacity).toBe(97_800);
  });

  test('el maná son 14.625 por turno y el almacén 2.250.000', () => {
    expect(income(m, CATALOG, TUNING).mana).toBe(14_625);
    expect(m.buildings.nodes * TUNING.manaStoragePerNode).toBe(2_250_000);
  });

  test('el mantenimiento son 41.025 de geld y 6.250 de maná', () => {
    expect(upkeep(m, CATALOG).geld).toBe(41_025);
    expect(upkeep(m, CATALOG).mana).toBe(6_250);
  });

  test('el ingreso de geld son 86.103 brutos y 45.078 netos', () => {
    expect(income(m, CATALOG, TUNING).geld).toBe(86_103);
    expect(netIncome(m, CATALOG, TUNING).geld).toBe(45_078);
  });

  test('construirlo entero cuesta 23,5 millones', () => {
    let total = 0;
    for (const [b, n] of Object.entries(m.buildings)) {
      total += n * CATALOG.buildings[b as keyof typeof CATALOG.buildings].cost;
    }
    expect(total).toBe(23_485_000);
  });
});
