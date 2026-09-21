/**
 * Simulador de temporada.
 *
 * Existe para **calibrar los números**, que es su único trabajo: los
 * coeficientes de `index.ts` son primera tirada y se mueven aquí, no
 * discutiéndolos (docs/SISTEMAS.md §17.2, docs/ARQUITECTURA.md §9.7).
 *
 * Vive en `content` y no en `core` porque necesita ver **las reglas y los
 * datos a la vez**, y el núcleo no puede importar el contenido
 * (docs/SPECS.md §5, invariante 1).
 *
 * Fuera de alcance: no hay PvP, ni magia, ni items. Un mago simulado juega
 * solo, así que esto calibra **la economía**, no el juego entero. El balance
 * de combate es de la fase 3.
 */

import { apply, createMage, exploreYield, netIncome, netPower, populationCapacity } from '@archmage/core';
import type { Action, Ctx, MageState, RandomSource } from '@archmage/core';
import { CATALOG, ECONOMY, STARTING_KINGDOM, TERRA } from './index.js';

const TUNING = { ...ECONOMY };

/** Azar reproducible. Sin semilla fija, una simulación no es una medida. */
export function seededRandom(seed: number): RandomSource {
  let s = seed >>> 0 || 1;
  const next = (): number => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 0x1_0000_0000;
  };
  return { next, nextInt: (max: number) => Math.floor(next() * max) };
}

/**
 * Una estrategia decide **en qué gasta el turno**, que es la decisión central
 * del juego (docs/SISTEMAS.md §1). Devuelve null cuando no quiere hacer nada.
 */
export type Strategy = (state: MageState, turn: number) => Action | null;

/** Porcentaje objetivo de cada edificio sobre la tierra. */
export interface Mix {
  nodes: number;
  towns: number;
  farms: number;
  workshops: number;
  guilds: number;
  barracks: number;
}

/**
 * Una estrategia que explora mientras rinda y luego construye hacia un
 * reparto objetivo, eligiendo cada turno el edificio que más lejos esté de su
 * cuota. Es la aproximación a «un jugador razonable» del criterio 10.
 */
export function mixStrategy(mix: Mix, exploreUntil = 1_300): Strategy {
  return (state) => {
    if (state.land.total < exploreUntil && exploreYield(state.land.total, ECONOMY) > 0) {
      return { type: 'explore', turns: 1 };
    }
    // Se elige por déficit **relativo** (qué fracción de su cuota le falta),
    // no absoluto. Con el déficit absoluto la estrategia se obsesiona con la
    // cuota más grande y nunca construye towns — que es un fallo del
    // simulador, no del juego, y costó una tanda de medidas descubrirlo.
    let peor: keyof Mix | null = null;
    let peorLlenado = Infinity;
    for (const [b, cuota] of Object.entries(mix) as [keyof Mix, number][]) {
      if (cuota <= 0) continue;
      const llenado = state.buildings[b] / state.land.total / cuota;
      if (llenado < peorLlenado && llenado < 1) {
        peorLlenado = llenado;
        peor = b;
      }
    }
    if (!peor) return null;
    return { type: 'build', building: peor, turns: 1 };
  };
}

export interface SeasonResult {
  turns: number;
  land: number;
  population: number;
  geld: number;
  mana: number;
  netGeld: number;
  netMana: number;
  netPower: number;
  /** Cuántas unidades sostiene el ingreso neto, a 2 geld de upkeep medio. */
  sustainableArmy: number;
  state: MageState;
}

/**
 * Juega `turns` turnos con una estrategia y devuelve lo medido.
 *
 * El mago recibe turnos «infinitos» a propósito: aquí se mide **en qué los
 * gasta**, no cuánto tarda el reloj en dárselos.
 */
export function simulateSeason(strategy: Strategy, turns: number, seed = 1): SeasonResult {
  const ctx: Ctx = {
    now: 0,
    random: seededRandom(seed),
    server: TERRA,
    catalog: CATALOG,
  };

  let state = createMage({
    id: 'sim',
    name: 'Simulado',
    specialty: 'plain',
    server: TERRA,
    starting: STARTING_KINGDOM,
    now: 0,
  });

  for (let t = 0; t < turns; t++) {
    // Se le rellenan los turnos: lo que se mide es el reparto, no el reloj.
    state = { ...state, turns: { ...state.turns, current: TERRA.turnCap } };
    const action = strategy(state, t);
    if (!action) break;
    const r = apply(state, action, ctx, TUNING);
    if (!r.ok) break;
    state = { ...r.state, turnsSpent: state.turnsSpent + 1 };
  }

  const net = netIncome(state, CATALOG, TUNING);
  return {
    turns,
    land: state.land.total,
    population: state.resources.population,
    geld: state.resources.geld,
    mana: state.resources.mana,
    netGeld: net.geld,
    netMana: net.mana,
    netPower: netPower(state),
    sustainableArmy: Math.max(0, Math.floor(net.geld / 2)),
    state,
  };
}

/** Repartos de referencia, incluidos los que recomiendan las guías del original. */
export const MIXES: Record<string, Mix> = {
  // docs/ORIGINAL.md §4.1: lo que recomiendan las guías.
  guia: { nodes: 0.3, towns: 0.1, farms: 0.3, workshops: 0.12, guilds: 0.1, barracks: 0.05 },
  // Volcado a maná, cerca del pico de la sierra.
  mana: { nodes: 0.55, towns: 0.08, farms: 0.24, workshops: 0.06, guilds: 0.04, barracks: 0.02 },
  // Volcado a economía.
  economia: { nodes: 0.1, towns: 0.2, farms: 0.5, workshops: 0.1, guilds: 0.05, barracks: 0.05 },
  // Volcado a ejército.
  ejercito: { nodes: 0.15, towns: 0.15, farms: 0.4, workshops: 0.1, guilds: 0.02, barracks: 0.18 },
};

export function capacityOf(state: MageState) {
  return populationCapacity(state, TUNING);
}
