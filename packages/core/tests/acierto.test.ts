import { describe, expect, test } from 'vitest';
import { ACCURACY_BASE, ACCURACY_BASE_SIEGE, accuracyFor, casualties } from '../src/combat.js';

/**
 * El acierto. docs/SISTEMAS.md §9.1, de docs/ORIGINAL.md §9.1 (publicada).
 *
 * Es el término que más pesa: la wiki insiste en que *«3% de acierto da el
 * mismo bono que 10% de ataque»*.
 */
const base = {
  attackers: 1_000,
  attackPower: 4_200,
  accuracy: 30,
  randomFactor: 0.5,
  efficiency: 100,
  resistance: 0,
  defensiveMultiplier: 1,
  defenderHitPoints: 70,
};

describe('criterio 2 — el asedio penaliza en el acierto', () => {
  test('la base es 30, y 20 en asedio', () => {
    expect(ACCURACY_BASE).toBe(30);
    expect(ACCURACY_BASE_SIEGE).toBe(20);
    expect(accuracyFor(0, false)).toBe(30);
    expect(accuracyFor(0, true)).toBe(20);
  });

  test('la misma batalla en asedio hace exactamente dos tercios del daño', () => {
    const regular = casualties({ ...base, accuracy: accuracyFor(0, false) });
    const asedio = casualties({ ...base, accuracy: accuracyFor(0, true) });
    expect(regular).toBe(9_000);
    expect(asedio).toBe(6_000);
    expect(asedio).toBe((regular * 2) / 3);
  });
});

