---
description: Crea o actualiza la spec de una feature — el "qué" y el "por qué", sin tecnología. Primer paso del embudo, antes de que /plan-tarea llegue al código.
argument-hint: <nombre o descripción breve de la feature>
---

Vas a escribir la **spec** de una feature o subsistema de Archmage. Es un
flujo ligero inspirado en Spec-Driven Development, adaptado a los
documentos que ya existen en `docs/`: no reemplaza
[docs/SPECS.md](../../docs/SPECS.md) (el contrato técnico permanente) ni
[ROADMAP.md](../../ROADMAP.md) (el plan por fases) — se apoya en los dos.

El embudo entero:

```
/spec       intención o encargo  →  el qué y el por qué, medible   ← ESTÁS AQUÍ
/plan-tarea spec                 →  plan, tareas, y las IMPLEMENTA y documenta
/tareas     retomar trabajo      →  implementa lo pendiente de ROADMAP «En curso»
/depurar    lo que no quedó bien →  preguntas, y arreglo donde esté el fallo
```

El paso siguiente llega hasta el código, así que **lo que dejes ambiguo
aquí se implementa ambiguo**. Un criterio de aceptación que no se puede
medir es una tarea que nadie sabrá dar por hecha.

Feature a especificar: $ARGUMENTS

## Antes de escribir nada

1. Lee [ROADMAP.md](../../ROADMAP.md) —al menos «En curso» y la fase que
   toque— y [docs/SPECS.md](../../docs/SPECS.md) entero. `SPECS.md` es
   corto a propósito y lleva los **invariantes** (§5): las cosas que se
   rompen sin dar un error. Si la feature choca con uno, dilo ahora.

2. **Mira si el original ya lo contesta.**
   [docs/ORIGINAL.md](../../docs/ORIGINAL.md) es la investigación del
   juego real, con niveles de confianza. Este proyecto nació de un
   documento de diseño que **supuso cuatro edificios donde la wiki
   documenta ocho con fórmulas publicadas**. Antes de inventar una
   mecánica, comprueba si el original la tiene documentada — y si la
   tiene y te separas de ella, **di que te separas y por qué**.

   Si `ORIGINAL.md` no lo cubre y crees que la wiki sí, **amplía la
   investigación primero** y escríbela allí con su nivel de confianza,
   antes de usarla en ningún otro sitio.

3. **Mira si ya está decidido.**
   [docs/SISTEMAS.md](../../docs/SISTEMAS.md) marca cada regla como
   `[orig]`, `[nuestro]` o `[abierto]`. Si lo que te piden es una marca
   `[abierto]`, **ése es exactamente el trabajo de esta spec**: sabemos
   la forma, falta el número.

4. **Comprueba si está declarado fuera de alcance.**
   [docs/SISTEMAS.md §16](../../docs/SISTEMAS.md) y la sección de fuera
   de alcance de [docs/INTERFAZ.md](../../docs/INTERFAZ.md) llevan lo que
   **no** vamos a hacer, con su porqué. Si lo que te piden es uno de
   esos huecos, **dilo**: hay un motivo escrito y puede que siga siendo
   válido. Que el usuario cambie de idea es legítimo, pero entonces la
   spec empieza por corregir esa lista.

5. **Y si ya hay código, míralo.** Comprueba los nombres de módulos,
   funciones y campos **en el código**, no los asumas por la
   documentación:

   | Si la feature va de… | Mira |
   |---|---|
   | una regla del juego | `packages/core/`, y [docs/SISTEMAS.md](../../docs/SISTEMAS.md) |
   | hechizos, unidades, edificios, items | `packages/content/`, que es **dato, no código** |
   | el API o un mensaje | `packages/contract/`, y [docs/SPECS.md](../../docs/SPECS.md) |
   | lo que se ve | `apps/web/src/`, y [docs/INTERFAZ.md](../../docs/INTERFAZ.md) |
   | persistencia, transacciones | `apps/server/` |

6. Si algo queda ambiguo —alcance, criterio de "terminado", qué se deja
   fuera a propósito— pregúntalo con **AskUserQuestion** antes de
   escribir. No lo dejes implícito ni lo decidas por tu cuenta: es
   exactamente el fallo que este paso existe para evitar.

## Al escribir la spec

- Español, prosa directa, sin relleno ni entusiasmo de marketing.
- El **qué y el por qué**, no el cómo técnico — nada de nombres de
  funciones o componentes todavía; eso es trabajo de `/plan-tarea`.
