/**
 * `/guerra`: contra quién se puede luchar y de qué manera.
 *
 * Tres reglas de presentación que esta pantalla tiene que cumplir
 * (docs/INTERFAZ.md):
 *
 *  - **Los tres ataques son tres decisiones**, no un desplegable. Cada uno
 *    dice qué se lleva y qué cuesta, porque elegir entre ellos *es* la
 *    decisión táctica.
 *  - **El coste se dice antes de pinchar.** Atacar cobra el upkeep de todo
 *    el ejército, y eso hunde a quien no lo sabía.
 *  - **La previsión va con un rango, no con un número.** El azar de cada
 *    golpe está entre 0,25 y 0,75: prometer una cifra exacta sería mentir,
 *    y el jugador la creería.
 */

import { useEffect, useState } from 'react';
import type { ActionInput, MageResponse } from '@archmage/contract';
import { type Target, fetchTargets } from '../api.js';

const ATAQUES = [
  {
    id: 'regular' as const,
    nombre: 'Ataque regular',
    que: 'Hasta el 5% de su tierra. Te quedas un tercio.',
    coste: 'Acierto 30.',
  },
  {
    id: 'siege' as const,
    nombre: 'Asedio',
    que: 'Hasta el 10% de su tierra. Te quedas un tercio.',
    coste: 'Acierto 20: pegas dos tercios de lo normal.',
  },
  {
    id: 'pillage' as const,
    nombre: 'Saqueo',
    que: 'Roba geld y población, quema hasta 100 acres. No quita tierra.',
    coste: 'Solo contra magos con al menos la mitad de tu net power.',
  },
];

export function Guerra({
  data,
  onAction,
  ocupado,
  onBatalla,
}: {
  data: MageResponse;
  onAction: (a: ActionInput) => Promise<void>;
  ocupado: boolean;
  onBatalla: (id: number) => void;
}) {
  const [objetivos, setObjetivos] = useState<Target[] | null>(null);
  const [elegido, setElegido] = useState<string | null>(null);

  useEffect(() => {
    void fetchTargets()
      .then(setObjetivos)
      .catch(() => setObjetivos([]));
  }, [data]);

  const miEjercito = data.mage.army.reduce((a, s) => a + s.count, 0);
  const upkeep = data.derived.upkeep.geld;
  const objetivo = objetivos?.find((o) => o.id === elegido) ?? null;

  const atacar = async (attackType: 'regular' | 'siege' | 'pillage') => {
    if (!elegido) return;
    await onAction({ type: 'attack', targetId: elegido, attackType });
    void fetchTargets().then(setObjetivos).catch(() => undefined);
  };

  return (
    <>
      <section className="panel">
        <h2 className="panel__titulo">Tu ejército</h2>
        {miEjercito === 0 ? (
          <p className="aviso">
            No tienes ejército. Recluta en el cuartel o invoca con magia antes de atacar.
          </p>
        ) : (
          <p className="recurso__nota">
            {miEjercito.toLocaleString('es-ES', { useGrouping: 'always' })} unidades.{' '}
            <strong>
              Atacar cuesta el mantenimiento de todas ellas:{' '}
              {upkeep.toLocaleString('es-ES', { useGrouping: 'always' })} de geld
            </strong>
            , y se cobra antes de resolver la batalla — ganar no te libra de pagarlo.
          </p>
        )}
      </section>

      <section className="panel">
        <h2 className="panel__titulo">A quién atacar</h2>
        {objetivos === null ? (
          <p className="recurso__nota">Buscando magos…</p>
        ) : objetivos.length === 0 ? (
          <p className="aviso">
            No hay nadie más en este servidor todavía. La guerra necesita a otro mago.
          </p>
        ) : (
          <ul className="lista">
            {objetivos.map((o) => (
              <li key={o.id}>
                <button
                  className="nav__enlace"
                  aria-current={elegido === o.id ? 'true' : undefined}
                  disabled={o.protected || ocupado}
                  onClick={() => setElegido(o.id)}
                >
                  {o.name} · {o.land.toLocaleString('es-ES', { useGrouping: 'always' })} acres ·
                  net power {o.netPower.toLocaleString('es-ES', { useGrouping: 'always' })}
                  {o.protected && ' · protegido'}
                  {!o.protected && o.tooWeak && ' · demasiado débil para saquear'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {objetivo && (
        <section className="panel">
          <h2 className="panel__titulo">Cómo atacar a {objetivo.name}</h2>

          {/* La previsión, **con rango**: el azar de cada golpe va de 0,25 a
              0,75, así que un número exacto sería mentira. */}
          <p className="recurso__nota">
            Previsión: entre <strong>un tercio y el doble</strong> del daño medio según cómo
            caiga el azar de cada ronda. Quien pierda menos porcentaje de ejército gana, y el
            defensor solo pierde tierra si pasa del 10% de bajas.
          </p>

          <ul className="lista">
            {ATAQUES.map((a) => {
              const bloqueado = a.id === 'pillage' && objetivo.tooWeak;
              return (
                <li key={a.id}>
                  <button
                    className="boton"
                    disabled={ocupado || miEjercito === 0 || bloqueado}
                    onClick={() => void atacar(a.id)}
                  >
                    {a.nombre}
                  </button>{' '}
                  <span className="recurso__nota">
                    {a.que} {a.coste}
                    {/* Se dice **por qué** no se puede, no se esconde. */}
                    {bloqueado && ' — no llega a la mitad de tu net power.'}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Historial onBatalla={onBatalla} data={data} />
    </>
  );
}

function Historial({
  data,
  onBatalla,
}: {
  data: MageResponse;
  onBatalla: (id: number) => void;
}) {
  const [filas, setFilas] = useState<Record<string, unknown>[]>([]);
  useEffect(() => {
    void fetch('/api/war/battles')
      .then((r) => (r.ok ? r.json() : { battles: [] }))
      .then((b: { battles: Record<string, unknown>[] }) => setFilas(b.battles))
      .catch(() => setFilas([]));
  }, [data]);

  if (filas.length === 0) return null;
  return (
    <section className="panel">
      <h2 className="panel__titulo">Batallas</h2>
      <ul className="lista">
        {filas.map((f) => (
          <li key={String(f.id)}>
            <button className="nav__enlace" onClick={() => onBatalla(Number(f.id))}>
              #{String(f.id)} · {String(f.attackType)} ·{' '}
              {f.attackerId === data.mage.id ? 'atacaste' : 'te atacaron'} ·{' '}
              {String(f.winner) === 'attacker' ? 'ganó el atacante' : 'ganó el defensor'} ·{' '}
              {String(f.landLost)} acres perdidos
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
