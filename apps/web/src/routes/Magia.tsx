/**
 * `/magia` — el libro, la investigación, el lanzamiento y los encantamientos.
 *
 * docs/INTERFAZ.md §3.1. Lo que esta pantalla resuelve:
 *
 *  - **Qué puedo investigar y qué no.** La rueda decide, y el jugador no
 *    debería memorizarla: el libro enseña solo lo que le toca, y dice por qué
 *    cuando algo le sale caro.
 *  - **Cuánto me cuesta a MÍ.** El recargo fuera de color multiplica hasta por
 *    seis, así que se enseña el precio que pagaría él. Enseñar 30.000 cuando
 *    va a pagar 180.000 sería mentir. El servidor lo manda ya resuelto.
 *  - **Qué tengo encantado y qué me cuesta.**
 *  - **Cuánto falta**, contado en turnos y no en minutos.
 *
 * **Y lo que no hace** (§1, §3.1): no recomienda qué investigar, no ordena el
 * libro por «lo mejor primero», y no avisa de que un hechizo es mala compra.
 */

import { useState } from 'react';
import { IconoEscuela } from '../components/IconoEscuela.js';
import type { ActionInput, MageResponse } from '@archmage/contract';
import { num, plural } from '../tokens.js';

type Entrada = MageResponse['derived']['spellbook'][number];

const RANGO: Record<Entrada['rank'], string> = {
  simple: 'Simple',
  average: 'Average',
  complex: 'Complex',
  ultimate: 'Ultimate',
  ancient: 'Ancient',
};

const ESCUELA: Record<string, string> = {
  ascendant: 'Ascendant',
  verdant: 'Verdant',
  eradication: 'Eradication',
  phantasm: 'Phantasm',
  nether: 'Nether',
  plain: 'Plain',
};

const EFECTO: Record<Entrada['effectKind'], string> = {
  summon: 'invoca unidades',
  enchantment: 'encantamiento',
  resource: 'recursos',
  combat: 'de batalla',
};

/** El orden es el del catálogo, no «lo mejor primero» (§3.1). */
const ORDEN_RANGO: Entrada['rank'][] = ['simple', 'average', 'complex', 'ultimate', 'ancient'];

export interface MagiaProps {
  data: MageResponse;
  onAction: (a: ActionInput) => void | Promise<void>;
  ocupado: boolean;
}

