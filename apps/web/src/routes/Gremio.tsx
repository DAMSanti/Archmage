/**
 * `/gremio`: miembros, aliados y diplomacia.
 *
 * **Lo que esta pantalla no puede callar** (docs/INTERFAZ.md §3.7):
 *
 *  - **A un compañero no se le puede atacar.** Se dice aquí y en `/guerra`:
 *    un botón que falta sin explicación parece un fallo.
 *  - **Un aliado manda refuerzos automáticos, salvo sus dos stacks más
 *    potentes.** Va dicho **antes** de aliarse, porque el que acepta está
 *    comprometiendo su ejército a batallas que no elige.
 *  - **Romper tarda 24 horas**, y durante el plazo los refuerzos siguen
 *    yendo. Se dice al pulsar, no después.
 */

import { useEffect, useState } from 'react';
import type { MageResponse } from '@archmage/contract';
import { type GuildInfo, fetchGuild } from '../api.js';

export function Gremio({ data }: { data: MageResponse }) {
  const [info, setInfo] = useState<GuildInfo | null>(null);

  useEffect(() => {
    void fetchGuild()
      .then(setInfo)
      .catch(() => setInfo({ guild: null, allies: [] }));
  }, [data]);

  if (!info) return <p className="recurso__nota">Cargando el gremio…</p>;

  return (
    <>
      <section className="panel">
        <h2 className="panel__titulo">Tu gremio</h2>
        {info.guild === null ? (
          <p className="aviso">
            No estás en ningún gremio. Hacen falta <strong>cinco magos</strong> para fundar uno, y
            un mago solo puede estar en uno.
          </p>
        ) : (
          <>
            <p className="recurso__nota">
              <strong>{info.guild.name}</strong> · {info.guild.members.length} miembros.{' '}
              <strong>A un compañero de gremio no se le puede atacar.</strong>
            </p>
            <ul className="lista">
              {info.guild.members.map((m) => (
                <li key={m.mageId} className="recurso__nota">
                  {m.name}
                  {m.role === 'leader' && ' · líder'}
                  {m.mageId === data.mage.id && ' · (tú)'}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="panel">
        <h2 className="panel__titulo">Aliados</h2>
        {/* El coste de aliarse, dicho ANTES de aceptar. */}
        <p className="recurso__nota">
          Un aliado <strong>manda refuerzos automáticamente</strong> cuando te atacan —
          <strong>salvo sus dos stacks más potentes</strong>, que se quedan en casa—. Y funciona
          en los dos sentidos: <strong>tus unidades mueren en batallas que no eliges</strong>.
          Romper una alianza <strong>tarda 24 horas</strong>, y durante ese plazo los refuerzos
          siguen yendo.
        </p>
        {(info.allies ?? []).length === 0 ? (
          <p className="aviso">No tienes aliados.</p>
        ) : (
          <ul className="lista">
            {(info.allies ?? []).map((a) => (
              <li key={a} className="recurso__nota">
                {a}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
