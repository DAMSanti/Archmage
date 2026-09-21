# Interfaz

Qué se ve y cómo se comporta. Rutas, pantallas, componentes y las reglas
de presentación que no son negociables.

---

## 1. El principio

**La interfaz informa; no optimiza.**

> **Revisado el 2026-09-21.** Este apartado decía antes que «la hoja de
> cálculo es nuestro trabajo» y que la interfaz avisaría de estar en el
> lado malo de un umbral. Al aparecer la fórmula real del maná —una
> sierra cuyo óptimo está en 55,99%
> ([SISTEMAS.md §5.1](SISTEMAS.md))— eso se convertía en resolverle al
> jugador la decisión económica central del juego. **Se decidió que no.**

El original es texto y tablas, y hace falta una hoja de cálculo al lado
por **dos** motivos distintos que conviene no confundir:

1. Porque no te dice con claridad **en qué estado estás**.
2. Porque no te dice **cuál sería el estado mejor**.

**Lo primero lo arreglamos; lo segundo es el juego.** Nadie debería
necesitar una calculadora para saber cuánto maná neto le entra ahora
mismo. Pero averiguar dónde está el filo del porcentaje es una habilidad
que se adquiere jugando, y regalarla vacía la decisión.

**Lo que la interfaz sí hace, siempre:**

- **Enseña el estado presente completo y exacto**: cuánto tienes de cada
  recurso, cuál es tu **ingreso neto** por turno (ingreso menos upkeep),
  cuántos edificios de cada tipo y **qué porcentaje de tu tierra son**.
- **Antes de confirmar una acción, dice qué cuesta**: cuántos turnos y
  cuánto geld, y cómo quedan los recursos después. Es información sobre
  *lo que has pedido*, no una recomendación.
- **Avisa antes del colapso.** Un ingreso neto negativo se señala
  **antes** de que las unidades empiecen a desertar
  ([SISTEMAS.md §5.6](SISTEMAS.md)). Perder un ejército por no haber
  visto un número que estaba en pantalla no es dificultad, es mala
  interfaz.
- **Dice las reglas fijas del juego.** El tope del 75% de resistencia de
  las barriers al 2,5% de tierra es una regla publicada, no un
  descubrimiento: la interfaz la dice. La diferencia con el caso anterior
  es que aquí hay **un número fijo que el juego declara**, no un óptimo
  que depende de tu estado.

**Lo que la interfaz NO hace, nunca:**

- **No calcula tu óptimo.** Nada de «bajar a 55,99% de nodes te daría +X
  maná». Ni el número, ni la flecha, ni el botón de ajustar.
- **No marca umbrales en las barras de reparto de tierra.** El
  porcentaje se ve; dónde conviene estar, no.
- **No recomienda repartos.** Ni al empezar, ni con un asistente, ni con
  un «reparto sugerido».

> La línea, dicha de una vez: **la interfaz contesta «¿cómo estoy?», no
> «¿qué debería hacer?».**

La previsualización la calcula el **mismo núcleo** que resolverá la
acción en el servidor ([ARQUITECTURA.md §1](ARQUITECTURA.md)). Si alguna
vez se ve tentado a calcular un número «solo para la interfaz», es que
esa función falta en `packages/core`.

---

## 2. Rutas

| Ruta | Qué es | Fase |
|---|---|---|
| `/` | Portal: entrar, crear cuenta, elegir servidor. | 1 |
| `/reino` | **La pantalla principal.** Recursos, ingresos, edificios, construir, explorar. | 1 |
| `/ejercito` | Stacks, reclutamiento, upkeep total, héroes. | 1-2 |
| `/magia` | Libro de hechizos, investigación en curso, lanzar, encantamientos activos. Ver §3.1. | 2 |
| `/guerra` | Buscar objetivo, previsualizar el ataque, lanzarlo. Ver §3.2. | 3 |
| `/cronica` | Qué ha pasado: ataques recibidos, investigación terminada, colapsos. | 1 |
| `/batalla/:id` | **La repetición**, ronda a ronda. Ver §3.3. | 3 |
| `/mercado` | Mercado negro: items, hechizos ancient, taberna de héroes. | 4 |
| `/ranking` | Clasificación del servidor. | 4 |
| `/gremio` | Gremio, aliados, diplomacia. | 5 |

---

## 3. La pantalla del reino

Es donde el jugador pasa el tiempo, y la que más decide si el juego se
entiende.

Tiene que responder de un vistazo, sin abrir nada:

- **Cuántos turnos tengo**, y **cuánto falta para el siguiente** y para
  llenar el almacén. Que el almacén esté lleno es un aviso: estás
  desperdiciando.
