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

type Pantalla = 'reino' | 'ejercito' | 'cronica';

const PANTALLAS: { id: Pantalla; nombre: string }[] = [
  { id: 'reino', nombre: 'Reino' },
  { id: 'ejercito', nombre: 'Ejército' },
  { id: 'cronica', nombre: 'Crónica' },
];

export function App() {
  const [pantalla, setPantalla] = useState<Pantalla>('reino');
  const [data, setData] = useState<MageResponse | null>(null);
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [cronica, setCronica] = useState<ChronicleRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const recargar = useCallback(async () => {
    try {
      const [m, c] = await Promise.all([fetchMage(), fetchCatalog()]);
      setData(m);
      setCatalog(c);
      setError(null);
    } catch (e) {
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

      <div className="envoltorio">
        <header className="cabecera">
          <h1 className="cabecera__titulo">Archmage</h1>
          {data && (
            <div className="cifra" style={{ color: 'var(--texto-tenue)' }}>
              {data.mage.name} · {data.mage.land.total} acres
            </div>
          )}
        </header>

        <nav className="nav">
          {PANTALLAS.map((p) => (
            <button
              key={p.id}
              className="nav__enlace"
              aria-current={pantalla === p.id ? 'page' : undefined}
              onClick={() => setPantalla(p.id)}
            >
              {p.nombre}
            </button>
          ))}
        </nav>

        <main>
          {error && <p className="error">{error}</p>}

          {!data || !catalog ? (
            <p className="recurso__nota">Cargando el reino…</p>
          ) : pantalla === 'reino' ? (
            <Reino data={data} catalog={catalog} onAction={onAction} ocupado={ocupado} />
          ) : pantalla === 'ejercito' ? (
            <Ejercito data={data} catalog={catalog} onAction={onAction} ocupado={ocupado} />
          ) : (
            <Cronica filas={cronica} />
          )}
        </main>
      </div>
    </>
  );
}
