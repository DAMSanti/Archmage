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
| `/` | Portal: entrar, crear cuenta, elegir servidor. | **4** |
| `/reino` | **La pantalla principal.** Recursos, ingresos, edificios, construir, explorar. | 1 |
| `/ejercito` | Stacks, reclutamiento, upkeep total, héroes. | 1-2 |
| `/magia` | Libro de hechizos, investigación en curso, lanzar, encantamientos activos. Ver §3.1. | 2 |
| `/guerra` | Buscar objetivo, previsualizar el ataque, lanzarlo. Ver §3.2. | 3 |
| `/cronica` | Qué ha pasado: ataques recibidos, investigación terminada, colapsos. | 1 |
| `/batalla/:id` | **La repetición**, ronda a ronda. Ver §3.3. | 3 |
| `/mercado` | Mercado negro: subasta de items, hechizos y unidades, y taberna de héroes. Ver §3.4. | 4 |
| `/ranking` | Clasificación del servidor por net power. Ver §3.5. | 4 |
| `/habilidades` | Las diez habilidades del mago y en qué gastar los puntos. Ver §3.6. | 4 |
| `/gremio` | Gremio, aliados y diplomacia. Ver §3.7. | 5 |
| `/mensajes` | Bandeja, directos y tablón de gremio. Ver §3.8. | 5 |
| `/temporada` | Cuántos sellos van, cuánto falta, y los dos Halls. Ver §3.9. | 5 |

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

**Y desde el 2026-09-22, además, tiene una escena** (§6.5): una vista
pintada del reino con **una pieza por cada tipo de edificio que tengas**.
No sustituye a nada de lo de arriba — los números siguen en sus paneles,
porque son los que se leen. Lo que añade es saber **de un vistazo qué
clase de mago eres**: un reino con node y guild y sin barracks se
reconoce antes de leer una cifra.

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

### 3.4. El mercado negro **[F4]**

Spec en [SISTEMAS.md §12.1](SISTEMAS.md). Cuatro secciones —items,
hechizos, unidades invocables y taberna de héroes—, cada una con sus
lotes en subasta.

**Lo que esta pantalla tiene que dejar claro, y son cuatro cosas que
duelen si se callan:**

1. **Pujar cuesta un turno.** Va dicho **antes** del botón, como el
   coste de atacar en §3.2. Es la diferencia entre una subasta y una
   tienda, y es lo que hace que competir por un lote sea una decisión.
2. **Una puja no se puede cancelar.** Se dice antes de confirmar, no
   después.
3. **El geld se cobra al pujar**, no al ganar, y vuelve entero si te
   superan. Un jugador que no lo sepa creerá que ha perdido el dinero.
4. **Cuánto queda.** Cada lote enseña su cuenta atrás —30 minutos desde
   la última puja— en **tiempo real**, que es el único sitio del juego
   donde el reloj manda sobre algo.

**Cuando no hay nada a la venta, la pantalla lo dice.** El mercado se
llena solo con lo que ponen los jugadores, así que estará vacío a menudo
al principio de una temporada. Un panel vacío parece roto; uno que dice
«no hay nada a la venta, pon tú el primer lote» es información.

### 3.5. El ranking **[F4]**

Net power, tierra y escuela. **No** el ejército ni el geld: saber con qué
cuenta el rival convierte la guerra en aritmética
([SISTEMAS.md §12.1](SISTEMAS.md)).

Un mago **protegido aparece igualmente**, marcado. Esconderlo haría que
la lista mintiera sobre cuánta gente hay jugando, que es justo lo que un
jugador nuevo mira para decidir si se queda.

### 3.6. Las habilidades **[F4]**

Las diez, con su nivel, lo que cuesta el siguiente rango y **qué cambia
en números** — «+7% de acierto en batalla», no «mejora tus tropas». La
regla de §4 vale aquí más que en ningún sitio: la interfaz no esconde la
fórmula.

Las cinco de especialidad dicen **cuánto cuestan fuera de tu color** —el
doble— en la propia fila, no en una nota al pie.

---

### 3.7. El gremio **[F5]**

Spec en [SISTEMAS.md §14.1](SISTEMAS.md). Miembros, solicitudes, enemigos
declarados, registros de batalla, y los **aliados**.

**Lo que esta pantalla tiene que dejar claro:**

- **A un compañero de gremio no se le puede atacar**, y eso se dice aquí
  y también en `/guerra`: un botón que no está sin explicación parece un
  fallo.