- **Qué tengo de cada recurso, y cuál es mi ingreso neto por turno.** El
  neto, no el bruto: ingreso menos upkeep. Es el número que decide si tu
  ejército sobrevive.
- **Cómo está repartida mi tierra**, en porcentaje y en número absoluto.
  Que se vea de un golpe que estás al 31,4% de nodes — **sin marcar
  umbrales ni decir si eso es bueno** (§1).
- **Qué se está construyendo** y cuánto le falta.

### 3.1. La pantalla de magia **[F2]**

Spec en [SISTEMAS.md §7.1](SISTEMAS.md). Lo que esta pantalla tiene que
resolver, y que no es obvio:

- **Qué puedo investigar y qué no.** La rueda decide el acceso, y el
  jugador no debería tener que memorizarla: el libro **enseña solo lo que
  le toca**, y cuando algo no le toca, dice por qué — «Nether es opuesta
  a Verdant: de ahí solo aprendes Simple y Average».
- **Cuánto me va a costar lanzarlo, a mí.** El coste fuera de color
  multiplica hasta por seis, así que el libro enseña **el precio que
  pagarías tú**, no el precio base. Enseñar 30.000 cuando vas a pagar
  180.000 sería mentir.
- **Qué tengo encantado y qué me cuesta.** Los encantamientos son upkeep
  continuo, y ahí es donde un mago se arruina sin darse cuenta. Su coste
  va sumado al ingreso neto de la pantalla del reino, no escondido aquí.
- **Cuánto falta.** La investigación y los *cast turns* avanzan al gastar
  turnos, así que se cuenta **en turnos, no en minutos**.

**Y lo que no hace**, igual que en el reino (§1): no recomienda qué
investigar, no ordena el libro por «lo mejor primero», y no avisa de que
un hechizo es mala compra. Enseña los cuatro costes y decide el jugador.

### 3.2. La pantalla de guerra **[F3]**

Spec en [SISTEMAS.md §9.1](SISTEMAS.md). Lo que tiene que resolver:

- **Contra quién puedo ir.** El original limita el pillage a magos dentro
  del **50% de tu net power** (§9); la lista dice quién entra y quién no,
  y por qué.
- **Qué me va a costar.** Atacar cuesta **el upkeep de todo tu ejército**
  antes de resolver, y eso hunde a quien ataca sin poder pagarlo. Va
  dicho antes de confirmar, no después.
- **Los tres ataques son tres decisiones**, no un desplegable: regular,
  asedio y saqueo dan cosas distintas y cuestan cosas distintas. La
  pantalla los presenta como tres caminos.

**La previsualización.** Aquí sí se calcula qué pasaría, **con el mismo
núcleo que lo resolverá en el servidor**
([ARQUITECTURA.md §1](ARQUITECTURA.md)) — es la razón principal de que
todo el repo sea TypeScript.

Y **no contradice §1**: enseñar el resultado probable de *lo que has
pedido* es información sobre tu propia acción, como el coste de construir.
Lo que sigue sin hacerse es **elegir por ti**: nada de «este objetivo te
conviene más» ni de ordenar la lista por facilidad.

> **Con una salvedad honesta**: la previsión de una batalla es
> **probable, no cierta** — el azar va entre 0,25 y 0,75 por golpe. La
> pantalla lo dice con un rango, nunca con un número solo. Una previsión
> que parezca exacta y luego falle es peor que no dar ninguna.

### 3.3. La repetición de batalla **[F3]**

Toda batalla guarda su semilla y **se puede volver a jugar exacta**
([SISTEMAS.md §9.1](SISTEMAS.md)). Ésta es la pantalla que lo aprovecha, y
existe por una razón de [VISION.md §3](VISION.md): en un juego donde
perder un ejército cuesta días, **«te han ganado» sin poder ver por qué es
inaceptable**.

- **Ronda a ronda**, con el orden de iniciativa, qué stack pegó a cuál,
  cuánto daño y cuántas bajas.
- **Se ve por qué**: el acierto que se aplicó, la resistencia del
  defensor a ese tipo de daño, y la eficiencia que quedaba tras la fatiga.
  Los números de la fórmula, no un resumen.
- **Sin animación.** Números y estado de los stacks
  (§7). Un juego que resuelve 40.000 unidades en
  milisegundos no gana nada animándolas.

**Esto sí explica reglas, y es la excepción deliberada a §1.** La
diferencia con la pantalla del reino: allí el jugador decide **antes** y
explicarle el óptimo le quita la decisión; aquí la batalla **ya pasó**, y
entender qué ocurrió es lo que le permite decidir mejor la próxima vez.

