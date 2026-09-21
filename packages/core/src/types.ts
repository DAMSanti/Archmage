/**
 * Las formas del estado, las acciones y los eventos.
 *
 * Contrato permanente: docs/SPECS.md §1 y §2.
 *
 * Fuera de alcance en este módulo, a propósito:
 *  - Cuentas, sesiones y autenticación. La fase 1 trabaja con un mago fijo
 *    (docs/ARQUITECTURA.md §9.6).
 *  - Los campos de magia, combate, items, héroes y habilidades existen para
 *    que el estado no cambie de forma en la fase 2, pero **se quedan vacíos**
 *    en la fase 1 y nada los lee.
 */

export type MageId = string;
export type ServerId = string;
export type UnitId = string;
export type SpellId = string;
export type ItemId = string;
export type SkillId = string;
export type HeroId = string;

/** docs/SISTEMAS.md §6 [orig]. La lista es cerrada. */
export const SPECIALTIES = [
  'ascendant',
  'verdant',
  'eradication',
  'phantasm',
  'nether',
  'plain',
] as const;
export type Specialty = (typeof SPECIALTIES)[number];

/**
 * docs/SISTEMAS.md §4 [orig]: «Los ocho, y no hay más».
 * El orden importa: es el que usan las pantallas y los catálogos.
 */
export const BUILDINGS = [
  'farms',
  'towns',
  'nodes',
  'workshops',
  'barracks',
  'guilds',
  'forts',
  'barriers',
] as const;
export type Building = (typeof BUILDINGS)[number];

export type Buildings = Record<Building, number>;

/**
 * Fracciones de construcción pendientes, en **punto fijo**: diezmilésimas de
 * edificio (docs/SPECS.md §4). Nunca coma flotante — sumar 0,1 tres veces no
 * da 0,3 y el acarreo entre turnos se desviaría sin que nadie lo notara
 * (docs/ARQUITECTURA.md §9.4).
 */
export type Construction = Record<Building, number>;

/** Una unidad de `Construction` equivale a 1/10.000 de edificio. */
export const CONSTRUCTION_SCALE = 10_000;

export interface Turns {
  /** Turnos disponibles ahora mismo. */
  current: number;
  /** Instante (epoch ms) hasta el que ya se devengó. docs/SPECS.md §3. */
  lastAccrualAt: number;
}

export interface Land {
  total: number;
  free: number;
}

/**
 * docs/SPECS.md §4: enteros, siempre.
 *
 * **La comida no está aquí.** Es capacidad derivada de las farms, no un
 * recurso almacenado — decidido el 2026-09-21, y nos separa del original
 * (docs/ARQUITECTURA.md §9.1).
 */
export interface Resources {
  geld: number;
  mana: number;
  population: number;
}

export interface Stack {
  unitId: UnitId;
  count: number;
  heroId?: HeroId;
}

/**
 * Reclutamiento en curso. docs/SISTEMAS.md §8 [orig]: fijarlo no cuesta
 * turnos, pero la tropa **llega poco a poco**, y solo se recluta un tipo a la
 * vez.
 */
export interface Recruiting {
  unitId: UnitId;
  /** Unidades que quedan por llegar. */
  remaining: number;
  /** Cuántas llegan por turno gastado. */
  perTurn: number;
}

export interface Spellbook {
  known: SpellId[];
  /**
   * Investigación en curso, **con su progreso**.
   *
   * Antes era un `SpellId | null` y no decía cuánto faltaba. Cambiado el
   * 2026-09-21 al implementar la fase 2 (docs/SISTEMAS.md §7.1): no hizo
   * falta migración porque `spellbook` ya se guarda como `jsonb`.
   */
  researching: { spellId: SpellId; progress: number } | null;
  level: number;
}

/**
 * Lanzamiento en curso.
 *
 * Los hechizos con *Cast Turn* tardan varios turnos en completarse
 * ([orig], docs/SISTEMAS.md §7). El maná **ya se cobró al iniciar**, así que
 * abandonar a mitad no devuelve nada.
 */