- **Un aliado manda refuerzos automáticos, salvo sus dos stacks más
  potentes.** Va dicho **antes** de aliarse, porque el que acepta está
  comprometiendo su ejército a batallas que no elige.
- **Romper una alianza tarda 24 horas**, y durante ese plazo los
  refuerzos siguen yendo. Se dice al pulsar, no después.

### 3.8. Los mensajes **[F5]**

Bandeja, directos y tablón de gremio. **Sin tiempo real**: se recarga al
entrar, no hay aviso emergente y no hay indicador de «escribiendo». Es
correo, no chat ([SISTEMAS.md §16](SISTEMAS.md)).

**El bloqueo está en la conversación**, a un clic, y no escondido en una
configuración: el canal que abre la diplomacia abre también el acoso, y
en un juego de tres meses eso expulsa gente antes que cualquier
desequilibrio. Quien bloquea **no ve** los intentos de escribirle.

### 3.9. La temporada **[F5]**

**Cuántos de los siete sellos van, y cuánto falta para la fecha tope.**
Las dos cosas a la vez y desde el primer día, porque **la fecha garantiza
que la temporada acaba y los sellos permiten acabarla antes** — y si solo
se enseñara una, la otra parecería no existir.

Y los dos Halls: **Hall of Fame** con los diez primeros por net power, y
**Hall of Immortals** con los siete que rompieron sello.

> **Esta pantalla es la que responde «¿para qué juego?»**, así que es la
> única que puede permitirse ser un poco solemne. Lo que no puede es
> mentir sobre cuánto falta.

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
- **[nuestro]** **Y la escena del reino tampoco aparece** (§6.5,
  decidido el 2026-09-22). En vertical se sirven los paneles y las
  listas, que es lo que se lee en quince minutos y con una mano.

  > **Esto se preguntó y se decidió, no se dio por supuesto.** Un mapa
  > interactivo y «en móvil la ilustración desaparece» no caben a la vez,
  > porque un mapa que desaparece deja de ser navegación. **Cede el
  > mapa.** El motivo es que este apartado dice que el móvil es el caso
  > principal, y el caso principal no puede ser el que peor lee.
  >
  > Es viable **porque el mapa no manda** (§6.5): todo lo que se alcanza
  > tocando un edificio se alcanza también por la barra inferior, que sí
  > está en las dos. Si el mapa fuera la única puerta a construir, esta
  > decisión dejaría el juego sin construir en móvil.

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

**Ampliación del 2026-09-22, a partir de una referencia visual del
usuario.** La dirección no cambia; se le añaden **dos cosas**, y las dos
afectan a las trece pantallas:

1. **Un marco persistente** — barra de recursos arriba, barra de
   navegación abajo — en lugar de que cada pantalla resuelva por su
   cuenta dónde enseña el estado y cómo se va a otro sitio (§6.9).
2. **Una escena del reino**, solo en `/reino`, con piezas que se pueden
   tocar (§6.5).

**Lo que la referencia proponía y NO se adopta**, porque choca con reglas
que ya estaban escritas y siguen siendo buenas:

- **Rótulos pintados encima de la ilustración.** La referencia lleva
  «Archmage Citadel» y «Farm» como texto libre sobre la imagen. §6.5
  regla 1 lo prohíbe y no se toca: los nombres van en **placas opacas**.
  Un rótulo sobre un cielo pintado es legible en el mock y deja de serlo
  en cuanto la imagen cambia.
- **Una ciudadela como edificio.** No es uno de los ocho
  ([SISTEMAS.md §4](SISTEMAS.md)). Puede estar **pintada en el fondo**
  como parte del paisaje, pero no es una pieza ni se puede tocar: una
  pieza que no corresponde a un edificio real enseña un juego que no es
  éste.
- **La escena como navegación principal.** Se preguntó y se decidió que
  **manda la barra**; el mapa es atajo (§6.5).

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

### 6.5. La ilustración, y la escena del reino

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

#### La escena del reino

**[nuestro]** **Spec del 2026-09-22.** `/reino` —y **solo** `/reino`—
tiene encima de su ilustración una **escena**: el paisaje del reino con
piezas colocadas.

**Es emblemática, no cuantitativa, y ésa es la decisión que la hace
posible.** Se pinta **una pieza por cada tipo de edificio del que tengas
al menos uno**. Ocho tipos, ocho piezas como mucho, y la escena no cambia
entre tener 40 farms y tener 4.000.

