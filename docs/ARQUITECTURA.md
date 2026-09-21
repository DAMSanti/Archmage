# Arquitectura

Cómo está montado el repositorio, con qué se construye, y **cómo se
comprueba que algo funciona**. Si vas a escribir código, éste y
[SPECS.md](SPECS.md) son los dos que tienes que haber leído.

Decidido el **2026-09-21**, revisando y sustituyendo la §11 del documento
de diseño en PDF. Qué proponía el PDF y por qué no: §8.

---

## 1. La decisión de fondo

**Las reglas del juego son una función pura, y viven en un sitio.**

```
estado del mago + acción + fuentes (tiempo, azar) → estado nuevo + eventos
```

Todo lo demás —la base de datos, el HTTP, React, los WebSockets— es
entrada y salida alrededor de esa función. No hay reglas de juego en un
endpoint, ni en un componente, ni en una consulta SQL.

Esto no es purismo. Es lo que hace posibles tres cosas concretas que este
juego necesita:

1. **El servidor manda.** Es un PvP por temporadas con un ranking: el
   estado tiene que ser autoritativo y el cliente no puede ser creíble.
2. **El cliente puede previsualizar.** *«Si ataco a este mago con estos
   stacks, esto es lo que pasa»* se calcula en el navegador con **el mismo
   código** que lo resolverá de verdad en el servidor. Ésta es la razón
   principal de que todo el repo sea TypeScript: en cualquier otra
   combinación, esa simulación se escribe dos veces y las dos versiones
   se separan.
3. **El balance se puede medir sin jugar.** Una temporada simulada son
   miles de batallas contra la función pura, en segundos, sin levantar
   nada.

---

## 2. Stack

| Capa | Qué | Por qué |
|---|---|---|
| Lenguaje | **TypeScript**, en todo el repo | Un solo lenguaje permite compartir el núcleo de reglas entre servidor y navegador. Ver §1. |
| Núcleo de reglas | TS puro, **sin dependencias** | Sin DOM, sin Node, sin red, sin base de datos. Ver §3. |
| Servidor | **Fastify** sobre Node | Ligero, tipado de verdad con esquemas, y rápido para un endpoint que sobre todo lee estado y aplica una acción. |
| Base de datos | **PostgreSQL** | Transacciones reales y bloqueo por fila, que es lo que exige que dos ataques simultáneos al mismo mago no se pisen. |
| Acceso a datos | **Drizzle ORM** + SQL cuando haga falta | Esquema tipado y migraciones versionadas, sin esconder el SQL cuando la consulta importa. |
| Cliente | **React + Vite** | Un juego de gestión es paneles, listas, contadores y estados de interfaz. Es justo donde React paga. |
| Tiempo real | **WebSocket** | Para «te han atacado» y para la crónica. No para el estado, que se pide por HTTP. |
| Validación | **Zod**, compartido | Un esquema define a la vez el tipo TypeScript, la validación del servidor y la del cliente. |
| Tests | **Vitest** | Mismo runner en los tres paquetes, y corre el núcleo puro a velocidad de función. |
| Paquetes | **pnpm workspaces** | Lo mínimo que hace falta para compartir código entre servidor y cliente. |

---

## 3. Cómo está troceado

```
archmage/
├─ packages/
│  ├─ core/        Las reglas. TypeScript puro, cero dependencias.
│  ├─ content/     Los datos del juego: hechizos, unidades, edificios, items, héroes.
│  └─ contract/    Los esquemas Zod del API. Los comparten servidor y cliente.
├─ apps/
│  ├─ server/      Fastify + Postgres. Autoritativo.
│  └─ web/         React + Vite.
└─ docs/
```

### `packages/core` — las reglas

Es el paquete importante y el que tiene las reglas más estrictas:

- **No importa nada.** Ni `node:*`, ni `fetch`, ni una librería de
  fechas. Si el `package.json` de `core` gana una dependencia, párate y
  pregunta por qué.
