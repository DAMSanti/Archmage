# Estado

**Las cifras medidas de hoy.** Ningún número de este documento es una
estimación: o está medido, o dice que no lo está.

Sirve para dos cosas: que nadie tenga que adivinar cuánto tarda algo, y
que se note cuando un documento afirma algo que ya no es cierto.

**Última actualización: 2026-09-21** (fase 1 completa salvo assets, y **fase 2 implementada**).

---

## 1. Código

El repositorio contiene, a día de hoy:

| | |
|---|---|
| Documentos en `docs/` | 9 |
| Comandos en `.claude/commands/` | 4 |
| Paquetes | **5** — `core`, `content`, `contract`, `server`, `web` |
| Items del catálogo | **44**, todos publicados |
| Habilidades | **10**, de 20 niveles |
| Tests | **687**, todos en verde — 447 de `core`, 143 de `content`, 71 de `server`, 26 de `web` |
| `tsc -b` | sale **0** |
| Bundle del cliente | **256 KB** de JS + **9,6 KB** de CSS; **74 KB** y **2,5 KB** comprimidos |

**La fase 1 está implementada: tareas 1 a 21 de 22.** Queda la **22**, la
tanda de assets, que espera una sesión con el usuario. **La fase 2 está
completa.** **La fase 3 está completa: las 22 tareas.** Hay guerra — tres tipos de
ataque, batallas repetibles con semilla guardada, tierra que cambia de
manos, héroes, items, y las pantallas de `/guerra` y `/batalla/:id`.

**Y la fase 4 también: las 25.** Hay **mundo** — cuentas con verificación
por correo, 44 items reales copiados del original con su capa de
pre-batalla, las diez habilidades, héroes que suben de nivel, el mercado
negro como subasta entre jugadores, ranking, y las pantallas de `/`,
`/mercado`, `/habilidades` y `/ranking`. La 4
cerró la decisión de balance que la 3 había dejado abierta, y lo hizo
adoptando la **economía publicada** del original: la fórmula de geld, los
topes de población y comida, y el crecimiento
([ORIGINAL.md §4.2](ORIGINAL.md)). Con ella vuelven a cumplirse el
criterio 11 de §17.2 y, **por primera vez**, el 10 de §7.1.

**Y la fase 5: las 22.** Hay **temporada** — gremios de cinco fundadores,
alianzas con refuerzos automáticos que entran de verdad en la batalla,
mensajería con bloqueo, **dos servidores** con temporadas independientes,
los **siete sellos** de Armageddon y la fecha tope de 90 días, los dos
Halls congelados al cerrar, y las pantallas de `/gremio`, `/mensajes` y
`/temporada`. Lo único que deja fuera, y declarado, es **NAP y
diplomacia**: sin tratados que romper, una lista de enemigos no cambiaría
ninguna regla.

La 5 enchufó además la capa de pre-batalla de la fase 4, que estaba
**escrita, probada y sin llamar desde ningún sitio** — catorce familias
de efectos que no llegaban a una batalla real. Ver
[ROADMAP.md](../ROADMAP.md).

---

## 2. Instrumentos y lo que cuestan

Las expectativas son de [ARQUITECTURA.md §6](ARQUITECTURA.md); la
columna de la derecha es lo que se midió al implementar.

| Instrumento | Esperado | Medido (2026-09-22) |
|---|---|---|
| La suite entera (687 tests) | — | **~14 s** |
| `vitest packages/core` (447 tests) | milisegundos | **~3 s**, de los que **770 ms** son los tests |
| Validación del catálogo de `content` | milisegundos | **~10 ms** |
| Simulación de temporada (22 tests, hasta 2.000 turnos) | segundos | **~350 ms** |
| `vitest apps/server` (71 tests, Postgres real) | segundos | **~8 s** |
| `tsc -b` en todo el repo | segundos | **~3 s** |
| `vite build` del cliente | ~1 min | **~0,7 s** |
| Pasada de navegador (12 comprobaciones, 3 contextos) | minutos, turno exclusivo | **~12 s** |
| Pasada de navegador de la guerra (18 comprobaciones) | minutos, turno exclusivo | **~25 s** |
| Pasada de navegador del mundo (15 comprobaciones) | minutos, turno exclusivo | **~20 s** |
| Pasada de navegador de la temporada (15 comprobaciones) | minutos, turno exclusivo | **~18 s** |

