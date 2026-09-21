/**
 * Los items: qué son y qué hacen.
 *
 * **Todo el catálogo está publicado** ([docs/ORIGINAL.md §7.2](../../../docs/ORIGINAL.md),
 * confianza alta), así que aquí no se inventa ningún número: se copian. Lo
 * que sí es nuestro es **la forma** con la que se describen, y está pensada
 * para que añadir un item sea añadir un dato y no un `if`
 * (docs/SPECS.md §4).
 *
 * **Por qué el efecto es una unión discriminada y no una función.** Un item
 * tiene que poder viajar por el API, guardarse en una fila y pintarse en una
 * pantalla; una función no hace nada de eso. Con datos, el cliente puede
 * decir «+20% de ataque» sin ejecutar nada, y el servidor puede resolverlo
 * sin mandar código.
 *
 * Fuera de alcance aquí, y **declarado porque es deuda**:
 *  - **Los 46 unique items.** La wiki publica sus nombres y no sus efectos.
 *  - **Tres que el propio original tiene deshabilitados**: *Bottle of
 *    Eversmoking*, *Cosmetics* y *Dozens of Silver-tipped Arrows*.
 *  - **Tres que piden mecánicas que este juego no tiene**: *Crystal Ball*
 *    (espiar necesita un sistema de información que no existe), *Minor
 *    Indulgence* (disipa hechizos de dioses, y los dioses están fuera de
 *    alcance, docs/SISTEMAS.md §16) y *Blood Stained Map* (los Griales no
 *    existen). Entran **como dato** para que el catálogo esté completo, y
 *    `applyItem()` los rechaza diciendo por qué.
 */

import type { UnitId } from './types.js';
import type { DamageType } from './units.js';

/** Un rango cerrado de enteros. El azar sale del `RandomSource`. */
export interface Range {
  min: number;
  max: number;
}

/** A quién le toca un efecto de batalla. Se llama `ItemSide` y no `Side`
 * porque `battle.ts` ya tiene un `Side` que es otra cosa: atacante y
 * defensor. Aquí es amigo y enemigo, que depende de quién use el item. */
export type ItemSide = 'friendly' | 'enemy';

/**
 * Lo que un item hace. Una entrada por **mecánica**, no por item: quince
 * items suben el ataque y todos usan `ap`.
 */
export type ItemEffect =
  // --- Batalla ---
  /** Multiplica el ataque —primario, extra y contraataque— de un bando. */
  | { kind: 'ap'; side: ItemSide; multiplier: number; race?: string; damageType?: DamageType }
  /** Multiplica los puntos de vida. */
  | { kind: 'hp'; side: ItemSide; multiplier: number }
  /** Suma o resta resistencia. `cap` la topa; sin `cap` puede bajar de 0. */
  | { kind: 'resistance'; side: ItemSide; damageType?: DamageType; delta: number; cap?: number }
  /** Reparte el `delta` **entre los stacks** del bando. Ver *Pixie Dust*. */
  | { kind: 'resistanceSpread'; side: ItemSide; delta: number }
  /** Fija la iniciativa. Con `randomStack`, a uno solo y al azar. */
  | { kind: 'initiativeSet'; side: ItemSide; value: number; randomStack?: boolean }
  | { kind: 'initiativeDelta'; side: ItemSide; delta: number }
  /** Da *Flying* a quien no lo tuviera. */
  | { kind: 'grantFlying'; side: ItemSide }
  /** Quita *Flying* a un stack al azar, y le resta iniciativa si volaba. */
  | { kind: 'ground'; side: ItemSide; initiativeDelta: number }
  /** Daño directo a cada stack: `base + azar(1..3) × unidades del stack`. */
  | { kind: 'directDamage'; damageType: DamageType; base: number; perUnit: Range }
  /**
   * Daño fijo a los stacks que tengan una raza concreta.
   *
   * El campo se llama `damage` y no `amount` **a propósito**: en los demás
   * efectos `amount` es un `Range`, y que un mismo nombre significara dos
   * formas distintas ya despistó a un test el primer día.
   */
  | { kind: 'damageToRace'; damageType: DamageType; race: string; damage: number }
  /** Destruye unidades sueltas de un stack al azar. */
  | { kind: 'destroyUnits'; side: ItemSide; amount: Range }
  /** Cura puntos de vida por unidad. */
  | { kind: 'heal'; side: ItemSide; perUnit: Range }
  /** Resucita una porción de las bajas al acabar. */
  | { kind: 'resurrect'; share: number }
  /** Suma o resta acierto. Con `bothSides`, a los dos bandos. */
  | { kind: 'accuracy'; side: ItemSide; delta: number; bothSides?: boolean }
  | { kind: 'efficiency'; side: ItemSide; delta: number }
  /** Añade un tipo de daño al primario de quien ya tenga otro. */
  | { kind: 'addDamageType'; side: ItemSide; add: DamageType; ifHas: DamageType }
  /** Invoca unidades que **desaparecen al acabar la batalla**. */
  | { kind: 'summonTemporary'; unitId: UnitId; count: number }
  // --- Fuera de batalla ---
  | { kind: 'grantGeld'; amount: Range }
  | { kind: 'grantMana'; amount: Range }
  | { kind: 'grantPopulation'; amount: Range }
  /** Sube la población un porcentaje, topado por el espacio que quede. */
  | { kind: 'grantPopulationShare'; share: number }
  /** Da yermo. **Rinde menos cuanto más tierra tienes.** */
  | { kind: 'grantLand'; amount: Range }
  | { kind: 'grantUnits'; unitId: UnitId; amount: Range }
  /** Una de varias opciones, todas con la misma probabilidad. */
  | { kind: 'oneOf'; options: ItemEffect[] }
  /** Varias opciones con peso; los pesos suman 1. */
  | { kind: 'weighted'; options: { weight: number; effect: ItemEffect | null }[] }
  | { kind: 'grantItems'; count: number }
  | { kind: 'grantUniqueItem' }
  // --- Contra otro mago, sin batalla ---
  | { kind: 'enemyTurns'; amount: Range }
  | { kind: 'enemyPopulation'; amount: Range }
  | { kind: 'enemyMana'; amount: Range }
  | { kind: 'enemyGeldAndPopulation'; geld: number; population: number }
  | { kind: 'stealFromEnemy' }
  // --- Declarados y no implementados ---
  | { kind: 'notImplemented'; why: string };

