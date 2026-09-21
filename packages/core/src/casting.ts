/**
 * Investigar, lanzar, invocar y encantar.
 *
 * docs/SISTEMAS.md §7 y §7.1. Las reglas son del original; los números que
 * el original no publica están marcados y dicen con qué se validaron.
 *
 * Fuera de alcance, declarado:
 *  - **Los hechizos de combate y los ofensivos.** Están en el catálogo y
 *    `castSpell` los rechaza con `spell_not_castable`: su efecto necesita una
 *    batalla, y no hay batallas hasta la fase 3.
 *  - **Ancient**, que no se investiga sino que se compra (fase 4).
 *  - Las habilidades que modifican la magia (fase 4).
 */

import { canResearch, castCost, relationTo, spellLevelGain } from './magic.js';
import { isCastable, isEnchantment, summonCount } from './spells.js';
import type { SpellSpec } from './spells.js';
import type { MageState, RandomSource, Specialty, SpellId } from './types.js';

/**
 * Puntos de investigación por guild y turno **dedicado**.
 *
 * [nuestro], calibrado el 2026-09-21 contra el criterio 11 de §7.1: el
 * original documenta **1.500-3.000 turnos para investigarlo todo** (las seis
 * escuelas, docs/ORIGINAL.md §4.1). Nuestro catálogo es una escuela más
 * Plain —117.100 puntos en total—, o sea del orden de un quinto, así que la
 * banda equivalente son **300-600 turnos**.
 *
 * Con 2 por guild, un mago del turno 120 (unos 125 guilds al 10% de 1.250
 * acres) tarda **469 turnos**. Dentro de la banda.
 */
export const RESEARCH_PER_GUILD = 2;

/**
 * Un turno gastado en otra cosa también investiga, **a la mitad**.
 *
 * [orig] la regla: «la investigación avanza sola mientras haces otras cosas,
 * y se puede acelerar dedicándole turnos» (docs/SISTEMAS.md §7). La mitad es
 * [nuestro]: es lo que hace que dedicar turnos valga la pena sin que no
 * dedicarlos sea un castigo.
 */
export function researchPerTurn(guilds: number, dedicated: boolean): number {
  const full = guilds * RESEARCH_PER_GUILD;
  return dedicated ? full : Math.floor(full / 2);
}

export interface SpellCatalog {
  spells: Record<SpellId, SpellSpec>;
}

/** Qué hechizos puede este mago investigar ahora mismo, y a qué precio. */
export interface SpellbookEntry {
  spell: SpellSpec;
  known: boolean;
  researchable: boolean;
  /** Lo que le costaría lanzarlo **a él**, con el recargo aplicado. `null` si no puede. */
  castMana: number | null;
  castable: boolean;
  relation: ReturnType<typeof relationTo>;
}

/**
 * El libro de hechizos de un mago.
 *
 * Función de consulta pura: la pantalla no recalcula nada
 * (docs/INTERFAZ.md §3.1). **Enseña el precio que pagaría él**, no el base —
 * enseñar 30.000 cuando va a pagar 180.000 sería mentir.
 */
export function spellbookFor(
  specialty: Specialty,
  known: readonly SpellId[],
  catalog: SpellCatalog,
): SpellbookEntry[] {
  const sabidos = new Set(known);
  const out: SpellbookEntry[] = [];
  for (const spell of Object.values(catalog.spells)) {
    const relation = relationTo(specialty, spell.school);
    const researchable = canResearch(specialty, spell.school, spell.rank);
    // Lo que no puede aprender, no aparece: el libro enseña lo que le toca.
    if (!researchable && !sabidos.has(spell.id)) continue;
    out.push({
      spell,
      known: sabidos.has(spell.id),
      researchable: researchable && !sabidos.has(spell.id),
      castMana: castCost(spell.castMana, spell.rank, relation),
      castable: isCastable(spell),
      relation,
    });
  }
  return out;
}

/**
 * Probabilidad de fallar por concentración, en centésimas.
 *
 * **En tu color nunca falla**, que es lo que hace valiosa tu escuela
 * ([orig], docs/SISTEMAS.md §7). Fuera de color el original dice que puede
 * fallar y que **el nivel de hechizo mejora la probabilidad**, sin publicar
 * la fórmula: la de aquí es [nuestro].
 *
 * A nivel cero se paga la base entera; a nivel máximo, la mitad. Nunca baja
 * de ahí: lanzar fuera de color **siempre** es una apuesta.
 */
const FAILURE_BASE: Record<string, number> = {
  'adjacent:simple': 10,
  'adjacent:average': 15,
  'adjacent:complex': 25,
  'opposite:simple': 20,
  'opposite:average': 30,
  'opposite:complex': 50,
};

export function failureChance(
  spell: SpellSpec,
  specialty: Specialty,
  spellLevel: number,
  maxSpellLevel: number,
): number {
  const relation = relationTo(specialty, spell.school);
  if (relation === 'own') return 0;
  const base = FAILURE_BASE[`${relation}:${spell.rank}`] ?? 0;
  const ratio = maxSpellLevel > 0 ? Math.min(1, Math.max(0, spellLevel / maxSpellLevel)) : 0;
  // De la base entera a la mitad, según el nivel.
  return Math.floor((base * (100 - 50 * ratio)) / 100);
}