- **No llama a `Date.now()` ni a `Math.random()`.** El tiempo y el azar
  **entran como parámetro**. Ver los invariantes de
  [SPECS.md §4](SPECS.md).
- Expone una forma y solo una:

  ```ts
  apply(state: MageState, action: Action, ctx: Ctx): Result
  // Result = { state: MageState, events: GameEvent[] } | { error: DomainError }
  ```

- Y las funciones de consulta que la interfaz necesita para enseñar
  números sin mutar nada: `income(state)`, `upkeep(state)`,
  `buildRate(state)`, `previewBattle(attacker, defender, ctx)`.

### `packages/content` — los datos

Hechizos, unidades, edificios, items y héroes son **ficheros de datos con
su esquema Zod**, no código. Añadir un hechizo nuevo es añadir una
entrada, y el test que valida el catálogo entero lo comprueba solo.

Cada entrada lleva **de dónde sale su número**: del juego original con su
nivel de confianza (ver [ORIGINAL.md](ORIGINAL.md)), o decisión nuestra
con su porqué. Esto no es adorno: es lo único que permite rebalancear sin
romper la fidelidad sin querer.

### `packages/contract` — el API

Un esquema Zod por endpoint y por mensaje de WebSocket. El servidor
valida la entrada con él; el cliente deriva sus tipos de él. **Un cambio
de contrato es un cambio en este paquete**, y rompe la compilación de los
dos lados a la vez — que es exactamente lo que queremos que pase.

### `apps/server` — el árbitro

Valida, carga el estado, llama a `core.apply()`, guarda el estado nuevo y
los eventos **en la misma transacción**, y responde. No lleva reglas. Si
te encuentras calculando ingreso o daño en una ruta, esa lógica va a
`core`.

### `apps/web` — la interfaz

Pinta, y usa `core` para previsualizar. **Nunca decide**: lo que enseña
como previsión lo confirma el servidor.

---

## 4. El tiempo: no hay cron

Ésta es la decisión no obvia, y merece que la entiendas antes de tocar
nada del devengo de turnos.

**Lo único que hace el reloj es producir turnos.** Y el número de turnos
que tiene un mago en un instante es una función pura de tres cosas: el
momento del último devengo, el momento actual y la cadencia del servidor,
topada al máximo acumulable.

Así que **no hay un proceso que recorra todos los magos cada N minutos**.
Los turnos se devengan **al leer el estado**, y se persiste el devengo en
la misma transacción que la acción que los gasta.

Todo lo demás del juego avanza **al gastar turnos**, no con el reloj:
la investigación, el reclutamiento en curso, los hechizos con *cast
turn*, el ingreso de geld, maná y población, la generación de items y de
puntos de habilidad. Ése es el modelo del original
([ORIGINAL.md §2](ORIGINAL.md)) y resulta que también es el que escala:
mil magos dormidos no cuestan nada.

**Lo único que sí necesita un proceso programado** son los eventos del
mundo, que no cuelgan de ningún mago: el cierre de la temporada
(Armageddon), las subastas del mercado negro, y la instantánea diaria del
ranking. Son pocos, están enumerados en [SPECS.md](SPECS.md), y cada uno
tiene que ser **idempotente**: ejecutarlo dos veces no puede cambiar el
resultado.

> Si alguna vez te ves escribiendo «un tick que recorre los magos»,
> vuelve aquí. Casi siempre lo que hace falta es una función del tiempo
> transcurrido.

---

## 5. Convenciones

- **Nada de coma flotante en recursos.** Geld, maná, población, tierra y
  acres son **enteros**. Los porcentajes y las fórmulas con divisiones se
  calculan con enteros o punto fijo, y se redondea **en un solo sitio
  documentado** por fórmula. Un juego de ranking donde el mismo cálculo
  da dos resultados según el orden de las sumas no tiene ranking.
