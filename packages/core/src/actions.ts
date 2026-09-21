/**
 * Las seis acciones de la fase 1, y el despachador `apply()`.
 *
 * docs/SPECS.md §2. **No hay mutación en sitio**: todo devuelve estado nuevo.
 * `apply()` es la única puerta, y ningún endpoint lleva reglas
 * (docs/SPECS.md §5, invariante 8).
 *
 * Fuera de alcance: las acciones de las fases 2 a 5 — investigar, lanzar,
 * atacar, mercado, gremios. Cuando lleguen, se añaden aquí y solo aquí.
 */

import { resolveTurn } from './tick.js';
import type { EconomyTuning } from './economy.js';
import { CONSTRUCTION_SCALE } from './types.js';
import type {
  Action,
  Building,
  Catalog,
  Ctx,
  DomainError,
  DomainErrorCode,
  GameEvent,
  MageState,
  Result,
} from './types.js';

/** Configuración de exploración. Son datos (docs/SISTEMAS.md §3). */
export interface ExploreTuning {
  exploreFactor: number;
  exploreLandCap: number;
}

const fail = (code: DomainErrorCode, message: string): Result => ({
  ok: false,
  error: { code, message } satisfies DomainError,
});

/**
 * Velocidad de construcción, en **diezmilésimas de edificio por turno**.
 *
 * docs/SISTEMAS.md §4.1 [orig], confianza alta:
 * `base = (workshops / 10) + 0,1`, y de ahí cada edificio con su divisor.
 *
 * Se calcula en punto fijo para que el acarreo entre turnos no se desvíe
 * (docs/ARQUITECTURA.md §9.4). **El único redondeo está aquí**: los divisores
 * 3 y 30 no dan exacto, y se trunca hacia abajo.
 */
export function buildRateFp(building: Building, workshops: number): number {
  const base = workshops * 1_000 + 1_000; // (W/10 + 0,1) × 10.000
  switch (building) {
    case 'farms':
    case 'barracks':
      return base * 2;
    case 'workshops':
      return base;
    case 'guilds':
      return Math.floor(base / 2);
    case 'towns':
    case 'nodes':
      return Math.floor(base / 3);
    case 'forts':
      return Math.floor(base / 30);
    case 'barriers':
      // docs/SISTEMAS.md §4.1 [orig]: 1 por turno, siempre.
      return CONSTRUCTION_SCALE;
  }
}

/**
 * Acres que da un turno de exploración.
 *
 * docs/SISTEMAS.md §3 [nuestro]: `redondeo(factor × (1 − tierra/tope))`,
 * mínimo 0. Ajustada a los extremos medidos del original: 18-26 acres con 200
 * acres, 0-1 al final, y nada a partir de 3.500.
 */
export function exploreYield(land: number, tuning: ExploreTuning): number {
  if (land >= tuning.exploreLandCap) return 0;
  return Math.max(0, Math.round(tuning.exploreFactor * (1 - land / tuning.exploreLandCap)));
}

export interface ApplyTuning extends EconomyTuning, ExploreTuning {}

/**
 * La única puerta. `Ctx` trae el tiempo, el azar y el catálogo: el núcleo
 * nunca los coge por su cuenta (docs/SPECS.md §5, invariantes 1 y 2).
 */
export function apply(state: MageState, action: Action, ctx: Ctx, tuning: ApplyTuning): Result {
  switch (action.type) {
    case 'build':
      return build(state, action.building, action.turns, ctx, tuning, false);
    case 'demolish':
      return build(state, action.building, action.turns, ctx, tuning, true);
    case 'explore':
      return explore(state, action.turns, ctx, tuning);
    case 'chargeMana':
      return charge(state, action.turns, ctx, tuning, 'mana');
    case 'chargeGeld':
      return charge(state, action.turns, ctx, tuning, 'geld');
    case 'setRecruit':
      return setRecruit(state, action.unitId, action.count, ctx);
    default:
      return fail('unknown_action', `Acción desconocida: ${(action as { type: string }).type}`);
  }
}

/** Gasta turnos y resuelve cada uno. Devuelve null si no hay suficientes. */
function spend(
  state: MageState,
  turns: number,
  ctx: Ctx,
  tuning: ApplyTuning,
  onTurn: (s: MageState, events: GameEvent[]) => MageState,
  multipliers: { mana?: number; geld?: number } = {},
): { state: MageState; events: GameEvent[] } | null {
  if (turns <= 0 || !Number.isInteger(turns)) return null;
  if (state.turns.current < turns) return null;

  let s: MageState = { ...state, turns: { ...state.turns } };
  const events: GameEvent[] = [];

  for (let i = 0; i < turns; i++) {
    s = { ...s, turns: { ...s.turns, current: s.turns.current - 1 }, turnsSpent: s.turnsSpent + 1 };
    // Producir primero: lo que ganas este turno se puede gastar este turno.
    const r = resolveTurn(s, ctx.catalog, tuning, ctx.random, multipliers);
    s = r.state;
    events.push(...r.events);
    s = onTurn(s, events);
  }
  return { state: s, events };
}

