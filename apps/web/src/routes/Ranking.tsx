/**
 * `/ranking`: la clasificación del servidor.
 *
 * **Net power, tierra y escuela. Ni ejército ni geld**
 * (docs/SISTEMAS.md §12.1): saber exactamente con qué cuenta el rival
 * convierte la guerra en aritmética, y el original tampoco lo enseña.
 *
 * **Un mago protegido aparece, marcado.** Esconderlo haría que la lista
 * mintiera sobre cuánta gente hay jugando — que es justo lo que un jugador
 * nuevo mira para decidir si se queda.
 */

import { useEffect, useState } from 'react';
import type { MageResponse } from '@archmage/contract';
import { type RankingRow, fetchRanking } from '../api.js';

const ESCUELAS: Record<string, string> = {
  verdant: 'Verdant',
  nether: 'Nether',
  eradication: 'Eradication',
  phantasm: 'Phantasm',
  ascendant: 'Ascendant',
  plain: 'Plain',
};

export function Ranking({ data }: { data: MageResponse }) {
  const [filas, setFilas] = useState<RankingRow[] | null>(null);

  useEffect(() => {
    void fetchRanking()
      .then(setFilas)
      .catch(() => setFilas([]));
  }, [data]);

  const n = (x: number) => x.toLocaleString('es-ES', { useGrouping: 'always' });

  if (filas === null) return <p className="recurso__nota">Cargando la clasificación…</p>;

  return (
    <section className="panel">
      <h2 className="panel__titulo">Clasificación</h2>
      {filas.length === 0 ? (
        <p className="aviso">No hay nadie en este servidor todavía.</p>
      ) : (
        <ul className="lista">
          {filas.map((f, i) => (
            <li key={f.id} className="recurso__nota">
              <strong>
                {i + 1}. {f.name}
              </strong>
              {f.id === data.mage.id && ' (tú)'} · {ESCUELAS[f.specialty] ?? f.specialty} ·{' '}
              {n(f.land)} acres · <strong>net power {n(f.netPower)}</strong>
              {/* Se dice que está protegido, no se esconde. */}
              {f.protected && ' · protegido'}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
