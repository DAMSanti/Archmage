/**
 * La economía: qué produce y qué cuesta un reino, por turno gastado.
 *
 * Todo se produce **al gastar un turno**, nunca con el reloj
 * (docs/SISTEMAS.md §5). El reloj solo hace turnos.
 *
 * Fuera de alcance aquí:
 *  - Los encantamientos y su upkeep de maná (fase 2). El hueco está en
 *    `upkeep()`: suma `state.enchantments`, que en la fase 1 va vacío.
 *  - Los modificadores de items sobre el ingreso (fase 4).
 */

import { manaIncome } from './mana.js';
import type { EconomyModifiers } from './spells.js';
import { BUILDINGS } from './types.js';
import type { Catalog, MageState } from './types.js';

/**
 * Los coeficientes de la economía. **No son constantes del núcleo**: entran
 * como parámetro porque son justo lo que el simulador de temporada puede
 * querer mover (docs/ARQUITECTURA.md §9.7).
 *
 * **Casi todos están publicados** desde el 2026-09-21 (docs/ORIGINAL.md
 * §4.2, confianza alta). Antes de esa fecha eran invención nuestra, y la
 * forma que les habíamos dado estaba mal: teníamos un solo tope de población
 * con la farm haciendo de comida, cuando el original tiene **dos topes
 * separados**.
 */
export interface EconomyTuning {
  /** **[orig]** Suelo de geld por turno, aunque la población sea cero. */
  geldFlat: number;
  /** **[orig]** Espacio residencial por town: 1.000. */
  spacePerTown: number;
  /** **[orig]** Espacio residencial por farm: 100. */
  spacePerFarm: number;
  /** **[orig]** Comida por farm: 500. La comida **solo** sale de farms. */
  foodPerFarm: number;
  /**
   * **[nuestro]** Comida que consume una unidad del ejército.
   *
   * El original dice que **todas** las unidades comen de las mismas farms
   * («your army units are also part of your population and have to be fed
   * using the same farms») pero **no publica la ración**. Se pone 1: una
   * unidad es una boca. El espacio residencial va aparte y sí varía por
   * unidad —`populationSpace`—, porque el original dice que solo *algunas*
   * tropas lo ocupan.
   */
  foodPerUnit: number;
  populationGrowthFlat: number;
  populationGrowthRate: number;
  manaStoragePerNode: number;
}

export interface Income {
  geld: number;
  mana: number;
  population: number;
}

export interface Upkeep {
  geld: number;
  mana: number;
  population: number;
}

/**
 * Los modificadores activos, sumados.
 *
 * Están en centésimas y se **multiplican** entre sí: dos encantamientos que
 * dan +25% y +15% dejan el total en 143,75%, no en 140%. La potencia de cada
 * uno se congeló al lanzarlo ([orig], docs/ORIGINAL.md §6.2), así que aquí
 * solo se combinan.
 */
export function activeModifiers(state: MageState): Required<EconomyModifiers> {
  const total = {
    farmOutput: 100,
    townOutput: 100,
    nodeOutput: 100,
    populationGrowth: 100,
    buildRate: 100,
    researchRate: 100,
  };
  for (const ench of state.enchantments) {
    for (const [k, v] of Object.entries(ench.modifiers)) {
      if (k in total) {
        const clave = k as keyof typeof total;
        total[clave] = Math.floor((total[clave] * v) / 100);
      }
    }
  }
  return total;
}

/** Aplica un modificador en centésimas. Redondea **una sola vez**. */
function conModificador(valor: number, mod: number): number {
  return Math.floor((valor * mod) / 100);
}

/**
 * Espacio de población de las towns, y lo que alimentan las farms.
 *
 * docs/SISTEMAS.md §5.4: manda **el menor de los dos**. Los coeficientes (300
 * y 100) están elegidos para que la proporción 3:1 que recomienda el original
 * salga sola.
 */
export function populationCapacity(
  state: MageState,
  tuning: EconomyTuning,
): { space: number; food: number; capacity: number } {
  const mods = activeModifiers(state);
  // **El espacio lo dan varios edificios y se SUMA** (docs/ORIGINAL.md §4.2):
  // un town aloja 1.000 y una farm 100. Hasta el 2026-09-21 aquí solo
  // contaban los towns, a 300, y la farm hacía de tope de comida — una
  // mezcla de los dos topes en uno.
  const space = state.buildings.towns * tuning.spacePerTown +
    state.buildings.farms * tuning.spacePerFarm;
  // La comida sale **solo** de las farms, a 500. Los encantamientos de farms
  // la suben, que es el tope que más duele en Verdant (docs/SISTEMAS.md §5.4).
  const food = conModificador(state.buildings.farms * tuning.foodPerFarm, mods.farmOutput);
  return { space, food, capacity: Math.min(space, food) };
}

/**
 * Espacio que ocupa el ejército. docs/SISTEMAS.md §8 [orig]: toda unidad
 * ocupa sitio de población.
 */
export function armyPopulationSpace(state: MageState, catalog: Catalog): number {
  let total = 0;
  for (const stack of state.army) {
    const spec = catalog.units[stack.unitId];
    if (spec) total += stack.count * spec.populationSpace;
  }
  return total;
}

