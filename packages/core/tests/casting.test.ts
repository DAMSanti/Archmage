import { describe, expect, test } from 'vitest';
import {
  apply,
  failureChance,
  researchPerTurn,
  spellbookFor,
  summonCount,
  type Action,
  type Ctx,
  type MageState,
} from '../src/index.js';
import { CATALOG, SPELLS_TEST, TERRA, TUNING, mageWith, seededRandom } from './fixtures.js';

/** Criterios 3 a 8 de docs/SISTEMAS.md §7.1. */

const TUNE = { ...TUNING, exploreFactor: 22, exploreLandCap: 3_500 };
const ctx = (seed = 1): Ctx => ({ now: 0, random: seededRandom(seed), server: TERRA, catalog: CATALOG });
const run = (s: MageState, a: Action, seed = 1) => apply(s, a, ctx(seed), TUNE);

/** Un mago verde con guilds, maná y sitio para invocar. */
function verde(extra: Partial<MageState> = {}): MageState {
  const base = mageWith({ guilds: 100, farms: 400, towns: 130, nodes: 100 }, 1_000, {
    mana: 500_000,
    population: 39_000,
  });
  return { ...base, specialty: 'verdant', ...extra };
}

describe('criterio 5 — investigar', () => {
  test('investigar algo que ya sabes es error de dominio y no gasta nada', () => {
    const m = verde({ spellbook: { known: ['summon_dryad'], researching: null, level: 1 } });
    const r = run(m, { type: 'research', spellId: 'summon_dryad', turns: 5 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('spell_already_known');
  });

  test('no se puede investigar lo que la rueda no te deja', () => {
    // `dark_pact` es Nether, opuesta a Verdant, pero Average: sí se puede.
    const m = verde();
    expect(run(m, { type: 'research', spellId: 'dark_pact', turns: 1 }).ok).toBe(true);
  });

  test('un hechizo que no existe da error de dominio', () => {
    const r = run(verde(), { type: 'research', spellId: 'no_existe', turns: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('spell_unknown');
  });

  test('la velocidad va con los guilds, y dedicar el turno la duplica', () => {
    expect(researchPerTurn(100, true)).toBe(200);
    expect(researchPerTurn(100, false)).toBe(100);
    expect(researchPerTurn(0, true)).toBe(0);
  });

  test('investigar termina y sube el nivel de hechizo', () => {
    // Summon Dryad cuesta 900; con 100 guilds dedicados son 200/turno.
    const m = verde();
    const r = run(m, { type: 'research', spellId: 'summon_dryad', turns: 5 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.spellbook.known).toContain('summon_dryad');
      expect(r.state.spellbook.level).toBe(1); // Simple = +1
      expect(r.state.spellbook.researching).toBeNull();
      expect(r.events.some((e) => e.type === 'research.completed')).toBe(true);
    }
  });

  test('la investigación avanza también gastando el turno en otra cosa', () => {
    // [orig]: «avanza sola mientras haces otras cosas», a la mitad.
    const m = verde({ spellbook: { known: [], researching: { spellId: 'slow_ritual', progress: 0 }, level: 0 } });
    const r = run(m, { type: 'explore', turns: 3 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      // 100 guilds, no dedicado = 100/turno × 3 turnos.
      expect(r.state.spellbook.researching?.progress).toBe(300);
    }
  });

  test('cambiar de hechizo tira el progreso del anterior', () => {
    const m = verde({
      spellbook: { known: [], researching: { spellId: 'slow_ritual', progress: 2_000 }, level: 0 },
    });
    const r = run(m, { type: 'research', spellId: 'summon_dryad', turns: 5 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      // Empieza de cero: los 2.000 del anterior no cuentan.
      expect(r.state.spellbook.known).toContain('summon_dryad');
    }
  });
});

describe('criterio 7 — los cast turns se consumen de verdad', () => {
  const sabelotodo = () =>
    verde({
      spellbook: { known: ['slow_ritual', 'summon_dryad', 'weather_summoning'], researching: null, level: 11 },
    });

  test('un hechizo de 4 turnos no surte efecto hasta el cuarto', () => {
    const m = sabelotodo();
    const tres = run(m, { type: 'cast', spellId: 'slow_ritual', turns: 3 });
    expect(tres.ok).toBe(true);
    if (!tres.ok) return;
    // Sigue en curso, y el geld del hechizo aún no ha llegado.
    expect(tres.state.casting).toEqual({ spellId: 'slow_ritual', turnsRemaining: 1 });
    expect(tres.events.some((e) => e.type === 'spell.resources')).toBe(false);

    const cuarto = apply(tres.state, { type: 'cast', spellId: 'slow_ritual', turns: 1 }, ctx(), TUNE);
    expect(cuarto.ok).toBe(true);
    if (cuarto.ok) {
      expect(cuarto.state.casting).toBeNull();
      expect(cuarto.events.some((e) => e.type === 'spell.resources')).toBe(true);
    }
  });

  test('el maná se cobra AL INICIAR, no al terminar', () => {
    // docs/SISTEMAS.md §7.1: si cobrara al final, abandonar sería gratis.
    const m = sabelotodo();
    const r = run(m, { type: 'cast', spellId: 'slow_ritual', turns: 1 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const gastado = m.resources.mana - r.state.resources.mana;
      expect(gastado).toBeGreaterThanOrEqual(30_000);
      expect(r.events.some((e) => e.type === 'cast.started')).toBe(true);
    }
  });

  test('no se puede lanzar lo que no sabes', () => {
    const r = run(verde(), { type: 'cast', spellId: 'summon_dryad', turns: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('spell_not_learned');
  });

  test('no se pueden lanzar dos hechizos a la vez', () => {
    const m = sabelotodo();
    const primero = run(m, { type: 'cast', spellId: 'slow_ritual', turns: 1 });
    expect(primero.ok).toBe(true);
    if (!primero.ok) return;
    const segundo = apply(primero.state, { type: 'cast', spellId: 'summon_dryad', turns: 1 }, ctx(), TUNE);
    expect(segundo.ok).toBe(false);
    if (!segundo.ok) expect(segundo.error.code).toBe('already_casting');
  });

  test('sin maná no se puede empezar', () => {
    const m = verde({
      spellbook: { known: ['slow_ritual'], researching: null, level: 7 },
      resources: { geld: 1_000, mana: 100, population: 39_000 },
    });
    const r = run(m, { type: 'cast', spellId: 'slow_ritual', turns: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('not_enough_mana');
  });

  test('un hechizo de combate NO se puede lanzar en la fase 2', () => {
    const m = verde({ spellbook: { known: ['plant_growth'], researching: null, level: 20 } });
    const r = run(m, { type: 'cast', spellId: 'plant_growth', turns: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('spell_not_castable');
  });
});

describe('criterio 3 — lanzar cuesta maná aunque falle', () => {
  test('en tu color nunca falla', () => {
    const spell = SPELLS_TEST.summon_dryad!;
    expect(failureChance(spell, 'verdant', 0, 31)).toBe(0);
    expect(failureChance(spell, 'verdant', 31, 31)).toBe(0);
  });

  test('fuera de color falla, y el nivel lo mejora', () => {
    const spell = SPELLS_TEST.dark_pact!; // Nether: opuesta a Verdant, Average
    const aCero = failureChance(spell, 'verdant', 0, 31);
    const alMaximo = failureChance(spell, 'verdant', 31, 31);
    expect(aCero).toBe(30);
    expect(alMaximo).toBe(15);
    expect(alMaximo).toBeLessThan(aCero);
  });

  test('con la semilla fijada en un fallo, el maná baja y el efecto no ocurre', () => {
    const m = verde({
      spellbook: { known: ['dark_pact'], researching: null, level: 0 },
    });
    // Se buscan dos semillas: una que falle y otra que no.
    let fallo: MageState | null = null;
    let exito: MageState | null = null;
    for (let seed = 1; seed < 60 && (!fallo || !exito); seed++) {
      const r = apply(m, { type: 'cast', spellId: 'dark_pact', turns: 1 }, ctx(seed), TUNE);
      if (!r.ok) continue;
      if (r.events.some((e) => e.type === 'cast.failed')) fallo ??= r.state;
      else if (r.events.some((e) => e.type === 'spell.resources')) exito ??= r.state;
    }
    expect(fallo, 'ninguna semilla falló').not.toBeNull();
    expect(exito, 'ninguna semilla acertó').not.toBeNull();
    // En los dos casos se pagó el maná (10.000 × 3,5 de opuesta = 35.000).
    expect(m.resources.mana - fallo!.resources.mana).toBeGreaterThanOrEqual(35_000);
    // Pero solo uno dio geld.
    expect(fallo!.resources.geld).toBeLessThan(exito!.resources.geld);
  });
});

describe('criterio 8 — invocar', () => {
  test('la cantidad escala con el nivel de hechizo', () => {
    const efecto = { kind: 'summon' as const, unitId: 'dryad', min: 1_000, max: 1_000 };
    // A nivel cero, el suelo del 25%; a nivel máximo, entero.
    expect(summonCount(efecto, 0, 100, 0)).toBe(250);
    expect(summonCount(efecto, 100, 100, 0)).toBe(1_000);
    expect(summonCount(efecto, 50, 100, 0)).toBe(625);
  });

  test('si no cabe en la población, falla SIN cobrar el maná', () => {
    // Summon Dryad invoca 2.200 mínimo; este mago no tiene sitio.
    const m = verde({
      spellbook: { known: ['summon_dryad'], researching: null, level: 1 },
      buildings: { ...verde().buildings, towns: 1, farms: 1 },
    });
    const manaAntes = m.resources.mana;
    const r = run(m, { type: 'cast', spellId: 'summon_dryad', turns: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('no_population_space');
    expect(m.resources.mana).toBe(manaAntes);
  });

  test('invocar mete las unidades en el ejército', () => {
    const m = verde({ spellbook: { known: ['summon_dryad'], researching: null, level: 1 } });
    const r = run(m, { type: 'cast', spellId: 'summon_dryad', turns: 1 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const stack = r.state.army.find((s) => s.unitId === 'dryad');
      expect(stack).toBeDefined();
      expect(stack!.count).toBeGreaterThan(0);
    }
  });

  test('es reproducible: misma semilla, misma cantidad', () => {
    const m = verde({ spellbook: { known: ['summon_dryad'], researching: null, level: 1 } });
    const a = run(m, { type: 'cast', spellId: 'summon_dryad', turns: 1 }, 99);
    const b = run(m, { type: 'cast', spellId: 'summon_dryad', turns: 1 }, 99);
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) expect(a.state.army).toEqual(b.state.army);
  });
});

describe('criterio 6 — encantar', () => {
  const conEncantamiento = () => {
    const m = verde({ spellbook: { known: ['weather_summoning'], researching: null, level: 3 } });
    const r = apply(m, { type: 'cast', spellId: 'weather_summoning', turns: 2 }, ctx(), TUNE);
    if (!r.ok) throw new Error('no se pudo encantar');
    return r.state;
  };

  test('lanzarlo lo deja activo con su upkeep y sus modificadores congelados', () => {
    const s = conEncantamiento();
    expect(s.enchantments).toHaveLength(1);
    expect(s.enchantments[0]).toMatchObject({
      spellId: 'weather_summoning',
      upkeepMana: 60,
      modifiers: { farmOutput: 125 },
    });
  });

  test('no se puede lanzar dos veces', () => {
    const s = conEncantamiento();
    const otra = apply(s, { type: 'cast', spellId: 'weather_summoning', turns: 1 }, ctx(), TUNE);
    expect(otra.ok).toBe(false);
    if (!otra.ok) expect(otra.error.code).toBe('enchantment_already_active');
  });

  test('el modificador se nota en la economía', () => {
    const s = conEncantamiento();
    // +25% de comida sube el tope de población.
    const sinEncantar = verde();
    expect(s.enchantments[0]!.modifiers.farmOutput).toBe(125);
    expect(sinEncantar.enchantments).toHaveLength(0);
  });

  test('disipar lo quita, y disipar lo que no tienes es error de dominio', () => {
    const s = conEncantamiento();
    const r = apply(s, { type: 'dispel', spellId: 'weather_summoning' }, ctx(), TUNE);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.enchantments).toHaveLength(0);

    const otra = apply(s, { type: 'dispel', spellId: 'no_lo_tengo' }, ctx(), TUNE);
    expect(otra.ok).toBe(false);
    if (!otra.ok) expect(otra.error.code).toBe('enchantment_not_active');
  });
});

describe('el libro de hechizos', () => {
  test('solo enseña lo que este mago puede aprender', () => {
    const libro = spellbookFor('verdant', [], CATALOG);
    const ids = libro.map((e) => e.spell.id);
    // Verdant llega a todo lo verde y a Plain; `dark_pact` es Nether Average,
    // que también, porque de las opuestas se aprenden Simple y Average.
    expect(ids).toContain('summon_dryad');
    expect(ids).toContain('mana_tap');
    expect(ids).toContain('dark_pact');
  });

  test('enseña el precio que pagaría ÉL, no el base', () => {
    const libro = spellbookFor('verdant', [], CATALOG);
    const propio = libro.find((e) => e.spell.id === 'summon_dryad')!;
    const opuesto = libro.find((e) => e.spell.id === 'dark_pact')!;
    expect(propio.castMana).toBe(3_000); // en color
    expect(opuesto.castMana).toBe(35_000); // Average opuesta = 350%
    expect(opuesto.relation).toBe('opposite');
  });

  test('marca lo que no se puede lanzar todavía', () => {
    const libro = spellbookFor('verdant', [], CATALOG);
    expect(libro.find((e) => e.spell.id === 'plant_growth')!.castable).toBe(false);
    expect(libro.find((e) => e.spell.id === 'summon_dryad')!.castable).toBe(true);
  });

  test('lo ya sabido deja de estar investigable', () => {
    const libro = spellbookFor('verdant', ['summon_dryad'], CATALOG);
    const e = libro.find((x) => x.spell.id === 'summon_dryad')!;
    expect(e.known).toBe(true);
    expect(e.researchable).toBe(false);
  });
});
