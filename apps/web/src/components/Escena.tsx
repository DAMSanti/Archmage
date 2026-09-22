/**
 * El mapa del reino.
 *
 * docs/INTERFAZ.md §6.5. **Una pieza por cada TIPO de edificio del que tengas
 * al menos uno** — qué piezas exactamente lo decide `escena.ts`, que es puro
 * y está comprobado (criterio 11).
 *
 * **Desde el 2026-09-22 es la pantalla, no un adorno de la pantalla.** El
 * panel de recursos y la tabla de reparto se quitaron de `/reino`: lo primero
 * subió al marco y lo segundo vive aquí, en la ficha de cada pieza.
 *
 * **Y la ficha no es decoración: lleva el dato.** Cantidad, porcentaje de tu
 * tierra y lo que hay en obra — que son las columnas que tenía la tabla. Sin
 * ella el reparto no estaría en ninguna parte, y §3 lo pide.
 *
 * > Esto **deroga la regla 9 de §6.5**, la de «la escena dice QUÉ y el panel
 * > dice CUÁNTO». Ya no hay panel: la escena dice las dos cosas. Está
 * > reescrita allí con su porqué.
 *
 * **En el móvil se toca, y eso obliga a una decisión.** Tocar no puede
 * enseñar la ficha *y* navegar a la vez, así que la ficha se abre al tocar y
 * **lleva el enlace dentro**. La pieza sigue siendo un atajo (criterio 12),
 * con un paso más donde no hay ratón.
 *
 * Fuera de alcance:
 *  - **Colocar los edificios.** El jugador no elige dónde va nada (§6.8): no
 *    hay decisión de juego detrás, y añadirla sería inventar una mecánica
 *    para justificar un dibujo.
 *  - **Decir si un reparto es bueno.** La ficha da el porcentaje y se calla
 *    (§1): dónde conviene estar es el juego, no información de estado.
 */

import { useEffect, useRef, useState } from 'react';
import { CONSTRUCTION_SCALE, type Buildings, type Construction } from '@archmage/core';
import { num, pct } from '../tokens.js';
import { piezasDe } from '../escena.js';

/** Cómo se llama cada pantalla en el botón. Con su tilde. */
const NOMBRE_PANTALLA: Record<string, string> = {
  magia: 'Magia',
  ejercito: 'Ejército',
  guerra: 'Guerra',
};

export interface EscenaProps {
  buildings: Buildings;
  construction: Construction;
  /** La tierra total, para el porcentaje. Sale del estado, no se recalcula. */
  tierra: number;
  onIr: (pantalla: string) => void;
}

export function Escena({ buildings, construction, tierra, onIr }: EscenaProps) {
  const piezas = piezasDe(buildings);
  const [abierta, setAbierta] = useState<string | null>(null);
  const caja = useRef<HTMLElement>(null);

  // Una ficha abierta por toque se queda puesta si no se cierra al tocar
  // fuera, y en el movil tapa medio mapa.
  useEffect(() => {
    if (!abierta) return;
    const fuera = (e: Event) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierta(null);
    };
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && setAbierta(null);
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', escape);
    };
  }, [abierta]);

  // Un reino sin nada construido no tiene mapa que enseñar.
  if (piezas.length === 0) return null;

  return (
    <section className="mapa" ref={caja} aria-label="Tu reino">
      {piezas.map((p) => {
        const enObra = construction[p.building] / CONSTRUCTION_SCALE;
        const activa = abierta === p.building;
        return (
          <div
            key={p.building}
            className={`mapa__sitio${activa ? ' mapa__sitio--activo' : ''}`}
            style={{ left: `${p.x}%`, top: `${p.y}%`, ['--escala' as string]: p.escala }}
          >
            <button
              type="button"
              className="mapa__pieza"
              aria-expanded={activa}
              onMouseEnter={() => setAbierta(p.building)}
              onMouseLeave={() => setAbierta((x) => (x === p.building ? null : x))}
              onFocus={() => setAbierta(p.building)}
              onClick={() => (activa ? onIr(p.pantalla) : setAbierta(p.building))}
            >
              <img src={`/escena/${p.building}.webp`} alt="" aria-hidden="true" />
              <span className="mapa__nombre">{p.nombre}</span>
            </button>

            {activa && (
              /* **Un panel opaco, no texto sobre el paisaje** (§6.5, regla 1):
                 el contraste se mide contra el panel, nunca contra la imagen. */
              <div className="mapa__ficha" role="tooltip">
                <strong className="mapa__ficha-titulo">{p.nombre}</strong>
                <dl className="mapa__datos">
                  <dt>Cantidad</dt>
                  <dd className="cifra">{num(buildings[p.building])}</dd>
                  <dt>% de tu tierra</dt>
                  <dd className="cifra">{pct(buildings[p.building], tierra)}</dd>
                  {enObra > 0 && (
                    <>
                      <dt>En obra</dt>
                      <dd className="cifra">
                        {enObra.toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </dd>
                    </>
                  )}
                </dl>
                {/* **Solo si lleva a otro sitio.** Farms, Towns y Workshops
                    se gestionan aquí mismo, así que un «Ir a Reino» estando
                    en Reino sería un botón que no hace nada. */}
                {p.pantalla !== 'reino' && (
                  <button type="button" className="mapa__ir" onClick={() => onIr(p.pantalla)}>
                    Ir a {NOMBRE_PANTALLA[p.pantalla] ?? p.pantalla}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
