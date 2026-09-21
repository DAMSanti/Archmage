/**
 * `/reino` — la pantalla principal.
 *
 * docs/INTERFAZ.md §3. Tiene que responder de un vistazo, sin abrir nada:
 * cuántos turnos tengo, qué tengo de cada recurso y cuál es mi **ingreso
 * neto**, cómo está repartida mi tierra, y qué se está construyendo.
 *
 * **Y lo que NO hace** (§1): no calcula tu óptimo, no marca umbrales en el
 * reparto, no recomienda repartos. La interfaz contesta «¿cómo estoy?», no
 * «¿qué debería hacer?». Si alguna vez aparece aquí un «bajar a 55,99% de
 * nodes te daría +X maná», se ha roto la decisión de diseño del 2026-09-21.
 */

import { useState } from 'react';
import { Escena } from '../components/Escena.js';
import { BUILDINGS } from '@archmage/core';
import type { Building } from '@archmage/core';
import type { ActionInput, CatalogResponse, MageResponse } from '@archmage/contract';
import { conSigno, num, pct, plural } from '../tokens.js';

const NOMBRE: Record<Building, string> = {
  farms: 'Farms',
  towns: 'Towns',
  nodes: 'Nodes',
  workshops: 'Workshops',
  barracks: 'Barracks',
  guilds: 'Guilds',
  forts: 'Fortresses',
  barriers: 'Barriers',
};

function Neto({ valor }: { valor: number }) {
  const clase = valor > 0 ? 'neto--positivo' : valor < 0 ? 'neto--negativo' : 'neto--cero';
  // El signo va en el texto, no solo en el color (§4): hay daltónicos
  // jugando, y aquí rojo y verde ya significan Eradication y Verdant.
  const flecha = valor > 0 ? '▲' : valor < 0 ? '▼' : '=';
  return (
    <div className={`recurso__neto ${clase}`}>
      {flecha} {conSigno(valor)} / turno
    </div>
  );
}

export interface ReinoProps {
  data: MageResponse;
  catalog: CatalogResponse;
  onAction: (a: ActionInput) => void | Promise<void>;
  ocupado: boolean;
  /** Adonde lleva tocar una pieza de la escena. Atajo, nunca unica puerta. */
  onIr: (pantalla: string) => void;
}