---

## 4. Reglas de presentación

- **Los números de este juego son grandes.** Decenas de miles de maná,
  cientos de miles de geld, cientos de unidades por invocación
  ([SISTEMAS.md §7](SISTEMAS.md)). Se formatean con separador de miles
  siempre, y se abrevian (`1,2 M`) solo donde no quepan — nunca en un
  campo donde el jugador tenga que comparar dos cifras.
- **Porcentaje y número absoluto juntos**, siempre que el efecto dependa
  del porcentaje. «248 nodes (12,4%)».
- **El color no es la única señal.** Un ingreso negativo lleva signo y
  texto, no solo rojo. Por dos motivos: hay daltónicos jugando, y en este
  juego **rojo y verde ya significan otra cosa** — son Eradication y
  Verdant (§6.3).
- **Nada que dependa del reloj se calcula en el cliente para decidir.**
  El contador de «siguiente turno en 4:12» es decoración; los turnos que
  tienes los dice el servidor ([SPECS.md §5](SPECS.md)).
- **Una acción que gasta turnos siempre se confirma**, y la confirmación
  enseña el coste y el resultado previsto. Gastar 180 turnos por un doble
  clic no puede pasar.

---

## 5. Móvil

**No es una adaptación: es el caso principal.** Los quince minutos al día
se juegan en el móvil.

- La pantalla del reino tiene que ser legible y accionable en vertical,
  sin desplazamiento horizontal.
- Las zonas de toque son de dedo, no de ratón.
- Las tablas densas (ejército, libro de hechizos) se apilan en tarjetas
  en pantalla estrecha, no se hacen scroll lateral.
- **La ilustración de fondo se reduce o desaparece** (§6.5). En una
  pantalla de 360px el panel ocupa casi todo: la imagen no se vería, y
  cobrar 150 KB por algo que no se ve es cobrar por nada.
- **El ornamento se simplifica a un filete** y no pasa del 15% del ancho
  (§6.6). En móvil el marco es lo primero que sobra.

---

## 6. Estilo visual

**Spec del 2026-09-21.** Cerrada la marca `[abierto]` que había aquí.

### 6.1. La dirección, y el riesgo que trae

**[nuestro]** **Pintado y ornamentado**: cada pantalla tiene una
ilustración de fondo, y los datos viven en **paneles enmarcados** encima.
Fantasía oscura medieval, coherente con [ASSETS.md](ASSETS.md).

**[nuestro]** **Solo tema oscuro.** Un tema cuidado antes que dos a
medias. Y hay una razón concreta además de la del esfuerzo: con
**Ascendant = blanco** y **Nether = negro** entre los colores canónicos
(§6.3), cualquier tema deja a una de las dos escuelas peleándose con el
fondo. En oscuro sufre Nether, y eso tiene solución (§6.3); en claro
sufriría Ascendant, que es la escuela de los ángeles y la luz, y ahí la
solución sería pelearse con la identidad del original.

> **El riesgo de esta dirección, dicho sin rodeos.** Éste es un juego de
> **leer números densos**, y una ilustración de fondo es exactamente lo
> que estorba a eso. Se eligió pintado a sabiendas. Por eso el resto de
> este apartado **no describe un ambiente: pone las reglas que impiden
> que la ilustración se coma la legibilidad**, y §6.7 las convierte en
> comprobaciones que se pueden ejecutar.
>
> La regla que gobierna todas las demás: **si hay que elegir entre que se
> vea bonito y que se lea, se lee.**

### 6.2. Paleta de la interfaz

**[nuestro]** Tokens. Todo color del producto sale de aquí; **ningún
componente escribe un color a mano**.

| Token | Valor | Para qué |
|---|---|---|
| `--fondo` | `#14100c` | El lienzo, y **el color de respaldo si la ilustración no carga** (§6.5). |
| `--panel` | `#1e1813` | La superficie de los paneles de datos. |
| `--panel-alto` | `#2a211a` | Filas destacadas, cabeceras, menús. |
| `--marco` | `#6b5537` | El bronce del ornamento. |
| `--marco-luz` | `#8a6f47` | El filete de luz del marco. |
| `--texto` | `#ece0cb` | Datos y prosa. |
| `--texto-tenue` | `#a8987e` | Etiquetas, unidades, secundario. |
| `--texto-apagado` | `#7a6d59` | Deshabilitado, marcas de agua. |
| `--acento` | `#d4a638` | Acciones, enlaces, foco. Oro. |
| `--positivo` | `#7fa66b` | Ingreso neto positivo. **Verde salvia, desaturado.** |
| `--negativo` | `#d4605e` | Ingreso neto negativo, pérdidas. **Rojo rosado, más claro que el de Eradication.** |
| `--aviso` | `#d08b3c` | Al borde del colapso, almacén lleno. |

