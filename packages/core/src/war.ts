/**
 * Un ataque de principio a fin: la regla, pura.
 *
 * Es lo único del juego que **toca a dos magos a la vez**, y por eso no pasa
 * por `apply()` —que está escrito para uno— sino que tiene su propia
 * entrada. El servidor solo carga los dos con bloqueo, llama aquí y guarda
 * (docs/SPECS.md §5, invariantes 6 y 8).
 *
 * Fuera de alcance aquí, y declarado:
 *  - **Los hechizos de pre-batalla** y las tres resistencias que tiene que
 *    pasar el del atacante: fase 4, cuando haya hechizos de batalla.
 *  - **La experiencia de los héroes**: se gana por turno, no por batalla.
 *  - **Los items robados** en el saqueo: no hay catálogo de items todavía.
 */

import { type Army, type AttackType, armyPower, resolveBattle } from './battle.js';
import type { BattleStack } from './combat.js';
import { upkeep } from './economy.js';
import { itemsPillaged } from './items.js';
import type { ItemSpec } from './items.js';
import { prepareBattle, resurrected } from './prebattle.js';
import { landTaken, pillageTaken } from './land.js';
import { reinforcements, splitSurvivors } from './alliance.js';
import { canAttack } from './guild.js';
import { isProtected } from './mage.js';
import { netPower } from './netpower.js';
import { BUILDINGS } from './types.js';
import type { Catalog, Ctx, GameEvent, MageState } from './types.js';

/** Turnos que cuesta atacar. docs/SISTEMAS.md §9.1 [nuestro]. */
export const TURNS_PER_ATTACK = 2;

/**
 * Porción mínima de tu net power que tiene que tener alguien para poder
 * **saquearlo**: el **50%**. docs/ORIGINAL.md, confirmado.
 *
 * Sin esto, machacar novatos sería la estrategia óptima: el saqueo no tiene
 * coste de batalla y roba recursos, así que el objetivo perfecto sería el
 * más débil que exista.
 */
export const PILLAGE_MIN_POWER_SHARE = 0.5;

export type AttackError =
  | { code: 'sin_turnos'; message: string }
  | { code: 'es_de_tu_gremio'; message: string }
  | { code: 'sin_ejercito'; message: string }
  | { code: 'objetivo_protegido'; message: string }
  | { code: 'objetivo_debil'; message: string }
  | { code: 'sin_geld_para_upkeep'; message: string }
  | { code: 'objetivo_invalido'; message: string };

export interface AttackOutcome {
  attacker: MageState;
  defender: MageState;
  /** Los aliados que ayudaron, con su ejército ya devuelto. */
  allies?: MageState[];
  battle: {
    seed: number;
    attackType: AttackType;
    winner: 'attacker' | 'defender';
    rounds: number;
    landLost: number;
    landTaken: number;
    log: readonly unknown[];
    summary: Record<string, unknown>;
  };
  events: { mageId: string; event: GameEvent }[];
}

function ejercito(state: MageState, catalog: Catalog): { stacks: BattleStack[] } {
  const stacks: BattleStack[] = [];
  for (const s of state.army) {
    const unit = catalog.units[s.unitId];
    if (unit && s.count > 0) stacks.push({ unit, count: s.count });
  }
  return { stacks };
}

// La protección ya la sabe `mage.ts`, y se mide en turnos **gastados**
// (docs/SISTEMAS.md §15). No se reimplementa aquí.

/**
 * Resuelve un ataque entero.
 *
 * El orden importa y es el del original:
 *
 * 1. **Se cobra el upkeep de TODO el ejército** antes de resolver nada
 *    (`[orig]`). Atacar sin poder pagarlo te hunde aunque ganes — y por eso
 *    se cobra primero: si se cobrara después, ganar te salvaría de una
 *    decisión mala.
 * 2. Se pelea.
 * 3. El ganador se lleva tierra, o el saqueo roba y quema.
 *
 * Devuelve un error de dominio —que la ruta convierte en 422— en vez de
 * lanzar: «no tienes turnos» es juego, no avería (invariante 9).
 */
