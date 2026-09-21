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
 * Fuera de alcance: no hay PvP ni items. Desde la fase 2 **sí hay magia**,
 * que es lo que permite volver a comparar repartos: sin ella el maná no
 * servía para nada y el reparto económico ganaba por definición
 * (docs/SISTEMAS.md §17.2, criterio 9). El balance de combate sigue siendo
 * de la fase 3.
 */

import { apply, createMage, exploreYield, makeRandom, netIncome, netPower, populationCapacity } from '@archmage/core';
import type { Action, Ctx, MageState } from '@archmage/core';
import { CATALOG, ECONOMY, STARTING_KINGDOM, TERRA } from './index.js';
import { SPELLS } from './spells.js';

const TUNING = { ...ECONOMY };

/**
 * Azar reproducible. Sin semilla fija, una simulación no es una medida.
 * Viene del núcleo: una sola implementación para todo el proyecto.
 */
export { makeRandom as seededRandom } from '@archmage/core';

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
  return mixWithMagic(mix, exploreUntil, false);
}

/**
 * Lo mismo, pero **usando la magia**: investiga cuando puede, lanza los
 * encantamientos económicos, e invoca cuando le sobra maná.
 *
 * Es la estrategia que hace comparable un reparto volcado a maná con uno
 * volcado a economía, que es el criterio 10 de §7.1.
 */
export function magicStrategy(mix: Mix, exploreUntil = 1_300): Strategy {
  return mixWithMagic(mix, exploreUntil, true);
}

function mixWithMagic(mix: Mix, exploreUntil: number, useMagic: boolean): Strategy {
  const economicos = SPELLS.filter(
    (sp) => sp.effect.kind === 'enchantment' && sp.school !== 'plain',
  ).map((sp) => sp.id);
  const utiles = SPELLS.filter((sp) => sp.effect.kind === 'enchantment').map((sp) => sp.id);
  const invocaciones = SPELLS.filter((sp) => sp.effect.kind === 'summon')
    .slice()
    .sort((a, b) => b.castMana - a.castMana)
    .map((sp) => sp.id);
  void economicos;

  return (state, turn) => {
    if (useMagic) {
      // 1. Terminar lo empezado.
      if (state.casting) return { type: 'cast', spellId: state.casting.spellId, turns: 1 };

      // 2. Mantener los encantamientos económicos que se puedan pagar.
      for (const id of utiles) {
        const sp = CATALOG.spells[id];
        if (!sp) continue;
        if (!state.spellbook.known.includes(id)) continue;
        if (state.enchantments.some((e) => e.spellId === id)) continue;
        if (state.resources.mana < sp.castMana) continue;
        return { type: 'cast', spellId: id, turns: 1 };
      }

      // 3. Investigar lo siguiente que no sepa.
      const pendiente =
        state.spellbook.researching?.spellId ??
        SPELLS.find(
          (sp) => !state.spellbook.known.includes(sp.id) && sp.school !== 'nether',
        )?.id;
      // Solo se dedica turno a investigar si ya hay guilds que lo aprovechen.
      if (pendiente && state.buildings.guilds >= 20 && turn % 3 === 0) {
        return { type: 'research', spellId: pendiente, turns: 1 };
      }

      // 4. Si sobra maná (más del 60% del almacén), invocar lo más caro que
      //    quepa: el maná guardado no hace nada.
      const almacen = state.buildings.nodes * ECONOMY.manaStoragePerNode;
      if (almacen > 0 && state.resources.mana > almacen * 0.6) {
        for (const id of invocaciones) {
          const sp = CATALOG.spells[id];
          if (!sp || !state.spellbook.known.includes(id)) continue;
          if (state.resources.mana < sp.castMana) continue;
          return { type: 'cast', spellId: id, turns: 1 };
        }
      }
    }
    return baseMix(mix, exploreUntil)(state, turn);
  };
}

function baseMix(mix: Mix, exploreUntil: number): Strategy {
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
  /**
   * Cuántas unidades sostiene el ingreso neto, al upkeep medio **real** de
   * la tropa reclutable. Hasta la fase 3 dividía por 2 geld inventados; el
   * medio de verdad es 0,914, así que el número sale 2,19 veces mayor
   * (docs/SISTEMAS.md §17.2, criterio 11).
   */
  sustainableArmy: number;
  /** Fase 2. */
  spellsKnown: number;
  spellLevel: number;
  enchantments: number;
  summonedUnits: number;
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
    random: makeRandom(seed),
    server: TERRA,
    catalog: CATALOG,
  };

  let state = createMage({
    id: 'sim',
    name: 'Simulado',
    // Verdant: es la escuela que la fase 2 implementa. Un mago Plain solo
    // llega a Simple y Average, así que no podría usar la magia de verdad.
    specialty: 'verdant',
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
    netPower: netPower(state, CATALOG),
    sustainableArmy: Math.max(0, Math.floor(net.geld / (AVG_UPKEEP_CENT / 100))),
    spellsKnown: state.spellbook.known.length,
    spellLevel: state.spellbook.level,
    enchantments: state.enchantments.length,
    summonedUnits: state.army.reduce((a, st) => a + st.count, 0),
    state,
  };
}

/** Repartos de referencia, incluidos los que recomiendan las guías del original. */
/**
 * Upkeep medio de la tropa reclutable, en **centésimas** de geld: 91,4.
 *
 * Se calcula del catálogo a propósito. La cifra vivía a mano como «2 geld» —
 * un número que me inventé en la fase 1 y que la ficha publicada de la
 * Milicia (0,32) desmintió en la fase 3.
 */
export const AVG_UPKEEP_CENT = (() => {
  const reclutables = Object.values(CATALOG.units).filter((u) => u.recruitPerBarracks > 0);
  return reclutables.reduce((a, u) => a + u.upkeepGeld, 0) / reclutables.length;
})();

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
