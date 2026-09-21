/**
 * El armazón: carga el estado, reparte las pantallas y manda las acciones.
 *
 * **Toda la aritmética viene del servidor** en `derived`
 * (docs/SPECS.md §6): el cliente no recalcula ingresos ni topes. Si algún día
 * hace falta un número que no esté ahí, la función falta en `packages/core`,
 * no aquí (docs/INTERFAZ.md §1).
 *
 * Fuera de alcance en la fase 1: enrutado de verdad. Con cuatro pantallas y
 * sin enlaces profundos, un `useState` basta y no añade una dependencia.
 */

import { useCallback, useEffect, useState } from 'react';
import type { ActionInput, CatalogResponse, MageResponse } from '@archmage/contract';
import { DomainError, fetchCatalog, fetchChronicle, fetchMage, sendAction } from './api.js';
import type { ChronicleRow } from './api.js';
import { Reino } from './routes/Reino.js';
import { Ejercito } from './routes/Ejercito.js';
import { Cronica } from './routes/Cronica.js';
import { Magia } from './routes/Magia.js';
import { Guerra } from './routes/Guerra.js';
import { Batalla } from './routes/Batalla.js';
import { Mercado } from './routes/Mercado.js';
import { Ranking } from './routes/Ranking.js';
import { Habilidades } from './routes/Habilidades.js';
import { Portal } from './routes/Portal.js';
import { Gremio } from './routes/Gremio.js';
import { Mensajes } from './routes/Mensajes.js';
import { Temporada } from './routes/Temporada.js';
import { Marco, type Entrada } from './components/Marco.js';

type Pantalla =
  | 'reino'
  | 'ejercito'
  | 'magia'
  | 'guerra'
  | 'mercado'
  | 'ranking'
  | 'habilidades'
  | 'gremio'
  | 'mensajes'
  | 'temporada'
  | 'cronica';

/**
 * **Las seis sueltas de la barra.** docs/INTERFAZ.md §6.9, cerrado el
 * 2026-09-22.
 *
 * La cuenta manda: descontando el portal y `/batalla/:id`, quedan once
 * entradas posibles, y a 44px de zona de toque son 484px contra los 360 de
 * la pantalla de referencia. No caben. Siete son 308: caben, y son el tope.
 *
 * `/reino` porque es donde se pasa el tiempo; `/cronica` porque es donde uno
 * se entera de que le han atacado, y esconder las malas noticias detrás de
 * un menú sería justo lo contrario de lo que hace falta; `/mensajes` porque
 * **es lo único del menú que otra persona puede hacerte llegar** — el resto
 * se consulta cuando uno quiere, y un mensaje te espera.
 */
const SUELTAS: readonly Entrada[] = [
  { id: 'reino', nombre: 'Reino' },
  { id: 'ejercito', nombre: 'Ejército' },
  { id: 'magia', nombre: 'Magia' },
  { id: 'guerra', nombre: 'Guerra' },
  { id: 'cronica', nombre: 'Crónica' },
  { id: 'mensajes', nombre: 'Mensajes' },
];

/** Las cinco de «Más»: las que se miran cuando uno quiere. */
const AGRUPADAS: readonly Entrada[] = [
  { id: 'mercado', nombre: 'Mercado' },
  { id: 'ranking', nombre: 'Ranking' },
  { id: 'habilidades', nombre: 'Habilidades' },
  { id: 'gremio', nombre: 'Gremio' },
  { id: 'temporada', nombre: 'Temporada' },
];

