/**
 * Usar un item **fuera de batalla**.
 *
 * Los de batalla los resuelve `prebattle.ts`; aquí están los ~21 que dan
 * recursos, unidades o tierra, y los que **atacan a otro mago sin batalla**:
 * le queman turnos, población y maná.
 *
 * **Que un item pueda destruir turnos del enemigo es lo que más dice del
 * diseño del original.** Solo tiene sentido si el turno es la moneda
 * (docs/SISTEMAS.md §2), y confirma que lo es.
 *
 * Fuera de alcance aquí:
 *  - **Repartir los items que dan items.** El *Treasure Chest* da «5 lesser»
 *    y esta función no conoce el catálogo entero, así que devuelve el hueco
 *    y lo reparte quien llama. Meter el catálogo aquí convertiría una regla
 *    en un buscador.
 *  - **Los tres declarados sin implementar**, que devuelven su motivo.
 */

import type { ItemEffect, ItemSpec } from './items.js';
import { rollRange } from './items.js';
import type { MageState, RandomSource } from './types.js';

export type UseItemError =
  | { code: 'no_tienes'; message: string }
  | { code: 'es_de_batalla'; message: string }
  | { code: 'sin_objetivo'; message: string }
  | { code: 'no_implementado'; message: string };

export interface UseItemOutcome {
  /** El estado de quien lo usa. */
  self: MageState;
  /** El del objetivo, si el item ataca a alguien. */
  target?: MageState;
  /** Qué pasó, para la crónica. */
  detail: string;
  /** Items sueltos que el efecto concede y que reparte quien llama. */
  grantsItems?: number;
  grantsUnique?: boolean;
}

/**
 * Usa un item.
 *
 * El item **se descuenta siempre que el efecto se aplique**, incluso si lo
 * que sale del azar es «nada»: el *Treasure Chest* puede no dar nada, y eso
 * es parte de lo que se compra.
 */
export function useItem(
  state: MageState,
  spec: ItemSpec,
  random: RandomSource,
  target?: MageState,
): UseItemOutcome | { error: UseItemError } {
  if ((state.items[spec.id] ?? 0) <= 0) {
    return { error: { code: 'no_tienes', message: 'No tienes ese item.' } };
  }
  if (spec.use === 'battle') {
    return {
      error: { code: 'es_de_batalla', message: 'Ese item se usa en combate, no desde aquí.' },
    };
  }
  if (spec.effect.kind === 'notImplemented') {
    // **Se dice por qué.** Un hueco declarado es deuda; uno callado es un
    // fallo esperando a una temporada real.
    return { error: { code: 'no_implementado', message: spec.effect.why } };
  }
  if (spec.targeted && !target) {
    return { error: { code: 'sin_objetivo', message: 'Elige contra quién usarlo.' } };
  }

  const gastado = { ...state, items: { ...state.items } };
  const quedan = (gastado.items[spec.id] ?? 0) - 1;
  if (quedan > 0) gastado.items[spec.id] = quedan;
  else delete gastado.items[spec.id];

  return aplicar(gastado, spec.effect, random, target);
}

function aplicar(
  self: MageState,
  e: ItemEffect,
  random: RandomSource,
  target?: MageState,
): UseItemOutcome | { error: UseItemError } {
  const sinObjetivo = {
    error: { code: 'sin_objetivo' as const, message: 'Elige contra quién usarlo.' },
  };

  switch (e.kind) {
    case 'grantGeld': {
      const n = rollRange(e.amount, random);
      return { self: conRecurso(self, 'geld', n), detail: `+${n} de geld` };
    }
    case 'grantMana': {
      const n = rollRange(e.amount, random);
      return { self: conRecurso(self, 'mana', n), detail: `+${n} de maná` };
    }
    case 'grantPopulation': {
      const n = rollRange(e.amount, random);
      return { self: conRecurso(self, 'population', n), detail: `+${n} de población` };
    }
    case 'grantPopulationShare': {
      // **El que ya está lleno no gana nada**, y eso lo convierte en una
      // decisión de cuándo usarlo. El tope lo pone quien guarda, que es
      // quien conoce la capacidad.
      const n = Math.floor(self.resources.population * e.share);
      return { self: conRecurso(self, 'population', n), detail: `+${n} de población` };
    }
    case 'grantLand': {
      const n = rollRange(e.amount, random);
      return {
        self: { ...self, land: { total: self.land.total + n, free: self.land.free + n } },
        detail: `+${n} acres de yermo`,
      };
    }
    case 'grantUnits': {
      const n = rollRange(e.amount, random);
      const army = [...self.army];
      const i = army.findIndex((s) => s.unitId === e.unitId);
      if (i >= 0) army[i] = { ...army[i]!, count: army[i]!.count + n };
      else army.push({ unitId: e.unitId, count: n });
      return { self: { ...self, army }, detail: `+${n} unidades` };
    }
    case 'grantItems':
      return { self, detail: `${e.count} items`, grantsItems: e.count };
    case 'grantUniqueItem':
      return { self, detail: 'un unique', grantsUnique: true };
    case 'oneOf':
      return aplicar(self, e.options[random.nextInt(e.options.length)]!, random, target);
    case 'weighted': {
      // Los pesos suman 1; se recorre acumulando.
      const tirada = random.next();
      let acc = 0;
      for (const o of e.options) {
        acc += o.weight;
        if (tirada < acc) {
          if (!o.effect) return { self, detail: 'nada' };
          return aplicar(self, o.effect, random, target);
        }
      }
      return { self, detail: 'nada' };
    }
    case 'enemyTurns': {
      if (!target) return sinObjetivo;
      const n = rollRange(e.amount, random);
      return {
        self,
        target: {
          ...target,
          turns: { ...target.turns, current: Math.max(0, target.turns.current - n) },
        },
        detail: `le destruye ${n} turnos`,
      };
    }
    case 'enemyPopulation': {
      if (!target) return sinObjetivo;
      const n = rollRange(e.amount, random);
      return {
        self,
        target: conRecurso(target, 'population', -n),
        detail: `le quita ${n} de población`,
      };
    }
    case 'enemyMana': {
      if (!target) return sinObjetivo;
      const n = rollRange(e.amount, random);
      return { self, target: conRecurso(target, 'mana', -n), detail: `le quita ${n} de maná` };
    }
    case 'enemyGeldAndPopulation': {
      if (!target) return sinObjetivo;
      const t = conRecurso(conRecurso(target, 'geld', -e.geld), 'population', -e.population);
      return { self, target: t, detail: `le quita ${e.geld} de geld y ${e.population} de población` };
    }
    case 'stealFromEnemy': {
      if (!target) return sinObjetivo;
      // **[nuestro]** La fuente dice «geld, un item o un unique» y no cuánto
      // geld. Se roba el **5%**, la mitad de lo que se lleva un saqueo: un
      // item no puede valer tanto como una guerra.
      const n = Math.floor(target.resources.geld * 0.05);
      return {
        self: conRecurso(self, 'geld', n),
        target: conRecurso(target, 'geld', -n),
        detail: `le roba ${n} de geld`,
      };
    }
    default:
      return {
        error: { code: 'no_implementado', message: 'Ese efecto no se usa fuera de batalla.' },
      };
  }
}

/** Suma o resta un recurso **sin dejarlo negativo**. Los recursos son enteros. */
function conRecurso(
  state: MageState,
  cual: 'geld' | 'mana' | 'population',
  delta: number,
): MageState {
  return {
    ...state,
    resources: { ...state.resources, [cual]: Math.max(0, state.resources[cual] + delta) },
  };
}
