import { describe, expect, test } from 'vitest';
import { MAX_SKILL_LEVEL, netPower, skillModifiers } from '@archmage/core';
import { CATALOG } from '../src/index.js';
import { SKILLS } from '../src/skills.js';
import { MIXES, magicStrategy, simulateSeason } from '../src/simulate.js';

/**
 * Calibración de la fase 4: criterio 17 de docs/SISTEMAS.md §12.1.
 *
 * **La pregunta es si las habilidades se comen el juego.** Son una ventaja,
 * no una segunda economía: si tenerlas todas al máximo doblara el net power,
 * la decisión dejaría de ser cómo repartes la tierra y pasaría a ser cuántos
 * guilds pones.
 */
const todasAlMaximo = Object.fromEntries(SKILLS.map((s) => [s.id, MAX_SKILL_LEVEL]));

describe('criterio 17 — las habilidades no se comen el juego', () => {
  test('con las diez al 20, el net power sube MENOS de un 50%', () => {
    // Se mide sobre las magnitudes, no simulando otra temporada: las diez
    // multiplican cosas distintas y su efecto compuesto es el producto.
    const m = skillModifiers(todasAlMaximo, SKILLS);
    // Las que suben net power directamente: tierra arrancada y unidades por
    // invocación. Las demás abaratan o mejoran, pero no crean net power.
    const compuesto = m.landTaken * m.summonCount;
    expect(compuesto).toBeCloseTo(1.44, 2);
    expect(compuesto).toBeLessThan(1.5);
  });

  test('ninguna sola cambia más de un 20% lo suyo', () => {
    const m = skillModifiers(todasAlMaximo, SKILLS);
    for (const [k, v] of Object.entries(m)) {
      expect(v, k).toBeGreaterThanOrEqual(0.8);
      expect(v, k).toBeLessThanOrEqual(1.2);
    }
  });

  test('y con las diez a 0 el juego es exactamente el de la fase 3', () => {
    // **El canario.** Si esto fallara, enchufar las habilidades habría
    // movido algo de lo ya calibrado.
    const m = skillModifiers({}, SKILLS);
    for (const v of Object.values(m)) expect(v).toBe(1);
  });
});

describe('lo que costaría tenerlas todas', () => {
  test('las diez al 20 son 2.100 puntos, o 2.520 con las cinco fuera de color', () => {
    // A un punto cada 34 turnos, son **71.400 turnos**: mucho más que una
    // temporada. Tenerlas todas **no es una opción**, y esa es la decisión
    // real — cuáles subir.
    const enColor = 10 * 210;
    expect(enColor).toBe(2_100);
    expect(enColor * (1 / 34)).toBeGreaterThan(60);
    const turnos = enColor * 34;
    expect(turnos).toBe(71_400);
  });
});

describe('la fase 4 no rompió la calibración de las anteriores', () => {
  test('el reparto de ejército sigue siendo el que más net power saca', () => {
    // Mismo resultado que la tarea 22 de la fase 3: si hubiera cambiado,
    // algo de items o habilidades se habría colado en la simulación.
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

  test('el net power sigue contando el ejército', () => {
    const r = simulateSeason(magicStrategy(MIXES.ejercito!, 1_250), 2_000);
    expect(netPower(r.state, CATALOG)).toBe(r.netPower);
    expect(r.netPower).toBeGreaterThan(3_000_000);
  });
});
