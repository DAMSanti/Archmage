/**
 * `/batalla/:id`: la repetición, ronda a ronda.
 *
 * **Enseña los términos que se aplicaron, no solo el resultado.** Una
 * animación bonita que diga «murieron 9.000» no le sirve al jugador para
 * decidir mejor la próxima vez; saber que su acierto fue 20 porque asediaba,
 * que el defensor resistía el 67% a melee y que en la tercera ronda su
 * eficiencia ya iba por 55, sí (docs/VISION.md §1).
 *
 * Que se pueda pintar esto es exactamente para lo que existe el invariante 3:
 * la semilla guardada hace que este log **sea** lo que pasó, no una
 * reconstrucción aproximada.
 */

import { useEffect, useState } from 'react';
import type { CatalogResponse } from '@archmage/contract';
import { type Battle, fetchBattle } from '../api.js';

const NOMBRE_GOLPE: Record<string, string> = {
  primary: 'ataque',
  extra: 'ataque extra',
  counter: 'contraataque',
};

export function Batalla({
  id,
  catalog,
  onVolver,
}: {
  id: number;
  catalog: CatalogResponse;
  onVolver: () => void;
}) {
  /**
   * El nombre de una unidad, no su id.
   *
   * El log guarda ids —`militia`, `cavalry`— porque es lo que identifica a
   * una unidad para siempre; la pantalla enseña **Milicia** y
   * **Caballería**. Dejar salir el id a la interfaz ya pasó una vez en la
   * fase 1 con los nombres de acción (docs/INTERFAZ.md).
   */
  const nombre = (unitId: string) => catalog.units[unitId]?.name ?? unitId;
  const [batalla, setBatalla] = useState<Battle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchBattle(id)
      .then(setBatalla)
      .catch(() => setError('No se pudo cargar esa batalla.'));
  }, [id]);

  if (error) {
    return (
      <section className="panel">
        <p className="aviso">{error}</p>
        <button className="boton" onClick={onVolver}>
          Volver
        </button>
      </section>
    );
  }
  if (!batalla) return <p className="recurso__nota">Cargando la batalla…</p>;

  const rondas = [...new Set(batalla.log.map((g) => g.round))].sort((a, b) => a - b);
  const n = (x: number) => x.toLocaleString('es-ES', { useGrouping: 'always' });

  return (
    <>
      <section className="panel">
        <h2 className="panel__titulo">Batalla #{batalla.id}</h2>
        <p className="recurso__nota">
          {batalla.attackerName} atacó a {batalla.defenderName} ·{' '}
          {batalla.attackType === 'siege'
            ? 'asedio'
            : batalla.attackType === 'pillage'
              ? 'saqueo'
              : 'ataque regular'}{' '}
          · {batalla.rounds} rondas ·{' '}
          <strong>
            {batalla.winner === 'attacker' ? 'ganó el atacante' : 'ganó el defensor'}
          </strong>
        </p>
        <p className="recurso__nota">
          Tierra perdida: {n(batalla.landLost)} · el atacante se quedó {n(batalla.landTaken)} ·
          se destruyeron {n(batalla.landLost - batalla.landTaken)}.
        </p>
        {/* La semilla, a la vista: es lo que hace comprobable que esto es lo
            que pasó y no una reconstrucción. */}
        <p className="recurso__nota">
          Semilla <code>{batalla.seed}</code> — con ella esta batalla se reproduce idéntica.
        </p>
        <button className="boton" onClick={onVolver}>
          Volver a la guerra
        </button>
      </section>

      {rondas.map((r) => (
        <section className="panel" key={r}>
          <h2 className="panel__titulo">Ronda {r + 1}</h2>
          <ul className="lista">
            {batalla.log
              .filter((g) => g.round === r)
              .map((g, i) => (
                <li key={i} className="recurso__nota">
                  <strong>
                    {g.side === 'attacker' ? '→' : '←'} {nombre(g.attackerUnit)}
                  </strong>{' '}
                  {NOMBRE_GOLPE[g.kind] ?? g.kind} sobre{' '}
                  <strong>{nombre(g.defenderUnit)}</strong>:{' '}
                  <strong>{n(g.casualties)} bajas</strong>
                  {' — '}
                  acierto {g.accuracy}, azar {g.randomFactor.toFixed(2)}, eficiencia{' '}
                  {g.efficiency}
                  {g.resistance !== 0 && `, resistencia ${g.resistance}%`}
                  {g.defensiveMultiplier !== 1 &&
                    `, habilidades ×${g.defensiveMultiplier.toFixed(2)}`}
                </li>
              ))}
          </ul>
        </section>
      ))}

      {batalla.log.length === 0 && (
        <section className="panel">
          <p className="aviso">
            Nadie llegó a golpear. Suele pasar cuando el atacante solo lleva unidades de melee y
            el defensor solo vuela: no hay a quién pegar.
          </p>
        </section>
      )}
    </>
  );
}