export function Magia({ data, onAction, ocupado }: MagiaProps) {
  const { mage, derived } = data;
  const [turnos, setTurnos] = useState(5);
  const [filtro, setFiltro] = useState<'todos' | 'sabidos' | 'investigables'>('todos');

  const libro = derived.spellbook.filter((e) =>
    filtro === 'sabidos' ? e.known : filtro === 'investigables' ? e.researchable : true,
  );
  const porRango = ORDEN_RANGO.map((r) => [r, libro.filter((e) => e.rank === r)] as const).filter(
    ([, xs]) => xs.length > 0,
  );

  const investigando = mage.spellbook.researching;
  const investigandoSpell = investigando
    ? derived.spellbook.find((e) => e.id === investigando.spellId)
    : undefined;
  const lanzando = mage.casting;
  const lanzandoSpell = lanzando
    ? derived.spellbook.find((e) => e.id === lanzando.spellId)
    : undefined;

  return (
    <>
      <section className="panel">
        <h2 className="panel__titulo">El mago</h2>
        <div className="recursos">
          <div className="recurso">
            <div className="recurso__nombre">Escuela</div>
            {/* El icono acompaña al nombre, no lo sustituye: si no está
                generado, el nombre sigue diciendo cuál es (ASSETS §3). */}
            <div className="recurso__valor recurso__valor--conicono">
              <IconoEscuela escuela={mage.specialty} tam={64} />
              {ESCUELA[mage.specialty] ?? mage.specialty}
            </div>
            <div className="recurso__nota">no cambia durante la temporada</div>
          </div>
          <div className="recurso">
            <div className="recurso__nombre">Nivel de hechizo</div>
            <div className="recurso__valor cifra">{num(mage.spellbook.level)}</div>
            <div className="recurso__nota">de {num(derived.maxSpellLevel)} posibles</div>
          </div>
          <div className="recurso">
            <div className="recurso__nombre">Hechizos sabidos</div>
            <div className="recurso__valor cifra">{num(mage.spellbook.known.length)}</div>
          </div>
          <div className="recurso">
            <div className="recurso__nombre">Maná</div>
            <div className="recurso__valor cifra">{num(mage.resources.mana)}</div>
            <div className="recurso__nota">almacén {num(derived.manaStorage)}</div>
          </div>
        </div>
      </section>

      {(investigando || lanzando) && (
        <section className="panel">
          <h2 className="panel__titulo">En curso</h2>
          {investigando && investigandoSpell && (
            <div className="confirmacion">
              <div className="confirmacion__linea">
                <strong>Investigando {investigandoSpell.name}</strong> —{' '}
                <span className="cifra">
                  {num(investigando.progress)} de {num(investigandoSpell.researchCost)}
                </span>
              </div>
              <div className="confirmacion__linea recurso__nota">
                Avanza sola al gastar turnos, y el doble si le dedicas el turno.
              </div>
            </div>
          )}
          {lanzando && lanzandoSpell && (
            <div className="confirmacion">
              <div className="confirmacion__linea">
                <strong>Lanzando {lanzandoSpell.name}</strong> — quedan{' '}
                <span className="cifra">{plural(lanzando.turnsRemaining, 'turno')}</span>
              </div>
              <div className="confirmacion__linea recurso__nota">
                El maná ya está pagado: abandonarlo no lo devuelve.
              </div>
            </div>
          )}
        </section>
      )}

      <section className="panel">
        <h2 className="panel__titulo">Encantamientos activos</h2>
        {mage.enchantments.length === 0 ? (
          <p className="recurso__nota">Ninguno. Los encantamientos cuestan maná cada turno.</p>
        ) : (
          <table className="reparto">
            <thead>
              <tr>
                <th>Hechizo</th>
                <th>Upkeep</th>
                <th>Efecto</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {mage.enchantments.map((e) => {
                const spell = derived.spellbook.find((x) => x.id === e.spellId);
                return (
                  <tr key={e.spellId}>
                    <td data-etiqueta="Hechizo" className="reparto__nombre">
                      {spell?.name ?? e.spellId}
                    </td>
                    <td data-etiqueta="Upkeep" className="cifra">
                      {num(e.upkeepMana)} maná/turno
                    </td>
                    <td data-etiqueta="Efecto" className="cifra">
                      {Object.entries(e.modifiers)
                        .map(([k, v]) => `${k} ${v > 100 ? '+' : ''}${v - 100} %`)
                        .join(' · ')}
                    </td>
                    <td>
                      <button
                        className="boton"
                        disabled={ocupado}
                        onClick={() => onAction({ type: 'dispel', spellId: e.spellId })}
                      >
                        Disipar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <h2 className="panel__titulo">Libro de hechizos</h2>
        <div className="control">
          <label htmlFor="filtro">Ver</label>
          <select id="filtro" value={filtro} onChange={(e) => setFiltro(e.target.value as typeof filtro)}>
            <option value="todos">Todos</option>
            <option value="sabidos">Los que sé</option>
            <option value="investigables">Los que puedo investigar</option>
          </select>
          <span className="control__grupo">
            <label htmlFor="turnos-magia">turnos por acción</label>
            <input
              id="turnos-magia"
              type="number"
              min={1}
              max={mage.turns.current || 1}
              value={turnos}
              onChange={(e) => setTurnos(Math.max(1, Number(e.target.value)))}
            />
          </span>
        </div>

        {porRango.map(([rango, entradas]) => (
          <div key={rango} style={{ marginTop: 14 }}>
            <h3 className="panel__titulo" style={{ marginBottom: 6 }}>
              {RANGO[rango]}
            </h3>
            <table className="reparto">
              <thead>
                <tr>
                  <th>Hechizo</th>
                  <th>Escuela</th>
                  <th>Lanzar</th>
                  <th>Investigar</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {entradas.map((e) => (
                  <tr key={e.id}>
                    <td data-etiqueta="Hechizo" className="reparto__nombre">
                      {e.name}
                      <span className="recurso__nota"> · {EFECTO[e.effectKind]}</span>
                    </td>
                    <td data-etiqueta="Escuela" className="recurso__nota">
                      {/* docs/INTERFAZ.md §6.3: el icono va donde se habla
                          de una escuela, y «iconos de hechizo» es esto. A
                          20px porque acompaña al nombre, que sigue ahí: el
                          icono es redundancia, no el único indicador. */}
                      <IconoEscuela escuela={e.school} tam={20} />
                      {ESCUELA[e.school] ?? e.school}
                      {e.relation !== 'own' && (
                        <>
                          {' '}
                          ({e.relation === 'adjacent' ? 'adyacente' : 'opuesta'})
                          {e.failureChance > 0 && (
                            <>
                              {' · '}
                              <span className="cifra">{e.failureChance} %</span> de fallo
                            </>
                          )}
                        </>
                      )}
                    </td>
                    {/* El precio que pagaría ÉL, con el recargo ya aplicado. */}
                    <td data-etiqueta="Lanzar" className="cifra">
                      {e.castMana === null
                        ? '—'
                        : `${num(e.castMana)} maná${e.castTurns > 0 ? ` · ${plural(e.castTurns, 'turno')}` : ''}`}
                      {e.upkeepMana > 0 && (
                        <div className="recurso__nota">+{num(e.upkeepMana)} maná/turno</div>
                      )}
                    </td>
                    <td data-etiqueta="Investigar" className="cifra">
                      {e.known ? '—' : num(e.researchCost)}
                    </td>
                    <td>
                      {e.known ? (
                        e.castable ? (
                          <button
                            className="boton"
                            disabled={
                              ocupado ||
                              mage.turns.current < turnos ||
                              (lanzando !== null && lanzando.spellId !== e.id)
                            }
                            onClick={() => onAction({ type: 'cast', spellId: e.id, turns: turnos })}
                          >
                            Lanzar
                          </button>
                        ) : (
                          <span className="recurso__nota">necesita una batalla</span>
                        )
                      ) : (
                        <button
                          className="boton"
                          disabled={ocupado || mage.turns.current < turnos}
                          onClick={() => onAction({ type: 'research', spellId: e.id, turns: turnos })}
                        >
                          Investigar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>
    </>
  );
}
