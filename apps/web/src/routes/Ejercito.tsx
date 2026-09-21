/**
 * `/ejercito` — stacks, reclutamiento y upkeep total.
 *
 * docs/INTERFAZ.md §2. En la fase 1 solo hay tropa básica de barracks: las
 * unidades invocadas llegan con la magia (fase 2) y sus números de combate
 * con la guerra (fase 3), así que aquí **no se enseña ataque ni defensa**
 * — no existen, y fingir un cero sería mentir.
 */

import { useState } from 'react';
import type { ActionInput, CatalogResponse, MageResponse } from '@archmage/contract';
import { conSigno, num } from '../tokens.js';

export interface EjercitoProps {
  data: MageResponse;
  catalog: CatalogResponse;
  onAction: (a: ActionInput) => void | Promise<void>;
  ocupado: boolean;
}

export function Ejercito({ data, catalog, onAction, ocupado }: EjercitoProps) {
  const { mage, derived } = data;
  const unidades = Object.values(catalog.units);
  const [unidad, setUnidad] = useState(unidades[0]?.id ?? 'militia');
  const [cuantas, setCuantas] = useState(100);

  const spec = catalog.units[unidad];
  const coste = (spec?.cost ?? 0) * cuantas;
  const porTurno = Math.max(1, mage.buildings.barracks * (spec?.recruitPerBarracks ?? 1));
  const espacioUsado = mage.army.reduce(
    (t, s) => t + s.count * (catalog.units[s.unitId]?.populationSpace ?? 1),
    0,
  );
  const sinGeld = mage.resources.geld < coste;

  return (
    <>
      <section className="panel">
        <h2 className="panel__titulo">Ejército</h2>
        {mage.army.length === 0 ? (
          <p className="recurso__nota">No tienes tropas. Reclútalas abajo.</p>
        ) : (
          <table className="reparto">
            <thead>
              <tr>
                <th>Unidad</th>
                <th>Cantidad</th>
                <th>Upkeep geld</th>
                <th>Espacio</th>
              </tr>
            </thead>
            <tbody>
              {mage.army.map((s) => {
                const u = catalog.units[s.unitId];
                return (
                  <tr key={s.unitId}>
                    <td data-etiqueta="Unidad">{u?.name ?? s.unitId}</td>
                    <td data-etiqueta="Cantidad" className="cifra">
                      {num(s.count)}
                    </td>
                    <td data-etiqueta="Upkeep geld" className="cifra">
                      {num(s.count * (u?.upkeepGeld ?? 0))}
                    </td>
                    <td data-etiqueta="Espacio" className="cifra">
                      {num(s.count * (u?.populationSpace ?? 1))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <h2 className="panel__titulo">Lo que cuesta mantenerlo</h2>
        <div className="recursos">
          <div className="recurso">
            <div className="recurso__nombre">Upkeep total</div>
            <div className="recurso__valor cifra">{num(derived.upkeep.geld)}</div>
            <div className="recurso__nota">geld por turno, edificios incluidos</div>
          </div>
          <div className="recurso">
            <div className="recurso__nombre">Ingreso neto</div>
            <div
              className={`recurso__valor cifra ${
                derived.net.geld >= 0 ? 'neto--positivo' : 'neto--negativo'
              }`}
            >
              {conSigno(derived.net.geld)}
            </div>
            <div className="recurso__nota">geld por turno</div>
          </div>
          <div className="recurso">
            <div className="recurso__nombre">Espacio ocupado</div>
            <div className="recurso__valor cifra">{num(espacioUsado)}</div>
            <div className="recurso__nota">de {num(derived.populationCapacity.capacity)}</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__titulo">Reclutar</h2>
        {mage.recruiting && (
          <p className="aviso">
            Ya estás reclutando {catalog.units[mage.recruiting.unitId]?.name ?? mage.recruiting.unitId}:
            quedan {num(mage.recruiting.remaining)}, a {num(mage.recruiting.perTurn)} por turno. Solo
            se recluta un tipo a la vez.
          </p>
        )}
        <div className="control">
          <label htmlFor="unidad">Unidad</label>
          <select id="unidad" value={unidad} onChange={(e) => setUnidad(e.target.value)}>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — {num(u.cost)} geld, {num(u.upkeepGeld)} de upkeep
              </option>
            ))}
          </select>
          <span className="control__grupo">
            <label htmlFor="cuantas">cuántas</label>
            <input
              id="cuantas"
              type="number"
              min={1}
              value={cuantas}
              onChange={(e) => setCuantas(Math.max(1, Number(e.target.value)))}
            />
          </span>
        </div>

        <div className="confirmacion">
          <div className="confirmacion__linea">
            Cuesta <strong className="cifra">{num(coste)}</strong> de geld, que se cobra al fijarlo.
          </div>
          <div className="confirmacion__linea">
            <strong>No gasta turnos</strong>, pero la tropa llega a {num(porTurno)} por turno gastado:
            unos {num(Math.ceil(cuantas / porTurno))} turnos con tus {num(mage.buildings.barracks)}{' '}
            barracks.
          </div>
          <div className="confirmacion__linea">
            Subirá tu upkeep en {num(cuantas * (spec?.upkeepGeld ?? 0))} de geld por turno.
          </div>
          {sinGeld && <div className="confirmacion__linea">No tienes geld suficiente.</div>}
        </div>

        <button
          className="boton"
          style={{ marginTop: 10 }}
          disabled={ocupado || sinGeld}
          onClick={() => onAction({ type: 'setRecruit', unitId: unidad, count: cuantas })}
        >
          Fijar reclutamiento
        </button>
      </section>
    </>
  );
}