export function Reino({ data, catalog, onAction, ocupado, onIr }: ReinoProps) {
  const { mage, derived, server } = data;
  const [edificio, setEdificio] = useState<Building>('farms');
  const [turnosConstruir, setTurnosConstruir] = useState(1);
  const [turnosExplorar, setTurnosExplorar] = useState(1);

  const costeUnidad = catalog.buildings[edificio]?.cost ?? 0;
  const sinTierra = mage.land.free <= 0;
  const exploracionAgotada = mage.land.total >= 3_500;

  return (
    <>
      {/* Que el almacén esté lleno es un aviso: estás desperdiciando (§3). */}
      {derived.turnsAtCap && (
        <p className="aviso">
          Tienes el almacén de turnos lleno ({num(mage.turns.current)} de {num(server.turnCap)}). Todo
          lo que el reloj produzca a partir de ahora se pierde.
        </p>
      )}

      {/* Un número que va a ponerse en rojo se ve venir (§1). */}
      {derived.net.geld < 0 && (
        <p className="error">
          Tu ingreso neto de geld es negativo ({conSigno(derived.net.geld)} por turno). Si llega a
          cero, las unidades desertan, se pierden edificios y los forts caen a la mitad cada turno.
        </p>
      )}
      {derived.net.mana < 0 && (
        <p className="error">
          Tu ingreso neto de maná es negativo ({conSigno(derived.net.mana)} por turno). Si llega a
          cero, se disuelven stacks y se deshacen las barriers.
        </p>
      )}

      {/* **La escena va antes de los numeros, no en su lugar** (§6.5): dice
          QUE has construido de un vistazo, y el desglose sigue debajo. En
          movil no aparece, y lo decide el CSS (§5). */}
      <Escena buildings={mage.buildings} onIr={onIr} />

      <section className="panel">
        <h2 className="panel__titulo">Recursos</h2>
        <div className="recursos">
          <div className="recurso">
            <div className="recurso__nombre">Turnos</div>
            <div className="recurso__valor cifra">
              {num(mage.turns.current)} <span className="recurso__nota">/ {num(server.turnCap)}</span>
            </div>
            <div className="recurso__nota">
              {derived.turnsAtCap
                ? 'almacén lleno'
                : `siguiente en ${Math.ceil(derived.msToNextTurn / 60_000)} min`}
            </div>
          </div>

          <div className="recurso">
            <div className="recurso__nombre">Geld</div>
            <div className="recurso__valor cifra">{num(mage.resources.geld)}</div>
            <Neto valor={derived.net.geld} />
          </div>

          <div className="recurso">
            <div className="recurso__nombre">Maná</div>
            <div className="recurso__valor cifra">{num(mage.resources.mana)}</div>
            <Neto valor={derived.net.mana} />
            <div className="recurso__nota">
              almacén {num(derived.manaStorage)}
              {/* El upkeep de los encantamientos va aquí, no escondido en
                  /magia: es donde un mago se arruina sin darse cuenta
                  (docs/INTERFAZ.md §3.1). */}
              {mage.enchantments.length > 0 && (
                <>
                  {' · '}
                  {mage.enchantments.length} encantamiento
                  {mage.enchantments.length === 1 ? '' : 's'}
                </>
              )}
            </div>
          </div>

          <div className="recurso">
            <div className="recurso__nombre">Población</div>
            <div className="recurso__valor cifra">{num(mage.resources.population)}</div>
            <Neto valor={derived.net.population} />
            <div className="recurso__nota">
              espacio {num(derived.populationCapacity.space)} · comida{' '}
              {num(derived.populationCapacity.food)}
            </div>
          </div>

          <div className="recurso">
            <div className="recurso__nombre">Tierra</div>
            <div className="recurso__valor cifra">{num(mage.land.total)}</div>
            <div className="recurso__nota">{num(mage.land.free)} acres sin construir</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__titulo">Reparto de la tierra</h2>
        <table className="reparto">
          <thead>
            <tr>
              <th>Edificio</th>
              <th>Cantidad</th>
              <th>% de tu tierra</th>
              <th>En obra</th>
            </tr>
          </thead>
          <tbody>
            {BUILDINGS.map((b) => (
              <tr key={b}>
                <td data-etiqueta="Edificio" className="reparto__nombre">
                  {NOMBRE[b]}
                </td>
                <td data-etiqueta="Cantidad" className="cifra">
                  {num(mage.buildings[b])}
                </td>
                {/* Porcentaje y absoluto juntos. Sin umbrales marcados (§1). */}
                <td data-etiqueta="% de tu tierra" className="cifra">
                  {pct(mage.buildings[b], mage.land.total)}
                </td>
                <td
                  data-etiqueta="En obra"
                  className={`cifra${mage.construction[b] === 0 ? ' reparto__vacio' : ''}`}
                >
                  {(mage.construction[b] / 10_000).toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
            <tr className="reparto__libre">
              <td data-etiqueta="Edificio" className="reparto__nombre">
                Sin construir
              </td>
              <td data-etiqueta="Cantidad" className="cifra">
                {num(mage.land.free)}
              </td>
              <td data-etiqueta="% de tu tierra" className="cifra">
                {pct(mage.land.free, mage.land.total)}
              </td>
              <td data-etiqueta="En obra">—</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2 className="panel__titulo">Gastar turnos</h2>
        <div className="acciones">
          <div className="accion">
            <div className="control">
              <label htmlFor="edificio">Construir</label>
              <select
                id="edificio"
                value={edificio}
                onChange={(e) => setEdificio(e.target.value as Building)}
              >
                {BUILDINGS.map((b) => (
                  <option key={b} value={b}>
                    {NOMBRE[b]} — {num(catalog.buildings[b]?.cost ?? 0)} geld
                  </option>
                ))}
              </select>
              <span className="control__grupo">
                <label htmlFor="turnos-construir">{turnosConstruir === 1 ? 'turno' : 'turnos'}</label>
                <input
                  id="turnos-construir"
                  type="number"
                  min={1}
                  max={mage.turns.current || 1}
                  value={turnosConstruir}
                  onChange={(e) => setTurnosConstruir(Math.max(1, Number(e.target.value)))}
                />
              </span>
            </div>
            {/* Se dice qué cuesta lo que has pedido. No es una recomendación (§1). */}
            <div className="confirmacion">
              <div className="confirmacion__linea">
                Gasta <strong>{plural(turnosConstruir, 'turno')}</strong>.
              </div>
              <div className="confirmacion__linea">
                Cada {NOMBRE[edificio]} cuesta {num(costeUnidad)} de geld y un acre libre.
              </div>
              {sinTierra && <div className="confirmacion__linea">No te queda tierra sin construir.</div>}
            </div>
            <div className="accion__botones">
            <button
              className="boton"
              disabled={ocupado || mage.turns.current < turnosConstruir}
              onClick={() => onAction({ type: 'build', building: edificio, turns: turnosConstruir })}
            >
              Construir
            </button>{' '}
            <button
              className="boton"
              disabled={ocupado || mage.turns.current < turnosConstruir || mage.buildings[edificio] === 0}
              onClick={() => onAction({ type: 'demolish', building: edificio, turns: turnosConstruir })}
            >
              Demoler
            </button>
            </div>
          </div>

          <div className="accion">
            <div className="control">
              <span className="control__grupo">
                <label htmlFor="turnos-explorar">Explorar</label>
                <input
                  id="turnos-explorar"
                  type="number"
                  min={1}
                  max={mage.turns.current || 1}
                  value={turnosExplorar}
                  onChange={(e) => setTurnosExplorar(Math.max(1, Number(e.target.value)))}
                />
                <span className="recurso__nota">{turnosExplorar === 1 ? 'turno' : 'turnos'}</span>
              </span>
            </div>
            <div className="confirmacion">
              <div className="confirmacion__linea">
                {exploracionAgotada
                  ? 'Ya no queda tierra que explorar. A partir de aquí se crece atacando.'
                  : 'Explorar rinde menos cuanto más grande eres.'}
              </div>
            </div>
            <div className="accion__botones">
              <button
                className="boton"
                disabled={ocupado || exploracionAgotada || mage.turns.current < turnosExplorar}
                onClick={() => onAction({ type: 'explore', turns: turnosExplorar })}
              >
                Explorar
              </button>
            </div>
          </div>

          <div className="accion">
            <div className="confirmacion">
              <div className="confirmacion__linea">
                Cargar duplica lo que producirías ese turno, y solo ese turno.
              </div>
            </div>
            <div className="accion__botones">
              <button
                className="boton"
                disabled={ocupado || mage.turns.current < 1}
                onClick={() => onAction({ type: 'chargeMana', turns: 1 })}
              >
                Cargar maná
              </button>
              <button
                className="boton"
                disabled={ocupado || mage.turns.current < 1}
                onClick={() => onAction({ type: 'chargeGeld', turns: 1 })}
              >
                Cargar geld
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
