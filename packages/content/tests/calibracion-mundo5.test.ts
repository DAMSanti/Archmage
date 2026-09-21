import { describe, expect, test } from 'vitest';
import {
  SEASON_DAYS,
  hallOfFame,
  netPower,
  shouldEnd,
} from '@archmage/core';
import type { Season } from '@archmage/core';
import { ARMAGEDDON, SPELLS } from '../src/spells.js';
import { CATALOG } from '../src/index.js';
import { MIXES, magicStrategy, mixStrategy, simulateSeason } from '../src/simulate.js';

/**
 * Calibración de la fase 5. docs/SISTEMAS.md §14.1, criterios 18 y 21.
 *
 * **La pregunta es si la fase 5 rompió algo.** Gremios, alianzas y sellos
 * tocan cosas calibradas en las fases 1 a 4, y lo que este fichero protege
 * es que no las hayan movido.
 */
describe('la fase 5 no rompió la calibración anterior', () => {
  test('el reparto de ejército sigue siendo el que más net power saca', () => {
    // Mismo resultado que la tarea 22 de la fase 3 y la 24 de la fase 4.
    const porMix = Object.fromEntries(
      Object.entries(MIXES).map(([n, mix]) => [
        n,
        simulateSeason(magicStrategy(mix, 1_250), 2_000).netPower,
      ]),
    );
    const orden = Object.entries(porMix)
      .sort((a, b) => b[1] - a[1])
      .map(([n]) => n);
    expect(orden[0]).toBe('ejercito');
  });

  test('y el net power sigue contando el ejército', () => {
    const r = simulateSeason(magicStrategy(MIXES.ejercito!, 1_250), 2_000);
    expect(netPower(r.state, CATALOG)).toBe(r.netPower);
  });
});

describe('¿puede pagarse un sello?', () => {
  test('un mago de maná que AHORRA puede pagarlo, y el que gasta no', () => {
    // **[nuestro]** El coste es 320.000, el doble del Ultimate más caro.
    // La spec prometía validarlo aquí, y la primera versión de este test
    // medía lo que no era: el maná que le queda al simulador, que gasta
    // todo lo que gana en encantamientos e invocaciones — 94.522.
    //
    // Lo que hay que medir es **si se puede llegar**, y se puede: el mismo
    // reparto sin gastar en magia acaba con **689.000**, que es su almacén
    // lleno y más del doble del coste.
    const gastando = simulateSeason(magicStrategy(MIXES.mana!, 1_250), 2_000);
    const ahorrando = simulateSeason(mixStrategy(MIXES.mana!, 1_250), 2_000);
    expect(gastando.mana).toBeLessThan(ARMAGEDDON.castMana);
    expect(ahorrando.mana).toBeGreaterThan(ARMAGEDDON.castMana * 2);
  });

  test('**Consecuencia declarada: romper un sello pide ser mago de maná**', () => {
    // El almacén de un reparto económico son 123.000: **no llega nunca**,
    // por mucho que ahorre. Y eso está bien — acabar el mundo es cosa de
    // quien invirtió en nodes, no de quien invirtió en farms. Ata la
    // mecánica a una decisión de reparto en vez de dejarla suelta.
    const almacenDe = (mix: keyof typeof MIXES) => {
      const r = simulateSeason(mixStrategy(MIXES[mix]!, 1_250), 2_000);
      return r.state.buildings.nodes * 1_000;
    };
    expect(almacenDe('mana')).toBeGreaterThan(ARMAGEDDON.castMana);
    expect(almacenDe('guia')).toBeGreaterThan(ARMAGEDDON.castMana);
    expect(almacenDe('economia')).toBeLessThan(ARMAGEDDON.castMana);
    expect(almacenDe('ejercito')).toBeLessThan(ARMAGEDDON.castMana);
  });

  test('pero no es calderilla: cuesta más que cualquier otro hechizo', () => {
    // Romper un sello tiene que ser un esfuerzo de mago grande y no un
    // trámite.
    const masCaro = Math.max(...SPELLS.map((s) => s.castMana));
    expect(ARMAGEDDON.castMana).toBeGreaterThan(masCaro);
  });


});

describe('criterio 18 — lo que sobrevive no da ventaja', () => {
  test('el Hall of Fame es una lista, no un estado', () => {
    // Nombre, puesto y net power final. **Nada que se pueda gastar.** Un
    // juego por temporadas donde lo anterior te hace más fuerte no es un
    // juego por temporadas.
    const h = hallOfFame([{ id: 'a', name: 'Ana', netPower: 5_000 }]);
    expect(Object.keys(h[0]!).sort()).toEqual(['mageId', 'name', 'netPower', 'rank']);
    // No hay geld, ni maná, ni items, ni habilidades.
    expect(h[0]).not.toHaveProperty('geld');
    expect(h[0]).not.toHaveProperty('items');
    expect(h[0]).not.toHaveProperty('skills');
  });
});

describe('la temporada dura lo que dice', () => {
  test('90 días, y ni uno menos sin sellos', () => {
    const T0 = 1_700_000_000_000;
    const DIA = 24 * 60 * 60 * 1000;
    const t: Season = {
      id: 't',
      serverId: 'terra',
      startedAt: T0,
      seals: [],
      status: 'open',
      endedAt: null,
    };
    expect(SEASON_DAYS).toBe(90);
    expect(shouldEnd(t, T0 + 89 * DIA)).toBe(false);
    expect(shouldEnd(t, T0 + 90 * DIA)).toBe(true);
  });
});
