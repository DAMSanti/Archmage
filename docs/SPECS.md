# Specs — el contrato técnico

Corto a propósito. Aquí está lo que **no se puede cambiar sin avisar**:
la forma del estado, las acciones, el API, y los **invariantes** — las
cosas que se rompen **sin dar un error**.

Si vas a implementar algo, lee §5 entero antes de diseñar nada.

---

## 1. El estado de un mago

La unidad de estado es el **mago**, y es lo que se carga, se muta y se
guarda en una transacción. Forma del estado (los tipos vivos están en
`packages/core`):

```
MageState
├─ id, serverId, name, specialty            identidad; la escuela no cambia en la temporada
├─ turns: { current, lastAccrualAt }        §3 — el reloj solo toca esto
├─ turnsSpent: number                       turnos gastados; de aquí sale la protección
├─ land: { total, free }                    acres; total = free + Σ buildings, SIEMPRE
├─ buildings: { farms, towns, nodes, workshops,
│                barracks, guilds, forts, barriers }
├─ construction: Record<Building, number>   fracciones pendientes en punto fijo, §4
├─ resources: { geld, mana, population }     ENTEROS, siempre
├─ army: Stack[]                            { unitId, count, heroId? }
├─ recruiting: Recruiting | null            { unitId, remaining, perTurn }
├─ spellbook: { known: SpellId[], researching, level }
├─ enchantments: Enchantment[]              con su upkeep
├─ heroes: Hero[]
├─ items: Record<ItemId, number>
└─ skills: Record<SkillId, level>           0-20
```

> **Tres correcciones del 2026-09-21**, salidas de planear la fase 1
> ([ARQUITECTURA.md §9.1](ARQUITECTURA.md)). Lo que este documento decía
> antes, y por qué cambió:
>
> 1. **Había `protectedUntil?`**, que sugiere un instante. La protección
>    se mide en **turnos gastados**
>    ([SISTEMAS.md §15](SISTEMAS.md)), así que ahora hay un contador
>    `turnsSpent` y la protección es `turnsSpent < protectionTurns`.
>    Quien leyera `protectedUntil` como fecha se equivocaba.
> 2. **No había dónde guardar el reclutamiento en curso**, aunque
>    `SetRecruit` estaba listada como acción de fase 1 y en el original la
>    tropa **llega poco a poco**. Se añade `recruiting`.
> 3. **`food` estaba en `resources`** y a la vez `SISTEMAS.md §5.4` la
>    modela como capacidad derivada de las farms. Las dos no podían ser
>    verdad: **la comida sale de `resources`** y es un tope calculado, no
>    un recurso guardado. **Nos separa del original**, que sí tiene
>    almacén de comida.
>
> También sale `assignment`, que era de la fase 3 y no pintaba nada en
> una lista encabezada por la fase 1; vuelve cuando exista el combate.

**Lo que NO está en el estado del mago**, porque es del mundo y no suyo:
el ranking, el mercado negro, los gremios, la crónica global y la
temporada. Van en sus propias tablas.

---

## 2. Acciones

Todo lo que un jugador puede hacer es una **acción**, y todas pasan por
la misma puerta:

```ts
apply(state: MageState, action: Action, ctx: Ctx): Result
```

- `Ctx` lleva **el tiempo y el azar** (`now`, `random: RandomSource`) y
  el catálogo de contenido. **Nunca los coge el núcleo por su cuenta**
  (§5).
- `Result` es `{ state, events }` o `{ error }`. No hay tercera forma, y
  **no hay mutación en sitio**.

Acciones de la fase 1: `Build`, `Demolish`, `Explore`, `SetRecruit`,
`ChargeMana`, `ChargeGeld`.
Fase 2: `Research`, `CastSpell`, `DispelEnchantment`.
Fase 3: `Attack` (regular / siege / pillage), `SetAssignment`.
Fase 4: `UseItem`, `MarketBid`, `TrainSkill`, `AssignHero`.
Fase 5: gremios, aliados, diplomacia.

---

## 3. El devengo de turnos

**No hay un proceso periódico que recorra magos.** Los turnos son una
función pura:

```
accrue(turns, lastAccrualAt, now, rate, cap) -> { turns, lastAccrualAt }
```

Se calcula **al leer** el estado y **se persiste en la misma transacción**
que la acción que los gasta. El razonamiento completo está en
[ARQUITECTURA.md §4](ARQUITECTURA.md).

