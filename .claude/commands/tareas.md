---
description: Implementa las tareas pendientes de ROADMAP «En curso», una a una, comprobando y documentando cada una en el documento permanente que le toque. Lo invoca /plan-tarea, y se llama suelto para retomar trabajo a medias.
argument-hint: <qué bloque de «En curso», o vacío para que te lo enseñe>
---

**El bucle de implementación.** Aquí vive, y en un solo sitio: lo invoca
`/plan-tarea` cuando acaba de planear, y se llama suelto para **retomar
trabajo a medias** — el tuyo de ayer, o el de otro agente que lo dejó
abierto.

Qué implementar: $ARGUMENTS

---

## 1. Mira qué hay pendiente

Las tareas vivas están en [ROADMAP.md](../../ROADMAP.md), sección **«En
curso»**. Cada bloque dice de qué va y en qué documento está su spec.

- Si `$ARGUMENTS` nombra un bloque, ve a ése.
- Si viene vacío, **enséñale al usuario los bloques abiertos** con sus
  tareas pendientes y pregúntale por cuál empezar. No elijas tú un bloque
  entero.
- Si «En curso» está vacío, dilo y sugiere `/spec`. No te inventes
  trabajo.

**Lee la spec y el plan antes de tocar nada.** Están en el documento
permanente que la línea del bloque señala. Una tarea implementada sin
leer su spec es una tarea implementada a ojo.

Y si el bloque es de otro agente, o su tarea lleva dueño puesto,
**háblale antes** (`ListAgents` / `SendMessage`).

---

## 2. El bucle, tarea a tarea

Para cada tarea, en orden, y sin saltarte pasos:

### 2.1. Firma

En `.claude/agentes/pizarra.md`: qué tarea coges y qué ficheros vas a
tocar, incluidos los que **puede** que toques. Lee antes lo que han
firmado los demás — si un fichero tuyo ya está declarado por otro, **no
lo edites**: háblale, y mientras tanto haz lo que no dependa de él.
Protocolo completo en [docs/AGENTES.md](../../docs/AGENTES.md).

Y toma el turno si lo necesitas: `mkdir .claude/agentes/turno-db` (base
de datos de desarrollo o servidores), `turno-navegador`. **Correr los
tests no necesita turno**: los del núcleo son funciones puras y los del
servidor usan cada uno su base de datos temporal.

### 2.2. Escribe primero la comprobación, y la MÁS BARATA que sirva

**TDD en `packages/core`, sin excepciones. Tiene que fallar antes del
cambio.** Si no consigues que falle, todavía no entiendes lo que vas a
implementar.

**Y elige bien el instrumento, que es donde se van las horas.** Costes
medidos en [docs/ESTADO.md](../../docs/ESTADO.md); reglas completas en
[docs/ARQUITECTURA.md §6](../../docs/ARQUITECTURA.md). En corto:

- **Una regla del juego se comprueba con un test del núcleo**, no jugando
  una partida. «¿Cuánto maná produce un mago al 12% de nodes?» es una
  función pura y una aserción.
- **Un estado lejano se construye, no se simula.** Para ver qué pasa con
  un mago a cero de geld, con 3 forts y 40.000 unidades, **se escribe ese
  estado** y se aplica una acción. Nadie juega hasta llegar.
- **Una batalla se comprueba con su semilla fijada**, y la semilla se
  guarda. Un test de combate que no fija la semilla es un test
  intermitente disfrazado — y en un juego con azar en cada ronda, sale
  intermitente tarde y de forma confusa.
- **El balance se comprueba simulando una temporada**, no opinando.
- **El navegador solo si la pregunta es visual.**

**Si dos tareas necesitan la misma verificación cara, son UNA pasada.**
Lo caro es arrancar la sesión, no lo que comprueba. Antes de lanzar nada
largo, junta todas las preguntas abiertas del bloque —incluidas las de
tareas que vengan después— y métela en la misma pasada.

Y si la comprobación de esta tarea va a costar más de unos minutos y **no
estaba presupuestada en el plan**, dilo antes de lanzarla.

### 2.3. Implementa

Respetando lo que ya está decidido: los invariantes de
[docs/SPECS.md §5](../../docs/SPECS.md) y las convenciones de
[docs/ARQUITECTURA.md §5](../../docs/ARQUITECTURA.md). En concreto, y son
las que más se rompen sin avisar:

- **`packages/core` no importa nada**, y **no llama a `Date.now()` ni a
  `Math.random()`**. El tiempo y el azar entran por `Ctx`. Si te ves
  añadiendo una dependencia a `core`, para: algo se ha diseñado mal.
- **Todo azar sale del `RandomSource`, y la semilla se guarda** con el
  resultado. Si no, la repetición que se le enseña al jugador miente.
- **El estado y sus eventos se guardan en la misma transacción.**
- **Ningún endpoint lleva reglas.** Valida, carga, `core.apply()`,
  guarda, responde. Si te encuentras calculando ingreso o daño en una
  ruta, esa función falta en `core`.
- **Los recursos son enteros**, y cada fórmula redondea **en un solo
  sitio documentado**. Dos redondeos separan la previsión del resultado
  sin dar error.
- **El contenido es dato.** Un hechizo, una unidad o un edificio nuevo es
  una entrada en `packages/content`, no código.
- **Una migración es aditiva**, con su `DEFAULT`.
- **Un error de dominio es un 422** con su código, no un 500. «No tienes
  maná» es juego, no avería.
- **El comentario dice el porqué y de dónde sale el número.** Si viene
  del original, la sección de
  [docs/ORIGINAL.md](../../docs/ORIGINAL.md) **y su nivel de
  confianza**; si es nuestro, el porqué y qué se midió.