- **Todo azar sale de un `RandomSource` con semilla**, nunca de
  `Math.random()`. La semilla de cada batalla **se guarda con el
  resultado**, así que cualquier batalla se puede volver a jugar exacta.
  Es lo que hace depurable el combate y lo que permite enseñarle al
  jugador la repetición.
- **Toda mutación produce eventos.** El estado nuevo y sus eventos se
  guardan juntos o no se guarda ninguno. La crónica, los avisos y la
  auditoría salen de ahí — no se reconstruyen mirando el estado.
- **Las migraciones son aditivas.** Se añaden columnas con su `DEFAULT`;
  no se borra lo que dejó de usarse durante una temporada viva.
- **El comentario dice el porqué y de dónde sale el número**, no lo que
  hace la línea. Si la cifra viene del original, va la fuente y el nivel
  de confianza; si es nuestra, va el porqué y qué se midió.
- **Lo que dejes fuera, escríbelo en el docstring del módulo**, en un
  bloque de *fuera de alcance*. Un hueco declarado es deuda; uno callado
  es un fallo esperando a una temporada real.
- **Un error de dominio es un 422**, con su código, no un 500. «No tienes
  maná suficiente» es una respuesta normal del juego.
- **Español en la documentación, inglés en el código.** Los nombres del
  dominio se quedan **como en el original**: `geld`, `mana`, `node`,
  `fort`, `barrier`, `stack`, `upkeep`, `pillage`. No los traduzcas: la
  wiki del original es parte de la documentación de este proyecto.

---

## 6. Cómo se comprueba

**Elige el instrumento más barato que conteste la pregunta.** Aquí la
diferencia entre el barato y el caro es de órdenes de magnitud:

| Instrumento | Coste | Contesta |
|---|---|---|
| `vitest packages/core` | **milisegundos** | Cualquier regla del juego. |
| Validar el catálogo de `content` | milisegundos | Que un dato nuevo no rompe nada. |
| Simular una temporada contra `core` | segundos | Balance, curvas, si una estrategia domina. |
| `vitest apps/server` con Postgres de test | segundos | Transacciones, concurrencia, contratos. |
| `tsc -b` en todo el repo | ~segundos | Que el contrato cuadra en los dos lados. |
| Navegador | minutos, **turno exclusivo** | Solo: qué se ve y si se puede pinchar. |

Y las reglas que se siguen de la tabla:

- **Una regla del juego se comprueba con un test del núcleo**, no jugando
  una partida. Si la pregunta es «¿cuánto maná produce un mago con 12% de
  nodes?», eso es una función pura y una aserción.
- **Un estado lejano se construye, no se simula.** Para ver qué pasa con
  un mago a cero de geld, con 3 forts y 40.000 unidades, **se escribe ese
  estado** y se aplica una acción. Nadie tiene que jugar hasta llegar.
- **Una batalla se comprueba con su semilla.** Fija la semilla, afirma el
  resultado. Un test de combate que no fija la semilla es un test
  intermitente disfrazado.
- **El navegador solo si la pregunta es visual.** Todo lo demás se
  contesta antes y más barato.
- **Compilar no es funcionar.** Si el cambio toca algo que se ve, míralo.

**TDD en `packages/core`, sin excepciones**: el test se escribe primero y
**tiene que fallar antes del cambio**. Si no consigues que falle, todavía
no entiendes lo que vas a implementar.

---

## 7. Fases

Lo que hay en [ROADMAP.md](../ROADMAP.md) con detalle; aquí solo el
principio que las ordena: **el núcleo primero, y el juego completo por
capas, no por trozos**.

| Fase | Qué |
|---|---|
| **1 — Reino** | Núcleo, contenido, servidor y cliente con un mago: turnos, tierra, los ocho edificios, economía, población. Sin combate y sin magia. |
| **2 — Magia** | Investigación, libro de hechizos, lanzar, encantamientos, invocación, upkeep. |
| **3 — Guerra** | Stacks, iniciativa, los tres tipos de ataque, forts, barriers, la crónica. |
| **4 — Mundo** | Varios magos de verdad: ranking, mercado negro, items, héroes, habilidades. |
| **5 — Temporada** | Gremios, aliados, diplomacia, Armageddon y el reset. |

