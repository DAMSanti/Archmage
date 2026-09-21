/**
 * La pre-batalla: lo que pasa **antes de la primera ronda**.
 *
 * [docs/ORIGINAL.md §9.4](../../../docs/ORIGINAL.md) describe tres fases —
 * pre-batalla con hechizos, items y **daño previo**; batalla; post-batalla
 * con resurrección—, y `battle.ts` dejó los dos huecos declarados desde la
 * fase 3. Esto los rellena.
 *
 * **La idea entera, y es la que hay que no perder:** un item de batalla
 * **no toca la fórmula de daño**. Modifica el *ejército* —su ataque, sus
 * resistencias, su iniciativa— y la ronda pelea con un ejército ya
 * modificado. Si un item se colara dentro de `casualties()` haría un
 * segundo redondeo y rompería el invariante 7 (docs/SPECS.md §5); si en
 * lugar de eso cambia la ficha de la unidad, la fórmula sigue teniendo un
 * solo `floor` y sigue sin saber que los items existen.
 *
 * **Y las fichas no se mutan.** Cada bando entra con una copia de sus
 * unidades: el catálogo es compartido y una batalla no puede dejar al
 * Treant del mundo con un +20% permanente.
 *
 * Fuera de alcance aquí:
 *  - **Los hechizos de pre-batalla** y las tres resistencias que tiene que
 *    pasar el del atacante (barrier, color y unidad). Fase 4 no trae
 *    hechizos de batalla.
 *  - **Los items de *assignment***, que ya se disparan solos desde la fase
 *    3: aquí se aplican igual que los que se usan a mano.
 */

import type { ItemEffect, ItemSide, ItemSpec } from './items.js';
import { rollRange } from './items.js';
import type { BattleStack } from './combat.js';
import type { RandomSource } from './types.js';
import type { DamageType, UnitSpec } from './units.js';

/** Un bando ya preparado para pelear, con sus stacks modificados. */
export interface PreparedSide {
  stacks: BattleStack[];
  /** Porción de bajas que resucita al acabar. Se acumula multiplicando. */
  resurrectShares: number[];
  /** Puntos de acierto que suma o resta a todos sus golpes. */
  accuracyDelta: number;
  /** Puntos de eficiencia que suma o resta. */
  efficiencyDelta: number;
}

/** Qué pasó en la pre-batalla, para el log. */
export interface PreBattleEvent {
  itemId: string;
  side: ItemSide;
  detail: string;
  casualties?: number;
}

export interface PreBattleResult {
  attacker: PreparedSide;
  defender: PreparedSide;
  events: PreBattleEvent[];
}

function vacio(stacks: readonly BattleStack[]): PreparedSide {
  // Copia honda de la ficha: el catálogo es compartido.
  return {
    stacks: stacks.map((s) => ({
      unit: {
        ...s.unit,
        attack: { ...s.unit.attack, types: [...s.unit.attack.types] },
        ...(s.unit.extraAttack
          ? { extraAttack: { ...s.unit.extraAttack, types: [...s.unit.extraAttack.types] } }
          : {}),
        resistances: { ...s.unit.resistances },
        abilities: [...s.unit.abilities],
        weaknesses: [...s.unit.weaknesses],
      },
      count: s.count,
    })),
    resurrectShares: [],
    accuracyDelta: 0,
    efficiencyDelta: 0,
  };
}

const ENTEROS = (x: number) => Math.floor(x);

/**
 * Prepara los dos bandos aplicando sus items.
 *
 * `attackerItems` y `defenderItems` son los que **cada uno lleva**; el
 * orden en que se aplican es el de la lista, y es determinista a propósito:
 * un *Oil Flasks* antes o después de un *Scroll of Protection* da el mismo
 * resultado porque los dos suman, pero un tope de 100 sí depende del orden,
 * y una batalla tiene que poder repetirse (invariante 3).
 */
export function prepareBattle(
  attacker: readonly BattleStack[],
  defender: readonly BattleStack[],
  attackerItems: readonly ItemSpec[],
  defenderItems: readonly ItemSpec[],
  random: RandomSource,
): PreBattleResult {
  const lados = { attacker: vacio(attacker), defender: vacio(defender) };
  const events: PreBattleEvent[] = [];

  const aplicar = (quien: 'attacker' | 'defender', items: readonly ItemSpec[]) => {
    const mio = lados[quien];
    const suyo = quien === 'attacker' ? lados.defender : lados.attacker;
    for (const item of items) {
      const ev = aplicarEfecto(item.effect, mio, suyo, random);
      if (ev) events.push({ itemId: item.id, side: 'friendly', ...ev });
    }
  };
  aplicar('attacker', attackerItems);
  aplicar('defender', defenderItems);

  return { attacker: lados.attacker, defender: lados.defender, events };
}