> **Por qué no crece con lo que construyes**, que era la alternativa.
> Un reino calibrado llega a **miles de acres con cientos de edificios de
> cada tipo** ([ESTADO.md](ESTADO.md)). Pintar más granjas cuando hay más
> granjas funciona hasta un tope, y a partir del tope **la escena miente
> y deja de decir nada**: un mago con 200 farms y uno con 4.000 verían lo
> mismo. Una escena emblemática no promete una cantidad, así que no puede
> incumplirla.
>
> Y hay una razón de coste, que conviene decir aunque sea la menos noble:
> emblemática, el arte que hace falta son **los ocho iconos de edificio
> que [ASSETS.md §4](ASSETS.md) ya tiene inventariados**. Cuantitativa,
> haría falta arte nuevo y lógica de composición.

Las reglas de la escena, que son las que impiden que se coma lo de
siempre:

7. **La escena no es la navegación: es un atajo.** Todo lo que se alcanza
   tocando una pieza se alcanza **también** por la barra inferior (§6.9).
   Se decidió así el 2026-09-22 porque lo contrario esconde funciones
   detrás de saber que un dibujo se puede tocar — y porque seis de las
   trece pantallas (crónica, mercado, ranking, gremio, mensajes,
   temporada) **no tienen edificio que tocar** y necesitarían otra puerta
   igualmente.
8. **Los rótulos van en placas opacas**, nunca como texto sobre la
   imagen. Es la regla 1 aplicada a la escena, y es donde la referencia
   visual se separa de lo que hacemos.
9. **La escena dice QUÉ, el panel dice CUÁNTO.** La pieza de farm dice
   que tienes farms; «437, el 12,3% de tu tierra» está en su fila. Una
   pieza **nunca** es el único sitio donde vive un dato.
10. **Una pieza que no puedes tocar no se pinta distinta de una que sí**,
    porque no hay ninguna que no se pueda tocar: si un tipo de edificio
    está en la escena, tiene su panel. Lo que no tienes, no aparece.
11. **Sigue siendo una ilustración por pantalla** (regla 4). La escena es
    **un fondo más las ocho piezas**, y las piezas son los iconos que ya
    existen para las tablas: no hay un segundo juego de arte.
12. **Y sigue funcionando sin ninguna imagen** (regla 3). Sin la escena,
    `/reino` es la pantalla de paneles que ya era. Ése es además el
    estado normal en móvil (§5).

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
- **[nuestro] Y una distinción que la escena obliga a hacer (2026-09-22):
  ornamento y control no son lo mismo.** La regla de arriba dice que el
  ornamento no lleva información; las piezas de la escena **sí llevan**,
  y se pueden tocar. No es una excepción a la regla: es que una pieza de
  edificio **no es ornamento, es un control**, y como control tiene que
  cumplir lo de los controles — zona de toque de dedo, foco visible,
  nombre accesible, y alcanzable por teclado. El marco de bronce sigue
  sin llevar nada.

### 6.9. El marco persistente

**[nuestro]** **Spec del 2026-09-22.** Hasta ahora cada pantalla
resolvía por su cuenta dónde enseñaba el estado. Pasa a haber **dos
barras fijas en las trece**, y es la parte de la referencia visual que
más se gana:

**Arriba, los recursos.** Geld, maná, población sobre su tope, y net
power. Con su icono y su cifra, siempre en el mismo sitio, **siempre
visibles**. El tope de población va junto al número (`54.320 / 60.000`)
porque acercarse a él es una decisión, no una sorpresa.

**Y los turnos justo debajo**, con **cuánto falta para el siguiente**.
Es la moneda del juego ([SISTEMAS.md §2](SISTEMAS.md)), así que no
comparte fila con nada: quien mira la pantalla tiene que saber cuántos
turnos puede gastar sin buscarlo.

> **Ojo con copiar la referencia aquí.** El mock dice `+1/15m`, y
> nuestros servidores van a **10 minutos** (Terra) y **5** (Veloz)
> ([SISTEMAS.md §2 y §14.1](SISTEMAS.md)). La cadencia **se lee del
> servidor**, no se escribe en la plantilla. Y el almacén lleno se avisa
> (§3): estar al tope es estar desperdiciando.

**Abajo, la navegación.** Iconos grandes, de dedo, con etiqueta de texto
—no solo icono, que se adivina mal—. Las trece rutas no caben en una
barra, así que se agrupan; **cuál va suelta y cuál agrupada es
`[abierto]`** y lo cierra `/plan-tarea` con la lista delante.