Que el diseño esté escrito entero desde el principio es justamente lo que
permite que la fase 1 no tenga que rehacerse en la 3.

---

## 8. Qué proponía el PDF, y por qué no

La §11 del documento de diseño proponía: JavaScript/TypeScript vanilla
sin framework, HTML/CSS más Canvas o SVG, **sin backend**, y el estado en
`localStorage`. Lo descartamos el 2026-09-21, con estos motivos:

- **Sin backend no hay juego.** The Reincarnation es un PvP por
  temporadas con ranking, gremios y mercado. Un prototipo de un jugador
  en el navegador no es una fase 1 del juego: es un juego distinto, y lo
  que se aprenda de balance en él no se transfiere.
- **`localStorage` no es persistencia.** Se borra al limpiar el
  navegador, no cruza de dispositivo, y en un juego con ranking es
  editable por el jugador.
- **Vanilla se paga en la pantalla que más importa.** La vista del reino
  es decenas de contadores que dependen unos de otros; mantener eso a
  mano es justo el trabajo que un framework hace mejor.
- **Lo que sí conservamos del PDF**, porque era buena idea: que el
  contenido sea **datos, no código** (§3, `packages/content`), y que
  exista un **modo de acelerar el tiempo** para no esperar turnos
  mientras se desarrolla — aquí es más simple todavía, porque el tiempo
  entra como parámetro (§4).

La §12 del PDF, el inventario de assets y los prompts, **sigue vigente**
y se ha llevado a [ASSETS.md](ASSETS.md) con las correcciones que exige
la lista real de edificios.

---

## 9. Plan técnico de la fase 1

**Escrito el 2026-09-21 con `/plan-tarea`.** Las tareas están en
[ROADMAP.md](../ROADMAP.md) «En curso».

> **Por qué el plan está aquí y no debajo de su spec.** La fase 1 tiene
> **dos** specs en dos documentos —la economía en
> [SISTEMAS.md §17](SISTEMAS.md) y el estilo visual en
> [INTERFAZ.md §6](INTERFAZ.md)— y un plan que las cruza no cabe entero
> debajo de ninguna de las dos sin partirlo. Va al documento de «cómo se
> construye», que es éste. Las dos specs siguen siendo la autoridad
> sobre el **qué**; esto es solo el **cómo**.

### 9.1. Qué cambia del contrato, y por qué

Planear destapó **tres huecos en [SPECS.md §1](SPECS.md)**. Ninguno se
resuelve en silencio:

1. **Falta la cola de reclutamiento.** `SetRecruit` está listada como
   acción de fase 1 (§2) pero el estado no tiene dónde guardar el
   reclutamiento en curso, y en el original **la tropa llega poco a poco
   a lo largo de varios turnos**
   ([SISTEMAS.md §8](SISTEMAS.md), `[orig]`). Se añade
   `recruiting?: { unitId, remaining, perTurn }`.

2. **La protección está mal tipada.** `protectedUntil?` sugiere una
   fecha, pero la spec dice que se mide en **turnos gastados**, no en
   tiempo real ([SISTEMAS.md §15](SISTEMAS.md), `[nuestro]`). Se cambia
   por un contador `turnsSpent` y la protección es
   `turnsSpent < 120`. **Es un cambio de contrato**: quien leyera
   `protectedUntil` como instante se equivocaba.

