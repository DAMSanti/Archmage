/**
 * El marco persistente: recursos arriba, navegación abajo.
 *
 * docs/INTERFAZ.md §6.9. **Está en las trece pantallas**, y eso es lo que
 * gana: hasta ahora cada pantalla resolvía por su cuenta dónde enseñaba el
 * estado, así que el jugador tenía que aprender un sitio distinto en cada
 * una.
 *
 * **Ni un número se calcula aquí.** Todo sale de `derived`, que lo resuelve
 * el servidor (docs/SPECS.md §5, invariante 5). Si alguna vez hiciera falta
 * un número que no está en `derived`, la función falta en `packages/core`, no
 * aquí (docs/INTERFAZ.md §1).
 *
 * Fuera de alcance:
 *  - **Decir si un número es bueno.** La interfaz contesta «¿cómo estoy?»,
 *    no «¿qué debería hacer?» (docs/INTERFAZ.md §1). El neto lleva su signo
 *    porque es un hecho; no lleva consejo.
 *  - **Iconos.** Los de la barra son la tarea 23 de la fase 1
 *    (docs/ASSETS.md §8.3). Hasta que existan, las entradas son solo texto, y
 *    la regla 3 de §6.5 dice que eso tiene que bastar.
 */

import { useEffect, useRef, useState } from 'react';
import type { MageResponse } from '@archmage/contract';
import { conSigno, num } from '../tokens.js';
import { cadencia, cuentaAtras } from '../reloj.js';

/** Las entradas sueltas de la barra, y las que van detrás de «Más». */
export interface Entrada {
  id: string;
  nombre: string;
  /** El fichero de `/iconos/`, sin extensión. Si falta, va solo el texto. */
  icono?: string;
}

/**
 * Un icono del marco.
 *
 * **Decorativo, siempre**: la etiqueta de texto va al lado y dice lo mismo
 * (docs/ASSETS.md §8.3), así que va `aria-hidden` y un lector de pantalla no
 * lo oye dos veces. Y por eso los dos iconos más flojos —el de net power y el
 * de «Más», que son figuras anchas metidas en un cuadrado— no estorban: el
 * texto carga con el significado.
 */
function Icono({ nombre, tam }: { nombre: string | undefined; tam: number }) {
  if (!nombre) return null;
  return (
    <img
      className="marco__icono"
      src={`/iconos/${nombre}.webp`}
      width={tam}
      height={tam}
      alt=""
      aria-hidden="true"
    />
  );
}

export interface MarcoProps {
  data: MageResponse;
  sueltas: readonly Entrada[];
  agrupadas: readonly Entrada[];
  pantalla: string;
  onIr: (id: string) => void;
}

/**
 * Un recurso de la barra: cifra, y debajo su neto por turno.
 *
 * **El neto, no el bruto** (docs/INTERFAZ.md §3): es el número que decide si
 * tu ejército sobrevive. Y lleva signo además de color, porque **el color
 * nunca es la única señal** (§6.7, criterio 10).
 */
function Recurso({
  nombre,
  valor,
  neto,
  icono,
}: {
  nombre: string;
  valor: string;
  neto?: number;
  icono: string;
}) {
  const color =
    neto === undefined ? undefined : neto < 0 ? 'var(--negativo)' : 'var(--texto-tenue)';
  return (
    <div className="marco__recurso">
      <span className="marco__etiqueta">
        <Icono nombre={icono} tam={18} />
        {nombre}
      </span>
      <span className="marco__cifra">{valor}</span>
      {neto !== undefined && (
        <span className="marco__neto" style={{ color }}>
          {conSigno(neto)}
        </span>
      )}
    </div>
  );
}

export function Marco({ data, sueltas, agrupadas, pantalla, onIr }: MarcoProps) {
  const { mage, derived, server } = data;
  const [abierto, setAbierto] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  // Un menú que no se cierra al pinchar fuera se queda tapando la pantalla,
  // y en móvil ocupa casi toda.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (menu.current && !menu.current.contains(e.target as Node)) setAbierto(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', escape);
    };
  }, [abierto]);

  const ir = (id: string) => {
    onIr(id);
    setAbierto(false);
  };

  const enMenu = agrupadas.some((e) => e.id === pantalla);

  return (
    <>
      <header className="marco marco--arriba">
        <div className="marco__recursos">
          <Recurso icono="geld" nombre="Geld" valor={num(mage.resources.geld)} neto={derived.net.geld} />
          <Recurso icono="mana" nombre="Maná" valor={num(mage.resources.mana)} neto={derived.net.mana} />
          <Recurso
            icono="poblacion"
            nombre="Población"
            valor={`${num(mage.resources.population)} / ${num(derived.populationCapacity.capacity)}`}
            neto={derived.net.population}
          />
          <Recurso icono="netpower" nombre="Net power" valor={num(derived.netPower)} />
        </div>

        {/* **Los turnos no comparten fila con nada**: son la moneda del
            juego (docs/SISTEMAS.md §2), y quien mira la pantalla tiene que
            saber cuántos puede gastar sin buscarlo. */}
        <div className="marco__turnos">
          <span className="marco__etiqueta">
            <Icono nombre="turno" tam={18} />
            Turnos
          </span>
          <span className="marco__cifra marco__cifra--turnos">{num(mage.turns.current)}</span>
          <span className="marco__nota">
            {cadencia(server)} · {cuentaAtras(derived.msToNextTurn, derived.turnsAtCap)}
          </span>
          {derived.turnsAtCap && (
            <span className="marco__aviso">Almacén lleno: estás desperdiciando turnos.</span>
          )}
        </div>
      </header>

      <nav className="marco marco--abajo" aria-label="Navegación principal">
        {sueltas.map((e) => (
          <button
            key={e.id}
            type="button"
            className="marco__enlace"
            aria-current={pantalla === e.id ? 'page' : undefined}
            onClick={() => ir(e.id)}
          >
            <Icono nombre={e.icono} tam={24} />
            <span className="marco__enlace-nombre">{e.nombre}</span>
          </button>
        ))}

        <div className="marco__mas" ref={menu}>
          <button
            type="button"
            className="marco__enlace"
            aria-expanded={abierto}
            aria-haspopup="true"
            aria-current={enMenu ? 'page' : undefined}
            onClick={() => setAbierto((x) => !x)}
          >
            <Icono nombre="nav-mas" tam={24} />
            <span className="marco__enlace-nombre">Más</span>
          </button>

          {/* **Sin `role="menu"`.** Ese rol es para menus de aplicación, y
              **sustituye el rol implícito de los botones de dentro**: pasan a
              ser `menuitem` y dejan de encontrarse como botones. Lo enseñó la
              pasada de navegador, que se quedó esperando un botón que en el
              árbol de accesibilidad ya no existía. Esto es navegación:
              botones dentro de un contenedor. */}
          {abierto && (
            <div className="marco__menu">
              {agrupadas.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className="marco__menu-enlace"
                  aria-current={pantalla === e.id ? 'page' : undefined}
                  onClick={() => ir(e.id)}
                >
                  {e.nombre}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