Los **únicos** procesos programados del sistema, y todos **idempotentes**:

| Proceso | Cuándo | Qué hace |
|---|---|---|
| Cierre de temporada | fin de temporada **[F5]** | Armageddon, Hall of Fame, reset de magos. |
| Subastas del mercado | cadencia del mercado **[F4]** | Resuelve pujas cerradas. |
| Instantánea de ranking | diaria **[F4]** | Congela la clasificación del día. |

Añadir un proceso programado **es un cambio de contrato**: se discute
aquí primero.

---

## 4. Reglas de datos

- **Todos los recursos son enteros.** `geld`, `mana`, `population` y
  `land`. En base de datos, `bigint`. *(`food` salió de la lista el
  2026-09-21: es capacidad derivada, no un recurso guardado — ver §1.)*
- **Las fracciones de construcción se guardan aparte**, en
  `construction`, y ahí sí hay decimales — en punto fijo, con 4
  decimales, no en coma flotante.
- **El contenido es dato.** Hechizos, unidades, edificios, items, héroes
  y habilidades viven en `packages/content` con esquema Zod, y el
  catálogo entero se valida en un test. Añadir contenido **no toca
  código**.
- **Las migraciones son aditivas**: columna nueva con su `DEFAULT`, nunca
  se rompe hacia atrás, y lo que deja de usarse no se borra durante una
  temporada viva.

---

## 5. Invariantes

**Las cosas que se rompen sin dar un error.** Un test en verde no las
protege; solo las protege saberlas.

1. **`packages/core` no importa nada.** Ni `node:*`, ni una librería de
   fechas, ni `fetch`. Si su `package.json` gana una dependencia, algo se
   ha diseñado mal. Sin esto, el cliente no puede previsualizar y todo el
   argumento de [ARQUITECTURA.md §1](ARQUITECTURA.md) se cae.

2. **El núcleo no llama a `Date.now()` ni a `Math.random()`.** El tiempo
   y el azar entran por `Ctx`. Romperlo no da error: da tests que pasan
   hoy y fallan el martes, y batallas que no se pueden reproducir.

3. **Todo azar sale del `RandomSource`, y la semilla se guarda.** Una
   batalla, un colapso de stacks por falta de maná, la generación de un
   item: todo tiene que poder repetirse exacto. Si algo consume azar sin
   pasar por ahí, la repetición que se le enseña al jugador **miente**, y
   miente en silencio.

   **Y hay una sola implementación**, en `packages/core/src/random.ts`.
   Añadido el 2026-09-21 tras un fallo real: había tres copias de un
   xorshift32 sembrado directamente, y **con semillas pequeñas las
   primeras tiradas salían casi cero**. Con semilla 1 la primera valía
   0,00006, así que toda comprobación del tipo «¿sale menos que el
   umbral?» —fallar un hechizo, acertar un golpe— **se cumplía siempre**.
   Un hechizo con 30% de fallo fallaba cinco de cada cinco veces, y el
   juego habría parecido amañado contra el jugador. Ningún test de
   entonces se puso en rojo.

   Que sea determinista **no basta**: tiene que estar bien distribuido
   desde la primera tirada. `random.test.ts` lo comprueba con 200
   semillas.

4. **El estado y sus eventos se guardan en la misma transacción.** Si se
   guarda el estado sin los eventos, la crónica pierde un hecho y nadie
   se entera hasta que un jugador pregunta por qué perdió un ejército.

5. **El servidor es autoritativo.** Lo que el cliente calcula es
   **previsión**. Ninguna ruta acepta un resultado calculado por el
   cliente, ni siquiera «para ir más rápido».

6. **Dos acciones sobre el mismo mago se serializan.** Se carga con
   bloqueo de fila. Dos ataques simultáneos al mismo defensor resueltos
   sobre el mismo estado de partida duplican el botín, y el saldo cuadra
   igualmente: no salta ninguna alarma.

7. **Los recursos no se van por debajo de cero por redondeo.** Toda
   fórmula con división redondea **en un solo sitio documentado**. El
   mismo cálculo tiene que dar el mismo número en el servidor y en el
   cliente, o la previsión y el resultado se separan.

8. **Ningún endpoint lleva reglas de juego.** Valida, carga, llama a
   `core.apply()`, guarda, responde. Una fórmula dentro de una ruta es
   una fórmula que el cliente no puede usar y que nadie va a probar con
   un test barato.