3. **La comida está en dos sitios con dos significados.** `SPECS.md §1`
   la lista como recurso entero almacenado; `SISTEMAS.md §5.4` la modela
   como **capacidad derivada** (`farms × 100`) que compite con el
   espacio de las towns. Las dos no pueden ser verdad.

   **Decidido con el usuario el 2026-09-21**: la comida es **capacidad
   derivada, no un recurso guardado**, y sale de `resources`. Motivo:
   `SISTEMAS.md` es el documento de diseño y ahí la comida solo aparece
   como tope; y un recurso almacenado que nadie acumula ni gasta es un
   campo que hay que mantener sincronizado a cambio de nada.

   **Y el coste, dicho**: el original **sí** tiene almacén de comida
   —pide *«adequate food storage»* para reclutar
   ([ORIGINAL.md §7](ORIGINAL.md))—, así que **nos separamos del
   original** en esto, y con ello perdemos una cuarta forma de arruinarse
   que en el original existe de verdad. Si algún día se echa en falta,
   es una spec nueva, no un parche.

### 9.2. La decisión que la spec dejaba implícita: el redondeo

**La fórmula del maná no da enteros.** Con `L=200, N=3` produce 31,7. En
el rango que se comprobó el 2026-09-21 hay **7.789 combinaciones no
enteras**. Y los recursos son enteros por
[invariante 7](SPECS.md).

**Decisión: se trunca hacia abajo (`floor`), una sola vez, al final de
`manaIncome`.** En ningún otro sitio se redondea maná. Motivos: nunca da
al jugador más de lo que dice la fórmula, y es la operación más fácil de
reproducir igual en el servidor y en el cliente — que es justo lo que el
invariante 7 protege.

La misma regla para todo lo demás: **cada fórmula con división tiene un
único `floor` documentado en su función**, y ninguna capa de arriba
vuelve a redondear.

> **Y el redondeo tiene consecuencia de diseño, medida al implementar el
> 2026-09-21.** Truncar **aplana el pico de la sierra**: la fórmula
> exacta tiene un único máximo en 55,99%, y con enteros empatan 54,99% y
> 55,99% (y tres valores distintos si el mago es pequeño). También mueve
> un punto el primer cruce que resta con 1.000 acres, de 19% a 20%.
>
> Se deja así. El truncamiento era la decisión correcta por el invariante
> 7, y el efecto secundario **juega a favor**: hace el pico un poco
> indulgente, que es justo lo que un juego sin ayudas en pantalla
> necesita. Está documentado en
> [SISTEMAS.md §17.1](SISTEMAS.md) con los valores medidos.

### 9.3. Dónde va cada cosa

| | Va a | Por qué |
|---|---|---|
| La sierra del maná, el geld, la población, el upkeep, el colapso, el devengo de turnos, las seis acciones | **`packages/core`** | Son reglas. Funciones puras, sin dependencias. |
| Coste, mantenimiento, velocidad y topes de los ocho edificios; la mitad económica de las cinco tropas | **`packages/content`** | Son datos. Añadir contenido no toca código. |
| Esquemas Zod de `GET /mage/me` y `POST /mage/me/actions`, y de la acción y el evento | **`packages/contract`** | Un cambio aquí rompe la compilación de los dos lados a la vez. |
| Transacción, bloqueo de fila, migraciones | **`apps/server`** | Entrada y salida. Ninguna regla. |
| Tokens, pantallas, previsualización | **`apps/web`** | Pinta y previsualiza con el mismo núcleo. |

**La mitad económica de una unidad, y solo la mitad.** La fase 1 recluta
tropa, así que necesita **coste, upkeep, espacio de población y ritmo de
reclutamiento**. Ataque, defensa, HP e iniciativa siguen `[abierto]` y
son de la fase 3 ([SISTEMAS.md §8](SISTEMAS.md)). El esquema de
`content` se parte en dos a propósito: lo económico ahora, lo de combate
después, y el validador no exige lo que todavía no existe.

### 9.4. Tres detalles con trampa

Los tres fallan **sin dar error**, que es la peor clase:

1. **El resto del devengo cuando estás al tope.** Si `lastAccrualAt`
   avanza solo en múltiplos de la cadencia, un mago que lleva tres días
   al tope acumula un resto enorme y, al gastar un turno, le entran
   veinte de golpe. Regla: **si el devengo llega al tope, `lastAccrualAt`
   pasa a ser `now`**. Va con su test.

