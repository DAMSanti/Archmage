/**
 * `/mercado`: el mercado negro.
 *
 * **Cuatro cosas que esta pantalla no puede callar** (docs/INTERFAZ.md §3.4),
 * y las cuatro duelen si se descubren después:
 *
 *  1. **Pujar cuesta un turno.** Va dicho antes del botón, como el coste de
 *     atacar. Es la diferencia entre una subasta y una tienda.
 *  2. **Una puja no se puede cancelar.**
 *  3. **El geld se cobra al pujar**, no al ganar, y vuelve si te superan.
 *  4. **Cuánto queda**, en tiempo real — el único sitio del juego donde el
 *     reloj manda sobre algo.
 *
 * Y cuando está vacío, **lo dice**: el mercado se llena solo con lo que
 * ponen los jugadores, así que estará vacío a menudo al principio de una
 * temporada. Un panel en blanco parece roto; uno que lo explica es
 * información.
 */

import { useEffect, useState } from 'react';
import type { MageResponse } from '@archmage/contract';
import { type Lot, fetchMarket, sendBid } from '../api.js';

const SECCIONES = [
  { id: 'antique', nombre: 'Anticuario', que: 'Items' },
  { id: 'tavern', nombre: 'Taberna de héroes', que: 'Héroes' },
  { id: 'mageware', nombre: 'Mercancía exótica', que: 'Hechizos' },
  { id: 'hatchery', nombre: 'Criadero', que: 'Unidades invocables' },
];

/** Lo que queda, en palabras. Se recalcula solo cada segundo. */
function useCuentaAtras(closesAt: number): string {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1_000);
    return () => clearInterval(t);
  }, []);
  const ms = closesAt - ahora;
  if (ms <= 0) return 'cerrando';
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}

function Fila({
  lot,
  onPujar,
  ocupado,
}: {
  lot: Lot;
  onPujar: (id: number, amount: number) => void;
  ocupado: boolean;
}) {
  const queda = useCuentaAtras(lot.closesAt);
  const n = (x: number) => x.toLocaleString('es-ES', { useGrouping: 'always' });

  const que =
    lot.content.kind === 'item'
      ? `${lot.content.count} × ${lot.content.itemId}`
      : lot.content.kind === 'hero'
        ? `Héroe de nivel ${lot.content.level}`
        : lot.content.kind === 'spell'
          ? `Hechizo: ${lot.content.spellId}`
          : `${lot.content.count} × ${lot.content.unitId}`;

  return (
    <li className="recurso__nota">
      <strong>{que}</strong> ·{' '}
      {lot.currentBid === null ? 'sin pujas' : `puja actual ${n(lot.currentBid)}`} · cierra en{' '}
      {queda}
      {lot.mine && ' · es tuyo'}
      {lot.winning && ' · vas ganando'}{' '}
      {!lot.mine && (
        <button className="boton" disabled={ocupado} onClick={() => onPujar(lot.id, lot.nextBid)}>
          Pujar {n(lot.nextBid)}
        </button>
      )}
    </li>
  );
}

export function Mercado({ data }: { data: MageResponse }) {
  const [lotes, setLotes] = useState<Lot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const recargar = () =>
    fetchMarket()
      .then(setLotes)
      .catch(() => setLotes([]));

  useEffect(() => {
    void recargar();
  }, [data]);

  const pujar = async (id: number, amount: number) => {
    setOcupado(true);
    try {
      await sendBid(id, amount);
      setError(null);
      await recargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'La puja no se pudo hacer.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <>
      <section className="panel">
        <h2 className="panel__titulo">Antes de pujar</h2>
        {/* Las cuatro cosas que no se pueden callar. */}
        <p className="recurso__nota">
          <strong>Pujar cuesta un turno</strong>, y el geld <strong>se cobra al pujar</strong>, no
          al ganar. Si te superan, te lo devuelven entero. Y{' '}
          <strong>una puja no se puede cancelar</strong>: hay que subir un 5% sobre la anterior, y
          el lote se adjudica 30 minutos después de la última puja.
        </p>
      </section>

      {error && <p className="error">{error}</p>}

      {lotes === null ? (
        <p className="recurso__nota">Cargando el mercado…</p>
      ) : lotes.length === 0 ? (
        <section className="panel">
          <h2 className="panel__titulo">El mercado</h2>
          {/* **Vacío no es roto.** */}
          <p className="aviso">
            No hay nada a la venta. El mercado se llena con lo que ponen los magos — pon tú el
            primer lote.
          </p>
        </section>
      ) : (
        SECCIONES.map((s) => {
          const suyos = lotes.filter((l) => l.section === s.id);
          if (suyos.length === 0) return null;
          return (
            <section className="panel" key={s.id}>
              <h2 className="panel__titulo">{s.nombre}</h2>
              <ul className="lista">
                {suyos.map((l) => (
                  <Fila key={l.id} lot={l} onPujar={pujar} ocupado={ocupado} />
                ))}
              </ul>
            </section>
          );
        })
      )}
    </>
  );
}
