/**
 * `/` — el portal: registrarse, entrar y crear el mago.
 *
 * **Es la única pantalla que se ve sin sesión**, así que tiene que explicar
 * el juego lo justo para que alguien decida quedarse, sin convertirse en una
 * página de marketing.
 *
 * Dos cosas que no se callan, porque duelen después:
 *  - **La escuela no cambia durante la temporada.** Es el invariante 10 de
 *    docs/SPECS.md, y quien la elija a la ligera lo arrastra tres meses.
 *  - **Un mago por cuenta y servidor.** Se dice antes de crearlo, no cuando
 *    el servidor devuelve el error.
 */

import { useState } from 'react';
import { IconoEscuela } from '../components/IconoEscuela.js';
import {
  crearMago,
  entrar,
  recuperar,
  registrar,
  verificar,
} from '../api.js';

const ESCUELAS = [
  { id: 'verdant', nombre: 'Verdant', que: 'Naturaleza: dríades, treants, druidas.' },
  { id: 'nether', nombre: 'Nether', que: 'No muertos: zombis, liches, vampiros.' },
  { id: 'eradication', nombre: 'Eradication', que: 'Fuego y destrucción directa.' },
  { id: 'phantasm', nombre: 'Phantasm', que: 'Ilusión y daño psíquico.' },
  { id: 'ascendant', nombre: 'Ascendant', que: 'Defensa: ángeles y unicornios.' },
];

type Paso = 'entrar' | 'registrar' | 'verificar' | 'recuperar' | 'crear';

export function Portal({ onListo }: { onListo: () => void }) {
  const [paso, setPaso] = useState<Paso>('entrar');
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [token, setToken] = useState('');
  const [nombre, setNombre] = useState('');
  const [escuela, setEscuela] = useState('verdant');
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const hacer = async (fn: () => Promise<void>) => {
    setOcupado(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <section className="panel">
      <h2 className="panel__titulo">Archmage</h2>
      <p className="recurso__nota">
        Un reino, un reloj que solo produce turnos, y tres meses de temporada. Todo lo que
        produces sale de gastar un turno.
      </p>

      {error && <p className="error">{error}</p>}
      {aviso && <p className="aviso">{aviso}</p>}

      <nav className="nav">
        <button className="nav__enlace" aria-current={paso === 'entrar' ? 'page' : undefined} onClick={() => setPaso('entrar')}>
          Entrar
        </button>
        <button className="nav__enlace" aria-current={paso === 'registrar' ? 'page' : undefined} onClick={() => setPaso('registrar')}>
          Crear cuenta
        </button>
        <button className="nav__enlace" aria-current={paso === 'recuperar' ? 'page' : undefined} onClick={() => setPaso('recuperar')}>
          Olvidé la contraseña
        </button>
      </nav>

      {(paso === 'entrar' || paso === 'registrar' || paso === 'recuperar') && (
        <div>
          <p className="recurso__nota">
            <label>
              Correo{' '}
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </label>
          </p>
          {paso !== 'recuperar' && (
            <p className="recurso__nota">
              <label>
                Contraseña{' '}
                <input value={clave} onChange={(e) => setClave(e.target.value)} type="password" />
              </label>{' '}
              <span>Ocho caracteres como mínimo.</span>
            </p>
          )}
          <button
            className="boton"
            disabled={ocupado}
            onClick={() =>
              void hacer(async () => {
                if (paso === 'registrar') {
                  await registrar(email, clave);
                  setAviso('Te hemos mandado un código de verificación.');
                  setPaso('verificar');
                } else if (paso === 'recuperar') {
                  await recuperar(email);
                  // **Responde igual exista o no la cuenta**: si dijera que
                  // ese correo no está registrado, cualquiera podría
                  // averiguar quién juega.
                  setAviso('Si hay una cuenta con ese correo, le hemos mandado un código.');
                } else {
                  await entrar(email, clave);
                  setPaso('crear');
                }
              })
            }
          >
            {paso === 'registrar' ? 'Crear cuenta' : paso === 'recuperar' ? 'Mandar código' : 'Entrar'}
          </button>
        </div>
      )}

      {paso === 'verificar' && (
        <div>
          <p className="recurso__nota">
            <label>
              Código{' '}
              <input value={token} onChange={(e) => setToken(e.target.value)} />
            </label>
          </p>
          <button
            className="boton"
            disabled={ocupado}
            onClick={() =>
              void hacer(async () => {
                await verificar(token);
                setAviso('Cuenta verificada. Ya puedes entrar.');
                setPaso('entrar');
              })
            }
          >
            Verificar
          </button>
        </div>
      )}

      {paso === 'crear' && (
        <div>
          <h2 className="panel__titulo">Tu mago</h2>
          <p className="recurso__nota">
            <strong>Un mago por cuenta y servidor</strong>, y{' '}
            <strong>la escuela no cambia durante la temporada</strong>: elige con calma.
          </p>
          <p className="recurso__nota">
            <label>
              Nombre <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </label>
          </p>
          <ul className="lista">
            {ESCUELAS.map((e) => (
              <li key={e.id}>
                <button
                  className="nav__enlace nav__enlace--escuela"
                  aria-current={escuela === e.id ? 'true' : undefined}
                  onClick={() => setEscuela(e.id)}
                >
                  {/* **Aquí es donde más falta hacía.** Es la pantalla en
                      la que se elige escuela, y la escuela **no cambia
                      durante la temporada** (invariante 10): quien elige
                      merece ver de qué se trata, no solo leer el nombre. */}
                  <IconoEscuela escuela={e.id} tam={32} />
                  {e.nombre}
                </button>{' '}
                <span className="recurso__nota">{e.que}</span>
              </li>
            ))}
          </ul>
          <button
            className="boton"
            disabled={ocupado || nombre.trim().length < 2}
            onClick={() => void hacer(async () => {
              await crearMago(nombre, escuela);
              onListo();
            })}
          >
            Empezar la temporada
          </button>
        </div>
      )}
    </section>
  );
}
