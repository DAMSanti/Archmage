import { describe, expect, test } from 'vitest';
import { BUILDINGS, createMage, totalBuildings, landIsConsistent } from '../src/index.js';
import { STARTING_KINGDOM, TERRA } from './fixtures.js';

describe('la forma del estado', () => {
  test('hay exactamente ocho edificios, y la lista es cerrada', () => {
    // docs/SISTEMAS.md §4: «Los ocho, y no hay más».
    expect(BUILDINGS).toHaveLength(8);
    expect([...BUILDINGS]).toEqual([
      'farms',
      'towns',
      'nodes',
      'workshops',
      'barracks',
      'guilds',
      'forts',
      'barriers',
    ]);
  });

  test('un mago nuevo sale con lo que dice SISTEMAS §15', () => {
    const mage = createMage({
      id: 'm1',
      name: 'Prueba',
      specialty: 'plain',
      server: TERRA,
      starting: STARTING_KINGDOM,
      now: 1_000_000,
    });

    expect(mage.land.total).toBe(200);
    expect(mage.land.free).toBe(94);
    expect(mage.buildings.farms).toBe(45);
    expect(mage.buildings.towns).toBe(15);
    expect(mage.buildings.nodes).toBe(20);
    expect(mage.buildings.forts).toBe(1);
    expect(mage.resources.geld).toBe(100_000);
    expect(mage.resources.mana).toBe(5_000);
    expect(mage.resources.population).toBe(4_500);
    // El almacén de turnos, lleno: la primera sesión es una sesión de verdad.
    expect(mage.turns.current).toBe(TERRA.turnCap);
    expect(mage.turnsSpent).toBe(0);
  });

  test('la tierra cuadra: total = libre + suma de edificios', () => {
    // Invariante de docs/ARQUITECTURA.md §9.4.
    const mage = createMage({
      id: 'm1',
      name: 'Prueba',
      specialty: 'plain',
      server: TERRA,
      starting: STARTING_KINGDOM,
      now: 0,
    });
    expect(totalBuildings(mage.buildings)).toBe(106);
    expect(landIsConsistent(mage)).toBe(true);
  });

  test('landIsConsistent detecta una tierra que no cuadra', () => {
    const mage = createMage({
      id: 'm1',
      name: 'Prueba',
      specialty: 'plain',
      server: TERRA,
      starting: STARTING_KINGDOM,
      now: 0,
    });
    const roto = { ...mage, land: { ...mage.land, free: mage.land.free + 1 } };
    expect(landIsConsistent(roto)).toBe(false);
  });

  test('el mago nuevo está protegido, y la protección se mide en turnos gastados', () => {
    // docs/SISTEMAS.md §15 [nuestro]: turnos gastados, no tiempo real.
    const mage = createMage({
      id: 'm1',
      name: 'Prueba',
      specialty: 'plain',
      server: TERRA,
      starting: STARTING_KINGDOM,
      now: 0,
    });
    expect(mage.turnsSpent).toBeLessThan(TERRA.protectionTurns);
  });

  test('no hay reclutamiento en curso al empezar', () => {
    const mage = createMage({
      id: 'm1',
      name: 'Prueba',
      specialty: 'plain',
      server: TERRA,
      starting: STARTING_KINGDOM,
      now: 0,
    });
    expect(mage.recruiting).toBeNull();
    expect(mage.army).toEqual([]);
  });
});