- **Lo que dejes fuera, escríbelo en el docstring del módulo**, en su
  bloque de *fuera de alcance*. Un hueco declarado es deuda; uno callado
  es un fallo esperando a una temporada real.

### 2.4. Comprueba, y comprueba las dos cosas

```bash
pnpm test        # vitest en todos los paquetes
pnpm -w exec tsc -b
```

- Que esté **en verde**.
- Y que el **total de tests no haya bajado**. Un fichero que revienta al
  importar no falla: desaparece. Ese número es lo único que lo delata.

> **Línea base: mírala en [docs/ESTADO.md](../../docs/ESTADO.md)** y
> **actualízala** si tu tarea la cambia. Si una prueba sale intermitente,
> no la marques como «a veces falla»: casi siempre es una semilla sin
> fijar, y eso es un fallo tuyo, no del azar.

Si tocaste el cliente, además del build: **compilar no es funcionar.** Si
el cambio toca algo que se ve, míralo. Y si **no** hay navegador en esta
sesión, **dilo explícitamente en la nota de HECHO** en vez de dejarlo
implícito.

> **Si se pone en rojo, paras y lo dices.** No sigues con la tarea
> siguiente encima de algo roto, y no la marcas hecha «pendiente de
> arreglar».

### 2.5. Márcala hecha, con lo que pasó de verdad

En `ROADMAP.md`, `- [x]`, y debajo:

```
> **HECHO (fecha).** Qué se hizo de verdad, con qué test o comprobación
> se verificó, y el resultado — incluidas las sorpresas y los cambios de
> premisa que aparecieron al implementar, no solo el resultado limpio.
```

**No borres ni reescribas el texto original de la tarea.** El historial
de qué se pidió y qué pasó de verdad es parte del valor.

### 2.6. Y lleva lo aprendido al documento permanente

**Ésta es la mitad que se olvida**, y sin ella el conocimiento se queda
en una lista de tareas que nadie relee:

| Lo que has cambiado | Actualiza |
|---|---|
| Una regla del juego: turnos, tierra, edificios, economía, magia, unidades, combate, héroes, items, gremios, temporada | [docs/SISTEMAS.md](../../docs/SISTEMAS.md) |
| La forma del estado, una acción, un endpoint, un mensaje, un invariante | [docs/SPECS.md](../../docs/SPECS.md) |
| Una ruta, una pantalla, una regla de presentación | [docs/INTERFAZ.md](../../docs/INTERFAZ.md) |
| Una forma nueva de trocear, medir o comprobar | [docs/ARQUITECTURA.md](../../docs/ARQUITECTURA.md) |
| Un asset o un prompt que de verdad se usó | [docs/ASSETS.md](../../docs/ASSETS.md) |
| Algo que averiguaste **del juego original** | [docs/ORIGINAL.md](../../docs/ORIGINAL.md), con su nivel de confianza |
| **Una cifra medida** (tests, tiempos, tamaño del catálogo) | [docs/ESTADO.md](../../docs/ESTADO.md) |

Tres reglas al escribir ahí:

- **Si cierras una marca `[abierto]` de `SISTEMAS.md`, cámbiala** a
  `[nuestro]` con el número y con **qué lo validó**. Dejarla abierta
  después de haberla implementado es la peor de las dos opciones: el
  código decide y el documento no se entera.
- **Si una cifra que el documento afirma ha dejado de ser cierta,
  cámbiala.** No vale dejar la vieja y poner la nueva solo en la cita de
  HECHO.
- **Si contradice algo escrito, corrígelo diciendo qué decía antes y por
  qué cambió.**

**No crees un documento nuevo.** `docs/` tiene un conjunto fijo.

### 2.7. Suelta

Borra tu bloque de la pizarra —o actualízalo a la tarea siguiente— y
suelta el turno que tuvieras (`rmdir .claude/agentes/turno-*`).
**Suéltalo aunque la tarea saliera mal.**

---

## 3. Al cerrar el bloque entero

Cuando no queden tareas:

1. **Quítalo de «En curso»**, dejando una línea de cierre con la fecha y
   adónde fue a parar lo aprendido.
2. Si el bloque fue largo y su relato tiene valor —qué se probó, qué
   falló, qué premisa se cayó a mitad—, ese relato va a `docs/archivo/`
   con su cabecera de archivado. El conjunto de `docs/` no crece.
3. **Cuéntaselo al usuario**: qué quedó hecho, qué se comprobó y con qué
   salió, qué resultó distinto de lo planeado, y qué queda pendiente. Si
   te dejaste algo, dilo tú antes de que pregunte.

---

**Y no malgastes contexto.** Busca con `grep -n` y lee el trozo, no el
fichero; filtra la salida de los tests; no pegues ficheros en el chat.
Reglas en [CLAUDE.md](../../CLAUDE.md) — y la contraria también: leer lo
que hace falta es barato, adivinarlo no.

---

## Lo que NO se hace aquí

- **No implementes varias tareas a la vez** salvo que el usuario lo haya
  dicho. Si no está claro por dónde empezar, pregunta.
- **No cierres una marca `[abierto]` a ojo.** Si la spec no puso el
  número, no te lo inventes dentro del código: para y vuelve a `/spec`.
  Un número inventado en una constante es una decisión de diseño tomada
  a escondidas.
- **No parchees dentro de una tarea lo que el usuario dice que no le
  gusta.** Eso es `/depurar`: preguntas detalladas primero, decidir si el
  fallo está en el código o en lo escrito después, y arreglarlo donde
  esté.
- **No lances una sesión de navegador porque sí.**
- **No des una tarea por hecha sin comprobarla.** «Compila» no es
  «funciona».
