---
description: Convierte una spec en plan técnico, lo descompone en tareas, te las enseña, te pregunta cómo atacarlas, y las implementa y documenta. Cierra el embudo spec → plan-tarea → tareas.
argument-hint: <ruta a la spec o nombre de la feature>
---

Vas a **llevar una spec desde el plan hasta el código documentado**. La
spec dice el qué y el por qué; a partir de aquí te encargas del resto:

```
plan técnico  →  lista de tareas  →  se la enseñas y preguntas  →  implementar
              →  comprobar  →  documentar en el permanente que toque
```

**No pares al terminar el plan.** Un comando que corta ahí acaba con lo
implementado documentado a mano, o sin documentar.

Spec de referencia: $ARGUMENTS

## Antes de planear

1. **Localiza la spec.** No vive en un fichero propio: está **dentro del
   documento permanente del que trata**. Según de qué vaya:

   | Tema | Documento |
   |---|---|
   | Una regla del juego | [docs/SISTEMAS.md](../../docs/SISTEMAS.md) |
   | Contrato técnico (estado, acción, endpoint, mensaje, invariante) | [docs/SPECS.md](../../docs/SPECS.md) |
   | Rutas, pantallas, presentación | [docs/INTERFAZ.md](../../docs/INTERFAZ.md) |
   | Cómo se escribe o se comprueba código | [docs/ARQUITECTURA.md](../../docs/ARQUITECTURA.md) |
   | Arte | [docs/ASSETS.md](../../docs/ASSETS.md) |
   | Una cifra medida | [docs/ESTADO.md](../../docs/ESTADO.md) |

   **[ROADMAP.md](../../ROADMAP.md) «En curso» tiene la línea que dice en
   cuál está** — la deja `/spec`. Ése es el índice: míralo antes de
   ponerte a buscar.

   Si el usuario invocó el comando a secas y solo hay un bloque abierto,
   ése es. Si hay varios, **enséñaselos y pregúntale** — no elijas tú. Y
   si lo que encuentras no es una spec sino una idea suelta, dilo y
   sugiere `/spec` primero; no improvises la spec aquí.

2. Lee [docs/SPECS.md](../../docs/SPECS.md) **completo** — es corto a
   propósito. El plan tiene que respetarlo, o **declarar explícitamente
   qué contrato cambia y por qué**.

3. Mira los **invariantes** de `SPECS.md` §5 antes de diseñar nada. Son
   los que se rompen sin dar un error:
   - `packages/core` importando algo, o llamando a `Date.now()` o
     `Math.random()`;
   - azar que no sale del `RandomSource`, o una semilla que no se guarda
     (la repetición de batalla pasa a mentir);
   - estado guardado sin sus eventos (la crónica pierde hechos);
   - una regla de juego dentro de un endpoint;
   - redondeo en dos sitios, que separa la previsión del resultado.

4. **Comprueba en `docs/SISTEMAS.md` la procedencia de lo que vas a
   tocar.** Si la regla está marcada `[orig]`, el plan **no puede
   cambiarla en silencio**: o la respeta, o dice que se separa del
   original y por qué. Si está `[abierto]`, el plan tiene que cerrarla
   con un número **y decir con qué se validó**.

5. **Y si ya hay código, busca los módulos reales que la feature toca** —
   comprueba los nombres de funciones y campos **en el código**, no los
   asumas por la documentación.

## Al escribir el plan

Añádelo **en el mismo documento donde está la spec**, justo debajo, como
`**Plan técnico.**` — no crees un archivo nuevo, y no lo pongas en otro
sitio que la spec. Incluye:

- **Paquetes y módulos afectados**: qué ficheros se crean o modifican. Si
  toca `packages/core/`, `packages/contract/`, `packages/content/` o el
  esquema de base de datos, **dilo explícitamente**: son los que más
  cruzan con otros agentes (ver
  [docs/AGENTES.md §1.1](../../docs/AGENTES.md)).
- **Dónde va cada cosa.** La pregunta que hay que contestar siempre:
  *¿esto es una regla?* Si lo es, va a `packages/core` como función pura,
  no al servidor ni al componente. *¿Es un número?* Entonces es
  `packages/content`, que es dato, no código.
- **Si toca el contrato**: el esquema Zod de `packages/contract` cambia
  primero, y rompe la compilación de los dos lados a la vez. Eso es lo
  que queremos.
- **Si toca el esquema de base de datos**: la migración es **aditiva**,
  con su `DEFAULT`. Nunca se rompe hacia atrás.
- **Decisiones de arquitectura**: solo las que la spec obliga a tomar —
  no diseñes por encima de lo que se pidió.
- **Orden de dependencias**: qué tiene que existir antes de qué.
- **Qué queda fuera de alcance**, y por qué. Va al docstring del módulo,
  no solo al plan.
- **Riesgos técnicos conocidos**, si los hay. Nombrar la deuda que se
  hereda o se introduce, no esconderla.

Si al planear descubres que la spec es ambigua o no encaja con el código
real, **para y pregunta**, o vuelve a `/spec`. No resuelvas la ambigüedad
en silencio dentro del plan: sería la misma «regla escrita en varios
sitios» que este flujo intenta evitar.

---

## Descompón en tareas, y enséñaselas

Con el plan escrito, saca la lista de tareas **y ponla en
[ROADMAP.md](../../ROADMAP.md), sección «En curso»** — un bloque con el
nombre del trabajo, una línea diciendo en qué documento está la spec, y
debajo la checklist en el orden real de implementación.