2. **Las fracciones de construcción.** Se guardan en **punto fijo con 4
   decimales** ([SPECS.md §4](SPECS.md)), es decir enteros de
   diezmilésimas. Nunca en coma flotante: sumar 0,1 tres veces no da 0,3
   y el acarreo entre turnos se iría desviando sin que nadie lo notara.

3. **`land.total = land.free + Σ buildings`, siempre.** Es un invariante
   que hoy no está escrito en `SPECS.md §5` porque se da por obvio. Va
   comprobado en un test de propiedad sobre cualquier secuencia de
   acciones: construir, demoler y explorar son las tres que pueden
   romperlo.

### 9.5. Orden de dependencias

```
andamiaje
   └─ formas del estado (core) ── contenido (content)
         └─ devengo ── apply()
               └─ economía: maná → geld/población → upkeep → colapso
                     └─ acciones: construir/demoler → explorar → cargar → reclutar
                           ├─ simulador de temporada  ← aquí se calibran los números
                           └─ contrato → persistencia → servidor
                                 └─ cliente: tokens → pantallas → piel
                                       └─ assets
```

**El simulador va antes que el servidor** a propósito: calibra los
números de [SISTEMAS.md §17.2](SISTEMAS.md) con tests de milisegundos,
sin que haya que levantar una base de datos para descubrir que un
edificio cuesta el doble de lo que debía.

### 9.6. Fuera del alcance de la fase 1

Va al docstring de cada módulo, no solo aquí:

- **Cuentas, sesiones y autenticación.** La fase 1 trabaja con un mago
  fijo de desarrollo. Sin esto no hay multijugador, y es deuda declarada.
- **Magia, combate, items, héroes y habilidades.** Sus campos existen en
  el estado y **se quedan vacíos**.
- **WebSocket.** El estado se pide por HTTP. Los avisos llegan en la
  fase 3, cuando haya algo que avisar.
- **El tema claro** ([INTERFAZ.md §6.8](INTERFAZ.md)).

### 9.7. Riesgos conocidos

- **La ilustración de fondo contra la legibilidad.** Declarado en
  [INTERFAZ.md §6.1](INTERFAZ.md). La tarea de la piel lleva los
  criterios que lo miden, y si no pasan, **cede la ilustración**.
- **Los números pueden moverse en la calibración.** Los siete de
  [SISTEMAS.md §4.2](SISTEMAS.md) son primera tirada. Si el simulador
  dice que hay un reparto dominante, se cambian **los datos de
  `content`**, no el código — que es exactamente para lo que el contenido
  es dato.
- **La fase 1 no tiene tests de cliente.** Lo que no se mire en la pasada
  de navegador, no lo mira nadie.

### 9.8. Cómo se levanta

**Añadido el 2026-09-21**, después de la fase 1.

**Un solo `docker compose up -d --build`**, o el botón de play de Docker
Desktop sobre la pila. Al arrancar, el juego está en
**<http://localhost:3001>**.

Dos servicios, y el reparto es deliberado:

| Servicio | Qué lleva |
|---|---|
| `app` | **El API y el cliente juntos**: Fastify sirve `/api/*` y, para todo lo demás, el cliente ya construido. Un proceso, un puerto. |
| `db` | Postgres con su volumen. |

**Por qué Postgres no va en el mismo contenedor**, aunque «todo en uno»
suene más cómodo: borrar o reconstruir el contenedor de la aplicación se
llevaría la partida por delante, y arrancar dos procesos en una imagen
hace frágil pararla y reiniciarla. El volumen con nombre es lo que hace
que `docker compose down` **no** borre lo jugado.

**Para desarrollar** sigue siendo mejor el modo suelto, que da recarga en
caliente: `pnpm db:up`, `pnpm dev:server` y `pnpm dev:web`, con el cliente
en `:5173` y su proxy a `/api`. El servidor sirve el cliente **solo si
`apps/web/dist` existe**, así que los dos modos conviven sin tocar nada.
