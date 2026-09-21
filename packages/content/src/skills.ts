/**
 * Las diez habilidades, como dato.
 *
 * Los nombres y cuáles son de especialidad están publicados
 * ([docs/ORIGINAL.md §8](../../../docs/ORIGINAL.md), confianza alta). **Qué
 * hace cada una, no** — salvo *Spell Mastery*, y de fuente floja. La regla
 * con la que se deducen las otras nueve está en
 * [docs/SISTEMAS.md §12.1](../../../docs/SISTEMAS.md): **+1% por rango**,
 * hasta +20% al nivel 20, sobre la magnitud que cada una toca.
 *
 * Aquí solo están los datos. El efecto lo aplica `packages/core/src/skills.ts`.
 */

import type { SkillSpec } from '@archmage/core';

const ORIG = '[orig] ORIGINAL §8: el nombre y que es de especialidad.';
const NUESTRO = '[nuestro] SISTEMAS §12.1: +1% por rango, deducido del ancla de Spell Mastery.';

export const SKILLS: readonly SkillSpec[] = [
  // --- De especialidad: cuestan el doble fuera de tu color ---------------
  {
    id: 'spell_mastery',
    name: 'Maestría Mágica',
    target: 'spellManaCost',
    ofSpecialty: true,
    reduces: true,
    // **La única con efecto publicado**, y es el ancla de escala de las
    // otras nueve: «los tres primeros rangos son un 3% menos de coste de
    // maná». Confianza baja —la nota se contradice a sí misma— pero basta
    // para saber que una habilidad al máximo vale un 20% y no un 200%.
    source: `${ORIG} Y su efecto: ~1% menos de coste de maná por rango. Confianza baja.`,
  },
  {
    id: 'spell_penetration',
    name: 'Penetración Mágica',
    target: 'offColourFailure',
    ofSpecialty: true,
    reduces: true,
    source: `${ORIG} ${NUESTRO}`,
  },
  {
    id: 'animal_mastery',
    name: 'Dominio Animal',
    target: 'animalAttack',
    ofSpecialty: true,
    reduces: false,
    source: `${ORIG} ${NUESTRO}`,
  },
  {
    id: 'undead_mastery',
    name: 'Dominio de los No Muertos',
    target: 'undeadAttack',
    ofSpecialty: true,
    reduces: false,
    source: `${ORIG} ${NUESTRO}`,
  },
  {
    id: 'legendary_artificer',
    name: 'Artífice Legendario',
    target: 'itemRate',
    ofSpecialty: true,
    reduces: false,
    source: `${ORIG} ${NUESTRO}`,
  },

  // --- Neutras ------------------------------------------------------------
  {
    id: 'grand_enchanter',
    name: 'Gran Encantador',
    target: 'enchantmentUpkeep',
    ofSpecialty: false,
    reduces: true,
    source: `${ORIG} ${NUESTRO}`,
  },
  {
    id: 'augment_summoning',
    name: 'Invocación Aumentada',
    target: 'summonCount',
    ofSpecialty: false,
    reduces: false,
    source: `${ORIG} ${NUESTRO}`,
  },
  {
    id: 'legendary_commander',
    name: 'Comandante Legendario',
    target: 'accuracy',
    ofSpecialty: false,
    reduces: false,
    // **La que más pesa en batalla**, y no por casualidad: el acierto vale
    // más que el ataque (docs/ORIGINAL.md §9.1, «3% de acierto da el mismo
    // bono que 10% de ataque»).
    source: `${ORIG} ${NUESTRO}`,
  },
  {
    id: 'grand_conqueror',
    name: 'Gran Conquistador',
    target: 'landTaken',
    ofSpecialty: false,
    reduces: false,
    source: `${ORIG} ${NUESTRO}`,
  },
  {
    id: 'barrier_proficiency',
    name: 'Maestría de Barreras',
    target: 'barrierDefence',
    ofSpecialty: false,
    reduces: false,
    source: `${ORIG} ${NUESTRO}`,
  },
];

export const SKILLS_BY_ID: Record<string, SkillSpec> = Object.fromEntries(
  SKILLS.map((s) => [s.id, s]),
);

/** Las cinco que cuestan el doble fuera de tu color. */
export const SPECIALTY_SKILL_IDS = SKILLS.filter((s) => s.ofSpecialty).map((s) => s.id);
