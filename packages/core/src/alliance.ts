/**
 * Alianzas y refuerzos automáticos.
 *
 * **[orig]** Se tienen **1 o 2 aliados** según el servidor. Mandan
 * refuerzos **automáticamente** cuando te atacan —**salvo sus dos stacks más
 * potentes**— y sus hechizos ignoran la barrier
 * ([docs/ORIGINAL.md §10](../../../docs/ORIGINAL.md), confianza alta). Un
 * compañero de gremio que **no** sea aliado no manda nada.
 *
 * **La decisión de diseño que hay detrás, y conviene verla:** los refuerzos
 * entran en la **pre-batalla**, así que **ayudar cuesta** — el aliado pierde
 * unidades de verdad en una batalla que no eligió. Y como **sus dos mejores
 * stacks se quedan en casa**, una alianza **no convierte a dos magos en
 * uno**: el que ayuda sigue pudiendo defenderse.
 *
 * Fuera de alcance aquí:
 *  - **Los hechizos de aliado que ignoran la barrier.** No hay hechizos de
 *    batalla todavía (docs/SISTEMAS.md §9.1), así que no hay barrier que
 *    ignorar. Declarado, no olvidado.
 *  - **Que el aliado actúe *durante* la batalla.** Aporta tropa antes y ya.
 *    Si un día hiciera falta más, es otra spec.
 */

import type { BattleStack } from './combat.js';

/** Stacks del aliado que **se quedan en casa**: los dos más potentes. */
export const ALLY_HOME_STACKS = 2;

/** Horas que tarda en romperse una alianza. docs/SISTEMAS.md §14.1. */
export const BREAK_DELAY_HOURS = 24;

export interface Alliance {
  id: string;
  serverId: string;
  a: string;
  b: string;
  /** Cuándo se pidió romperla, o `null`. */
  breakRequestedAt: number | null;
}

export type AllianceError =
  | { code: 'demasiados_aliados'; message: string }
  | { code: 'ya_sois_aliados'; message: string }
  | { code: 'contigo_no'; message: string };

/**
 * Cuántos aliados permite un servidor.
 *
 * **[nuestro]** El original dice «1 o 2 según el servidor» y no dice cuál
 * es cuál. Se pone **2 en el normal y 1 en el rápido**: en un servidor que
 * va al doble de ritmo, dos aliados mandando refuerzos harían que defender
 * fuera casi gratis, y el rápido tiene que ser el más áspero.
 */
export function maxAllies(serverId: string): number {
  return serverId === 'veloz' ? 1 : 2;
}

export function canAlly(
  mageId: string,
  otherId: string,
  misAliados: number,
  susAliados: number,
  yaAliados: boolean,
  serverId: string,
): { ok: true } | { error: AllianceError } {
  if (mageId === otherId) {
    return { error: { code: 'contigo_no', message: 'No puedes aliarte contigo mismo.' } };
  }
  if (yaAliados) {
    return { error: { code: 'ya_sois_aliados', message: 'Ya sois aliados.' } };
  }
  const tope = maxAllies(serverId);
  // **Se mira a los dos.** Si solo se mirara a quien propone, el que acepta
  // podría acabar con tres aliados aceptando tres propuestas.
  if (misAliados >= tope || susAliados >= tope) {
    return {
      error: {
        code: 'demasiados_aliados',
        message: `En este servidor no se pueden tener más de ${tope} aliados.`,
      },
    };
  }
  return { ok: true };
}

/**
 * Si una alianza sigue en pie **ahora**.
 *
 * **Romper tarda 24 horas, y durante ese plazo los refuerzos siguen
 * yendo.** Sin el plazo, aliarse sería gratis: te ayudo mientras me
 * conviene y me borro justo antes de que me toque ayudar. Con él, la
 * alianza es un compromiso y no una etiqueta.
 *
 * El reloj entra por parámetro (docs/SPECS.md §5, invariante 2).
 */
export function isActive(alliance: Alliance, now: number): boolean {
  if (alliance.breakRequestedAt === null) return true;
  return now < alliance.breakRequestedAt + BREAK_DELAY_HOURS * 60 * 60 * 1000;
}

/** Cuándo se romperá del todo, o `null` si nadie la ha pedido romper. */
export function breaksAt(alliance: Alliance): number | null {
  if (alliance.breakRequestedAt === null) return null;
  return alliance.breakRequestedAt + BREAK_DELAY_HOURS * 60 * 60 * 1000;
}

/**
 * Los stacks que un aliado manda de refuerzo.
 *
 * **Todos menos los dos más potentes**, medidos por `número × rango de
 * poder` — la misma medida que ordena los stacks en batalla y que decide
 * el bonus (§9.1). Que se queden los dos mejores es lo que impide que una
 * alianza convierta a dos magos en uno.
 *
 * Devuelve **copias**: el ejército del aliado no se toca aquí, y lo que
 * vuelve de la batalla lo devuelve quien la resolvió.
 */
export function reinforcements(allyArmy: readonly BattleStack[]): BattleStack[] {
  const conPoder = allyArmy
    .filter((s) => s.count > 0)
    .map((s) => ({ s, poder: s.count * s.unit.powerRank }));
  // Orden descendente y estable: a igual poder manda el id, para que el
  // resultado sea reproducible (invariante 3).
  conPoder.sort((x, y) => y.poder - x.poder || x.s.unit.id.localeCompare(y.s.unit.id));
  return conPoder.slice(ALLY_HOME_STACKS).map(({ s }) => ({ unit: s.unit, count: s.count }));
}

/**
 * Reparte los supervivientes entre el defensor y su aliado.
 *
 * **Sin esto, el defensor se queda con el ejército de su aliado** al acabar
 * la batalla, y ayudar pasaría a ser un negocio en vez de un coste. Es el
 * bug fácil de escribir y difícil de ver de toda la fase.
 *
 * El reparto es **proporcional a lo que cada uno puso**: si el defensor
 * puso 100 de un tipo y el aliado 400, y sobreviven 250, le tocan 50 y 200.
 * Con un solo `floor`, y **el resto se lo queda el defensor**, que es quien
 * eligió la batalla.
 */
export function splitSurvivors(
  survivors: Record<string, number>,
  defenderContributed: Record<string, number>,
  allyContributed: Record<string, number>,
): { defender: Record<string, number>; ally: Record<string, number> } {
  const defensor: Record<string, number> = {};
  const aliado: Record<string, number> = {};

  for (const [unitId, vivos] of Object.entries(survivors)) {
    const puestoDef = defenderContributed[unitId] ?? 0;
    const puestoAli = allyContributed[unitId] ?? 0;
    const total = puestoDef + puestoAli;
    if (total <= 0 || vivos <= 0) continue;

    const paraAliado = Math.floor((vivos * puestoAli) / total);
    const paraDefensor = vivos - paraAliado;
    if (paraDefensor > 0) defensor[unitId] = paraDefensor;
    if (paraAliado > 0) aliado[unitId] = paraAliado;
  }
  return { defender: defensor, ally: aliado };
}