Cada tarea tiene que ser:

- **Concreta**: un cambio en un fichero, o un conjunto pequeño y
  cohesionado — nunca «implementar la economía» de una tacada.
- **Verificable**: di con qué se comprueba, y **empieza por el test**.
  TDD es la regla en `packages/core`. El test tiene que fallar antes del
  cambio.
- **Declarada**: di qué ficheros toca, que es lo que deja a otro agente
  repartirse el trabajo sin cruzarse contigo.

Y **enséñasela al usuario en el chat**, numerada, con lo que toca cada
una y cuánto crees que pesa. No le hagas abrir un fichero para ver qué le
propones.

### Presupuesta lo que va a costar comprobar, y dilo

No todo cuesta lo mismo, y la diferencia es de órdenes de magnitud. Las
cifras medidas están en [docs/ESTADO.md](../../docs/ESTADO.md); las
expectativas, en
[docs/ARQUITECTURA.md §6](../../docs/ARQUITECTURA.md):

| Instrumento | Coste |
|---|---|
| `vitest packages/core` | milisegundos |
| Validar el catálogo de `content` | milisegundos |
| Simular una temporada | segundos |
| `vitest apps/server` con Postgres de test | segundos |
| `tsc -b` en todo el repo | segundos |
| Navegador | minutos, **turno exclusivo** |
| Generar un set de assets y revisarlo | una sesión con el usuario |

Y las reglas que se siguen:

- **¿Es una regla del juego?** Es un test del núcleo, no una partida.
- **¿Es un estado lejano** —un mago a cero de geld, con 3 forts y 40.000
  unidades—? **Constrúyelo, no lo simules.**
- **¿Es una batalla?** Fija la semilla. Un test de combate sin semilla es
  un test intermitente disfrazado.
- **¿Es de balance?** Es una simulación de temporada, no una opinión.
- **¿De verdad hace falta el navegador?** Solo si lo que preguntas es qué
  se ve o si se puede pinchar.

Y si **varias** tareas necesitan la misma verificación cara —una sesión
de navegador, una tanda de assets—, **son una sola pasada**, no una por
tarea. Lo caro es arrancarla, no lo que comprueba. Júntalas en la lista
antes de proponerla y dilo explícitamente.

**Pon el total en el chat.** Si pasa de unos minutos, **es una decisión
del usuario y va en la pregunta de abajo**.

Marca además cuáles se pueden hacer **a la vez** y cuáles no: dos tareas
en paquetes distintos que no comparten fichero pueden ir en paralelo,
pero **dos que midan contra la base de datos de desarrollo, no** — ver
[docs/AGENTES.md §3](../../docs/AGENTES.md).

---

## Pregúntale cómo atacarlas

Con **AskUserQuestion**, y con la lista ya delante. Lo que hay que
resolver es **cómo**, no si:

- **Todas seguidas**, parando solo si algo falla o si aparece una
  decisión que no es tuya. Es lo normal, y suele ser la respuesta.
- **Una a una**, enseñando el resultado entre cada una. Para lo que toca
  balance o algo que el usuario quiere ver antes de seguir.
- **Solo algunas, o en otro orden.**
- **Parar aquí.** El plan y las tareas quedan escritos y no se toca
  código.

Si alguna tarea encierra una decisión de diseño —un número de balance,
una regla del original con dos lecturas, un hueco que hay que elegir si
se cubre o se declara fuera—, **dilo en la pregunta**: es más barato
decidirlo ahora que después de implementarlo.

**Y si el presupuesto de verificación pasa de unos minutos, pregúntalo
aparte**, con el número delante.

---

## Y entonces impleméntalas

Cuando conteste, **ponte a ello**: invoca el comando `/tareas`, que lleva
el bucle de implementación —firmar en la pizarra, escribir primero la
comprobación, implementar, comprobar las dos cosas, marcar hecho con su
cita, y llevar lo aprendido al documento permanente que le toque—. Está
escrito ahí y en un solo sitio a propósito.

**Lo que no es negociable, conteste lo que conteste:**

- Una tarea no está hecha hasta que está **comprobada** y **documentada
  en el documento del tema**, no solo en la cita de HECHO del ROADMAP.
- Si la suite se pone en rojo, o el **total de tests baja**, paras y lo
  dices. No sigues con la tarea siguiente encima de algo roto.
- Si al implementar se cae una premisa del plan, **lo cuentas y corriges
  el plan**. El plan no es un contrato con el usuario: es lo que creías
  antes de tocar el código.

Al terminar, dile qué quedó hecho, qué se comprobó y con qué, qué salió
distinto de lo planeado y qué queda pendiente. Si te dejaste algo, dilo
tú antes de que pregunte.

---

**Y no malgastes contexto.** Busca con `grep -n` y lee el trozo, no el
fichero; filtra la salida de los tests; no pegues ficheros en el chat.
Reglas en [CLAUDE.md](../../CLAUDE.md) — y la contraria también: leer lo
que hace falta es barato, adivinarlo no.

---

## Si vais a ser varios

Lee y firma en `.claude/agentes/pizarra.md`, y **declara en el plan qué
ficheros va a tocar**: ese plan es lo que los demás agentes leerán para
no cruzarse contigo. Protocolo en
[docs/AGENTES.md](../../docs/AGENTES.md).
