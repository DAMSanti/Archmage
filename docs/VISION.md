# Visión

Qué estamos construyendo, para quién, y qué haría que valiera la pena.

---

## 1. Qué es

Un **remake de The Reincarnation** (antes *Archmage*): un MMO de
navegador por temporadas donde cada jugador es un archimago que gestiona
un reino —tierra, población, economía, magia y ejército— y compite con
los demás por la tierra.

Lo que se conserva del original, que es lo que lo hacía adictivo:

- **El turno como moneda**, acumulándose hasta un tope. Entras dos veces
  al día, gastas lo que se ha acumulado, decides en qué. Quince minutos.
- **La tierra como recurso maestro**, y todo medido en porcentaje de
  ella. No hay una construcción óptima: hay un reparto.
- **Un ejército que se te cae si no puedes mantenerlo**, y que se puede
  caer por tres recursos distintos.
- **Seis escuelas de magia** con una rueda de adyacencia que decide qué
  puedes aprender.
- **PvP real**, con tres tipos de ataque que son tres decisiones.
- **Temporadas de ~3 meses** que terminan en Armageddon y borran a todos
  los magos.

Lo que se moderniza:

- **Una interfaz que te dice con claridad en qué estado estás.** El
  original es texto y tablas, y hace falta una hoja de cálculo al lado
  para dos cosas: saber cómo vas, y saber qué te convendría.
  **Quitamos la primera y dejamos la segunda**: cuánto maná neto te
  entra debería ser evidente; dónde está el reparto óptimo es el juego.
  Revisado el 2026-09-21, ver [INTERFAZ.md §1](INTERFAZ.md).
- **Combate que se puede ver, no solo leer.** Toda batalla guarda su
  semilla y se puede repetir ronda a ronda
  ([SISTEMAS.md §9](SISTEMAS.md)).
- **Funciona en el móvil**, que es donde se juegan de verdad los quince
  minutos.

---

## 2. Para quién

Tres personas, en este orden:

1. **Quien jugó Archmage o The Reincarnation** y lo recuerda con cariño.
   Sabe lo que es un node y un fort, y lo que quiere es volver a jugarlo
   sin la hoja de cálculo.
2. **Quien juega juegos de gestión por turnos** y nunca ha oído hablar de
   éste. Lo que le atrae es la decisión —en qué gasto el turno—, y lo que
   lo echaría atrás es tener que leer una wiki para empezar.
3. **Quien tiene quince minutos** y quiere un juego que respete que sean
   quince.

---

## 3. Lo que tiene que ser verdad para que funcione

- **Una sesión cabe en quince minutos** y deja al jugador con una
  decisión tomada, no con deberes.
- **El jugador puede reconstruir qué pasó.** Por qué se le disolvió un
  stack, por qué perdió la batalla, qué turno fue el que le dejó el
  ingreso en negativo. La crónica y la repetición de batalla guardan los
  hechos, y los hechos están completos.

  **Esto no es lo mismo que explicarle las reglas.** Que su ingreso de
  maná bajara al construir más nodes lo verá en el número; **por qué**
  bajó es algo que descubre jugando, no algo que le cuente un cartel
  (decisión del 2026-09-21, [INTERFAZ.md §1](INTERFAZ.md)). Aceptamos el
  coste que eso tiene: **quien ya conoce el juego arranca con ventaja**,
  igual que en el original. Lo que no aceptamos es que además tenga
  ventaja por ver mejor sus propios números.
- **Nada se compra con dinero real.** Ni turnos, ni recursos, ni ventaja.
  Está declarado fuera de alcance en [SISTEMAS.md §16](SISTEMAS.md).
- **Un mago nuevo puede empezar a mitad de temporada** y tener algo que
  hacer. El reset periódico existe justamente para eso.

---

## 4. Cómo llegamos

Por capas, no por trozos: el juego entero está diseñado desde el primer
día ([SISTEMAS.md](SISTEMAS.md)), y las fases construyen capas completas
de ese diseño. Es lo que evita que la fase 1 haya que rehacerla en la 3.

| Fase | Qué se puede hacer al acabarla |
|---|---|
| **1 — Reino** | Gestionar un reino: turnos, tierra, los ocho edificios, economía, población. |
| **2 — Magia** | Investigar, lanzar, encantar, invocar ejército. |
| **3 — Guerra** | Atacar a otro mago de las tres maneras, y defenderse. |
| **4 — Mundo** | Ranking, mercado negro, items, héroes, habilidades. |
| **5 — Temporada** | Gremios, aliados, diplomacia, Armageddon y reset. |

El detalle está en [ROADMAP.md](../ROADMAP.md).

---

## 5. De dónde viene esto

- El recuerdo del juego original, y la conversación que lo arrancó, en el
  PDF `Remake de The Reincarnation (ex-Archmage) — Documento de
  diseño.pdf` (2026-09-21).
- **La investigación del juego real**, que corrigió varias cosas de ese
  PDF: [ORIGINAL.md](ORIGINAL.md).
- Las decisiones de arquitectura que sustituyeron su §11:
  [ARQUITECTURA.md §8](ARQUITECTURA.md).