function build(
  state: MageState,
  building: Building,
  turns: number,
  ctx: Ctx,
  tuning: ApplyTuning,
  demolishing: boolean,
): Result {
  if (turns <= 0 || !Number.isInteger(turns)) return fail('invalid_amount', 'Los turnos son un entero positivo.');
  if (state.turns.current < turns) return fail('not_enough_turns', 'No tienes tantos turnos.');

  const spec = ctx.catalog.buildings[building];

  const out = spend(state, turns, ctx, tuning, (s, events) => {
    const rate = buildRateFp(building, s.buildings.workshops);
    const construction = { ...s.construction };
    construction[building] += rate;

    const posibles = Math.floor(construction[building] / CONSTRUCTION_SCALE);
    if (posibles <= 0) return { ...s, construction };

    if (demolishing) {
      const van = Math.min(posibles, s.buildings[building]);
      if (van <= 0) return { ...s, construction };
      construction[building] -= van * CONSTRUCTION_SCALE;
      events.push({ type: 'building.demolished', building, amount: van });
      // Demoler no devuelve geld (docs/SISTEMAS.md §4.1) y libera el acre ya.
      return {
        ...s,
        construction,
        buildings: { ...s.buildings, [building]: s.buildings[building] - van },
        land: { ...s.land, free: s.land.free + van },
      };
    }

    const porGeld = spec.cost > 0 ? Math.floor(s.resources.geld / spec.cost) : posibles;
    const van = Math.min(posibles, s.land.free, porGeld);
    if (van <= 0) return { ...s, construction };

    construction[building] -= van * CONSTRUCTION_SCALE;
    events.push({ type: 'building.completed', building, amount: van });
    return {
      ...s,
      construction,
      buildings: { ...s.buildings, [building]: s.buildings[building] + van },
      land: { ...s.land, free: s.land.free - van },
      resources: { ...s.resources, geld: s.resources.geld - van * spec.cost },
    };
  });

  if (!out) return fail('not_enough_turns', 'No tienes tantos turnos.');
  out.events.push({ type: 'turns.spent', amount: turns, on: demolishing ? 'demolish' : 'build' });
  return { ok: true, state: out.state, events: out.events };
}

function explore(state: MageState, turns: number, ctx: Ctx, tuning: ApplyTuning): Result {
  if (turns <= 0 || !Number.isInteger(turns)) return fail('invalid_amount', 'Los turnos son un entero positivo.');
  if (state.turns.current < turns) return fail('not_enough_turns', 'No tienes tantos turnos.');

  // A tope de exploración el turno NO se gasta: el juego no te deja tirarlo
  // sin avisar (docs/SISTEMAS.md §17.1, criterio 6).
  if (exploreYield(state.land.total, tuning) <= 0) {
    return fail('exploration_exhausted', 'Ya no queda tierra que explorar: el crecimiento viene de atacar.');
  }

  const out = spend(state, turns, ctx, tuning, (s, events) => {
    const acres = exploreYield(s.land.total, tuning);
    if (acres <= 0) {
      events.push({ type: 'land.exhausted' });
      return s;
    }
    events.push({ type: 'land.explored', acres });
    return { ...s, land: { total: s.land.total + acres, free: s.land.free + acres } };
  });

  if (!out) return fail('not_enough_turns', 'No tienes tantos turnos.');
  out.events.push({ type: 'turns.spent', amount: turns, on: 'explore' });
  return { ok: true, state: out.state, events: out.events };
}

function charge(
  state: MageState,
  turns: number,
  ctx: Ctx,
  tuning: ApplyTuning,
  what: 'mana' | 'geld',
): Result {
  if (turns <= 0 || !Number.isInteger(turns)) return fail('invalid_amount', 'Los turnos son un entero positivo.');
  if (state.turns.current < turns) return fail('not_enough_turns', 'No tienes tantos turnos.');

  // docs/SISTEMAS.md §5.5 [orig]: duplica lo que producirías ese turno.
  const out = spend(state, turns, ctx, tuning, (s) => s, what === 'mana' ? { mana: 2 } : { geld: 2 });
  if (!out) return fail('not_enough_turns', 'No tienes tantos turnos.');
  out.events.push({ type: 'turns.spent', amount: turns, on: what === 'mana' ? 'chargeMana' : 'chargeGeld' });
  return { ok: true, state: out.state, events: out.events };
}

/**
 * docs/SISTEMAS.md §8 [orig]: fijar un reclutamiento **no cuesta turnos**, y
 * solo se recluta un tipo a la vez. El geld se paga por adelantado.
 */
function setRecruit(state: MageState, unitId: string, count: number, ctx: Ctx): Result {
  if (count <= 0 || !Number.isInteger(count)) return fail('invalid_amount', 'El número de unidades es un entero positivo.');
  const spec = ctx.catalog.units[unitId];
  if (!spec) return fail('unknown_unit', `No existe la unidad ${unitId}.`);

  const coste = spec.cost * count;
  if (state.resources.geld < coste) return fail('not_enough_geld', 'No tienes geld para ese reclutamiento.');

  const perTurn = Math.max(1, state.buildings.barracks * spec.recruitPerBarracks);

  return {
    ok: true,
    state: {
      ...state,
      resources: { ...state.resources, geld: state.resources.geld - coste },
      recruiting: { unitId, remaining: count, perTurn },
    },
    events: [{ type: 'recruit.set', unitId, total: count }],
  };
}