/** Cuánta población civil cabe aún, descontando lo que ocupa el ejército. */
export function civilianRoom(
  state: MageState,
  catalog: Catalog,
  tuning: EconomyTuning,
): number {
  const { space, food } = populationCapacity(state, tuning);
  // **El ejército compite por los dos topes, y no por igual**
  // (docs/ORIGINAL.md §4.2): todas las unidades comen, solo algunas ocupan
  // espacio residencial. Se resta de cada tope lo suyo y se toma el menor —
  // restar de `capacity` una sola vez daría de más en cuanto los dos topes
  // no fueran iguales.
  const ocupado = armyPopulationSpace(state, catalog);
  const comido = armyFood(state, catalog, tuning);
  return Math.max(0, Math.min(space - ocupado, food - comido));
}

/** Comida que se come el ejército. docs/ORIGINAL.md §4.2. */
export function armyFood(state: MageState, catalog: Catalog, tuning: EconomyTuning): number {
  let total = 0;
  for (const stack of state.army) {
    if (!catalog.units[stack.unitId]) continue;
    total += stack.count * tuning.foodPerUnit;
  }
  return total;
}

/**
 * Lo que produce un turno gastado.
 *
 * - **Maná**: solo los nodes, con la sierra publicada (ver `mana.ts`).
 * - **Geld**: `población × (base + porTown × %towns)`. docs/SISTEMAS.md §5.3
 *   [orig] la forma —población y porcentaje de towns—, [nuestro] los
 *   coeficientes. **Sin sierra**: el freno es que cada town es un acre que no
 *   es farm, y las farms sostienen la población que produce el geld.
 * - **Población**: `plano + tasa × población`, frenando al llegar al tope
 *   (docs/SISTEMAS.md §5.4 [orig]).
 *
 * Cada división redondea **una sola vez, aquí** (docs/SPECS.md §5,
 * invariante 7).
 */
export function income(state: MageState, catalog: Catalog, tuning: EconomyTuning): Income {
  const mods = activeModifiers(state);
  const mana = conModificador(
    manaIncome(state.buildings.nodes, state.land.total),
    mods.nodeOutput,
  );

  // **La fórmula publicada** (docs/ORIGINAL.md §4.2, confianza alta):
  //   Pob × ((100 + 10×towns) / tierra) ^ 0,5 + 1.000
  // Es la primera de las tres versiones que documenta la wiki: la única en
  // la que los towns hacen algo por el geld. En 2009 le pusieron al
  // exponente 0,0000005, que anula el paréntesis y deja «Pob + 1.000» —
  // el juego después de quitarle esa decisión.
  //
  // El exponente 0,5 es lo que da **rendimiento decreciente** a los towns:
  // doblarlos no dobla el geld por cabeza.
  const factor =
    state.land.total > 0
      ? Math.sqrt((100 + 10 * state.buildings.towns) / state.land.total)
      : 1;
  const geld = conModificador(
    Math.floor(state.resources.population * factor + tuning.geldFlat),
    mods.townOutput,
  );

  const room = civilianRoom(state, catalog, tuning) - state.resources.population;
  const growthBase =
    tuning.populationGrowthFlat + Math.floor(state.resources.population * tuning.populationGrowthRate);
  const growth = conModificador(growthBase, mods.populationGrowth);
  const population = Math.max(0, Math.min(growth, room));

  return { geld, mana, population };
}

/**
 * Lo que cuesta mantener el reino, por turno.
 *
 * Edificios (docs/SISTEMAS.md §4.2) más ejército (§8.1) más encantamientos
 * (fase 2, hoy vacío).
 */
export function upkeep(state: MageState, catalog: Catalog): Upkeep {
  let geld = 0;
  let mana = 0;
  const population = 0;

  // Los edificios cuestan enteros.
  for (const b of BUILDINGS) {
    const spec = catalog.buildings[b];
    geld += state.buildings[b] * spec.upkeepGeld;
    mana += state.buildings[b] * spec.upkeepMana;
  }

  // Las unidades cuestan **centésimas**: los valores publicados son
  // fraccionarios (la Dríade, 0,01 de maná) y los recursos son enteros. Se
  // acumula en centésimas y **se redondea una sola vez**, abajo
  // (docs/SPECS.md §5, invariante 7).
  let geldCent = 0;
  let manaCent = 0;
  for (const stack of state.army) {
    const spec = catalog.units[stack.unitId];
    if (!spec) continue;
    geldCent += stack.count * spec.upkeepGeld;
    manaCent += stack.count * spec.upkeepMana;
  }
  geld += Math.floor(geldCent / 100);
  mana += Math.floor(manaCent / 100);

  for (const ench of state.enchantments) mana += ench.upkeepMana;

  return { geld, mana, population };
}

/**
 * Ingreso **neto**: lo que de verdad decide si tu ejército sobrevive, y el
 * número que la pantalla del reino enseña (docs/INTERFAZ.md §3).
 */
export function netIncome(
  state: MageState,
  catalog: Catalog,
  tuning: EconomyTuning,
): Income {
  const inc = income(state, catalog, tuning);
  const up = upkeep(state, catalog);
  return {
    geld: inc.geld - up.geld,
    mana: inc.mana - up.mana,
    population: inc.population - up.population,
  };
}