9. **Un error de dominio es un 422 con su código**, no un 500. «No tienes
   maná» es juego, no avería.

10. **La escuela de un mago no cambia durante la temporada**, y la lista
    de edificios y de escuelas está cerrada
    ([SISTEMAS.md §4, §6](SISTEMAS.md)).

11. **`land.total = land.free + Σ buildings`, siempre.** Añadido el
    2026-09-21: se daba por obvio y por eso no estaba escrito, que es
    justo como se rompen estas cosas. Construir, demoler y explorar son
    las tres acciones que pueden romperlo, y lo romperían **sin dar
    error**: el mago seguiría jugando con acres que no existen. Va
    comprobado con un test de propiedad sobre secuencias de acciones.

12. **Una medida que depende del catálogo lo recibe como parámetro
    obligatorio.** Añadido el 2026-09-21 (fase 3). `netPower()` vivía con
    una sola firma, `netPower(state)`, y dejaba el ejército fuera porque
    el rango de poder de cada unidad todavía no se conocía. Cuando se
    conoció, la tentación era añadir un catálogo **opcional** para no
    romper a nadie — y eso habría dejado a quien lo olvidara con un net
    power sin ejército **y sin enterarse**. Es el fallo de la clase que
    esta lista recoge: no da error, solo da un número más pequeño.

    La regla: si una función del núcleo necesita el catálogo para dar un
    resultado completo, **lo pide y rompe la compilación**. Los dos
    únicos sitios que la llamaban se arreglaron en un minuto; el fallo
    silencioso habría durado una fase entera. Ya pasó una vez: el
    ejército no contaba desde la fase 1, y la fase 2 dedujo de ahí que
    invocar era una trampa ([SISTEMAS.md §7.1](SISTEMAS.md)).

---

## 6. API

**Cerrado el 2026-09-21** al implementar la fase 1. Las rutas que hay:

| Ruta | Qué hace |
|---|---|
| `GET /api/health` | Comprobación de vida. |
| `GET /api/catalog` | El catálogo entero: ocho edificios y cinco tropas. |
| `GET /api/mage/me` | El estado **ya devengado**, más `derived` y la configuración del servidor. |
| `POST /api/mage/me/actions` | **Una** acción. Devuelve estado nuevo, `derived` y **los eventos**. |
| `GET /api/mage/me/chronicle` | La crónica, de lo más reciente a lo más antiguo. |

**`derived`** lleva todo lo que la interfaz necesita y **no debe recalcular
por su cuenta**: ingreso, upkeep, ingreso neto, almacén de maná, capacidad
de población, net power, y la cuenta atrás al siguiente turno. Si un día
hace falta un número que no está ahí, **la función falta en
`packages/core`** — no se calcula en el cliente.

Códigos: **400** si la petición no valida contra el esquema Zod, **422**
con su código si es un error de dominio, **404** si el mago no existe.

**[abierto]** Autenticación y WebSocket. La fase 1 trabaja con **un mago
fijo** de desarrollo, y no hay avisos en vivo porque todavía no hay nada
que avisar. Los dos llegan con el PvP, en la fase 3.

Las reglas que ya estaban fijadas y se han respetado:

- **HTTP para el estado y las acciones.** `GET /mage/me` devuelve el
  estado **ya devengado** (§3). `POST /mage/me/actions` recibe **una**
  acción.
- **WebSocket solo para avisos**: «te han atacado», «ha terminado la
  investigación», crónica en vivo. **Nunca para el estado**: quien recibe
  un aviso pide el estado.
- **Un esquema Zod por endpoint y por mensaje**, en
  `packages/contract`. El servidor valida con él y el cliente deriva sus
  tipos de él, así que un cambio de contrato rompe la compilación de los
  dos lados a la vez. Eso es lo que queremos.
- **Toda respuesta de acción devuelve el estado nuevo y los eventos**,
  para que el cliente no tenga que adivinar qué cambió.

---

## 7. Cómo cambiar este documento

Un cambio aquí **es un cambio de contrato**. Dilo explícitamente en el
plan (`/plan-tarea`), di qué se rompe, y **corrige lo que este documento
afirmaba antes diciendo qué decía y por qué cambió**. Los invariantes de
§5 no se tocan sin discutirlo: cada uno está ahí porque su ausencia falla
en silencio.