**Las cuatro pasadas suman 70 comprobaciones** (22 + 18 + 15 + 15) y son la
superficie de regresión de cualquier cambio en el armazón del cliente. Se
midió el 2026-09-22, al meter el marco persistente: **un cambio de
navegación las toca todas**, porque todas navegan por nombre de botón.

**Casi todas las expectativas se quedaron cortas por el lado bueno.** La
simulación de temporada se presupuestó en «segundos» y son **66
milisegundos** para nueve escenarios de hasta 2.000 turnos; el build del
cliente se presupuestó en un minuto y tarda **menos de uno**; la pasada de
navegador se presupuestó en minutos y son **12 segundos**.

**La que sí ha crecido es la del servidor**, y era de esperar: cada test
levanta su propia base de datos y la fase 5 le añadió veintitrés. Ocho
segundos para 71 tests contra Postgres real sigue siendo barato comparado
con lo que compran — pero es **la mitad del reloj de la suite entera**, y
es el primer sitio donde mirar si algún día molesta.

Comprobar este proyecto es barato, así que **no hay excusa para discutir
balance en vez de medirlo, ni para dar algo por bueno sin mirarlo**.

> Cuando midas uno, **ponlo aquí con la fecha**, y si una expectativa
> resultó falsa, dilo: la fila dice lo que se esperaba y lo que salió.

---

## 3. Huecos entre lo escrito y lo que existe

- `docs/` describe el juego entero por fases. **La fase 1 está
  implementada y se juega**: turnos, tierra, los ocho edificios, la
  economía, el colapso, las seis acciones, persistencia en Postgres,
  servidor y tres pantallas. **Las fases 2 a 5 no existen.**
- **No hay cuentas ni autenticación**: la fase 1 trabaja con un mago fijo
  de desarrollo. Es deuda declarada en
  [ARQUITECTURA.md §9.6](ARQUITECTURA.md), no un olvido.
- [SISTEMAS.md](SISTEMAS.md) tenía **catorce marcas `[abierto]`**; la
  spec de la economía del 2026-09-21 cerró las de economía, tierra,
  edificios y estado inicial. **Quedan siete**, y ninguna bloquea la
  fase 1:

  | Marca abierta | Se cierra en |
  |---|---|
  | Los siete números de coste y mantenimiento son primera tirada, a calibrar | con el simulador, §17.2 |
  | Coeficiente de poder de unidad en net power | fase 3 |
  | Lista de hechizos por escuela y rango | fase 2 |
  | Números de las unidades | fase 3 |
  | Fórmula de daño, acierto, fatiga y bonus de fort | fase 3 |
  | Efecto numérico de las 10 habilidades | fase 4 |
  | Qué hace Armageddon | fase 5 |

- [SPECS.md §6](SPECS.md) (el API) está abierto a propósito: se escribe
  al implementar la fase 1.
- [INTERFAZ.md §6](INTERFAZ.md) (estilo visual) **quedó cerrado el
  2026-09-21**. **Ya no queda ninguna marca que bloquee código.**

---

## 4. Contenido del juego

| Catálogo | Entradas |
|---|---|
| Edificios | 8 definidos, **8 con coste, mantenimiento y efecto** (sin implementar) |
| Escuelas | 6 definidas, **2 con contenido** (Plain y Verdant) |
| Hechizos | **33** — Plain y Verdant, con sus cuatro costes |
| Unidades | **20**: 5 de barracks y 15 invocables, todas solo con su mitad económica |
| Items | **0** |
| Héroes | **0** |
| Habilidades | 10 nombradas, **0 con efecto numérico** |
| Assets | 26 especificados con su prompt, **0 generados** — la interfaz corre con marcadores de posición |

---

## 5. Qué se ha comprobado de verdad