describe('la fórmula a tramos de los modificadores', () => {
  test('un modificador positivo suma directamente', () => {
    expect(accuracyFor(10, false)).toBe(40);
    expect(accuracyFor(70, false)).toBe(100);
    expect(accuracyFor(10, true)).toBe(30); // en asedio, sobre 20
  });

  test('una penalización pequeña resta directamente', () => {
    expect(accuracyFor(-5, false)).toBe(25);
    expect(accuracyFor(-14, false)).toBe(16);
  });

  test('a partir de −15 la penalización se frena', () => {
    // 24 − (3/5)·|A|. Con |A| = 20: 24 − 12 = 12, en vez de 10.
    expect(accuracyFor(-20, false)).toBe(12);
    expect(accuracyFor(-25, false)).toBe(9);
  });

  test('y a partir de −30 se frena más todavía', () => {
    // 12 − (1/5)·|A|. Con |A| = 50: 12 − 10 = 2.
    expect(accuracyFor(-50, false)).toBe(2);
    expect(accuracyFor(-40, false)).toBe(4);
  });

  test('LOS TRAMOS EMPALMAN, y eso es lo que confirma cómo leerlos', () => {
    // **La fuente escribe el segundo tramo como `30 − A` con A negativo**,
    // que daría *más* acierto al penalizar — un sinsentido. La lectura
    // correcta es con el valor absoluto, y lo demuestra que **las tres
    // fórmulas empalman exactamente en las fronteras**:
    //
    //   |A| = 15 → 30 − 15 = 15   y   24 − (3/5)·15 = 15
    //   |A| = 30 → 24 − 18 =  6   y   12 − (1/5)·30 =  6
    //
    // Con la lectura literal no empalmarían. Comprobarlo era el único modo
    // de resolver la ambigüedad sin inventar.
    expect(accuracyFor(-15, false)).toBe(15);
    expect(accuracyFor(-30, false)).toBe(6);
    // Y la curva es continua y monótona en todo el recorrido.
    let anterior = Infinity;
    for (let a = 0; a >= -80; a--) {
      const x = accuracyFor(a, false);
      expect(x, `A=${a}`).toBeLessThanOrEqual(anterior);
      anterior = x;
    }
  });

  test('el acierto nunca baja de cero', () => {
    // 12 − (1/5)·|A| cruza el cero en |A| = 60.
    expect(accuracyFor(-60, false)).toBe(0);
    expect(accuracyFor(-200, false)).toBe(0);
  });

  test('penalizar mucho deja de doler: es una curva, no una recta', () => {
    // De −10 a −20 se pierden 8 puntos; de −40 a −50, solo 2. Ésa es la
    // razón de ser de los tramos: un apilado de penalizaciones no anula
    // del todo a un ejército.
    expect(accuracyFor(-10, false) - accuracyFor(-20, false)).toBe(8);
    expect(accuracyFor(-40, false) - accuracyFor(-50, false)).toBe(2);
  });

  test('no es necesariamente entero, y no debe serlo', () => {
    // El acierto entra en la fórmula como `acierto/100`, así que no hay
    // razón para redondearlo — y redondearlo aquí sería **un segundo
    // redondeo** en una fórmula que solo puede tener uno
    // (docs/SPECS.md §5, invariante 7). 24 − (3/5)·17 = 13,8.
    expect(accuracyFor(-17, false)).toBeCloseTo(13.8, 10);
    for (let a = -80; a <= 80; a++) {
      const x = accuracyFor(a, false);
      expect(Number.isFinite(x), `A=${a}`).toBe(true);
      expect(x, `A=${a}`).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('el asedio arrastra los tramos', () => {
  test('la penalización se aplica sobre la base de asedio', () => {
    // El asedio no es un modificador más: cambia la **base**, y los tramos
    // se miden sobre ella.
    // La curva entera escala con la base: los cortes caen en B/2 y en B, y
    // las alturas en 0,8B y 0,4B. Con base 20, |A| = 5 está en el primer
    // tramo (20 − 5 = 15) y |A| = 20 ya está en el tercero
    // (0,4×20 − 0,2×20 = 4).
    expect(accuracyFor(-5, true)).toBe(15);
    expect(accuracyFor(-20, true)).toBe(4);
    expect(accuracyFor(-10, true)).toBe(10); // el corte B/2, empalmando
  });

  test('dos tercios exactos SIN modificadores, que es lo que pide el criterio', () => {
    // El criterio 2 de §9.1 habla del caso sin modificar: «20 en vez de 30
    // de acierto». Eso se cumple exacto.
    expect(accuracyFor(0, true)).toBe((2 / 3) * accuracyFor(0, false));
  });

  test('con modificadores la proporción se mueve, y NO se finge que no', () => {
    // **Aquí hay una ambigüedad de la fuente, y se deja dicha.** La fórmula
    // a tramos está publicada solo para la base 30, y hay dos maneras de
    // llevarla a la base 20 del asedio:
    //
    //  (a) La curva está escrita en función de su base —24 = 0,8B,
    //      12 = 0,4B, cortes en B/2 y B—, así que **un punto de castigo
    //      cuesta un punto** en los dos casos. Es la que se adoptó.
    //  (b) La curva entera se multiplica por B/30, lo que daría dos tercios
    //      exactos en todo el rango, pero haría que **un castigo de 15
    //      puntos costara solo 10** en asedio.
    //
    // Se eligió (a) porque un modificador de acierto está expresado en
    // puntos de acierto, y (b) lo convertiría en algo que vale distinto
    // según el tipo de ataque. El criterio 2 no distingue entre las dos:
    // solo habla del caso sin modificar.
    expect(accuracyFor(-10, true)).toBe(10); // (b) daría 13,33
    expect(accuracyFor(-10, false)).toBe(20);
    expect(accuracyFor(-39, true)).toBeCloseTo(0.2, 10); // (b) daría 2,8
  });

  test('las dos curvas cruzan el cero en 2×base: 40 en asedio, 60 regular', () => {
    expect(accuracyFor(-40, true)).toBe(0);
    expect(accuracyFor(-40, false)).toBe(4);
    expect(accuracyFor(-60, false)).toBe(0);
  });

  test('un bono de acierto, en cambio, suma puntos y no escala', () => {
    // El modificador positivo es absoluto: +10 de acierto es +10, venga de
    // un héroe o de un item, y no vale más por estar asediando.
    expect(accuracyFor(10, true)).toBe(30);
    expect(accuracyFor(10, false)).toBe(40);
  });

  test('nunca hace más daño que el ataque regular con el mismo modificador', () => {
    for (const a of [-40, -20, -5, 0, 10, 50]) {
      expect(accuracyFor(a, true), `A=${a}`).toBeLessThan(accuracyFor(a, false));
    }
  });
});