Lo que sí está decidido de la agrupación: **`/reino` siempre suelta**,
porque es donde se pasa el tiempo; y **nada de esconder `/cronica`**,
porque es donde el jugador se entera de que le han atacado.

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

**Y los de la escena y el marco, añadidos el 2026-09-22:**

11. **La escena no inventa edificios.** Las piezas pintadas son
    **exactamente** los tipos de los que el mago tiene al menos uno, ni
    uno más ni uno menos. *Test: un estado con `barracks: 0` no produce
    pieza de barracks, y uno con los ocho produce ocho.* Es el criterio
    que caza el fallo de pintar una escena bonita fija que no se
    corresponde con el reino de nadie.
12. **La escena no es la única puerta.** Para cada pieza de la escena
    existe la misma acción en la barra inferior o dentro de la pantalla a
    la que lleva. *Comprobable recorriendo las rutas: ninguna acción
    tiene como único origen un clic en la imagen.*
13. **Ningún dato vive solo en la escena.** Todo número que aparezca
    junto a una pieza aparece también en un panel. *Se comprueba en la
    pasada de navegador, con la escena oculta: no falta ningún dato.*
14. **Las piezas son controles de verdad.** Zona de toque ≥ **44px**,
    foco visible, nombre accesible, y se llega a todas con el tabulador
    en un orden que se entiende. *Comprobable en la pasada de navegador.*
15. **El marco no miente sobre el reloj.** La cadencia de turnos que
    enseña la barra es la del servidor del mago, no una constante.
    *Test: el mismo estado en Terra dice 10 minutos y en Veloz dice 5.*
16. **El marco no roba la pantalla.** Las dos barras juntas ocupan
    ≤ **20%** del alto a 360×640, y el área de datos sigue cumpliendo el
    criterio 8. Es el riesgo real de poner dos barras fijas en un juego
    de leer tablas.
17. **Y el peso no sube por la escena.** El criterio 6 (≤ 250 KB por
    pantalla) **incluye las piezas**. Se cumple porque son los iconos que
    ya se cargan para las tablas; si alguna vez hiciera falta un segundo
    juego de arte para la escena, es señal de que la escena se está
    yendo de madre.

### 6.8. Fuera de alcance

- **Tema claro.** Decidido el 2026-09-21. Los tokens de §6.2 dejan la
  puerta abierta, pero **no se promete**.
- **Temas personalizables por el jugador**, y temas por escuela.
- **Ilustración animada, parallax o partículas de ambiente.**
- **Una ilustración por escuela de la misma pantalla.** Una por pantalla.
- **Modo de alto contraste propio.** Los criterios de §6.7 ya piden 7:1
  para el texto principal, que está por encima del mínimo habitual.

**Y de la escena, añadido el 2026-09-22:**

- **Escena cuantitativa.** Más edificios no pintan más piezas. El porqué
  está en §6.5, y es que a partir del tope dejaría de decir la verdad.
- **Colocar los edificios.** El jugador no elige dónde va nada: la
  composición es fija. No hay decisión de juego detrás — el original no
  tiene posiciones ([SISTEMAS.md §16](SISTEMAS.md)) — y añadirla sería
  inventar una mecánica para justificar un dibujo.
- **Escena en las otras doce pantallas.** Solo `/reino` tiene edificios
  que enseñar. Las demás siguen con fondo pintado y paneles, que es lo
  que §6.5 ya decía.
- **Escena en móvil.** Decidido en §5, y con su porqué.
- **Animar la escena**: humo, agua, gente andando. Ya estaba fuera por
  §6.6 y §7; la escena no lo reabre.

---

## 7. Fuera de alcance

- **Animaciones de combate en tiempo real.** La repetición de batalla es
  ronda a ronda, con números y estado de los stacks. Un juego que resuelve
  40.000 unidades en milisegundos no gana nada animándolas.
- **Mapa del mundo.** No hay posiciones ([SISTEMAS.md §16](SISTEMAS.md)):
  ningún mago está *al lado* de otro, y atacar no depende de la
  distancia.

  > **Y esto no lo contradice la escena del reino** (§6.5), aunque lo
  > parezca. La escena es **tu** reino, y dentro de él las piezas no
  > tienen coordenadas que signifiquen nada: es una vitrina de lo que has
  > construido, no un terreno. Lo que sigue sin existir es la geografía
  > **entre** magos, que es lo que este punto descarta.
- **Aplicación nativa.**
- **Y lo que declara §6.8**: tema claro, temas personalizables,
  ilustración animada o con parallax, y una ilustración por escuela.