function objetivo(efecto: { side?: ItemSide }, mio: PreparedSide, suyo: PreparedSide) {
  return efecto.side === 'enemy' ? suyo : mio;
}

function aplicarEfecto(
  e: ItemEffect,
  mio: PreparedSide,
  suyo: PreparedSide,
  random: RandomSource,
): Omit<PreBattleEvent, 'itemId' | 'side'> | null {
  switch (e.kind) {
    case 'ap': {
      const lado = objetivo(e, mio, suyo);
      let tocados = 0;
      for (const s of lado.stacks) {
        if (e.race && s.unit.race !== e.race) continue;
        if (e.damageType && !s.unit.attack.types.includes(e.damageType)) continue;
        s.unit.attack.power = ENTEROS(s.unit.attack.power * e.multiplier);
        if (s.unit.extraAttack) {
          s.unit.extraAttack.power = ENTEROS(s.unit.extraAttack.power * e.multiplier);
        }
        s.unit.counterAttack = ENTEROS(s.unit.counterAttack * e.multiplier);
        tocados++;
      }
      return { detail: `ataque ×${e.multiplier} en ${tocados} stacks` };
    }
    case 'hp': {
      const lado = objetivo(e, mio, suyo);
      for (const s of lado.stacks) s.unit.hitPoints = ENTEROS(s.unit.hitPoints * e.multiplier);
      return { detail: `HP ×${e.multiplier}` };
    }
    case 'resistance': {
      const lado = objetivo(e, mio, suyo);
      for (const s of lado.stacks) ajustarResistencia(s.unit, e.damageType, e.delta, e.cap);
      return { detail: `resistencia ${e.delta > 0 ? '+' : ''}${e.delta}` };
    }
    case 'resistanceSpread': {
      const lado = objetivo(e, mio, suyo);
      if (lado.stacks.length === 0) return null;
      // **Repartido entre los stacks**: contra veinte stacks hace un 1% a
      // cada uno. Premia atacar a quien concentra su ejército.
      const porStack = e.delta / lado.stacks.length;
      for (const s of lado.stacks) ajustarResistencia(s.unit, undefined, porStack);
      return { detail: `${e.delta} de resistencia repartido entre ${lado.stacks.length} stacks` };
    }
    case 'initiativeSet': {
      const lado = objetivo(e, mio, suyo);
      const objetivos = e.randomStack ? unoAlAzar(lado.stacks, random) : lado.stacks;
      for (const s of objetivos) {
        s.unit.attack.initiative = e.value;
        if (s.unit.extraAttack) s.unit.extraAttack.initiative = e.value;
      }
      return { detail: `iniciativa = ${e.value} en ${objetivos.length} stacks` };
    }
    case 'initiativeDelta': {
      const lado = objetivo(e, mio, suyo);
      for (const s of lado.stacks) {
        s.unit.attack.initiative = Math.max(0, s.unit.attack.initiative + e.delta);
      }
      return { detail: `iniciativa ${e.delta}` };
    }
    case 'grantFlying': {
      const lado = objetivo(e, mio, suyo);
      let tocados = 0;
      for (const s of lado.stacks) {
        if (s.unit.abilities.includes('flying')) continue;
        (s.unit.abilities as string[]).push('flying');
        tocados++;
      }
      return { detail: `vuelan ${tocados} stacks` };
    }
    case 'ground': {
      const lado = objetivo(e, mio, suyo);
      const [s] = unoAlAzar(lado.stacks, random);
      if (!s) return null;
      const volaba = s.unit.abilities.includes('flying');
      s.unit.abilities = s.unit.abilities.filter((a) => a !== 'flying');
      if (volaba) {
        s.unit.attack.initiative = Math.max(0, s.unit.attack.initiative + e.initiativeDelta);
      }
      return { detail: `${s.unit.id} aterrizado${volaba ? ' y ralentizado' : ''}` };
    }
    case 'directDamage': {
      const lado = suyo;
      let total = 0;
      for (const s of lado.stacks) {
        // `base + azar(1..3) × unidades`, tal cual lo publica la fuente.
        const dano = e.base + rollRange(e.perUnit, random) * s.count;
        total += matar(s, dano, e.damageType);
      }
      return { detail: `daño de ${e.damageType}`, casualties: total };
    }
    case 'damageToRace': {
      let total = 0;
      for (const s of suyo.stacks) {
        if (s.unit.race !== e.race) continue;
        total += matar(s, e.damage, e.damageType);
      }
      return { detail: `daño de ${e.damageType} a ${e.race}`, casualties: total };
    }
    case 'destroyUnits': {
      const lado = objetivo(e, mio, suyo);
      const [s] = unoAlAzar(lado.stacks, random);
      if (!s) return null;
      const n = Math.min(s.count, rollRange(e.amount, random));
      s.count -= n;
      return { detail: `${s.unit.id} pierde unidades`, casualties: n };
    }
    case 'heal': {
      const lado = objetivo(e, mio, suyo);
      const cura = rollRange(e.perUnit, random);
      for (const s of lado.stacks) s.unit.hitPoints += cura;
      return { detail: `+${cura} HP por unidad` };
    }
    case 'resurrect': {
      mio.resurrectShares.push(e.share);
      return { detail: `resucita el ${Math.round(e.share * 100)}% de las bajas` };
    }
    case 'accuracy': {
      mio.accuracyDelta += e.delta;
      // **A los dos bandos**: un item que también te perjudica.
      if (e.bothSides) suyo.accuracyDelta += e.delta;
      return { detail: `acierto ${e.delta}${e.bothSides ? ' a los dos bandos' : ''}` };
    }
    case 'efficiency': {
      objetivo(e, mio, suyo).efficiencyDelta += e.delta;
      return { detail: `eficiencia ${e.delta}` };
    }
    case 'addDamageType': {
      const lado = objetivo(e, mio, suyo);
      let tocados = 0;
      for (const s of lado.stacks) {
        if (!s.unit.attack.types.includes(e.ifHas)) continue;
        if (s.unit.attack.types.includes(e.add)) continue;
        s.unit.attack.types = [...s.unit.attack.types, e.add];
        tocados++;
      }
      return { detail: `+${e.add} en ${tocados} stacks` };
    }
    case 'summonTemporary': {
      // Se añaden al bando y **no salen del estado del mago**: `resolveBattle`
      // devuelve supervivientes por unidad, y quien guarde el resultado debe
      // ignorar los temporales. Es responsabilidad de `war.ts`.
      return { detail: `invoca ${e.count} temporales de ${e.unitId}` };
    }
    default:
      // Los de fuera de batalla no pintan nada aquí.
      return null;
  }
}

