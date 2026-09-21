/**
 * Crear un mago y comprobar que su tierra cuadra.
 *
 * Fuera de alcance: la elección de escuela y el nombre los valida la capa de
 * arriba; aquí se dan por buenos.
 */

import { BUILDINGS, type Buildings, type Construction, type MageState, type Specialty } from './types.js';
import type { MageId, ServerConfig } from './types.js';

/**
 * Lo que un mago nuevo recibe. Los números son **datos**
 * (docs/SISTEMAS.md §15), así que entran por parámetro desde
 * `@archmage/content` y no viven aquí.
 */
export interface StartingKingdom {
  land: number;
  buildings: Buildings;
  geld: number;
  mana: number;
  population: number;
}

export function emptyBuildings(): Buildings {
  return {
    farms: 0,
    towns: 0,
    nodes: 0,
    workshops: 0,
    barracks: 0,
    guilds: 0,
    forts: 0,
    barriers: 0,
  };
}

export function emptyConstruction(): Construction {
  return emptyBuildings();
}

export function totalBuildings(buildings: Buildings): number {
  let total = 0;
  for (const b of BUILDINGS) total += buildings[b];
  return total;
}

/**
 * `land.total = land.free + Σ buildings`, siempre.
 *
 * Invariante de docs/ARQUITECTURA.md §9.4. Construir, demoler y explorar son
 * las tres acciones que pueden romperlo, y lo romperían **sin dar error**.
 */
export function landIsConsistent(state: MageState): boolean {
  return state.land.total === state.land.free + totalBuildings(state.buildings);
}

export interface CreateMageArgs {
  id: MageId;
  name: string;
  specialty: Specialty;
  server: ServerConfig;
  starting: StartingKingdom;
  /** Epoch ms del alta. */
  now: number;
}

export function createMage(args: CreateMageArgs): MageState {
  const { id, name, specialty, server, starting, now } = args;
  const buildings = { ...starting.buildings };

  return {
    id,
    serverId: server.id,
    name,
    specialty,
    // El almacén de turnos, lleno: docs/SISTEMAS.md §15 [nuestro] — así la
    // primera sesión es una sesión de verdad y no una espera.
    turns: { current: server.turnCap, lastAccrualAt: now },
    turnsSpent: 0,
    land: { total: starting.land, free: starting.land - totalBuildings(buildings) },
    buildings,
    construction: emptyConstruction(),
    resources: {
      geld: starting.geld,
      mana: starting.mana,
      population: starting.population,
    },
    army: [],
    recruiting: null,
    spellbook: { known: [], researching: null, level: 0 },
    enchantments: [],
    heroes: [],
    items: {},
    skills: {},
  };
}

/** docs/SISTEMAS.md §15: la protección se mide en turnos **gastados**. */
export function isProtected(state: MageState, server: ServerConfig): boolean {
  return state.turnsSpent < server.protectionTurns;
}