export type ItemUse = 'battle' | 'outOfBattle';

export interface ItemSpec {
  id: string;
  name: string;
  /** `lesser` se acumula; `unique` tiene tope de uno. */
  rarity: 'lesser' | 'unique';
  use: ItemUse;
  /** Si hace falta elegir a quién se lo tiras. */
  targeted?: boolean;
  effect: ItemEffect;
  /** De dónde sale cada número. */
  source: string;
}

/** Tope de ejemplares de un unique. docs/ORIGINAL.md §7. */
export const UNIQUE_LIMIT = 1;

/** Un item de batalla se resuelve en la pre-batalla; el resto, al usarlo. */
export function isBattleItem(item: ItemSpec): boolean {
  return item.use === 'battle';
}

/** Si el efecto está declarado pero sin implementar. */
export function isDeclaredOnly(item: ItemSpec): boolean {
  return item.effect.kind === 'notImplemented';
}

/**
 * Tira un rango con el azar del contexto.
 *
 * **Inclusivo en los dos extremos**: «2-8 turnos» del *Voodoo Doll* incluye
 * el 2 y el 8. Un rango que no llegase a su máximo haría que el item
 * publicado no fuera el publicado.
 */
export function rollRange(r: Range, random: { nextInt: (n: number) => number }): number {
  if (r.max <= r.min) return r.min;
  return r.min + random.nextInt(r.max - r.min + 1);
}

// --- De dónde salen los items. docs/SISTEMAS.md §12.1 -------------------

/**
 * Items por turno según el **porcentaje de guilds sobre la tierra**.
 *
 * **[nuestro]** El original dice que se generan «a un ritmo que depende del
 * % de guilds» y no publica el ritmo. Se ancla en **un item cada 40 turnos
 * con el 5% de la tierra en guilds**, que sale de dos sitios: la misma
 * escala que los puntos de habilidad —uno cada ~34 turnos con ese mismo 5%
 * (docs/ORIGINAL.md §8)— y de que **un item bueno cambia una batalla**. Si
 * salieran cada cinco turnos no la cambiaría ninguno.
 *
 * Es **lineal en el porcentaje**, no en el número: un mago con 5.000 acres y
 * un 5% de guilds saca lo mismo que uno con 500 acres y un 5%. Así el item
 * es una decisión de **reparto** y no un premio por ser grande — que ya lo
 * es todo lo demás.
 *
 * Devuelve **fracción**, que se acumula. Redondear cada turno la dejaría en
 * cero para siempre, igual que con los puntos de habilidad.
 */
export const ITEM_TURNS_AT_5_PERCENT = 40;

export function itemsPerTurn(guilds: number, land: number, rate = 1): number {
  if (guilds <= 0 || land <= 0) return 0;
  const share = guilds / land;
  // A 0,05 de share sale 1/40; el factor es 1/(40 × 0,05) = 0,5.
  return (share / 0.05 / ITEM_TURNS_AT_5_PERCENT) * rate;
}

/**
 * Qué se lleva un saqueo del inventario del defensor.
 *
 * **[orig]** El saqueo roba items (docs/ORIGINAL.md §7). **[nuestro]** Se
 * lleva **lesser y no uniques**: un unique es, por definición, uno en el
 * mundo, y que cambie de manos por un saqueo afortunado lo convertiría en
 * el objetivo de todas las guerras — que es otro juego.
 *
 * Roba **una porción**, no el inventario: el 25%, redondeando hacia abajo,
 * así que robar a quien tiene tres items se lleva cero y hay que atacar a
 * quien de verdad acumula.
 */
export const PILLAGE_ITEM_SHARE = 0.25;

export function itemsPillaged(
  inventory: Record<string, number>,
  catalog: Record<string, ItemSpec>,
): Record<string, number> {
  const robado: Record<string, number> = {};
  for (const [id, n] of Object.entries(inventory)) {
    const spec = catalog[id];
    if (!spec || spec.rarity === 'unique') continue;
    const cuantos = Math.floor(n * PILLAGE_ITEM_SHARE);
    if (cuantos > 0) robado[id] = cuantos;
  }
  return robado;
}