export interface Casting {
  spellId: SpellId;
  turnsRemaining: number;
}

export interface Enchantment {
  spellId: SpellId;
  upkeepMana: number;
  /**
   * Los modificadores **congelados al lanzarlo**.
   *
   * [orig], docs/ORIGINAL.md §6.2: «un encantamiento ya lanzado no se
   * actualiza si tu nivel cambia después». Por eso se guardan aquí en vez de
   * recalcularse desde el catálogo.
   */
  modifiers: Record<string, number>;
}

export interface Hero {
  id: HeroId;
  level: number;
  experience: number;
}

export interface MageState {
  id: MageId;
  serverId: ServerId;
  name: string;
  /** No cambia durante la temporada. docs/SPECS.md §5, invariante 10. */
  specialty: Specialty;

  turns: Turns;
  /**
   * Turnos gastados desde que empezó el mago.
   *
   * Sustituye al `protectedUntil` que el contrato tenía antes: la protección
   * se mide en **turnos gastados, no en tiempo real** (docs/SISTEMAS.md §15).
   */
  turnsSpent: number;

  land: Land;
  buildings: Buildings;
  construction: Construction;
  resources: Resources;

  army: Stack[];
  recruiting: Recruiting | null;

  spellbook: Spellbook;
  /** Lanzamiento en curso, o `null`. Fase 2. */
  casting: Casting | null;
  enchantments: Enchantment[];

  // Fase 3 en adelante. Vacíos todavía.
  heroes: Hero[];
  items: Record<ItemId, number>;
  skills: Record<SkillId, number>;
}

/**
 * Configuración del servidor. docs/SISTEMAS.md §2 [nuestro]: la cadencia y el
 * tope son configuración, no constantes del código.
 */
export interface ServerConfig {
  id: ServerId;
  /** Minutos de reloj por turno. */
  turnMinutes: number;
  /** Tope de turnos acumulables. */
  turnCap: number;
  /** Turnos **gastados** durante los que el mago no puede atacar ni ser atacado. */
  protectionTurns: number;
}

/**
 * Azar. docs/SPECS.md §5, invariante 3: todo azar sale de aquí, y la semilla
 * se guarda con el resultado.
 */
export interface RandomSource {
  /** Flotante en [0, 1). */
  next(): number;
  /** Entero en [0, maxExclusive). */
  nextInt(maxExclusive: number): number;
}

/**
 * Lo que el núcleo necesita saber de un edificio. Los **datos** viven en
 * `@archmage/content`; aquí solo está la forma, para que el núcleo no dependa
 * de nada (docs/SPECS.md §5, invariante 1).
 */
export interface BuildingSpec {
  /** Coste en geld de construir uno. docs/SISTEMAS.md §4.2. */
  cost: number;
  /** Mantenimiento en geld por turno. */
  upkeepGeld: number;
  /** Mantenimiento en maná por turno. */
  upkeepMana: number;
}

export interface Catalog {
  buildings: Record<Building, BuildingSpec>;
  /**
   * La ficha **completa** de cada unidad. Hasta la fase 2 era solo la mitad
   * económica; la de combate está publicada y se adoptó en la fase 3
   * (docs/SISTEMAS.md §9.1). El tipo vive en `units.ts`.
   */
  units: Record<UnitId, import('./units.js').UnitSpec>;
  /** Fase 2. El tipo vive en `spells.ts` para no cruzar los módulos. */
  spells: Record<SpellId, import('./spells.js').SpellSpec>;
  /** Nivel de hechizo máximo de **este** catálogo. Escala las invocaciones. */
  maxSpellLevel: number;
  /** Fase 4. La ficha de cada item; el tipo vive en `items.ts`. */
  items: Record<ItemId, import('./items.js').ItemSpec>;
  /** Fase 4. Las diez habilidades; el tipo vive en `skills.ts`. */
  skills: readonly import('./skills.js').SkillSpec[];
}

/** docs/SPECS.md §2: el tiempo y el azar **entran**, nunca se cogen. */
export interface Ctx {
  /** Epoch ms. */
  now: number;
  random: RandomSource;
  server: ServerConfig;
  catalog: Catalog;
}