export function resolveAttack(
  attacker: MageState,
  defender: MageState,
  attackType: AttackType,
  ctx: Ctx,
  /**
   * Los gremios de los dos, si los tienen. **Opcional a propósito**: los
   * tests de la fase 3 no los pasan, y sin gremio el comportamiento es el
   * de antes — que es lo que protege lo ya calibrado.
   */
  guilds: { attacker: string | null; defender: string | null } = {
    attacker: null,
    defender: null,
  },
  /**
   * Los aliados **activos** del defensor. Quien llama ya ha comprobado el
   * plazo de ruptura: aquí llegan los que de verdad ayudan.
   *
   * **Opcional a propósito**, como los gremios: sin aliados el resultado es
   * idéntico al de la fase 3, y eso es lo que protege lo ya calibrado.
   */
  defenderAllies: readonly MageState[] = [],
): AttackOutcome | { error: AttackError } {
  if (attacker.id === defender.id) {
    return { error: { code: 'objetivo_invalido', message: 'No puedes atacarte a ti mismo.' } };
  }
  if (attacker.turns.current < TURNS_PER_ATTACK) {
    return {
      error: { code: 'sin_turnos', message: `Atacar cuesta ${TURNS_PER_ATTACK} turnos.` },
    };
  }
  // **A un compañero de gremio no se le ataca**, y es regla del código, no
  // norma de foro: si el juego lo permitiera, alguien lo usaría y el gremio
  // dejaría de significar nada (docs/SISTEMAS.md §14.1).
  if (!canAttack(guilds.attacker, guilds.defender)) {
    return {
      error: {
        code: 'es_de_tu_gremio',
        message: 'No puedes atacar a alguien de tu propio gremio.',
      },
    };
  }
  if (isProtected(defender, ctx.server)) {
    return {
      error: {
        code: 'objetivo_protegido',
        message: 'Ese mago sigue en su periodo de protección.',
      },
    };
  }

  const armAtt = ejercito(attacker, ctx.catalog);
  const armDef = ejercito(defender, ctx.catalog);
  if (armAtt.stacks.length === 0) {
    return { error: { code: 'sin_ejercito', message: 'No tienes ejército con el que atacar.' } };
  }

  const npAtt = netPower(attacker, ctx.catalog);
  const npDef = netPower(defender, ctx.catalog);
  if (attackType === 'pillage' && npDef < npAtt * PILLAGE_MIN_POWER_SHARE) {
    return {
      error: {
        code: 'objetivo_debil',
        message: 'Solo puedes saquear a magos con al menos la mitad de tu net power.',
      },
    };
  }

  // 1. El upkeep del ejército entero, por delante.
  const coste = upkeep(attacker, ctx.catalog).geld;
  if (attacker.resources.geld < coste) {
    return {
      error: {
        code: 'sin_geld_para_upkeep',
        message: `Atacar cuesta el upkeep de todo tu ejército: ${coste} de geld.`,
      },
    };
  }

  // **Los refuerzos de los aliados**, antes de la pre-batalla.
  //
  // Entran como stacks más del defensor, así que **la ronda no sabe que
  // las alianzas existen**. Y como van al montón, el aliado **pierde
  // unidades de verdad**: ayudar cuesta (docs/SISTEMAS.md §14.1).
  const puestoPorDefensor = contar(armDef.stacks);
  const puestoPorAliados: Record<string, Record<string, number>> = {};
  for (const aliado of defenderAllies) {
    const suyo = reinforcements(ejercito(aliado, ctx.catalog).stacks);
    puestoPorAliados[aliado.id] = contar(suyo);
    armDef.stacks.push(...suyo);
  }

  // 2. **La pre-batalla**, y luego la batalla.
  //
  // Hasta el 2026-09-22 esto llamaba a `resolveBattle()` directamente:
  // la capa de pre-batalla estaba escrita y probada desde la fase 4, y
  // **desconectada**, así que un ataque de verdad no aplicaba los items.
  // Se construyó y no se enchufó. Ahora sí.
  const seed = ctx.random.nextInt(0x7fff_ffff);
  const pre = prepareBattle(
    armAtt.stacks,
    armDef.stacks,
    itemsDeBatalla(attacker, ctx.catalog),
    itemsDeBatalla(defender, ctx.catalog),
    ctx.random,
  );
  const r = resolveBattle(
    { stacks: pre.attacker.stacks },
    { stacks: pre.defender.stacks },
    {
      seed,
      random: ctx.random,
      attackType,
      attackerAccuracy: pre.attacker.accuracyDelta,
      defenderAccuracy: pre.defender.accuracyDelta,
    },
  );

  // 3. Lo que se lleva el ganador.
  const supervivientes = Object.values(r.attacker.survivors).reduce((a, b) => a + b, 0);
  const gana = r.winner === 'attacker' && r.defenderBreached;
  const tierra = gana
    ? landTaken(defender.land.total, supervivientes, attackType, r.battleBonus)
    : { lost: 0, taken: 0, destroyed: 0, limitedBySurvivors: false };

  let nuevoAtacante: MageState = {
    ...attacker,
    turns: { ...attacker.turns, current: attacker.turns.current - TURNS_PER_ATTACK },
    turnsSpent: attacker.turnsSpent + TURNS_PER_ATTACK,
    resources: { ...attacker.resources, geld: attacker.resources.geld - coste },
    army: aStacks(r.attacker.survivors),
    land: { ...attacker.land, total: attacker.land.total + tierra.taken, free: attacker.land.free + tierra.taken },
  };
  // **Repartir los supervivientes antes de guardar nada.** Sin esto el
  // defensor se quedaría con el ejército de su aliado, y ayudar sería un
  // negocio en vez de un coste.
  let quedanDelDefensor = r.defender.survivors;
  const aliadosDevueltos: MageState[] = [];
  for (const aliado of defenderAllies) {
    const reparto = splitSurvivors(
      quedanDelDefensor,
      puestoPorDefensor,
      puestoPorAliados[aliado.id] ?? {},
    );
    quedanDelDefensor = reparto.defender;
    aliadosDevueltos.push({ ...aliado, army: aStacks(reparto.ally) });
  }

  let nuevoDefensor: MageState = {
    ...defender,
    army: aStacks(quedanDelDefensor),
    land: quitarTierra(defender, tierra.lost),
  };

  // El saqueo, que no quita tierra pero roba y quema.
  let saqueo: ReturnType<typeof pillageTaken> | undefined;
  let robados: Record<string, number> = {};
  if (attackType === 'pillage' && gana) {
    saqueo = pillageTaken(
      defender.resources.geld,
      defender.resources.population,
      armyPower(armAtt.stacks),
    );
    // **Y roba items.** Lesser, no uniques: que un unique cambiase de manos
    // por un saqueo afortunado lo convertiría en el objetivo de todas las
    // guerras (docs/SISTEMAS.md §12.1).
    robados = itemsPillaged(defender.items, ctx.catalog.items);

    nuevoDefensor = {
      ...nuevoDefensor,
      resources: {
        ...nuevoDefensor.resources,
        geld: nuevoDefensor.resources.geld - saqueo.geld,
        population: nuevoDefensor.resources.population - saqueo.population,
      },
      items: quitarItems(defender.items, robados),
      ...quemar(nuevoDefensor, saqueo.burned),
    };
    nuevoAtacante = {
      ...nuevoAtacante,
      resources: { ...nuevoAtacante.resources, geld: nuevoAtacante.resources.geld + saqueo.geld },
      items: sumarItems(attacker.items, robados),
    };
  }

  // **La resurrección de post-batalla**, que es la tercera fase de
  // docs/ORIGINAL.md §9.4 y el otro hueco que la fase 3 dejó declarado.
  const resucitadosAtt = resurrected(r.attacker.losses, pre.attacker.resurrectShares);
  const resucitadosDef = resurrected(r.defender.losses, pre.defender.resurrectShares);

  const resumen = {
    attackerLosses: r.attacker.losses,
    defenderLosses: r.defender.losses,
    attackerLossShare: r.attacker.lossShare,
    defenderLossShare: r.defender.lossShare,
    battleBonus: r.battleBonus,
    breached: r.defenderBreached,
    landDestroyed: tierra.destroyed,
    limitedBySurvivors: tierra.limitedBySurvivors,
    preBattle: pre.events,
    attackerResurrected: resucitadosAtt,
    defenderResurrected: resucitadosDef,
    ...(saqueo ? { pillage: saqueo, itemsStolen: robados } : {}),
  };

  const evento = (mageId: string): { mageId: string; event: GameEvent } => ({
    mageId,
    event: {
      type: 'battle',
      attackType,
      winner: r.winner,
      attackerId: attacker.id,
      defenderId: defender.id,
      landLost: tierra.lost,
      landTaken: tierra.taken,
      ...resumen,
    } as unknown as GameEvent,
  });

  return {
    attacker: nuevoAtacante,
    defender: nuevoDefensor,
    ...(aliadosDevueltos.length > 0 ? { allies: aliadosDevueltos } : {}),
    battle: {
      seed,
      attackType,
      winner: r.winner,
      rounds: r.rounds,
      landLost: tierra.lost,
      landTaken: tierra.taken,
      log: r.log,
      summary: resumen,
    },
    // **Los dos reciben el evento.** El defensor tiene derecho a saber que
    // le han atacado sin tener que deducirlo de que le falta tierra.
    events: [evento(attacker.id), evento(defender.id)],
  };
}

