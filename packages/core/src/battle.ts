/**
 * La batalla: las rondas, el log y quién gana.
 *
 * Reglas de [docs/ORIGINAL.md §9.1-9.4](../../../docs/ORIGINAL.md), nuestras
 * decisiones en docs/SISTEMAS.md §9.1. Los términos sueltos de la fórmula
 * viven en `combat.ts`; aquí se combinan.
 *
 * **Todo sale de la semilla, y la semilla se guarda con el resultado**
 * (docs/SPECS.md §5, invariante 3). Es lo que permite enseñarle al jugador
 * la repetición ronda a ronda sabiendo que cuadra con lo que pasó: dos
 * ejecuciones con la misma semilla dan el mismo log, golpe a golpe.
 *
 * Fuera de alcance aquí, y declarado:
 *  - **Los hechizos e items de pre-batalla** y la resurrección de
 *    post-batalla: tareas 15 y 16. `resolveBattle()` ya tiene los huecos
 *    donde entran, y los deja explícitos en el resultado.
 *  - **La tierra que cambia de manos**: `land.ts`, tarea 14. Aquí se decide
 *    quién gana y con qué margen, no qué se lleva.
 *  - **Guardar la batalla**: es del servidor (tarea 18).
 */

import {
  type AttackKind,
  type BattleStack,
  accuracyFor,
  casualties,
  chooseTarget,
  defensiveMultiplier,
  efficiencyAfter,
  resistanceAgainst,
  sortStacks,
} from './combat.js';
import type { RandomSource } from './types.js';
import type { Attack, DamageType, UnitSpec } from './units.js';

/** Quién es quién. El atacante es el que eligió atacar. */
export type Side = 'attacker' | 'defender';

/** Los tres ataques del original. docs/SISTEMAS.md §9.1. */
export type AttackType = 'regular' | 'siege' | 'pillage';

/** Un golpe, tal y como se le enseña al jugador. */
export interface BattleBlow {
  round: number;
  side: Side;
  /** Índice del stack que pega, dentro de su bando ya ordenado. */
  attackerStack: number;
  attackerUnit: string;
  defenderUnit: string;
  kind: AttackKind;
  /** Los términos que se aplicaron, para que la repetición sea auditable. */
  accuracy: number;
  randomFactor: number;
  efficiency: number;
  resistance: number;
  defensiveMultiplier: number;
  /** Bajas que causó, ya recortadas a los que quedaban. */
  casualties: number;
}

export interface BattleSideResult {
  /** Cómo empezó, por unidad. */
  initial: Record<string, number>;
  /** Cómo acabó. */
  survivors: Record<string, number>;
  losses: number;
  initialCount: number;
  /** Porcentaje de bajas, sin redondear: es lo que decide quién gana. */
  lossShare: number;
}

export interface BattleResult {
  seed: number;
  attackType: AttackType;
  rounds: number;
  log: readonly BattleBlow[];
  attacker: BattleSideResult;
  defender: BattleSideResult;
  /** Quién perdió **menos** porcentaje de ejército. */
  winner: Side;
  /**
   * El bonus de batalla del atacante, en tanto por uno. 0 si no llega al
   * doble del defensor. docs/ORIGINAL.md §9.3.
   */
  battleBonus: number;
  /** Si el defensor pasó del 10% de bajas, que es lo que le hace perder tierra. */
  defenderBreached: boolean;
}

/** Cuántas rondas se pelean como mucho. docs/SISTEMAS.md §9.1 [nuestro]. */
export const MAX_ROUNDS = 10;

/**
 * Bajas que el defensor tiene que pasar para perder tierra: **10%**.
 * docs/ORIGINAL.md §9.3.
 */
export const BREACH_THRESHOLD = 0.1;

/** Un ejército: sus stacks, con la ficha de cada unidad. */
export interface Army {
  stacks: readonly BattleStack[];
}

/** El azar de un golpe: 0,25-0,75, y **fijo en 0,5** para Magic y Psychic. */
export function randomFactorFor(types: readonly DamageType[], random: RandomSource): number {
  // docs/ORIGINAL.md §9.1. Que estos dos no tiren dado es lo que hace la
  // magia predecible: pega menos en el mejor caso y más en el peor.
  if (types.includes('magic') || types.includes('psychic')) return 0.5;
  return 0.25 + random.next() * 0.5;
}

interface Combatiente {
  unit: UnitSpec;
  count: number;
  /** Golpes que ya ha dado y le han fatigado. */
  fatigued: number;
}

