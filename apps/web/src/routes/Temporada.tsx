/**
 * `/temporada`: cuántos sellos van y cuánto falta.
 *
 * **Las dos vías a la vez, y desde el primer día** (docs/INTERFAZ.md §3.9):
 * la fecha garantiza que la temporada acaba, los sellos permiten acabarla
 * antes, y si solo se enseñara una, la otra parecería no existir.
 *
 * Es la pantalla que responde «¿para qué juego?», así que puede permitirse
 * ser un poco solemne. Lo que no puede es mentir sobre cuánto falta.
 */

import { useEffect, useState } from 'react';
import type { MageResponse } from '@archmage/contract';
import { type SeasonInfo, fetchSeason, romperSello } from '../api.js';

function cuantoFalta(ms: number): string {
  if (ms <= 0) return 'ya';
  const dias = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (dias > 0) return `${dias} día${dias === 1 ? '' : 's'}`;
  const horas = Math.ceil(ms / (60 * 60 * 1000));
  return `${horas} hora${horas === 1 ? '' : 's'}`;
}

export function Temporada({ data }: { data: MageResponse }) {
  const [info, setInfo] = useState<SeasonInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const ahora = Date.now();

  const recargar = () =>
    fetchSeason()
      .then(setInfo)
      .catch(() => setInfo(null));

  useEffect(() => {
    void recargar();
  }, [data]);

  if (!info) return <p className="recurso__nota">Cargando la temporada…</p>;

  const { season, halls } = info;
  const rotos = season.seals.length;
  const yaRompi = season.seals.some((s) => s.mageId === data.mage.id);
  const esperando = season.nextSealAt !== null && ahora < season.nextSealAt;

  const romper = async () => {
    setOcupado(true);
    try {
      await romperSello();
      setError(null);
      await recargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo romper el sello.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <>
      <section className="panel">
        <h2 className="panel__titulo">Los siete sellos</h2>
        <p className="recurso__nota">
          <strong>
            {rotos} de {season.sealsNeeded} sellos rotos.
          </strong>{' '}
          Cada sello lo rompe <strong>un mago distinto</strong>, y pasan al menos{' '}
          <strong>24 horas</strong> entre uno y el siguiente. Roto el séptimo, el mundo termina.
        </p>

        {season.seals.length > 0 && (
          <ul className="lista">
            {season.seals.map((s) => (
              <li key={s.index} className="recurso__nota">
                Sello {s.index} · roto por <strong>{s.mageId}</strong>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="error">{error}</p>}

        {yaRompi ? (
          <p className="aviso">
            Ya rompiste un sello. Los que faltan los tienen que romper otros magos.
          </p>
        ) : esperando ? (
          <p className="aviso">
            Falta{cuantoFalta(season.nextSealAt! - ahora) === '1 hora' ? '' : 'n'}{' '}
            {cuantoFalta(season.nextSealAt! - ahora)} para que se pueda romper el siguiente.
          </p>
        ) : (
          <button className="boton" disabled={ocupado} onClick={() => void romper()}>
            Romper el siguiente sello
          </button>
        )}
      </section>

      <section className="panel">
        <h2 className="panel__titulo">La fecha tope</h2>
        {/* **La otra vía, siempre visible.** Con pocos jugadores coordinar
            siete magos es difícil, y si solo se vieran los sellos parecería
            que la temporada no acaba nunca. */}
        <p className="recurso__nota">
          Aunque no se rompa ningún sello, esta temporada termina en{' '}
          <strong>{cuantoFalta(season.deadlineAt - ahora)}</strong>. Los sellos solo permiten
          acabarla antes.
        </p>
      </section>

      {halls.length > 0 && (
        <section className="panel">
          <h2 className="panel__titulo">Temporadas anteriores</h2>
          {halls.map((h) => {
            const fame = (h.halls.fame ?? []) as { mageId: string; name: string; rank: number }[];
            const immortals = (h.halls.immortals ?? []) as { mageId: string; seal: number }[];
            return (
              <div key={h.id}>
                <p className="recurso__nota">
                  <strong>Hall of Fame</strong> —{' '}
                  {fame.map((f) => `${f.rank}. ${f.name}`).join(' · ') || 'nadie'}
                </p>
                <p className="recurso__nota">
                  <strong>Hall of Immortals</strong> —{' '}
                  {immortals.map((i) => `sello ${i.seal}: ${i.mageId}`).join(' · ') ||
                    'la temporada acabó por el reloj, no por nadie'}
                </p>
              </div>
            );
          })}
        </section>
      )}
    </>
  );
}
