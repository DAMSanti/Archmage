/**
 * Gremios: fundar, entrar, y a quién no se puede atacar.
 *
 * Reglas de [docs/ORIGINAL.md §10](../../../docs/ORIGINAL.md), confirmadas,
 * y las nuestras en docs/SISTEMAS.md §14.1.
 *
 * **La regla que más importa es la que no parece una regla:** «protección
 * frente a los compañeros» es **código, no norma de foro**. Si el juego
 * permite atacar a un compañero, alguien lo hará y el gremio dejará de
 * significar nada. Por eso `canAttack()` vive aquí y no en una pantalla.
 *
 * Fuera de alcance aquí:
 *  - **Las alianzas**, que son otra cosa y viven en `alliance.ts`: un
 *    compañero de gremio no manda refuerzos, un aliado sí.
 *  - **Guardar nada.** Aquí se decide; el servidor persiste.
 *  - **Los gremios sobreviven a la temporada**: no lo hacen
 *    (docs/SISTEMAS.md §14.1), y eso lo resuelve el cierre de temporada.
 */

/** Fundadores que hace falta reunir. docs/ORIGINAL.md §10. */
export const FOUNDERS_NEEDED = 5;

export type GuildRole = 'leader' | 'member';

export interface GuildMember {
  mageId: string;
  role: GuildRole;
}

export interface Guild {
  id: string;
  serverId: string;
  name: string;
  /** Quién lo registró. docs/ORIGINAL.md §10: «quien lo registra es el líder». */
  leaderId: string;
  members: readonly GuildMember[];
  /** Magos declarados enemigos. No cambia ninguna regla: es información. */
  enemies: readonly string[];
}

export type GuildError =
  | { code: 'faltan_fundadores'; message: string }
  | { code: 'ya_tienes_gremio'; message: string }
  | { code: 'no_eres_miembro'; message: string }
  | { code: 'el_lider_no_sale'; message: string };

/**
 * Comprueba que se puede fundar.
 *
 * **Cinco fundadores, y cinco distintos.** Repetir un id para llegar a cinco
 * es el atajo obvio, y sin comprobarlo funcionaría.
 */
export function canFound(
  founderIds: readonly string[],
  yaEnGremio: (mageId: string) => boolean,
): { ok: true } | { error: GuildError } {
  const unicos = new Set(founderIds);
  if (unicos.size < FOUNDERS_NEEDED) {
    return {
      error: {
        code: 'faltan_fundadores',
        message: `Hacen falta ${FOUNDERS_NEEDED} magos distintos para fundar un gremio.`,
      },
    };
  }
  for (const id of unicos) {
    if (yaEnGremio(id)) {
      return {
        error: {
          code: 'ya_tienes_gremio',
          message: 'Alguno de los fundadores ya está en un gremio.',
        },
      };
    }
  }
  return { ok: true };
}

/**
 * Si un mago puede entrar en un gremio.
 *
 * **Un mago, un gremio.** El original no lo dice explícitamente, pero la
 * protección entre compañeros no tendría sentido si se pudiera estar en
 * varios: sería inmunidad con pasos extra.
 */
export function canJoin(mageId: string, guild: Guild, yaEnGremio: boolean):
  | { ok: true }
  | { error: GuildError } {
  if (yaEnGremio) {
    return {
      error: { code: 'ya_tienes_gremio', message: 'Ya estás en un gremio.' },
    };
  }
  if (guild.members.some((m) => m.mageId === mageId)) {
    return { error: { code: 'ya_tienes_gremio', message: 'Ya estás en ese gremio.' } };
  }
  return { ok: true };
}

/**
 * Si un mago puede salirse.
 *
 * **El líder no puede irse sin más**, porque dejaría el gremio sin quien lo
 * lleve y sin forma de nombrar a otro. Primero pasa el liderazgo.
 */
export function canLeave(mageId: string, guild: Guild): { ok: true } | { error: GuildError } {
  if (!guild.members.some((m) => m.mageId === mageId)) {
    return { error: { code: 'no_eres_miembro', message: 'No estás en ese gremio.' } };
  }
  if (guild.leaderId === mageId && guild.members.length > 1) {
    return {
      error: {
        code: 'el_lider_no_sale',
        message: 'Pasa antes el liderazgo a otro miembro.',
      },
    };
  }
  return { ok: true };
}

/** Si dos magos están en el mismo gremio. */
export function sameGuild(a: string | null, b: string | null): boolean {
  return a !== null && b !== null && a === b;
}

/**
 * Si un mago puede atacar a otro, mirando solo los gremios.
 *
 * **A un compañero no se le ataca**, y es regla del código. Las demás
 * razones para no poder atacar —protección, turnos, geld— las mira
 * `war.ts`; ésta es la única que depende de con quién vas.
 */
export function canAttack(attackerGuild: string | null, defenderGuild: string | null): boolean {
  return !sameGuild(attackerGuild, defenderGuild);
}
