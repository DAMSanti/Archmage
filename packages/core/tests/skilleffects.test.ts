import { describe, expect, test } from 'vitest';
import { noSkills, skillModifiers, withSkill } from '../src/skilleffects.js';
import { castCost } from '../src/magic.js';
import { failureChance } from '../src/casting.js';
import { landTaken } from '../src/land.js';
import { resolveBattle } from '../src/battle.js';
import { makeRandom } from '../src/random.js';
import type { SkillSpec } from '../src/skills.js';
import type { UnitSpec } from '../src/units.js';
import { SPELLS_TEST } from './fixtures.js';

/**
 * Las habilidades, enchufadas. docs/SISTEMAS.md §12.1, criterio 14.
 *
 * **Éste es el canario del riesgo 1 del plan.** Las habilidades tocan nueve
 * fórmulas ya calibradas en las fases 1 a 3; lo que este fichero protege no
 * es que funcionen, es que **al nivel 0 no muevan ni un número**.
 */
const skill = (id: string, target: string, reduces = false): SkillSpec =>
  ({ id, name: id, target, ofSpecialty: false, reduces, source: 'test' } as SkillSpec);

describe('al nivel 0 no cambia NADA', () => {
  test('los diez multiplicadores valen exactamente 1', () => {
    const m = noSkills();
    for (const [k, v] of Object.entries(m)) expect(v, k).toBe(1);
  });

  test('un mago sin habilidades tiene los diez a 1', () => {
    const catalogo = [skill('a', 'accuracy'), skill('b', 'landTaken')];
    expect(skillModifiers({}, catalogo)).toEqual(noSkills());
    expect(skillModifiers({ a: 0, b: 0 }, catalogo)).toEqual(noSkills());
  });

  test('las fórmulas dan lo mismo sin pasarles habilidad', () => {
    // **La prueba de que enchufarlas fue aditivo.** Los parámetros nuevos
    // tienen valor por defecto, así que todo lo que ya llamaba a estas
    // funciones sigue obteniendo lo de antes.
    const spell = SPELLS_TEST.verdant_complex ?? Object.values(SPELLS_TEST)[0]!;
    expect(castCost(1_000, spell.rank, 'own')).toBe(castCost(1_000, spell.rank, 'own', 1));
    expect(failureChance(spell, 'nether', 50, 200)).toBe(
      failureChance(spell, 'nether', 50, 200, 1),
    );
    expect(landTaken(1_000, 1_000_000, 'siege')).toEqual(
      landTaken(1_000, 1_000_000, 'siege', 0, 1),
    );
  });
});

describe('cada habilidad mueve lo suyo, y solo lo suyo', () => {
  test('Spell Mastery abarata el maná', () => {
    const spell = Object.values(SPELLS_TEST)[0]!;
    const normal = castCost(1_000, spell.rank, 'own')!;
    const conHabilidad = castCost(1_000, spell.rank, 'own', 0.8)!;
    expect(conHabilidad).toBeLessThan(normal);
    expect(conHabilidad).toBe(Math.floor(normal * 0.8));
  });

  test('Spell Penetration baja el fallo fuera de color', () => {
    const spell = Object.values(SPELLS_TEST).find((s) => s.school !== 'plain')!;
    const normal = failureChance(spell, 'nether', 0, 200);
    const conHabilidad = failureChance(spell, 'nether', 0, 200, 0.8);
    if (normal > 0) expect(conHabilidad).toBeLessThan(normal);
  });

  test('Grand Conqueror arranca más tierra', () => {
    expect(landTaken(1_000, 1_000_000, 'siege', 0, 1.2).lost).toBe(120);
    expect(landTaken(1_000, 1_000_000, 'siege', 0, 1).lost).toBe(100);
  });

  test('pero los supervivientes siguen mandando', () => {
    // La habilidad no crea tierra de la nada: sigue haciendo falta ejército.
    const r = landTaken(1_000, 2_500, 'siege', 0, 1.2);
    expect(r.lost).toBe(50);
    expect(r.limitedBySurvivors).toBe(true);
  });

  test('Legendary Commander sube el acierto en batalla', () => {
    const u = {
      id: 's',
      name: 's',
      abilities: [],
      weaknesses: [],
      resistances: {},
      spellResistances: {},
      attack: { power: 100, types: ['melee'], initiative: 3 },
      counterAttack: 0,
      hitPoints: 100,
      powerRank: 10,
    } as unknown as UnitSpec;
    const pelear = (delta: number) =>
      resolveBattle(
        { stacks: [{ unit: u, count: 1_000 }] },
        { stacks: [{ unit: u, count: 1_000 }] },
        { seed: 5, random: makeRandom(5), attackType: 'regular', attackerAccuracy: delta },
      );
    const sin = pelear(0).log.find((g) => g.side === 'attacker')!;
    const con = pelear(6).log.find((g) => g.side === 'attacker')!;
    expect(sin.accuracy).toBe(30);
    expect(con.accuracy).toBe(36);
    // Y el defensor no se entera.
    expect(pelear(6).log.find((g) => g.side === 'defender')!.accuracy).toBe(30);
  });
});

describe('cómo se combinan', () => {
  test('dos habilidades sobre la misma magnitud se MULTIPLICAN', () => {
    // Si se sumaran, apilarlas podría llegar a cero o pasarse. Multiplicando
    // no: dos del −20% dejan el coste en 0,64, no en 0,60.
    const catalogo = [
      skill('a', 'spellManaCost', true),
      skill('b', 'spellManaCost', true),
    ];
    const m = skillModifiers({ a: 20, b: 20 }, catalogo);
    expect(m.spellManaCost).toBeCloseTo(0.64, 10);
  });

  test('una habilidad no toca las magnitudes de las demás', () => {
    const m = skillModifiers({ a: 20 }, [skill('a', 'accuracy')]);
    expect(m.accuracy).toBeCloseTo(1.2, 10);
    expect(m.landTaken).toBe(1);
    expect(m.spellManaCost).toBe(1);
  });

  test('un nivel que no está en el catálogo se ignora', () => {
    expect(skillModifiers({ fantasma: 20 }, [skill('a', 'accuracy')])).toEqual(noSkills());
  });
});

describe('el redondeo sigue siendo uno', () => {
  test('withSkill trunca una sola vez', () => {
    expect(withSkill(100, 1.2)).toBe(120);
    expect(withSkill(7, 1.2)).toBe(8); // 8,4
    expect(withSkill(7, 0.8)).toBe(5); // 5,6
  });

  test('nunca devuelve fracción', () => {
    for (const v of [1, 7, 99, 1_234]) {
      for (const m of [0.8, 0.93, 1.07, 1.2]) {
        expect(Number.isInteger(withSkill(v, m))).toBe(true);
      }
    }
  });
});