// --- Acciones -------------------------------------------------------------

/**
 * docs/SPECS.md §2. Las seis de la fase 1.
 *
 * `build`, `explore`, `chargeMana` y `chargeGeld` se expresan **en turnos**:
 * el turno es la moneda (docs/SISTEMAS.md §2), así que la acción dice cuántos
 * gastas y el resultado sale de las reglas.
 */
export type Action =
  | { type: 'build'; building: Building; turns: number }
  | { type: 'demolish'; building: Building; turns: number }
  | { type: 'explore'; turns: number }
  | { type: 'chargeMana'; turns: number }
  | { type: 'chargeGeld'; turns: number }
  | { type: 'setRecruit'; unitId: UnitId; count: number }
  // Fase 2.
  | { type: 'research'; spellId: SpellId; turns: number }
  | { type: 'cast'; spellId: SpellId; turns: number }
  | { type: 'dispel'; spellId: SpellId };

// --- Eventos --------------------------------------------------------------

/**
 * Todo cambio de estado produce eventos, y se guardan en la misma transacción
 * que el estado (docs/SPECS.md §5, invariante 4). La crónica sale de aquí, no
 * de mirar el estado.
 */
export type GameEvent =
  | { type: 'turns.accrued'; gained: number; wastedAtCap: number }
  | { type: 'turns.spent'; amount: number; on: Action['type'] }
  | { type: 'resources.produced'; geld: number; mana: number; population: number }
  | { type: 'mana.overflowed'; lost: number }
  | { type: 'upkeep.paid'; geld: number; mana: number }
  | { type: 'building.queued'; building: Building; amount: number }
  | { type: 'building.completed'; building: Building; amount: number }
  | { type: 'building.demolished'; building: Building; amount: number }
  | { type: 'land.explored'; acres: number }
  | { type: 'land.exhausted' }
  | { type: 'recruit.set'; unitId: UnitId; total: number }
  | { type: 'recruit.arrived'; unitId: UnitId; count: number }
  | { type: 'collapse.geld'; fortsLost: number; buildingsLost: number; unitsDeserted: number }
  | { type: 'collapse.mana'; stacksDisbanded: number; enchantmentsLost: number }
  | { type: 'collapse.population'; stacksDisbanded: number }
  | { type: 'protection.ended' }
  // Fase 2.
  | { type: 'research.started'; spellId: SpellId }
  | { type: 'research.advanced'; spellId: SpellId; progress: number; total: number; needed: number }
  | { type: 'research.completed'; spellId: SpellId; levelGained: number }
  | { type: 'cast.started'; spellId: SpellId; manaCost: number; turns: number }
  | { type: 'cast.failed'; spellId: SpellId }
  | { type: 'spell.summoned'; spellId: SpellId; unitId: UnitId; count: number }
  | { type: 'spell.enchanted'; spellId: SpellId; upkeepMana: number }
  | { type: 'spell.resources'; spellId: SpellId; geld: number; mana: number; population: number }
  | { type: 'enchantment.dispelled'; spellId: SpellId };

// --- Resultado y errores --------------------------------------------------

export type DomainErrorCode =
  | 'not_enough_turns'
  | 'not_enough_geld'
  | 'not_enough_land'
  | 'not_enough_buildings'
  | 'exploration_exhausted'
  | 'no_population_space'
  | 'unknown_unit'
  | 'unknown_action'
  | 'invalid_amount'
  // Fase 2.
  | 'spell_unknown'
  | 'spell_already_known'
  | 'spell_not_researchable'
  | 'spell_not_castable'
  | 'spell_not_learned'
  | 'not_enough_mana'
  | 'enchantment_already_active'
  | 'enchantment_not_active'
  | 'already_casting';

/** docs/SPECS.md §5, invariante 9: esto es un 422, no un 500. */
export interface DomainError {
  code: DomainErrorCode;
  message: string;
}

export type Result =
  | { ok: true; state: MageState; events: GameEvent[] }
  | { ok: false; error: DomainError };