function aCombatientes(army: Army): Combatiente[] {
  return sortStacks(army.stacks).map((s) => ({ unit: s.unit, count: s.count, fatigued: 0 }));
}

function vivos(cs: readonly Combatiente[]): BattleStack[] {
  return cs.filter((c) => c.count > 0).map((c) => ({ unit: c.unit, count: c.count }));
}

/** Nadie de este bando puede ya hacer daño: todos a eficiencia 0. */
function agotados(cs: readonly Combatiente[]): boolean {
  return cs.every((c) => c.count <= 0 || efficiencyAfter(c.unit, c.fatigued) <= 0);
}

function total(cs: readonly Combatiente[]): number {
  return cs.reduce((a, c) => a + c.count, 0);
}

function porUnidad(cs: readonly Combatiente[]): Record<string, number> {
  const r: Record<string, number> = {};
  for (const c of cs) r[c.unit.id] = (r[c.unit.id] ?? 0) + c.count;
  return r;
}

/** El poder de un ejército, que es lo que compara el bonus de batalla. */
export function armyPower(stacks: readonly BattleStack[]): number {
  return stacks.reduce((a, s) => a + s.count * s.unit.powerRank, 0);
}

/**
 * El bonus de batalla del atacante. docs/ORIGINAL.md §9.3.
 *
 * Si un ejército pasa del **200%** del otro, gana **1% por cada 2%** que
 * pase del doble. Un ejército que duplica y además se pasa un 100% del doble
 * —o sea, cuadruplica— se lleva un **50%**.
 */
export function battleBonus(attackerPower: number, defenderPower: number): number {
  if (defenderPower <= 0) return attackerPower > 0 ? 0.5 : 0;
  const ratio = attackerPower / defenderPower;
  if (ratio <= 2) return 0;
  const exceso = (ratio - 2) / 2; // en tanto por uno sobre el doble
  return Math.min(0.5, exceso / 2);
}

/**
 * Resuelve una batalla entera y devuelve el log golpe a golpe.
 *
 * El orden lo fija la **iniciativa**, y dentro de la misma iniciativa el
 * orden de stacks (voladores delante). Con iniciativa 0 no se ataca.
 *
 * Cada golpe apunta **todos los términos que se le aplicaron**, no solo el
 * resultado: es lo que hace la repetición auditable en vez de una animación
 * bonita (docs/INTERFAZ.md).
 */