// --- Investigar -----------------------------------------------------------

export type MagicError =
  | 'spell_unknown'
  | 'spell_already_known'
  | 'spell_not_researchable'
  | 'spell_not_castable'
  | 'spell_not_learned'
  | 'not_enough_mana'
  | 'enchantment_already_active'
  | 'enchantment_not_active'
  | 'already_casting'
  | 'no_population_space';

export interface ResearchStep {
  /** Puntos aplicados. */
  progress: number;
  /** El hechizo terminado, si terminó. */
  learned: SpellSpec | null;
}

/**
 * Aplica un turno de investigación al hechizo en curso.
 *
 * Devuelve `null` si no hay nada investigándose. **No valida el acceso**: eso
 * se hizo al empezar la investigación.
 */
export function advanceResearch(
  state: MageState,
  catalog: SpellCatalog,
  dedicated: boolean,
): ResearchStep | null {
  const en = state.spellbook.researching;
  if (!en) return null;
  const spell = catalog.spells[en.spellId];
  if (!spell) return null;

  const progress = researchPerTurn(state.buildings.guilds, dedicated);
  const total = en.progress + progress;
  return { progress, learned: total >= spell.researchCost ? spell : null };
}

/** Comprueba si este mago puede empezar a investigar este hechizo. */
export function canStartResearch(
  state: MageState,
  spell: SpellSpec,
): MagicError | null {
  if (state.spellbook.known.includes(spell.id)) return 'spell_already_known';
  if (!canResearch(state.specialty, spell.school, spell.rank)) return 'spell_not_researchable';
  return null;
}

/** Lo que sube el nivel al aprender. Reexportado para que el sitio sea uno. */
export { spellLevelGain };

// --- Lanzar ---------------------------------------------------------------

export interface CastCheck {
  error: MagicError | null;
  /** Maná que se cobra **al iniciar**, con el recargo aplicado. */
  manaCost: number;
}

/**
 * Comprueba si se puede empezar a lanzar, y cuánto cuesta.
 *
 * **El maná se cobra al iniciar, no al terminar** (docs/SISTEMAS.md §7.1):
 * el original dice que cuesta aunque falles, y un hechizo de diez turnos que
 * cobrara al final sería gratis si lo abandonas a mitad.
 */
export function checkCast(
  state: MageState,
  spell: SpellSpec,
  catalog: SpellCatalog,
): CastCheck {
  const relation = relationTo(state.specialty, spell.school);
  const coste = castCost(spell.castMana, spell.rank, relation);

  if (!state.spellbook.known.includes(spell.id)) return { error: 'spell_not_learned', manaCost: 0 };
  if (!isCastable(spell)) return { error: 'spell_not_castable', manaCost: 0 };
  if (coste === null) return { error: 'spell_not_castable', manaCost: 0 };
  if (state.casting) return { error: 'already_casting', manaCost: coste };
  if (isEnchantment(spell) && state.enchantments.some((e) => e.spellId === spell.id)) {
    // [orig]: nunca el mismo encantamiento dos veces.
    return { error: 'enchantment_already_active', manaCost: coste };
  }
  if (state.resources.mana < coste) return { error: 'not_enough_mana', manaCost: coste };
  void catalog;
  return { error: null, manaCost: coste };
}

export interface CastOutcome {
  kind: 'summon' | 'enchantment' | 'resource';
  failed: boolean;
  /** Unidades invocadas, si invocó. */
  summoned?: { unitId: string; count: number };
  /** Recursos ganados, si dio recursos. */
  gained?: { geld: number; mana: number; population: number };
}

/**
 * Resuelve el efecto de un hechizo que acaba de terminar de lanzarse.
 *
 * Todo el azar sale del `RandomSource` (docs/SPECS.md §5, invariante 3): con
 * la misma semilla, el mismo resultado — el fallo y la cantidad invocada
 * incluidos.
 */
export function resolveCast(
  state: MageState,
  spell: SpellSpec,
  maxSpellLevel: number,
  random: RandomSource,
): CastOutcome {
  const fallo = failureChance(spell, state.specialty, state.spellbook.level, maxSpellLevel);
  if (fallo > 0 && random.nextInt(100) < fallo) {
    return { kind: spell.effect.kind === 'summon' ? 'summon' : 'resource', failed: true };
  }

  switch (spell.effect.kind) {
    case 'summon': {
      const count = summonCount(spell.effect, state.spellbook.level, maxSpellLevel, random.next());
      return { kind: 'summon', failed: false, summoned: { unitId: spell.effect.unitId, count } };
    }
    case 'enchantment':
      return { kind: 'enchantment', failed: false };
    case 'resource':
      return {
        kind: 'resource',
        failed: false,
        gained: {
          geld: spell.effect.geld ?? 0,
          mana: spell.effect.mana ?? 0,
          population: spell.effect.population ?? 0,
        },
      };
    case 'combat':
      // `checkCast` ya lo impide; aquí sería un fallo de programación.
      return { kind: 'resource', failed: true };
  }
}