- La motivación: qué problema real resuelve, o qué pide
  [docs/VISION.md](../../docs/VISION.md) que hoy no existe.
- **Marca la procedencia de cada regla**, con las marcas de
  `SISTEMAS.md`: `[orig]` si viene del juego original —y entonces cita la
  sección de `ORIGINAL.md` y su nivel de confianza—, `[nuestro]` si es
  decisión nuestra —y entonces va el porqué—, `[abierto]` si sigue sin
  cerrarse. **No mezcles los tres niveles en silencio.**
- Un apartado **"Fuera de alcance"** explícito — tan importante como lo
  que sí se pide. Lo que queda fuera **se declara, no se calla**.
- Cada punto con un **criterio de aceptación medible**: algo comprobable
  con un test o una simulación, no una impresión. "Está equilibrado" no
  vale; "una temporada simulada no la gana siempre el mismo reparto de
  tierra" sí; "un mago con 31% de nodes produce menos maná total que uno
  con 30%, comprobado con un test del núcleo" también.

**Y ojo con la escala.** Los números de este juego son grandes: decenas
de miles de maná, cientos de miles de geld, cientos de unidades por
invocación ([docs/SISTEMAS.md §7](../../docs/SISTEMAS.md)). Una spec que
propone un hechizo de 50 de maná está diseñando otro juego.

## Dónde guardarlo: en el documento permanente que le toque

**No crees un fichero nuevo.** `docs/` tiene un conjunto fijo. La spec se
escribe **dentro del documento permanente del que trata**. Léelo entero
antes de escribir en él, y respeta su tono y su estructura:

| Si la feature va de… | Lee y actualiza |
|---|---|
| Una **regla del juego**: turnos, tierra, edificios, economía, magia, unidades, combate, héroes, items, gremios, temporada | [docs/SISTEMAS.md](../../docs/SISTEMAS.md) |
| Un **contrato técnico**: forma del estado, acción nueva, endpoint, mensaje, invariante | [docs/SPECS.md](../../docs/SPECS.md) |
| **Lo que se ve**: rutas, pantallas, presentación, móvil | [docs/INTERFAZ.md](../../docs/INTERFAZ.md) |
| **Cómo se escribe, se trocea o se comprueba** el código | [docs/ARQUITECTURA.md](../../docs/ARQUITECTURA.md) |
| **Arte**: iconos, fondos, prompts | [docs/ASSETS.md](../../docs/ASSETS.md) |
| Un hallazgo **sobre el juego original** | [docs/ORIGINAL.md](../../docs/ORIGINAL.md), con su nivel de confianza |
| Una **cifra medida** | [docs/ESTADO.md](../../docs/ESTADO.md) |
| Producto, público, qué tiene que ser verdad | [docs/VISION.md](../../docs/VISION.md) |

**Casi siempre son dos.** Una mecánica nueva toca `SISTEMAS.md` (la
regla) y `SPECS.md` (la acción o el campo de estado que hace falta).
Actualiza los dos: **una regla escrita en dos sitios se queja siempre por
la copia que no tocaste.**

Si de verdad no encaja en ninguno, **dilo y pregunta** antes de crear
nada. La respuesta correcta casi nunca es un fichero nuevo.

**Y apunta el trabajo en [ROADMAP.md](../../ROADMAP.md), sección «En
curso»**, con una línea que diga de qué va y en qué documento está la
spec. Es donde `/plan-tarea` va a colgar después la lista de tareas, y es
lo único que permite retomarlo desde otra sesión.

No implementes nada de código en este paso: el siguiente, `/plan-tarea`,
ya lo hace —planea, descompone, pregunta cómo atacarlo, y lo implementa y
documenta—. Por eso **este paso es el último sitio barato para cambiar de
idea**.

---

**Y no malgastes contexto.** Busca con `grep -n` y lee el trozo, no el
fichero; no pegues ficheros en el chat. Las reglas están en
[CLAUDE.md](../../CLAUDE.md) — y la contraria también: leer lo que hace
falta es barato, adivinarlo no.

---

## Si vais a ser varios

Lee y firma en `.claude/agentes/pizarra.md` antes de editar nada.
Protocolo en [docs/AGENTES.md](../../docs/AGENTES.md). Este paso no
levanta servidores ni navegador, así que no necesita turno — pero
`ROADMAP.md` lo tocan los cuatro comandos del embudo, así que decláralo.
