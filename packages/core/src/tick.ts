/**
 * Lo que pasa **al gastar un turno**: se produce, se paga el mantenimiento,
 * llega la tropa reclutada, y si algo no se puede pagar, se colapsa.
 *
 * docs/SISTEMAS.md §5. Esto no lo dispara ningún reloj: lo dispara el jugador
 * gastando turnos (docs/ARQUITECTURA.md §4).
 *
 * Fuera de alcance:
 *  - La investigación y los cast turns (fase 2).
 *  - El colapso de encantamientos solo los borra; sus efectos no existen aún.
 */

import { income, upkeep, type EconomyTuning } from './economy.js';
import { manaStorage } from './mana.js';
import { BUILDINGS } from './types.js';
import type { Building, Catalog, GameEvent, MageState, RandomSource, Stack } from './types.js';

/** Los edificios que el colapso de geld puede perder, de menos a más valioso. */
const EXPENDABLE: readonly Building[] = ['barriers', 'barracks', 'workshops', 'guilds', 'farms', 'towns', 'nodes'];

/**
 * Disuelve stacks al azar hasta liberar lo que haga falta.
 *
 * docs/SISTEMAS.md §5.6 [orig]: a cero de maná «los stacks se disuelven **al
 * azar**». El azar sale del `RandomSource` y su semilla se guarda, así que el
 * jugador puede ver en la crónica por qué perdió justo ése
 * (docs/SPECS.md §5, invariante 3).
 */
function disbandRandomStacks(army: Stack[], howMany: number, random: RandomSource): { army: Stack[]; disbanded: number } {
  const out = army.map((s) => ({ ...s }));
  let disbanded = 0;
  while (disbanded < howMany && out.some((s) => s.count > 0)) {
    const vivos = out.map((s, i) => [s, i] as const).filter(([s]) => s.count > 0);
    const elegido = vivos[random.nextInt(vivos.length)];
    if (!elegido) break;
    const [stack] = elegido;
    stack.count = 0;
    disbanded += 1;
  }
  return { army: out.filter((s) => s.count > 0), disbanded };
}

export interface TurnResolution {
  state: MageState;
  events: GameEvent[];
}

/**
 * Resuelve **un** turno gastado: produce, paga, cobra las consecuencias y
 * entrega la tropa reclutada.
 *
 * `manaMultiplier` y `geldMultiplier` valen 2 cuando el turno se gastó en
 * cargar (docs/SISTEMAS.md §5.5 [orig]).
 */
export function resolveTurn(
  state: MageState,
  catalog: Catalog,
  tuning: EconomyTuning,
  random: RandomSource,
  multipliers: { mana?: number; geld?: number } = {},
): TurnResolution {
  const events: GameEvent[] = [];
  let next: MageState = { ...state, resources: { ...state.resources }, buildings: { ...state.buildings } };

  // 1. Producir.
  const inc = income(next, catalog, tuning);
  const geldIn = inc.geld * (multipliers.geld ?? 1);
  const manaIn = inc.mana * (multipliers.mana ?? 1);

  const storage = manaStorage(next.buildings.nodes, tuning.manaStoragePerNode);
  const manaAntes = next.resources.mana;
  const manaBruto = manaAntes + manaIn;
  const manaTrasTope = Math.min(manaBruto, storage);
  const derramado = manaBruto - manaTrasTope;

  next.resources.geld += geldIn;
  next.resources.mana = manaTrasTope;
  next.resources.population += inc.population;

  events.push({ type: 'resources.produced', geld: geldIn, mana: manaIn, population: inc.population });
  // El almacén ES el node: lo que sobra se pierde (docs/ORIGINAL.md §3).
  if (derramado > 0) events.push({ type: 'mana.overflowed', lost: derramado });

  // 2. Pagar el mantenimiento.
  const up = upkeep(next, catalog);
  next.resources.geld -= up.geld;
  next.resources.mana -= up.mana;
  events.push({ type: 'upkeep.paid', geld: up.geld, mana: up.mana });

  // 3. Colapsar, si no llega. Los tres son distintos a propósito
  //    (docs/SISTEMAS.md §5.6).
  next = collapse(next, catalog, random, events);

  // 4. Llega la tropa reclutada. docs/SISTEMAS.md §8 [orig]: poco a poco.
  if (next.recruiting && next.recruiting.remaining > 0) {
    const llegan = Math.min(next.recruiting.perTurn, next.recruiting.remaining);
    if (llegan > 0) {
      const army = next.army.map((s) => ({ ...s }));
      const existente = army.find((s) => s.unitId === next.recruiting!.unitId);
      if (existente) existente.count += llegan;
      else army.push({ unitId: next.recruiting.unitId, count: llegan });
      const remaining = next.recruiting.remaining - llegan;
      next = {
        ...next,
        army,
        recruiting: remaining > 0 ? { ...next.recruiting, remaining } : null,
      };
      events.push({ type: 'recruit.arrived', unitId: army[army.length - 1]!.unitId, count: llegan });
    }
  }

  return { state: next, events };
}