function ajustarResistencia(
  unit: UnitSpec,
  tipo: DamageType | undefined,
  delta: number,
  cap?: number,
): void {
  const tipos: DamageType[] = tipo
    ? [tipo]
    : (Object.keys(unit.resistances) as DamageType[]).concat(
        // Si no tiene ninguna declarada, bajarle «todas» no puede hacer nada;
        // y subírselas sí, así que se aplica sobre las que tenga más el tipo
        // pedido. Sin esto, un Pixie Dust contra una unidad sin resistencias
        // parecería no funcionar y en realidad es que no había qué bajar.
        [],
      );
  for (const t of tipos) {
    const base = unit.resistances[t] ?? 0;
    const nuevo = base + delta;
    unit.resistances[t] = cap === undefined ? nuevo : Math.min(cap, nuevo);
  }
}

/** Mata unidades enteras con un daño, y devuelve cuántas cayeron. */
function matar(s: BattleStack, dano: number, _tipo: DamageType): number {
  if (s.unit.hitPoints <= 0) return 0;
  // **Un solo `floor`**, como en `casualties()`: el daño directo es la misma
  // clase de cuenta y no puede redondear distinto (invariante 7).
  const bajas = Math.min(s.count, Math.floor(dano / s.unit.hitPoints));
  s.count -= bajas;
  return bajas;
}

function unoAlAzar(stacks: BattleStack[], random: RandomSource): BattleStack[] {
  const vivos = stacks.filter((s) => s.count > 0);
  if (vivos.length === 0) return [];
  return [vivos[random.nextInt(vivos.length)]!];
}

/**
 * Cuántas bajas resucitan al acabar.
 *
 * **Se combinan multiplicando los complementos**, no sumando
 * (docs/ORIGINAL.md §9.4): 30% + 20% + 25% da `1 − (0,70 × 0,80 × 0,75) ≈
 * 58%`, no 75%. Es lo que impide que apilar tres efectos resucite al
 * ejército entero.
 */
export function resurrected(losses: number, shares: readonly number[]): number {
  let complemento = 1;
  for (const s of shares) complemento *= 1 - s;
  return Math.floor(losses * (1 - complemento));
}