Los contrastes de todos ellos sobre `--panel` están **calculados y
comprobados** (§6.7), no elegidos a ojo.

**Por qué el positivo y el negativo son claros y desaturados.** Para
separarse de Verdant y de Eradication (§6.3) — pero **hay que ser
honesto sobre hasta dónde llega esa separación**: el rojo de estado y el
rojo de Eradication son los dos rojos, y difieren en **claridad y
saturación**, no en tono (7° de diferencia). Un daltónico, o alguien
mirando de reojo, no los va a separar por el color.

Así que lo que de verdad evita la confusión son las otras dos reglas, y
por eso son obligatorias:

1. **No coinciden nunca en la misma vista** (§6.3).
2. **El color no es la única señal** (§4): un ingreso negativo lleva
   signo y flecha.

Si alguna vez las dos fallan a la vez, el problema es la pantalla, no la
paleta.

### 6.3. Los cinco colores de escuela

**[orig]** Los colores son canon y son **vocabulario de la comunidad**:
en el original a un jugador se le llama literalmente «un rojo» o «un
verde» ([ORIGINAL.md §5](ORIGINAL.md), confianza alta). No se tocan.

| Escuela | Token | Valor |
|---|---|---|
| Ascendant (blanco) | `--escuela-ascendant` | `#f2ead8` |
| Verdant (verde) | `--escuela-verdant` | `#4e9e4a` |
| Eradication (rojo) | `--escuela-eradication` | `#d1442c` |
| Phantasm (azul) | `--escuela-phantasm` | `#3f7fc4` |
| Nether (negro) | `--escuela-nether` | `#8574a0` |
| Plain (ninguna) | `--escuela-plain` | `--texto-tenue` |

**[nuestro]** **Los colores de escuela no pintan la interfaz.** Aparecen
**solo donde se habla de una escuela**: iconos de hechizo y de unidad,
filtros del libro, la ficha del mago, la rueda de adyacencia. Nunca como
color de una barra de recursos, de un botón o de un estado.

Es lo que permite que la interfaz use rojo y verde para «vas mal» y «vas
bien» sin ambigüedad: **nunca coinciden en la misma vista con un icono
de escuela**. Si un día coinciden, la que cede es la interfaz.

**[nuestro]** **Nether no puede ser negro de verdad.** Sobre un fondo
oscuro, el negro no se ve. Su token es un **violeta ceniza** legible, y
la identidad de «negro» la lleva **la forma del icono** —calavera,
vacío— y un relleno oscuro con **reborde claro**. Es la única escuela
que se separa de su color nominal, y se separa porque el color nominal
es invisible, no por gusto.

### 6.4. Tipografía

**[nuestro]** Dos familias y ni una más:

- **Títulos y ornamento**: una serif con carácter, romana o de
  inscripción. **Solo para títulos cortos y nombres propios.** Nunca para
  datos.
- **Datos y prosa**: una sans humanista, legible a tamaño pequeño.

**Y una regla que no se negocia: cifras tabulares** (`font-variant-
numeric: tabular-nums`) **en toda columna de números.** Este juego es
una columna de cifras de seis y siete dígitos que cambian cada turno; si
los dígitos no ocupan lo mismo, la columna baila y deja de poder leerse
de un vistazo. Es el detalle tipográfico que más importa aquí y el más
fácil de olvidar.

Tamaño base **16px**, y **14px como mínimo absoluto** para cualquier
dato. Nada de 12px «porque cabe más»: ver §4, la densidad es legítima y
la ilegibilidad no.

### 6.5. La ilustración

**[nuestro]** Las reglas que hacen que el fondo pintado sea seguro:

1. **La ilustración nunca va detrás del texto.** Va detrás y alrededor de
   los paneles. El texto se lee siempre sobre `--panel`.
2. **Los paneles son opacos o casi**: mínimo **92%** de opacidad. El
   contraste se mide **contra el color del panel**, nunca contra la
   ilustración — una imagen tiene mil colores y ninguno es una garantía.
3. **La interfaz tiene que funcionar entera sin ninguna ilustración.**
   Con las imágenes bloqueadas, el fondo es `--fondo` y todo se lee
   igual. Esto no es una degradación elegante opcional: es el estado
   normal durante la carga, con mala conexión, y para quien navegue sin
   imágenes.
