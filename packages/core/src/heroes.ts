/**
 * Héroes e items en la batalla.
 *
 * Reglas de [docs/ORIGINAL.md §7](../../../docs/ORIGINAL.md) y
 * docs/SISTEMAS.md §9.1.
 *
 * Fuera de alcance aquí, y **declarado porque es deuda**:
 *  - **El efecto numérico de cada habilidad de héroe.** Sigue `[abierto]`
 *    en §9.1: la wiki las nombra sin publicar cuánto hacen. Aquí solo entra
 *    el bonus de eficiencia por nivel, que sí está publicado.
 *  - **El catálogo de items.** Solo entran los cuatro con números
 *    publicados; la lista completa es de la fase 4.
 *  - **La experiencia y el subir de nivel**: es del turno, no de la
 *    batalla.
 */

import type { BattleStack } from './combat.js';
import type { UnitSpec } from './units.js';

/**
 * Un héroe, en lo que le importa a una batalla: su **ficha**.
 *
 * Se llama `HeroSpec` y no `Hero` porque `Hero` ya existe en `types.ts` y es
 * **otra cosa**: el estado que el mago guarda de él —id, nivel y
 * experiencia—. Esto es el dato del catálogo, como `UnitSpec`.
 */
export interface HeroSpec {
  id: string;
  name: string;
  level: number;
  /** Raza que prefiere liderar. */
  race: string;
  /** Escuela que prefiere liderar. */
  specialty: string;
  hitPoints: number;
}

/** A qué stack acabó liderando cada héroe. */
export interface HeroAssignment {
  heroId: string;
  stackIndex: number;
  /** Bonus de eficiencia en puntos, que es **su nivel**. */
  efficiencyBonus: number;
  /** Si lidera una unidad de su raza y su color. */
  preferred: boolean;
}

/**
 * Reparte los héroes entre los stacks: **el de mayor nivel al stack más
 * potente**, y así hacia abajo.
 *
 * **[nuestro]** Cómo se rompe un empate. El original dice que los héroes
 * «prefieren su raza y su color» pero no en qué orden mandan las cosas. Aquí
 * el criterio es, en este orden: **nivel del héroe**, y a igual nivel el
 * `id`; y para los stacks, **poder total**, y a igual poder el `id` de la
 * unidad. Determinista a propósito — si el reparto dependiera del azar
 * habría que guardar otra semilla para poder repetir la batalla
 * (docs/SPECS.md §5, invariante 3).
 *
 * La preferencia por raza y color **no cambia a quién lidera**: cambia si el
 * bonus se aplica. Un héroe que acaba en un stack que no es el suyo va igual,
 * pero no aporta.
 */
export function assignHeroes(
  heroes: readonly HeroSpec[],
  stacks: readonly BattleStack[],
): HeroAssignment[] {
  const porNivel = [...heroes].sort((a, b) => b.level - a.level || a.id.localeCompare(b.id));
  const porPoder = stacks
    .map((s, index) => ({ s, index }))
    .sort(
      (a, b) =>
        b.s.count * b.s.unit.powerRank - a.s.count * a.s.unit.powerRank ||
        a.s.unit.id.localeCompare(b.s.unit.id),
    );

  const r: HeroAssignment[] = [];
  for (let i = 0; i < porNivel.length && i < porPoder.length; i++) {
    const h = porNivel[i]!;
    const { s, index } = porPoder[i]!;
    const preferred = s.unit.race === h.race && s.unit.specialty === h.specialty;
    r.push({
      heroId: h.id,
      stackIndex: index,
      // **Solo suma si lidera lo suyo.** Es lo que hace que componer el
      // ejército alrededor de tus héroes sea una decisión.
      efficiencyBonus: preferred ? h.level : 0,
      preferred,
    });
  }
  return r;
}

/** El bonus de eficiencia que le toca a un stack, o 0. */
export function heroBonusFor(assignments: readonly HeroAssignment[], stackIndex: number): number {
  return assignments.find((a) => a.stackIndex === stackIndex)?.efficiencyBonus ?? 0;
}

/**
 * Si un héroe muere: **su stack fue aniquilado y quedó daño de sobra para
 * superar sus HP**. docs/SISTEMAS.md §9.1.
 *
 * El matiz importa: perder el stack no basta. Un héroe cuyo stack cae justo
 * al último golpe sobrevive, y es lo que permite rescatar a un héroe caro
 * poniéndolo en un stack grande.
 */
export function heroDies(hero: HeroSpec, stackWiped: boolean, overkillDamage: number): boolean {
  return stackWiped && overkillDamage >= hero.hitPoints;
}

// --- Items de batalla ---------------------------------------------------

// **El catálogo se mudó a `packages/content/src/items.ts` el 2026-09-21.**
// Estaba aquí como `BATTLE_ITEMS`, que era **dato en un paquete de código**:
// los números de un item no son distintos de los de una unidad o un
// hechizo, y todos los demás viven en `content` (docs/SPECS.md §4). Aquí
// queda solo lo que es regla: cómo se aplican.
//
// El tipo `ItemSpec` está en `items.ts`, junto a las mecánicas.

/**
 * Si un item de *assignment* se dispara: el ejército enemigo llega al
 * porcentaje que el jugador fijó.
 *
 * **En defensa no se pueden bloquear** (docs/SISTEMAS.md §9.1): esta
 * función no tiene parámetro para impedirlo, y es a propósito.
 */
export function assignmentTriggers(
  enemyPower: number,
  ownPower: number,
  thresholdShare: number,
): boolean {
  if (ownPower <= 0) return enemyPower > 0;
  return enemyPower / ownPower >= thresholdShare;
}