export function App() {
  const [pantalla, setPantalla] = useState<Pantalla>('reino');
  // Qué batalla se está mirando. `null` = ninguna, y manda `pantalla`.
  const [batalla, setBatalla] = useState<number | null>(null);
  /** Sin sesión o sin mago: se enseña el portal, no un error. */
  const [sinMago, setSinMago] = useState(false);
  const [data, setData] = useState<MageResponse | null>(null);
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [cronica, setCronica] = useState<ChronicleRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const recargar = useCallback(async () => {
    try {
      const c = await fetchCatalog();
      setCatalog(c);
      const m = await fetchMage();
      setData(m);
      setSinMago(false);
      setError(null);
    } catch (e) {
      // **Sin sesión o sin mago no es un error, es el primer día.** Se manda
      // al portal en vez de enseñar un mensaje rojo que no se puede
      // resolver desde donde está (docs/INTERFAZ.md §1).
      const code = e instanceof DomainError ? e.code : '';
      if (code === 'sin_sesion' || code === 'sin_mago' || code === 'http_401' || code === 'http_404') {
        setSinMago(true);
        setError(null);
        return;
      }
      setError(e instanceof Error ? e.message : 'No se pudo cargar el reino.');
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  useEffect(() => {
    if (pantalla !== 'cronica') return;
    void fetchChronicle().then(setCronica).catch(() => setCronica([]));
  }, [pantalla, data]);

  const onAction = useCallback(async (a: ActionInput) => {
    setOcupado(true);
    try {
      const res = await sendAction(a);
      setData({ mage: res.mage, derived: res.derived, server: res.server });
      // Tras atacar, a ver qué pasó: el resultado **es** el contenido de la
      // acción, y esconderlo detrás de un clic más sería raro.
      if (res.battleId !== undefined) setBatalla(res.battleId);
      setError(null);
    } catch (e) {
      // Un 422 es juego, no avería: se enseña tal cual lo dijo el servidor.
      setError(e instanceof DomainError ? e.message : 'La acción no se pudo completar.');
    } finally {
      setOcupado(false);
    }
  }, []);

  return (
    <>
      {/* Marcador de posición: los assets llegan en la tarea 22, y la
          interfaz tiene que funcionar entera sin ninguno (INTERFAZ §6.7). */}
      <div className="escena escena--marcador" aria-hidden="true" />

      {/* **El marco solo existe si hay mago.** Sin sesión se está en el
          portal, y una barra de recursos vacía sobre un formulario de
          entrada no informa de nada. */}
      {data && (
        <Marco
          data={data}
          sueltas={SUELTAS}
          agrupadas={AGRUPADAS}
          pantalla={pantalla}
          onIr={(id) => {
            setPantalla(id as Pantalla);
            setBatalla(null);
          }}
        />
      )}

      <div className={data ? 'envoltorio envoltorio--marco' : 'envoltorio'}>
        <main>
          {error && <p className="error">{error}</p>}

          {sinMago ? (
            <Portal onListo={() => void recargar()} />
          ) : !data || !catalog ? (
            <p className="recurso__nota">Cargando el reino…</p>
          ) : pantalla === 'reino' ? (
            <Reino
              data={data}
              catalog={catalog}
              onAction={onAction}
              ocupado={ocupado}
              onIr={(id) => setPantalla(id as Pantalla)}
            />
          ) : pantalla === 'ejercito' ? (
            <Ejercito data={data} catalog={catalog} onAction={onAction} ocupado={ocupado} />
          ) : pantalla === 'magia' ? (
            <Magia data={data} onAction={onAction} ocupado={ocupado} />
          ) : pantalla === 'gremio' ? (
            <Gremio data={data} />
          ) : pantalla === 'mensajes' ? (
            <Mensajes data={data} />
          ) : pantalla === 'temporada' ? (
            <Temporada data={data} />
          ) : pantalla === 'mercado' ? (
            <Mercado data={data} />
          ) : pantalla === 'ranking' ? (
            <Ranking data={data} />
          ) : pantalla === 'habilidades' ? (
            <Habilidades data={data} catalog={catalog} />
          ) : pantalla === 'guerra' ? (
            batalla !== null ? (
              <Batalla id={batalla} catalog={catalog} onVolver={() => setBatalla(null)} />
            ) : (
              <Guerra
                data={data}
                onAction={onAction}
                ocupado={ocupado}
                onBatalla={setBatalla}
              />
            )
          ) : (
            <Cronica filas={cronica} />
          )}
        </main>
      </div>
    </>
  );
}