- **La investigación del original** ([ORIGINAL.md](ORIGINAL.md)) se hizo
  el 2026-09-21 contra la web y la wiki oficiales, y cada afirmación
  lleva su nivel de confianza. **Tres afirmaciones del PDF quedaron
  refutadas**: el maná no regenera con el reloj (son los turnos), los
  edificios no son los cuatro que suponía (son ocho, con fórmulas
  publicadas), y el combate no es una comparación de totales.
- **La ampliación del 2026-09-21** para la spec de la economía encontró
  publicado lo que se daba por no publicado: la **fórmula del maná**
  ([ORIGINAL.md §3.1](ORIGINAL.md)), la de **Net Power**
  ([§3.2](ORIGINAL.md)) y los **valores de partida**
  ([§4.1](ORIGINAL.md)). **Refutó además una afirmación propia**:
  `SISTEMAS.md §5.1` describía una curva suave con máximo en el 30% que
  yo había deducido de una sola frase, y el máximo real está en 55,99%
  con forma de sierra. Corregido en el documento, con la nota de qué
  decía antes.
- **Los contrastes de la paleta están calculados, no estimados**
  (2026-09-21). Sobre `--panel` `#1e1813`: texto **13,46:1**,
  texto-tenue 6,24, acento 7,79, positivo 6,33, negativo 4,71, aviso
  6,22; Nether **4,19:1** y Ascendant 14,67. El par de escuelas
  cromáticas más cercano es Phantasm-Nether, a **52,1° de tono**. Todos
  los criterios calculables de
  [INTERFAZ.md §6.7](INTERFAZ.md) pasan.

  **Dos tokens y un criterio se corrigieron por ese cálculo**: el rojo
  de estado no llegaba a 4,5:1, el violeta de Nether no llegaba a 3:1, y
  el criterio de «escuelas distinguibles» estaba escrito con razón de
  contraste, que mide claridad y no tono.
- **Los criterios de aceptación de la economía están ejecutados.** Los
  ocho de `SISTEMAS.md §17.1` son tests que pasan. De los cinco de
  §17.2, **tres cumplen** (curva de crecimiento, tamaño del ejército,
  ningún reparto es una trampa) y **dos quedaron aplazados a la fase 3**
  con el motivo escrito: sin magia ni combate, el maná no sirve para
  nada y el net power es ~98% tierra.
- **Los criterios visuales están ejecutados en navegador** (2026-09-21):
  **12 de 12**, en tres contextos —escritorio 1280×900, móvil 360×740 y
  con las imágenes bloqueadas—. Medido: sin scroll horizontal a 360px, el
  área de datos ocupa el **91,1%** del ancho, todas las zonas de toque
  pasan de 40px, cifras tabulares en todas las columnas, y ningún color de
  escuela pintando la interfaz.

  **La primera pasada falló dos**, y una era una violación de la propia
  spec: los avisos se dibujaban fuera de panel, sobre la ilustración.
- **El generador de azar tenía un sesgo, y no lo veía ningún test**
  (2026-09-21). Era un xorshift32 sembrado directamente, con tres copias
  en el repositorio, y **con semillas pequeñas las primeras tiradas
  salían casi cero**: un hechizo con 30% de fallo fallaba cinco de cada
  cinco veces. Lo destapó implementar el fallo por concentración de la
  fase 2, no un test. Ahora hay **una sola implementación** con su test
  de distribución sobre 200 semillas.
- **El criterio 10 de la fase 2 NO se cumple, y está medido**
  (2026-09-21). Se esperaba que la magia hiciera competir al reparto
  volcado a maná; a 2.000 turnos el económico sigue ganando por 45.000 de
  net power. El motivo medido: de las tres cosas que compra el maná
  —nivel de hechizo, encantamientos e invocación— **la invocación no paga
  nada hasta que haya combate**, y los encantamientos de Verdant
  favorecen al mago que ya tiene economía. Aplazado a la fase 3, con la
  causa medida en vez de supuesta.
- **Lo que sigue sin comprobarse**: las fases 3 a 5, y el juego **no se
  ha jugado una sesión larga de verdad**. El simulador cubre la economía y
  la magia; que el bucle de quince minutos enganche, no lo sabe nadie
  aún.