/**
 * Las tres cascadas de docs/SISTEMAS.md §5.6 [orig]. **No son la misma**, y
 * cada una se siente distinta:
 *
 *  - **Maná**: stacks al azar, encantamientos, barriers.
 *  - **Población**: stacks.
 *  - **Geld**: deserción, edificios, y los forts **a la mitad cada turno**.
 */
function collapse(
  state: MageState,
  catalog: Catalog,
  random: RandomSource,
  events: GameEvent[],
): MageState {
  let next = state;

  // --- Maná a cero -------------------------------------------------------
  if (next.resources.mana < 0) {
    const buildings = { ...next.buildings };
    const enchantmentsLost = next.enchantments.length;
    const barriersPerdidas = buildings.barriers;
    buildings.barriers = 0;

    const { army, disbanded } = disbandRandomStacks(next.army, 1, random);
    next = {
      ...next,
      buildings,
      // Las barriers eran acres: vuelven a ser tierra libre, o el invariante
      // `total = free + Σ buildings` deja de cumplirse.
      land: { ...next.land, free: next.land.free + barriersPerdidas },
      enchantments: [],
      army,
      resources: { ...next.resources, mana: 0 },
    };
    events.push({ type: 'collapse.mana', stacksDisbanded: disbanded, enchantmentsLost });
  }

  // --- Población a cero --------------------------------------------------
  const espacioEjercito = next.army.reduce((total, s) => {
    const spec = catalog.units[s.unitId];
    return total + (spec ? s.count * spec.populationSpace : 0);
  }, 0);
  if (next.resources.population < 0 || (espacioEjercito > 0 && next.resources.population < 0)) {
    const { army, disbanded } = disbandRandomStacks(next.army, 1, random);
    next = { ...next, army, resources: { ...next.resources, population: 0 } };
    events.push({ type: 'collapse.population', stacksDisbanded: disbanded });
  }

  // --- Geld a cero -------------------------------------------------------
  if (next.resources.geld < 0) {
    let deuda = -next.resources.geld;
    let unitsDeserted = 0;

    // Primero desertan las unidades: son lo más caro de mantener.
    const army = next.army.map((s) => ({ ...s }));
    for (const stack of army) {
      if (deuda <= 0) break;
      const spec = catalog.units[stack.unitId];
      if (!spec || spec.upkeepGeld <= 0) continue;
      const necesarias = Math.ceil(deuda / spec.upkeepGeld);
      const van = Math.min(stack.count, necesarias);
      stack.count -= van;
      unitsDeserted += van;
      deuda -= van * spec.upkeepGeld;
    }

    // Luego se pierden edificios, de menos a más valioso.
    const buildings = { ...next.buildings };
    let free = next.land.free;
    let buildingsLost = 0;
    for (const b of EXPENDABLE) {
      if (deuda <= 0) break;
      const spec = catalog.buildings[b];
      if (spec.upkeepGeld <= 0) continue;
      const necesarios = Math.ceil(deuda / spec.upkeepGeld);
      const van = Math.min(buildings[b], necesarios);
      buildings[b] -= van;
      free += van;
      buildingsLost += van;
      deuda -= van * spec.upkeepGeld;
    }

    // Y los forts se reducen a la mitad cada turno, sin recuperarse.
    const fortsAntes = buildings.forts;
    buildings.forts = Math.floor(fortsAntes / 2);
    const fortsLost = fortsAntes - buildings.forts;
    free += fortsLost;

    next = {
      ...next,
      army: army.filter((s) => s.count > 0),
      buildings,
      land: { ...next.land, free },
      resources: { ...next.resources, geld: 0 },
    };
    events.push({ type: 'collapse.geld', fortsLost, buildingsLost, unitsDeserted });
  }

  // Ningún recurso queda en negativo (docs/SPECS.md §5, invariante 7).
  const resources = { ...next.resources };
  for (const k of ['geld', 'mana', 'population'] as const) {
    if (resources[k] < 0) resources[k] = 0;
  }
  return { ...next, resources };
}

/** Suma de edificios, para comprobar el invariante de la tierra. */
export function sumBuildings(state: MageState): number {
  let t = 0;
  for (const b of BUILDINGS) t += state.buildings[b];
  return t;
}