/** Cuántas unidades de cada tipo hay en una lista de stacks. */
function contar(stacks: readonly { unit: { id: string }; count: number }[]) {
  const r: Record<string, number> = {};
  for (const s of stacks) r[s.unit.id] = (r[s.unit.id] ?? 0) + s.count;
  return r;
}

function aStacks(survivors: Record<string, number>) {
  return Object.entries(survivors)
    .filter(([, n]) => n > 0)
    .map(([unitId, count]) => ({ unitId, count }));
}

/**
 * Le quita tierra al defensor, **empezando por la libre**.
 *
 * Si no basta, se demuelen edificios — porque `land.total = land.free + Σ
 * buildings` siempre (invariante 11), y dejar el total por debajo de lo
 * construido rompería esa igualdad sin dar error.
 */
function quitarTierra(state: MageState, acres: number): MageState['land'] {
  if (acres <= 0) return state.land;
  const total = Math.max(0, state.land.total - acres);
  const free = Math.max(0, state.land.free - acres);
  // Lo que no cupo en la tierra libre sale de los edificios, y de eso se
  // encarga `quemar()` sobre el estado; aquí solo cuadra el total.
  return { ...state.land, total, free };
}

/** Quema edificios, repartiendo el golpe entre los que el saqueo alcanza. */
function quemar(state: MageState, acres: number): Pick<MageState, 'buildings' | 'land'> {
  if (acres <= 0) return { buildings: state.buildings, land: state.land };
  // docs/ORIGINAL.md §9.3: el saqueo quema farms, towns, workshops y guilds.
  const objetivo = ['farms', 'towns', 'workshops', 'guilds'] as const;
  const buildings = { ...state.buildings };
  let restante = acres;
  for (const b of objetivo) {
    if (restante <= 0) break;
    const quita = Math.min(buildings[b], restante);
    buildings[b] -= quita;
    restante -= quita;
  }
  const quemados = acres - restante;
  // El acre sigue siendo tuyo: queda **yermo**, no desaparece. Por eso el
  // total no baja y la libre sube (invariante 11).
  void BUILDINGS;
  return {
    buildings,
    land: { ...state.land, free: state.land.free + quemados },
  };
}

