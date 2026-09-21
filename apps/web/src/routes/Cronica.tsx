/**
 * `/cronica` — qué ha pasado.
 *
 * docs/VISION.md §3: **el jugador puede reconstruir qué pasó.** La crónica
 * sale de los eventos que el núcleo produjo y que se guardaron en la misma
 * transacción que el estado, no de mirar el estado y deducir
 * (docs/SPECS.md §5, invariante 4).
 *
 * Cuenta **hechos**, no reglas: que tu maná bajó se ve aquí; por qué bajó lo
 * descubres jugando (docs/INTERFAZ.md §1).
 */

import type { ChronicleRow } from '../api.js';
import { num } from '../tokens.js';

/** Los nombres de las acciones, en español y no como los llama el código. */
const ACCION: Record<string, string> = {
  build: 'construir',
  demolish: 'demoler',
  explore: 'explorar',
  chargeMana: 'cargar maná',
  chargeGeld: 'cargar geld',
  setRecruit: 'reclutar',
};

/** «1 turnos» es de robot. */
const turnos = (n: number) => `${num(n)} ${n === 1 ? 'turno' : 'turnos'}`;

const TEXTO: Record<string, (p: Record<string, unknown>) => string> = {
  'turns.accrued': (p) => `Se acumularon ${turnos(Number(p.gained))}.`,
  'turns.spent': (p) =>
    `Gastaste ${turnos(Number(p.amount))} en ${ACCION[String(p.on)] ?? String(p.on)}.`,
  'resources.produced': (p) =>
    `Produjiste ${num(Number(p.geld))} de geld, ${num(Number(p.mana))} de maná y ${num(
      Number(p.population),
    )} de población.`,
  'mana.overflowed': (p) =>
    `Se perdieron ${num(Number(p.lost))} de maná: el almacén estaba lleno.`,
  'upkeep.paid': (p) =>
    `Mantenimiento: ${num(Number(p.geld))} de geld y ${num(Number(p.mana))} de maná.`,
  'building.completed': (p) => `Terminaste ${num(Number(p.amount))} × ${String(p.building)}.`,
  'building.demolished': (p) => `Demoliste ${num(Number(p.amount))} × ${String(p.building)}.`,
  'building.queued': (p) => `Pusiste en obra ${String(p.building)}.`,
  'land.explored': (p) => {
    const a = Number(p.acres);
    return `Exploraste y ganaste ${num(a)} ${a === 1 ? 'acre' : 'acres'}.`;
  },
  'land.exhausted': () => 'No quedaba tierra que explorar.',
  'recruit.set': (p) => `Fijaste el reclutamiento de ${num(Number(p.total))} × ${String(p.unitId)}.`,
  'recruit.arrived': (p) => `Llegaron ${num(Number(p.count))} × ${String(p.unitId)}.`,
  'collapse.geld': (p) =>
    `Te quedaste sin geld: perdiste ${num(Number(p.fortsLost))} forts, ${num(
      Number(p.buildingsLost),
    )} edificios y desertaron ${num(Number(p.unitsDeserted))} unidades.`,
  'collapse.mana': (p) =>
    `Te quedaste sin maná: se disolvieron ${num(Number(p.stacksDisbanded))} stacks y se cayeron ${num(
      Number(p.enchantmentsLost),
    )} encantamientos.`,
  'collapse.population': (p) =>
    `Te quedaste sin población: se disolvieron ${num(Number(p.stacksDisbanded))} stacks.`,
  'protection.ended': () => 'Se acabó tu periodo de protección.',
};

export function Cronica({ filas }: { filas: ChronicleRow[] }) {
  return (
    <section className="panel">
      <h2 className="panel__titulo">Crónica</h2>
      {filas.length === 0 ? (
        <p className="recurso__nota">Todavía no ha pasado nada. Gasta algún turno.</p>
      ) : (
        <ul className="cronica">
          {filas.map((f) => (
            <li className="cronica__linea" key={f.seq}>
              <span className="cronica__tipo">#{num(f.seq)}</span>
              <span className="cronica__detalle">
                {TEXTO[f.type]?.(f.payload) ?? f.type}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