export function resolveBattle(
  attacker: Army,
  defender: Army,
  options: { seed: number; random: RandomSource; attackType: AttackType },
): BattleResult {
  const { seed, random, attackType } = options;
  const siege = attackType === 'siege';

  const att = aCombatientes(attacker);
  const def = aCombatientes(defender);
  const attInicial = porUnidad(att);
  const defInicial = porUnidad(def);
  const attTotal = total(att);
  const defTotal = total(def);

  const log: BattleBlow[] = [];
  let round = 0;

  for (; round < MAX_ROUNDS; round++) {
    if (total(att) <= 0 || total(def) <= 0) break;
    // **Una batalla termina cuando los dos ejércitos están agotados**, no al
    // llegar al tope de rondas. Con 15 de fatiga por golpe, al séptimo todo
    // el mundo está a eficiencia 0: seguir tres rondas más solo producía
    // líneas de «0 bajas» en la repetición. Se vio mirando la captura, no
    // en un test — ningún número estaba mal, solo sobraba.
    if (agotados(att) && agotados(def)) break;

    // Todos los golpes de la ronda, ordenados por iniciativa descendente.
    // Los ataques extra van con **su propia** iniciativa, que puede ser
    // distinta de la del primario (el Fénix: 5 contra 3).
    const golpes: {
      side: Side;
      idx: number;
      c: Combatiente;
      attack: Attack;
      kind: AttackKind;
    }[] = [];
    const meter = (side: Side, cs: Combatiente[]) => {
      cs.forEach((c, idx) => {
        if (c.count <= 0) return;
        if (c.unit.attack.initiative > 0) {
          golpes.push({ side, idx, c, attack: c.unit.attack, kind: 'primary' });
        }
        if (c.unit.extraAttack && c.unit.extraAttack.initiative > 0) {
          golpes.push({ side, idx, c, attack: c.unit.extraAttack, kind: 'extra' });
        }
      });
    };
    meter('attacker', att);
    meter('defender', def);
    // Estable: `sort` de V8 lo es, así que a igual iniciativa manda el orden
    // de stacks, que ya viene de `sortStacks()`. Determinista sin sortear.
    golpes.sort((a, b) => b.attack.initiative - a.attack.initiative);

    for (const g of golpes) {
      if (g.c.count <= 0) continue;
      const enemigos = g.side === 'attacker' ? def : att;
      const blow = pegar(g.side, g.idx, g.c, g.attack, g.kind, enemigos, {
        round,
        // **La penalización de asedio es solo del que asedia.** El defensor
        // defiende con base 30 venga el ataque que venga: la fuente dice
        // «base 30 en defensa y ataque regular, 20 en asedio», y el asedio
        // es algo que se *hace*, no algo que se sufre. Se vio al leer el log
        // de la pasada de navegador, donde los dos bandos pegaban con 20.
        siege: siege && g.side === 'attacker',
        random,
      });
      if (blow) log.push(blow);
    }
  }

  const attLosses = attTotal - total(att);
  const defLosses = defTotal - total(def);
  const attShare = attTotal > 0 ? attLosses / attTotal : 0;
  const defShare = defTotal > 0 ? defLosses / defTotal : 0;
  /** Un defensor sin una sola unidad. No hay batalla: hay ocupación. */
  const sinDefensa = defTotal === 0 && attTotal > 0;

  return {
    seed,
    attackType,
    rounds: round,
    log,
    attacker: {
      initial: attInicial,
      survivors: porUnidad(att),
      losses: attLosses,
      initialCount: attTotal,
      lossShare: attShare,
    },
    defender: {
      initial: defInicial,
      survivors: porUnidad(def),
      losses: defLosses,
      initialCount: defTotal,
      lossShare: defShare,
    },
    // **Gana quien pierde menos porcentaje.** El empate lo gana el defensor:
    // atacar y no sacar ventaja es no haber conseguido nada.
    //
    // **Salvo que el defensor no tenga ejército**, y esto se encontró en la
    // pasada de navegador: con los dos porcentajes a cero el empate daba la
    // victoria al defensor, así que **quedarse sin tropas protegía la
    // tierra**. Es lo contrario de lo que tiene que pasar — sería un
    // exploit, y además el más fácil de descubrir.
    winner: sinDefensa ? 'attacker' : attShare < defShare ? 'attacker' : 'defender',
    battleBonus: battleBonus(armyPower(attacker.stacks), armyPower(defender.stacks)),
    defenderBreached: sinDefensa || defShare > BREACH_THRESHOLD,
  };
}

/** Un golpe: elige objetivo, calcula bajas, las aplica y fatiga al que pega. */
function pegar(
  side: Side,
  idx: number,
  c: Combatiente,
  attack: Attack,
  kind: AttackKind,
  enemigos: Combatiente[],
  ctx: { round: number; siege: boolean; random: RandomSource },
): BattleBlow | undefined {
  const objetivo = chooseTarget(c.unit, vivos(enemigos), c.count);
  if (!objetivo) return undefined; // sin objetivo: melee puro contra voladores

  const victima = enemigos.find((e) => e.unit.id === objetivo.unit.id && e.count > 0);
  if (!victima) return undefined;

  const accuracy = accuracyFor(0, ctx.siege);
  const randomFactor = randomFactorFor(attack.types, ctx.random);
  const efficiency = efficiencyAfter(c.unit, c.fatigued);
  const resistance = resistanceAgainst(victima.unit, attack.types);
  const defensive = defensiveMultiplier(victima.unit, {
    types: attack.types,
    primary: kind === 'primary',
  });

  const brutas = casualties({
    attackers: c.count,
    attackPower: attack.power,
    accuracy,
    randomFactor,
    efficiency,
    resistance,
    defensiveMultiplier: defensive,
    defenderHitPoints: victima.unit.hitPoints,
  });
  // **El recorte va aquí y no en `casualties()`**: es la ronda quien sabe
  // cuántos quedan vivos.
  const bajas = Math.min(brutas, victima.count);
  victima.count -= bajas;

  // Los ataques extra no fatigan (docs/ORIGINAL.md §9.1).
  if (kind !== 'extra') c.fatigued += 1;

  return {
    round: ctx.round,
    side,
    attackerStack: idx,
    attackerUnit: c.unit.id,
    defenderUnit: victima.unit.id,
    kind,
    accuracy,
    randomFactor,
    efficiency,
    resistance,
    defensiveMultiplier: defensive,
    casualties: bajas,
  };
}
