/**
 * `/mensajes`: bandeja, directos y tablón de gremio.
 *
 * **Sin tiempo real**: se recarga al entrar, no hay aviso emergente y no
 * hay indicador de «escribiendo». Es correo, no chat
 * ([SISTEMAS.md §16](../../../docs/SISTEMAS.md)).
 *
 * **El bloqueo está en la conversación, a un clic**, y no escondido en una
 * configuración: el canal que abre la diplomacia abre también el acoso, y en
 * un juego de tres meses eso expulsa gente antes que cualquier
 * desequilibrio.
 */

import { useEffect, useState } from 'react';
import type { MageResponse } from '@archmage/contract';
import { type MessagesInfo, bloquear, enviarMensaje, fetchMessages } from '../api.js';

export function Mensajes({ data }: { data: MageResponse }) {
  const [info, setInfo] = useState<MessagesInfo | null>(null);
  const [destino, setDestino] = useState('');
  const [texto, setTexto] = useState('');
  const [alGremio, setAlGremio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recargar = () =>
    fetchMessages()
      .then(setInfo)
      .catch(() => setInfo({ inbox: [], board: [] }));

  useEffect(() => {
    void recargar();
  }, [data]);

  const enviar = async () => {
    try {
      await enviarMensaje(alGremio ? { toGuild: true, body: texto } : { toId: destino, body: texto });
      setTexto('');
      setError(null);
      await recargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar.');
    }
  };

  if (!info) return <p className="recurso__nota">Cargando los mensajes…</p>;

  return (
    <>
      <section className="panel">
        <h2 className="panel__titulo">Escribir</h2>
        {error && <p className="error">{error}</p>}
        <p className="recurso__nota">
          <label>
            <input type="checkbox" checked={alGremio} onChange={(e) => setAlGremio(e.target.checked)} />{' '}
            Al tablón de mi gremio
          </label>
        </p>
        {!alGremio && (
          <p className="recurso__nota">
            <label>
              Para{' '}
              <input value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="id del mago" />
            </label>
          </p>
        )}
        <p className="recurso__nota">
          <label>
            Mensaje <input value={texto} onChange={(e) => setTexto(e.target.value)} />
          </label>
        </p>
        <button className="boton" disabled={texto.trim().length === 0} onClick={() => void enviar()}>
          Enviar
        </button>
      </section>

      <section className="panel">
        <h2 className="panel__titulo">Bandeja</h2>
        {info.inbox.length === 0 ? (
          <p className="aviso">No tienes mensajes.</p>
        ) : (
          <ul className="lista">
            {info.inbox.map((m) => (
              <li key={m.id} className="recurso__nota">
                <strong>{m.fromId}</strong>: {m.body}{' '}
                {/* **El bloqueo, a un clic y en la conversación.** */}
                <button className="nav__enlace" onClick={() => void bloquear(m.fromId).then(recargar)}>
                  bloquear
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h2 className="panel__titulo">Tablón del gremio</h2>
        {info.board.length === 0 ? (
          <p className="aviso">Nada en el tablón. Solo lo leen los miembros del gremio.</p>
        ) : (
          <ul className="lista">
            {info.board.map((m) => (
              <li key={m.id} className="recurso__nota">
                <strong>{m.fromId}</strong>: {m.body}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