4. **Una ilustración por pantalla**, no una por estado ni una por
   escuela.
5. **Presupuesto de peso**: ≤ **150 KB** por ilustración en formato
   moderno, cargada de forma diferida, y **≤ 250 KB** sumando la
   ilustración y el ornamento de una pantalla.
6. **En móvil se sirve una versión reducida**, y con `prefers-reduced-
   data` o conexión lenta **no se sirve ninguna**: color plano.

### 6.6. El ornamento

**[nuestro]**

- **El ornamento nunca lleva información.** Un marco no indica estado, no
  distingue un panel activo de uno inactivo, y no es el único indicador
  de nada. Es decoración, y si se quita no se pierde ningún dato.
- **El ornamento no come área de datos.** En pantalla estrecha se
  simplifica a un filete, y su presupuesto total es **≤ 15% del ancho**
  (§6.7). Un marco bonito que deja la tabla en la mitad de la pantalla es
  un marco mal puesto.
- **Sin animación de ambiente**: nada de parpadeos, partículas ni
  parallax. Ver §7.

### 6.7. Criterios de aceptación

Medibles, y varios automatizables sobre los tokens sin abrir el
navegador:

1. **Contraste.** `--texto` sobre `--panel` ≥ **7:1**; `--texto-tenue`
   sobre `--panel` ≥ **4,5:1**; `--acento`, `--positivo`, `--negativo` y
   `--aviso` sobre `--panel` ≥ **4,5:1**. Un test recorre los tokens y lo
   calcula: no hace falta mirar.
2. **Nether se ve.** `--escuela-nether` sobre `--panel` ≥ **3:1**.
3. **Las escuelas se distinguen entre sí.** Ascendant se distingue por
   **claridad** (es casi blanco: ≥ 10:1 sobre `--panel`); las otras
   cuatro, por **tono**, separadas ≥ **50°** entre cualquier par. Medido
   el 2026-09-21: el par más cercano es Phantasm-Nether, a 52°.

   > **Ojo con el instrumento.** La razón de contraste **no sirve** para
   > esto: mide claridad, no tono, y dice que Eradication y Phantasm se
   > parecen (1,10:1) cuando son rojo y azul. Se comprueba con el ángulo
   > de tono, no con el contraste. Este criterio estuvo mal escrito
   > durante media hora el 2026-09-21, y el cálculo lo delató.
4. **Sin imágenes se juega.** Con las imágenes bloqueadas, la pantalla
   del reino se lee completa y todas las acciones funcionan. Se comprueba
   en el navegador, en la misma sesión que el resto de lo visual.
5. **Ningún texto sobre la ilustración.** Ningún elemento de texto tiene
   como fondo directo la imagen: siempre hay un panel de por medio.
6. **Peso.** Ilustración + ornamento de cualquier pantalla ≤ **250 KB**.
   Se mide en el build.
7. **Cifras tabulares.** Toda columna de números las usa. Comprobable con
   un test sobre los estilos.
8. **Móvil.** A **360px** de ancho no hay desplazamiento horizontal y el
   área de datos ocupa **≥ 85%** del ancho.
9. **Los colores de escuela se quedan en su sitio.** Los tokens
   `--escuela-*` solo aparecen en componentes de escuela. Comprobable
   con una búsqueda sobre el código, y es la regla que más fácil se
   rompe al añadir una pantalla nueva.
10. **El color nunca es la única señal** (§4). Un ingreso negativo lleva
   signo y flecha además de color.

### 6.8. Fuera de alcance

- **Tema claro.** Decidido el 2026-09-21. Los tokens de §6.2 dejan la
  puerta abierta, pero **no se promete**.
- **Temas personalizables por el jugador**, y temas por escuela.
- **Ilustración animada, parallax o partículas de ambiente.**
- **Una ilustración por escuela de la misma pantalla.** Una por pantalla.
- **Modo de alto contraste propio.** Los criterios de §6.7 ya piden 7:1
  para el texto principal, que está por encima del mínimo habitual.

---

## 7. Fuera de alcance

- **Animaciones de combate en tiempo real.** La repetición de batalla es
  ronda a ronda, con números y estado de los stacks. Un juego que resuelve
  40.000 unidades en milisegundos no gana nada animándolas.
- **Mapa del mundo.** No hay posiciones ([SISTEMAS.md §16](SISTEMAS.md)).
- **Aplicación nativa.**
- **Y lo que declara §6.8**: tema claro, temas personalizables,
  ilustración animada o con parallax, y una ilustración por escuela.
