import { describe, expect, test } from 'vitest';
import {
  createMage,
  income,
  netIncome,
  populationCapacity,
  upkeep,
  type MageState,
} from '../src/index.js';
import { CATALOG, STARTING_KINGDOM, TERRA, TUNING, mageWith } from './fixtures.js';

const nuevo = (): MageState =>
  createMage({
    id: 'm1',
    name: 'Prueba',
    specialty: 'plain',
    server: TERRA,
    starting: STARTING_KINGDOM,
    now: 0,
  });

describe('población y comida', () => {
  test('criterio 5 — con 2,5 farms por town los dos topes se igualan', () => {
    // docs/SISTEMAS.md §17.1, criterio 5. **Decía 3 farms por town** hasta
    // el 2026-09-21, porque nuestros coeficientes inventados (300 por town,
    // la farm como tope de comida) lo hacían salir en 3. Con los publicados
    // (docs/ORIGINAL.md §4.2) el punto de equilibrio es **2,5**, y el 3:1
    // que aconsejan las guías es eso más el margen que se come el ejército.
    const m = mageWith({ towns: 100, farms: 250 }, 1_000);
    const cap = populationCapacity(m, TUNING);
    expect(cap.space).toBe(125_000);
    expect(cap.food).toBe(125_000);
    expect(cap.capacity).toBe(125_000);
  });

  test('con 2 farms por town manda la comida', () => {
    const cap = populationCapacity(mageWith({ towns: 100, farms: 200 }, 1_000), TUNING);
    expect(cap.capacity).toBe(cap.food);
    expect(cap.food).toBeLessThan(cap.space);
  });

  test('con 4 farms por town manda el espacio', () => {
    const cap = populationCapacity(mageWith({ towns: 100, farms: 400 }, 1_000), TUNING);
    expect(cap.capacity).toBe(cap.space);
    expect(cap.space).toBeLessThan(cap.food);
  });

  test('el mago de partida arranca justo lleno', () => {
    // 19.500 desde el 2026-09-21: eran 4.500 con los coeficientes
    // inventados. Los publicados alojan 4,3 veces más gente en la misma
    // tierra (docs/ORIGINAL.md §4.2).
    const m = nuevo();
    expect(populationCapacity(m, TUNING).capacity).toBe(19_500);
    expect(m.resources.population).toBe(19_500);
    // Y por tanto no crece: está en el tope.
    expect(income(m, CATALOG, TUNING).population).toBe(0);
  });

  test('la población crece 1,5% + 50 cuando hay sitio', () => {
    // docs/SISTEMAS.md §5.4 [orig].
    const m = mageWith({ towns: 100, farms: 300 }, 1_000, { population: 10_000 });
    expect(income(m, CATALOG, TUNING).population).toBe(200); // 50 + 150
  });

  test('el crecimiento se frena al llegar al tope, nunca lo pasa', () => {
    // Tope con 100 towns y 300 farms: espacio 130.000, comida 150.000.
    const m = mageWith({ towns: 100, farms: 300 }, 1_000, { population: 129_900 });
    expect(income(m, CATALOG, TUNING).population).toBe(100);
  });
});

describe('geld', () => {
  test('el mago de partida produce 22.801 brutos y 22.106 netos', () => {
    // **Los números de partida cambiaron el 2026-09-21** al adoptar la
    // economía publicada (docs/ORIGINAL.md §4.2). Eran 4.500 de población y
    // 4.050 de geld; son 19.500 y 22.801, porque los coeficientes reales
    // alojan 4,3 veces más gente en la misma tierra y el ingreso **es** la
    // población. docs/SISTEMAS.md §15.
    const m = nuevo();
    expect(income(m, CATALOG, TUNING).geld).toBe(22_801);
    expect(upkeep(m, CATALOG).geld).toBe(695);
    expect(netIncome(m, CATALOG, TUNING).geld).toBe(22_106);
  });

  test('más porcentaje de towns da más geld por habitante', () => {
    const pocas = mageWith({ towns: 50, farms: 300 }, 1_000, { population: 10_000 });
    const muchas = mageWith({ towns: 200, farms: 300 }, 1_000, { population: 10_000 });
    expect(income(muchas, CATALOG, TUNING).geld).toBeGreaterThan(
      income(pocas, CATALOG, TUNING).geld,
    );
  });

  test('sin población solo queda el suelo de 1.000', () => {
    // **Decía que sin población no había geld.** El original publica un
    // suelo de 1.000 por turno aunque no quede nadie (docs/ORIGINAL.md
    // §4.2), y ése es el que impide que un mago arruinado quede muerto sin
    // poder reaccionar.
    const m = mageWith({ towns: 300, farms: 300 }, 1_000, { population: 0 });
    expect(income(m, CATALOG, TUNING).geld).toBe(1_000);
  });
});

describe('upkeep', () => {
  test('solo las barriers cuestan maná', () => {
    const m = mageWith({ barriers: 10, farms: 100 }, 1_000);
    expect(upkeep(m, CATALOG).mana).toBe(500);
  });

  test('el ejército suma su upkeep', () => {
    const m = mageWith({ towns: 100, farms: 300 }, 1_000, {
      population: 10_000,
      army: [{ unitId: 'phalanx', count: 1_000 }],
    });
    const sinEjercito = upkeep(mageWith({ towns: 100, farms: 300 }, 1_000), CATALOG).geld;
    // 1.000 falanges a **0,60** de geld = 600. Era 2.000 hasta la fase 3,
    // cuando el upkeep me lo había inventado (docs/SISTEMAS.md §9.1).
    expect(upkeep(m, CATALOG).geld).toBe(sinEjercito + 600);
  });

  test('una unidad desconocida no revienta el cálculo', () => {
    const m = mageWith({ farms: 10 }, 100, { army: [{ unitId: 'no-existe', count: 5 }] });
    expect(() => upkeep(m, CATALOG)).not.toThrow();
  });
});

describe('todo sale entero', () => {
  test('ningún ingreso ni upkeep tiene decimales', () => {
    for (const land of [200, 337, 1_250, 5_000]) {
      const m = mageWith({ towns: 40, farms: 120, nodes: 33, guilds: 7 }, land, {
        population: 7_777,
      });
      for (const v of Object.values(income(m, CATALOG, TUNING))) {
        expect(Number.isInteger(v)).toBe(true);
      }
      for (const v of Object.values(upkeep(m, CATALOG))) {
        expect(Number.isInteger(v)).toBe(true);
      }
    }
  });
});
