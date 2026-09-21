/**
 * `/habilidades`: las diez del mago.
 *
 * **Dice qué cambian en números**, no «mejora tus tropas»: «+7% de acierto
 * en batalla». La regla de docs/INTERFAZ.md §4 vale aquí más que en ningún
 * sitio — la interfaz no esconde la fórmula, porque el jugador no puede
 * decidir sobre lo que no ve.
 *
 * Y las cinco de especialidad dicen **cuánto cuestan fuera de tu color** en
 * la propia fila, no en una nota al pie.
 */

import type { CatalogResponse, MageResponse } from '@archmage/contract';

/** Qué toca cada habilidad, dicho en palabras del jugador. */
const QUE_TOCA: Record<string, { texto: string; baja: boolean }> = {
  spellManaCost: { texto: 'de coste de maná en todos tus hechizos', baja: true },
  offColourFailure: { texto: 'de fallo al lanzar fuera de tu color', baja: true },
  enchantmentUpkeep: { texto: 'de mantenimiento de tus encantamientos', baja: true },
  summonCount: { texto: 'de unidades por invocación', baja: false },
  animalAttack: { texto: 'de ataque en tus unidades animales', baja: false },
  undeadAttack: { texto: 'de ataque en tus no muertos', baja: false },
  accuracy: { texto: 'de acierto en batalla', baja: false },
  landTaken: { texto: 'de tierra arrancada al ganar', baja: false },
  barrierDefence: { texto: 'de defensa de tus barriers', baja: false },
  itemRate: { texto: 'de ritmo de generación de items', baja: false },
};

export function Habilidades({
  data,
  catalog,
}: {
  data: MageResponse;
  catalog: CatalogResponse;
}) {
  const skills = catalog.skills;
  const nivelDe = (id: string) => data.mage.skills[id] ?? 0;

  return (
    <section className="panel">
      <h2 className="panel__titulo">Habilidades</h2>
      <p className="recurso__nota">
        Diez habilidades de veinte niveles. Cada rango vale <strong>un 1%</strong>, así que al
        nivel 20 son un <strong>20%</strong>. Los puntos salen de tus <strong>guilds</strong>, y
        llegar al 20 cuesta <strong>210 puntos</strong>.
      </p>

      <ul className="lista">
        {skills.map((s) => {
          const nivel = nivelDe(s.id);
          const info = QUE_TOCA[s.target];
          const signo = info?.baja ? '−' : '+';
          // **Se dice siempre qué hace, también al nivel 0.** Con solo «sin
          // efecto todavía» no se puede decidir cuál subir, que es la única
          // decisión de esta pantalla. Lo enseñó la pasada de navegador.
          const ahora = nivel === 0 ? 'todavía no la tienes' : `ahora ${signo}${nivel}%`;
          return (
            <li key={s.id} className="recurso__nota">
              <strong>{s.name}</strong> · nivel {nivel}/20 ·{' '}
              <strong>
                {signo}1% {info?.texto ?? ''} por rango
              </strong>{' '}
              ({ahora}, {signo}20% al 20)
              {/* **En la fila, no en una nota al pie.** */}
              {s.ofSpecialty && (
                <> · de escuela: <strong>cuesta el doble fuera de tu color</strong></>
              )}
            </li>
          );
        })}
      </ul>

      {skills.length === 0 && (
        <p className="aviso">El catálogo de habilidades no se ha podido cargar.</p>
      )}
    </section>
  );
}
