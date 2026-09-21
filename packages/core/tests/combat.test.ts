import { describe, expect, test } from 'vitest';
import { casualties } from '../src/combat.js';

/**
 * La fórmula de daño. docs/SISTEMAS.md §9.1, y docs/ORIGINAL.md §9.1
 * (publicada, confianza alta).
 *
 * ```
 * bajas de R = N_A × ataque_A × (acierto/100) × azar × eficiencia
 *              × (1 − resistencia_R) × habilidades_R ÷ HP_R
 * ```
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

describe('criterio 1 — la fórmula da lo que dice la fórmula', () => {
  test('1.000 Treants contra Dríades matan exactamente 9.000', () => {
    // 1000 × 4200 × 0,3 × 0,5 × 1 × 1 × 1 / 70 = 9.000.
    // Treant: ataque 4.200. Dríade: HP 70. Los dos publicados
    // (docs/ORIGINAL.md §9.5).
    expect(casualties(base)).toBe(9_000);
  });

  test('cada término escala lo que tiene que escalar', () => {
    expect(casualties({ ...base, attackers: 2_000 })).toBe(18_000);
    expect(casualties({ ...base, attackPower: 2_100 })).toBe(4_500);
    expect(casualties({ ...base, accuracy: 60 })).toBe(18_000);
    expect(casualties({ ...base, randomFactor: 0.25 })).toBe(4_500);
    expect(casualties({ ...base, efficiency: 50 })).toBe(4_500);
    expect(casualties({ ...base, defenderHitPoints: 140 })).toBe(4_500);
  });

  test('la resistencia se aplica como (1 − resistencia)', () => {
    expect(casualties({ ...base, resistance: 50 })).toBe(4_500);
    expect(casualties({ ...base, resistance: 100 })).toBe(0);
    expect(casualties({ ...base, resistance: 67 })).toBe(2_970);
  });

  test('las habilidades defensivas multiplican, y pueden empeorar', () => {
    expect(casualties({ ...base, defensiveMultiplier: 0.7 })).toBe(6_300);
    // weakness 2,0: el defensor recibe el doble.
    expect(casualties({ ...base, defensiveMultiplier: 2 })).toBe(18_000);
    // Se multiplican entre sí: healing 0,7 × scales 0,75 = 0,525.
    expect(casualties({ ...base, defensiveMultiplier: 0.7 * 0.75 })).toBe(4_725);
  });
});

describe('criterio 9 — todo entero, y con un solo redondeo', () => {
  test('las bajas son siempre un entero', () => {
    for (const accuracy of [7, 13, 29, 31, 97]) {
      for (const hp of [70, 180, 4_200]) {
        const n = casualties({ ...base, accuracy, defenderHitPoints: hp });
        expect(Number.isInteger(n), `acierto ${accuracy}, HP ${hp}`).toBe(true);
      }
    }
  });

  test('el redondeo va al final, no término a término', () => {
    // Si se redondease en cada paso, esto daría menos: cada término es
    // fraccionario y los errores se acumulan hacia abajo.
    const n = casualties({
      ...base,
      attackers: 3,
      attackPower: 101,
      accuracy: 7,
      randomFactor: 0.33,
      efficiency: 37,
      resistance: 13,
      defensiveMultiplier: 0.7,
      defenderHitPoints: 180,
    });
    const exacto =
      (3 * 101 * (7 / 100) * 0.33 * (37 / 100) * (1 - 13 / 100) * 0.7) / 180;
    expect(n).toBe(Math.floor(exacto));
  });

  test('el binario no muerde un entero de menos', () => {
    // **Encontrado al implementar, el 2026-09-21.** Con healing 0,7 y
    // scales 0,75 el multiplicador debería ser 0,525 y en binario sale
    // 0,52499999999999997, así que `Math.floor` daba **4.724** donde la
    // cuenta exacta da **4.725**. Un entero de menos, sin dar error, en un
    // número que el jugador ve dos veces: en la previsión y en el
    // resultado.
    expect(casualties({ ...base, defensiveMultiplier: 0.7 * 0.75 })).toBe(4_725);
    expect(casualties({ ...base, resistance: 67 })).toBe(2_970);
    // Y no es un caso aislado: los valores del original —0,7, 0,75, 0,8—
    // casi nunca son representables.
    for (const [mult, esperado] of [
      [0.7, 6_300],
      [0.8, 7_200],
      [0.7 * 0.8, 5_040],
      [0.75 * 0.8, 5_400],
      [0.7 * 0.75 * 0.8, 3_780],
    ] as const) {
      expect(casualties({ ...base, defensiveMultiplier: mult }), `mult ${mult}`).toBe(esperado);
    }
  });

  test('pero media baja SIGUE sin ser una baja', () => {
    // La corrección de arriba no puede convertirse en «redondear»: se pega
    // al entero solo cuando la distancia es error de representación.
    expect(casualties({ ...base, accuracy: 15, randomFactor: 0.5, attackers: 1, attackPower: 105 })).toBe(0);
    const casi = casualties({ ...base, attackers: 1, attackPower: 139, defenderHitPoints: 70 });
    expect(casi).toBe(0); // 1×139×0,3×0,5 = 20,85 / 70 = 0,29
  });

  test('trunca hacia abajo: media baja no es una baja', () => {
    // Un ataque que «casi» mata a uno **no mata a nadie**. Es lo correcto
    // con recursos enteros, y es lo que hace que picar con stacks
    // diminutos no sirva de nada.
    const n = casualties({ ...base, attackers: 1, attackPower: 1, defenderHitPoints: 4_200 });
    expect(n).toBe(0);
  });

  test('nunca sale negativo, por absurdos que sean los modificadores', () => {
    expect(casualties({ ...base, resistance: 150 })).toBe(0);
    expect(casualties({ ...base, efficiency: -20 })).toBe(0);
    expect(casualties({ ...base, accuracy: -5 })).toBe(0);
  });
});

describe('los casos de borde de la fórmula', () => {
  test('sin atacantes no hay bajas', () => {
    expect(casualties({ ...base, attackers: 0 })).toBe(0);
  });

  test('un defensor sin HP no revienta el cálculo', () => {
    // No debería pasar —ninguna ficha tiene HP 0— pero una división por
    // cero silenciosa daría `Infinity` y de ahí un ejército entero muerto.
    expect(casualties({ ...base, defenderHitPoints: 0 })).toBe(0);
  });

  test('con eficiencia 0 —fatiga total— no se hace daño', () => {
    expect(casualties({ ...base, efficiency: 0 })).toBe(0);
  });
});