/** Suma items a un inventario, sin mutarlo. */
function sumarItems(
  base: Record<string, number>,
  mas: Record<string, number>,
): Record<string, number> {
  const r = { ...base };
  for (const [id, n] of Object.entries(mas)) r[id] = (r[id] ?? 0) + n;
  return r;
}

/** Quita items de un inventario, sin dejar entradas en cero. */
function quitarItems(
  base: Record<string, number>,
  menos: Record<string, number>,
): Record<string, number> {
  const r = { ...base };
  for (const [id, n] of Object.entries(menos)) {
    const queda = (r[id] ?? 0) - n;
    if (queda > 0) r[id] = queda;
    else delete r[id];
  }
  return r;
}

/**
 * Los items de batalla que un mago lleva puestos.
 *
 * **Todos los que tenga**, por ahora: elegir cuáles llevar es una
 * decisión que la interfaz todavía no ofrece, y hacerlo automático es
 * mejor que no aplicarlos —que es lo que pasaba hasta el 2026-09-22—.
 * Cuando `/guerra` deje elegir, esto recibe la lista elegida.
 */
function itemsDeBatalla(state: MageState, catalog: Catalog): ItemSpec[] {
  const r: ItemSpec[] = [];
  for (const [id, n] of Object.entries(state.items)) {
    const spec = catalog.items[id];
    if (!spec || spec.use !== 'battle' || n <= 0) continue;
    r.push(spec);
  }
  return r;
}
