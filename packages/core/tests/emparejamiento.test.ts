import { describe, expect, test } from 'vitest';
import { MIN_TARGET_SHARE, canTarget, chooseTarget, sortStacks } from '../src/combat.js';
import type { UnitSpec } from '../src/units.js';

/**
 * Orden de stacks y emparejamiento. docs/SISTEMAS.md §9.1, de
 * docs/ORIGINAL.md §9.2 (confirmado).
 *
 * Aquí está el criterio 5: **un ejército solo de melee contra uno solo de
 * voladores no hace daño**, porque se queda sin objetivo. Es la regla que
 * convierte la composición del ejército en una decisión y no en una suma.
 */
const u = (id: string, over: Partial<UnitSpec> = {}) =>
  ({
    id,
    abilities: [],
    attack: { power: 100, types: ['melee'], initiative: 3 },
    powerRank: 10,
    ...over,
  } as unknown as UnitSpec);

const volador = u('volador', {
  abilities: ['flying'],
  attack: { power: 100, types: ['melee'], initiative: 3 },
});
const arquero = u('arquero', { attack: { power: 100, types: ['missile', 'ranged'], initiative: 3 } });
const melee = u('melee');

describe('el orden de los stacks', () => {
  test('los multiplicadores son 1,0 a distancia, 1,5 el resto, 2,25 volador', () => {
    // docs/ORIGINAL.md §9.2, y la wiki avisa: **solo decide el orden**, no
    // mejora a nadie.
    const orden = sortStacks([
      { unit: arquero, count: 10 },
      { unit: melee, count: 10 },
      { unit: volador, count: 10 },
    ]);
    expect(orden.map((s) => s.unit.id)).toEqual(['volador', 'melee', 'arquero']);
  });

  test('los voladores van delante y los de distancia atrás', () => {
    const orden = sortStacks([
      { unit: arquero, count: 1 },
      { unit: volador, count: 1 },
    ]);
    expect(orden[0]!.unit.id).toBe('volador');
    expect(orden[1]!.unit.id).toBe('arquero');
  });

  test('un volador a distancia cuenta como volador', () => {
    // El Fénix vuela y pega a distancia. Manda volar: 2,25.
    const fenix = u('fenix', {
      abilities: ['flying'],
      attack: { power: 100, types: ['magic', 'ranged'], initiative: 5 },
    });
    const orden = sortStacks([
      { unit: arquero, count: 1 },
      { unit: fenix, count: 1 },
      { unit: melee, count: 1 },
    ]);
    expect(orden.map((s) => s.unit.id)).toEqual(['fenix', 'melee', 'arquero']);
  });

  test('el orden es estable y no depende del tamaño del stack', () => {
    // Un stack de 1 volador va delante de 20.000 de melee: el multiplicador
    // **depende solo del tipo de unidad**.
    const orden = sortStacks([
      { unit: melee, count: 20_000 },
      { unit: volador, count: 1 },
    ]);
    expect(orden[0]!.unit.id).toBe('volador');
  });

  test('no muta la lista que le pasan', () => {
    const original = [{ unit: arquero, count: 1 }, { unit: volador, count: 1 }];
    const copia = [...original];
    sortStacks(original);
    expect(original).toEqual(copia);
  });
});

describe('criterio 5 — quién puede pegar a quién', () => {
  test('los voladores pegan a cualquiera', () => {
    expect(canTarget(volador, melee)).toBe(true);
    expect(canTarget(volador, volador)).toBe(true);
  });

  test('los de distancia pegan a cualquiera', () => {
    expect(canTarget(arquero, melee)).toBe(true);
    expect(canTarget(arquero, volador)).toBe(true);
  });

  test('los de melee solo pegan a tierra', () => {
    expect(canTarget(melee, melee)).toBe(true);
    expect(canTarget(melee, volador)).toBe(false);
  });

  test('UN EJÉRCITO SOLO DE MELEE CONTRA VOLADORES NO HACE DAÑO', () => {
    // El criterio, tal cual. No es que pegue poco: **se queda sin
    // objetivo**, y eso convierte la composición en una decisión de verdad.
    const defensores = [{ unit: volador, count: 1_000 }];
    expect(chooseTarget(melee, defensores)).toBeUndefined();
  });

  test('pero basta un stack de tierra para que tenga a quién pegar', () => {
    const defensores = [
      { unit: volador, count: 1_000 },
      { unit: melee, count: 1_000 },
    ];
    expect(chooseTarget(melee, defensores)?.unit.id).toBe('melee');
  });
});

describe('el objetivo tiene que valer la pena', () => {
  test('se PREFIERE un stack que valga el 10% del que ataca', () => {
    expect(MIN_TARGET_SHARE).toBe(0.1);
    // Atacante: 1.000 × rank 10 = 10.000 de poder. El mínimo son 1.000.
    const flaco = { unit: melee, count: 99 }; // 990 — por debajo
    const gordo = { unit: melee, count: 100 }; // 1.000 — justo el 10%
    // Con los dos delante y el flaco primero, se salta al que vale la pena.
    expect(chooseTarget(melee, [flaco, gordo], 1_000)?.count).toBe(100);
  });

  test('pero si no hay ninguno que valga, se pega al que haya', () => {
    // **[nuestro]** La fuente dice que un stack «solo es objetivo» si vale
    // el 10%. Al pie de la letra eso deja **invulnerable a un stack
    // pequeño**: medido al montar la batalla, un millón de soldados no
    // podía tocar a diez, y partir el ejército en stacks minúsculos lo
    // volvía intocable. Eso no es táctica, es un exploit — así que el 10%
    // es preferencia y no veto.
    const flaco = { unit: melee, count: 99 };
    expect(chooseTarget(melee, [flaco], 1_000)?.count).toBe(99);
    expect(chooseTarget(melee, [{ unit: melee, count: 1 }], 1_000_000)?.count).toBe(1);
  });

  test('con varios objetivos válidos se coge el primero del orden', () => {
    // El orden ya viene dado por `sortStacks`: los voladores delante. Que
    // la elección sea determinista es lo que hace la batalla repetible
    // (docs/SPECS.md §5, invariante 3).
    const defensores = sortStacks([
      { unit: melee, count: 1_000 },
      { unit: volador, count: 1_000 },
    ]);
    expect(chooseTarget(arquero, defensores, 1_000)?.unit.id).toBe('volador');
    // Y el de melee, que no alcanza al volador, coge el siguiente que puede.
    expect(chooseTarget(melee, defensores, 1_000)?.unit.id).toBe('melee');
  });

  test('un stack vacío no es objetivo', () => {
    expect(chooseTarget(melee, [{ unit: melee, count: 0 }])).toBeUndefined();
  });

  test('sin defensores no hay objetivo', () => {
    expect(chooseTarget(melee, [])).toBeUndefined();
  });

  test('sin tamaño del atacante no se aplica el mínimo del 10%', () => {
    // Para poder preguntar «¿a quién podría pegar?» sin fijar un tamaño.
    expect(chooseTarget(melee, [{ unit: melee, count: 1 }])?.count).toBe(1);
  });
});
