/**
 * Net Power: la medida oficial del tamaño de un mago.
 *
 * Los coeficientes son del original y están **publicados**
 * (docs/ORIGINAL.md §3.2, confianza alta). Se adoptan tal cual: además de ser
 * el ranking de la fase 4, son **la tabla de equivalencias entre recursos
 * según los propios diseñadores**, y con ella cualquier número que inventemos
 * nosotros deja de ser invención y pasa a ser deducción
 * (docs/SISTEMAS.md §5.7).
 *
 * Fuera de alcance: el **ejército**. Su aportación es
 * `número × rango de poder`, y el rango de poder de cada unidad sigue
 * `[abierto]` hasta la fase 3 (docs/SISTEMAS.md §8). `netPower()` lo deja
 * fuera y lo dice, en vez de inventarse un cero silencioso.
 */

import type { MageState } from './types.js';

/** docs/ORIGINAL.md §3.2, confianza alta. */
export const NET_POWER = {
  perAcre: 1_000,
  perFort: 19_360,
  perBarrier: 6_500,
  perMana: 0.05,
  perPopulation: 0.02,
  perGeld: 0.0005,
  perSpellLevel: 1_000,
  perLesserItem: 1_000,
  perHeroLevel: 10_000,
  perAlly: 10_000,
} as const;

/**
 * Net power **sin el ejército**. Devuelve un entero: se trunca una sola vez,
 * al final (docs/SPECS.md §5, invariante 7).
 */
export function netPower(state: MageState): number {
  let total = 0;
  total += state.land.total * NET_POWER.perAcre;
  // Los forts y las barriers suman ADEMÁS de su acre.
  total += state.buildings.forts * NET_POWER.perFort;
  total += state.buildings.barriers * NET_POWER.perBarrier;
  total += state.resources.mana * NET_POWER.perMana;
  total += state.resources.population * NET_POWER.perPopulation;
  total += state.resources.geld * NET_POWER.perGeld;
  total += state.spellbook.level * NET_POWER.perSpellLevel;
  for (const n of Object.values(state.items)) total += n * NET_POWER.perLesserItem;
  for (const h of state.heroes) total += h.level * NET_POWER.perHeroLevel;
  return Math.floor(total);
}

/**
 * Las tasas de cambio que se deducen de la tabla, útiles para calibrar:
 * 1 maná = 100 geld, 1 habitante = 40 geld, 1 acre = 20.000 maná.
 */
export const EXCHANGE = {
  manaPerAcre: NET_POWER.perAcre / NET_POWER.perMana,
  populationPerAcre: NET_POWER.perAcre / NET_POWER.perPopulation,
  geldPerAcre: NET_POWER.perAcre / NET_POWER.perGeld,
  geldPerMana: NET_POWER.perMana / NET_POWER.perGeld,
  geldPerPopulation: NET_POWER.perPopulation / NET_POWER.perGeld,
} as const;
