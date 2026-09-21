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
