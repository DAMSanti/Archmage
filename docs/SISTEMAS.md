# Sistemas — las reglas del juego

Qué juego estamos construyendo. Éste es **el documento de diseño
definitivo**: cuando una regla se discuta, gana lo que ponga aquí.

No confundir con [ORIGINAL.md](ORIGINAL.md), que dice cómo es *The
Reincarnation*. Este documento dice cómo es **el nuestro**, y cada regla
lleva su procedencia:

| Marca | Significa |
|---|---|
| **[orig]** | Confirmado en el original. La fuente está en [ORIGINAL.md](ORIGINAL.md); si cambias la regla, **di que te separas del original y por qué**. |
| **[nuestro]** | Decisión de diseño nuestra, con su porqué escrito. El original no lo documenta, o lo documenta y hemos decidido otra cosa. |
| **[abierto]** | Sabemos la forma, falta el número. Se cierra con `/spec`, no improvisando al implementar. |

Y su fase, de [ROADMAP.md](../ROADMAP.md): **[F1]** reino, **[F2]**
magia, **[F3]** guerra, **[F4]** mundo, **[F5]** temporada.

---

## 1. El bucle

**[orig]** El juego se juega en **sesiones cortas y repetidas**: entras,
gastas los turnos que se te han acumulado, decides en qué, y te vas. El
eslogan del original —*15 minutos al día*— es la especificación, no el
marketing.

De ahí sale todo lo demás. **Los turnos se acumulan hasta un tope**: si
no entras, los desperdicias. Eso es lo que te hace volver, y es también
lo que impide que jugar 14 horas seguidas sirva de algo.

Una sesión típica:

1. Miras cuántos turnos tienes y qué ha pasado mientras no estabas
   (la crónica: quién te atacó, qué se terminó de investigar).
2. Decides el reparto: construir, reclutar, explorar, investigar, cargar
   maná, o atacar.
3. Gastas. Te vas.

**La decisión central del juego es en qué gastas el turno**, y todas las
demás reglas existen para que esa decisión sea difícil.

---

## 2. Turnos **[F1]**

**[orig]** El turno es la moneda de acción. Se acumula con el reloj, hasta
un tope. Todo lo demás se produce **al gastarlo**, nunca con el reloj.

**[nuestro]** Nuestro servidor de referencia se llama **Terra** y va a
**1 turno cada 10 minutos, con 180 acumulables** — los valores del
servidor *Guild* del original, que es el punto medio entre entrar dos
veces al día y tener que vivir pendiente. Un mago dormido 30 horas llega
al tope; a partir de ahí desperdicia.

**[nuestro]** La cadencia y el tope son **configuración del servidor**,
no constantes del código: la fase 5 abre varios servidores a velocidades
distintas, como el original, y el entorno de desarrollo corre a una
velocidad acelerada para no esperar.

**[orig]** Qué gasta turnos: construir, demoler, explorar, investigar,
cargar maná (*M.P. charge*), cargar geld (*gelding*), lanzar hechizos con
*cast turn*, y atacar.

**[orig]** Qué **no** gasta turnos: fijar un reclutamiento (la tropa llega
sola durante los turnos siguientes), mirar cualquier pantalla, y usar un
item fuera de batalla.

**[orig]** **Los turnos son un objetivo militar.** Hay items que destruyen
turnos del enemigo (*Voodoo Doll*: 2-8). Cualquier diseño que dé turnos
por dinero real rompe el juego entero; queda declarado fuera de alcance
en §16.

---

## 3. Tierra **[F1]**

**[orig]** La tierra se mide en **acres** y es el recurso maestro: casi
todos los efectos del juego se calculan como **porcentaje de tu tierra**,
no como número absoluto. Un mago con 200 forts y 1.000 acres está
defendido; con 200 forts y 100.000 acres, no.

**[orig]** Se consigue de dos maneras:

- **Explorando**, que gasta turnos, es seguro, y **rinde cada vez menos
  cuanto más grande eres**.
- **Atacando** a otro mago **[F3]**. A partir de cierto tamaño es la
  única vía que sigue creciendo, y ése es el motor del PvP.

**[nuestro]** La curva de exploración. El original no publica la
función, pero sí sus extremos medidos
([ORIGINAL.md §4.1](ORIGINAL.md)): **18-26 acres por turno** empezando
con 200 acres, **0-1 al final**, y tope de **3.500 acres** en algunos
servidores. La curva más simple que pasa por los tres puntos:

```
acres por turno = redondeo( 22 × (1 − tierra / 3500) )     mínimo 0
```

Con 200 acres da **21 por turno**, dentro del rango medido de 18-26; con
1.250 da 14; con 3.000 da 3; con 3.400 da 1; en 3.500 se acabó. **El
tope de 3.500 lo adoptamos**: es lo que obliga a que crecer más allá
tenga que ser atacando, que es el motor del PvP (§9).

**[nuestro]** Un acre está **libre** o tiene **un edificio**. No hay
edificios a medias en el mapa: lo que está en construcción es un contador
aparte que se resuelve al gastar turnos (§4).

---

## 4. Edificios **[F1]**

**[orig]** Los ocho, y **no hay más**. La lista es cerrada; cualquier
edificio nuevo es un cambio de diseño, no una adición.

| Edificio | Qué hace |
|---|---|
| **Farms** | Producen comida. Sin comida no se sostiene ni la población ni el ejército. |
| **Towns** | Alojan población y generan geld. |
| **Nodes** | Producen maná y lo **almacenan**: 1.000 cada uno. |
| **Workshops** | Aceleran toda la construcción, **incluida la de más workshops**. |
| **Barracks** | Permiten reclutar y fijan la velocidad de reclutamiento. |
| **Guilds** | Investigan hechizos, generan puntos de habilidad y generan items. Mantenimiento caro. |
| **Fortresses** | Bonus defensivo. **Con 0 forts, el mago muere.** |
| **Barriers** | Resistencia a magia e items enemigos. Upkeep de maná alto. |

### 4.1. Velocidad de construcción

**[orig]** Depende solo de los workshops. Con `W` workshops y
`base = (W / 10) + 0,1`, por turno se construyen:

| Edificio | Por turno |
|---|---|
| Farms, Barracks | `base × 2` |
| Workshops | `base` |
| Guilds | `base / 2` |
| Towns, Nodes | `base / 3` |
| Fortresses | `base / 30` |
| Barriers | **1, siempre** |

**[orig]** De ahí sale que **299 workshops construyen un fort por turno**.

**[nuestro]** Las fracciones **se acumulan entre turnos**, no se pierden.
Si un turno te deja 10,5 nodes, el medio node se guarda. El original
premia al jugador que sabe combinar edificios en un turno para no
desperdiciar la fracción; guardarla es más justo y no quita la decisión
interesante, que es el reparto.

**[nuestro]** **Demoler** cuesta turnos y no devuelve geld. Libera el
acre inmediatamente.

### 4.2. Coste y mantenimiento

**[nuestro]** La wiki no publica ni el coste en geld ni el
mantenimiento. Pero **sí publica el tiempo de construcción**, y resulta
que la «proporción de referencia» del original
(`1 fort = 10 nodes/towns = 15 guilds = 30 workshops = 60 farms/barracks`)
**es exactamente esa tabla de tiempos normalizada**
([ORIGINAL.md §4](ORIGINAL.md)). Así que el coste en geld sigue la misma
proporción: si un edificio costara caro en tiempo y barato en geld,
habría dos escaseces distintas tirando en direcciones distintas, y el
reparto dejaría de ser una sola decisión.

| Edificio | Coste (geld) | Mantenimiento (por turno) |
|---|---|---|
| Farm, Barracks | 1.000 | 5 geld |
| Workshop | 2.000 | 5 geld |
| Guild | 4.000 | **15 geld** |
| Town, Node | 6.000 | 5 geld (town) / 6 geld (node) |
| Fortress | 60.000 | 100 geld |
| Barrier | 10.000 | 20 geld **+ 50 maná** |

**Qué escala producen, comprobado el 2026-09-21.** Un mago de 5.000
acres con el reparto que recomiendan las guías del original —2.250 nodes
(45%), 1.000 guilds, 300 workshops, 20 forts, 125 barriers (2,5%), y el
resto en 979 farms y 326 towns (3:1)— sale así:

| | |
|---|---|
| Construirlo entero | **23,5 millones de geld** |
| Mantenimiento | **41.025 geld/turno** + 6.250 maná/turno |
| Población máxima | **423.900** (espacio; la comida daría 489.500) |
| Ingreso de geld | **348.494/turno**, **307.469 netos** |
| Ingreso de maná | **14.625/turno**, con almacén de 2.250.000 |

> **Rehecho el 2026-09-21** con la economía publicada
> ([ORIGINAL.md §4.2](ORIGINAL.md)). La población máxima decía **97.800**
> y el ingreso **86.100 brutos / 45.100 netos**.
>
> Y el cuadro **delata algo que antes no se veía**: a este mago le sobran
> farms y le faltan towns. El espacio da 423.900 y la comida 489.500, así
> que manda el espacio y **65.600 de comida no alimentan a nadie**. Con
> solo un 6,5% de la tierra en towns, el factor de geld por cabeza cae a
> **0,82** — crecer en tierra sin construir towns empobrece a cada
> habitante, que es justo el freno que la fórmula publicada tiene y la
> nuestra no tenía. El reparto de las guías está pensado para maná, no
> para geld, y ahora el cuadro lo dice.

Dos comprobaciones contra el original, y **ninguna de las dos es
redonda**, que es lo honesto:

- Una guía veterana recomienda tener *«around 30 mils»* de geld guardado
  a ese tamaño ([ORIGINAL.md §4.1](ORIGINAL.md)). Nuestro coste de
  construcción entero son 23,5 millones: **el mismo orden de magnitud,
  un 20% por debajo**. No cuadra al céntimo y no debería pretenderlo —
  una es una reserva y otra un coste—, pero descarta que estemos a un
  factor 10 de distancia, que es el error que de verdad importa.
- El maná: 14.625 por turno con 2,25 millones almacenados. Un *Summon
  Unicorn* cuesta 30.000 (§7), o sea **dos turnos de
  ingreso**. En el original una invocación grande es un gasto que se
  nota pero no arruina, y eso es lo que sale.

Los 45.100 geld netos por turno son lo que tiene que sostener el
ejército. Si al poner los números de las unidades (fase 3) resulta que
eso da para mucho menos de las 10.000-20.000 unidades que documenta el
original, **el que está mal es este cuadro**, no el ejército.

Guilds y barriers son **deliberadamente caros de mantener**, como en el
original: son los dos edificios que la wiki describe con mantenimiento
alto, y es lo que impide tener 1.600 guilds y un ejército a la vez.

**[abierto]** Estos siete números son **una primera tirada**. Se
calibran con la simulación de temporada, no discutiéndolos: ver los
criterios de aceptación en §17.

### 4.3. Topes de efectividad

**[orig]** Construir más de la cuenta **no suma**, y en algunos casos
resta:

- **Barriers**: máximo **75% de resistencia**, alcanzado al **2,5%** de
  la tierra. Por encima, solo pagas upkeep.
- **Fortresses**: el bonus aparece por encima del **0,67%** de la tierra
  y es **máximo al 2,33%**.

---

## 5. Economía **[F1]**

Todo se produce **por turno gastado**, no con el reloj.

### 5.1. Cómo rinde un edificio

> **Corrección del 2026-09-21.** Este apartado decía antes que el
> decrecimiento era una curva suave con el máximo en el 30%, y que la
> forma era `(umbral/ratio)²`. **Era una invención mía**, deducida de una
> sola frase del *Beginner's Guide*. Al ampliar la investigación apareció
> la fórmula publicada, y no se parece: es una **sierra**, y el máximo
> está en el **55,99%**. Queda sustituida.

**[orig]** El maná tiene fórmula publicada, y la copiamos exacta
([ORIGINAL.md §3.1](ORIGINAL.md), confianza alta). Con `N` nodes y `L`
acres:

```
X = floor(100 · N / L)
maná por turno = X·L/100 + N·(100−X)/10
```

Lo que esto hace, y es el corazón de la decisión económica del juego:

- **Dentro de cada punto porcentual, cada node nuevo suma.**
- **Pero el node que hace subir el porcentaje entero puede restar.** El
  salto al cruzar al `k`% vale `L·(10−k)/1000 + (101−k)/10`. Por eso el
  óptimo local está siempre en `k−1,99%`: el último node antes de cruzar.
- **La sierra muerde según lo grande que seas.** Con 200 acres el primer
  cruce que resta es el 41%; con 1.000 es el 19%; con 10.000 o más, el
  11%. Nadie lo dice en ninguna regla: sale de la fórmula. **La
  dificultad crece con el jugador**, y ése es el motivo más fuerte para
  copiarla exacta en vez de suavizarla.
- **El máximo global está en ~56%** a cualquier tamaño (55,50% con 200
  acres, 55,99% con 10.000).

**[nuestro]** **Lo copiamos con sus saltos, y la interfaz no resuelve el
puzle por ti** (decisión del 2026-09-21). Encontrar el filo del
porcentaje es una habilidad del juego, no un defecto que haya que pulir.
Lo que la interfaz sí hace es no mentir: te enseña cuántos nodes tienes,
qué porcentaje es y cuánto maná neto te entra — pero no te dice dónde
está el óptimo ni te ofrece ajustarlo. Ver
[INTERFAZ.md §1](INTERFAZ.md).

**[nuestro]** **Los demás edificios no llevan sierra.** Solo el maná
tiene fórmula publicada, y replicar la sierra en geld y comida «por
simetría» sería inventarse tres mecánicas difíciles a partir de una. El
freno de los demás es otro y ya existe: **la tierra es finita**, así que
subir el porcentaje de towns baja el de farms, y eso ya limita la
población sin necesidad de una penalización artificial (§5.3, §5.4).

### 5.2. Maná **[orig]**

Lo producen **solo los nodes**, con la fórmula de §5.1. **El almacén es
el propio edificio**: **1.000 de maná por node**, y lo que sobra se
pierde. Querer guardar más maná significa construir más nodes, lo que a
su vez te empuja contra la sierra. Paga lanzamientos, encantamientos,
barriers y el upkeep de las unidades mágicas.

### 5.3. Geld **[orig]** la forma, **[nuestro]** los números

**[orig]** Lo producen towns y farms en función de **la población** y del
**porcentaje de tierra dedicado a towns**: más gente produce más, y más
porcentaje de towns produce más *por persona*. **Sin límite de
almacenamiento.** Paga el mantenimiento de los edificios, el upkeep de
buena parte del ejército, y el reclutamiento.

**[orig]** **La fórmula está publicada** ([ORIGINAL.md §4.2](ORIGINAL.md),
confianza alta), encontrada el 2026-09-21:

```
geld por turno = población × √((100 + 10 × towns) / tierra) + 1.000
```

`towns` es el **número** de towns, no el porcentaje, y la tierra son
acres. Tres cosas que esto trae y que nuestra versión no tenía:

- **Rendimiento decreciente** en los towns, por la raíz: doblarlos no
  dobla el geld por cabeza. Es lo que hace que volcarse a towns deje de
  compensar en algún punto, sin necesidad de una penalización inventada.
- **El geld por cabeza puede bajar de 1**: crecer en tierra sin construir
  towns **empobrece a cada habitante**. Con 5.000 acres y un 6,5% en
  towns el factor es 0,82 (§4.2).
- **Un suelo de 1.000 por turno**, aunque no quede nadie. Ver §5.6: es lo
  que hace que un mago arruinado no quede muerto sin poder reaccionar.

> **Corrección al diseño anterior (2026-09-21).** Aquí ponía
> `población × (0,75 + 2 × %towns)` marcado `[nuestro]`, con la nota «los
> coeficientes no están publicados». **Sí lo estaban**, y la nuestra se
> separaba en las tres cosas de arriba: era una recta sin rendimiento
> decreciente, no podía bajar de 0,75 por cabeza y no tenía suelo.
>
> La wiki documenta además **dos versiones posteriores**: en 2009 le
> pusieron al exponente 0,0000005, que anula el término de towns y deja
> «población + 1.000». Se adopta **la primera**, que es la que la wiki
> etiqueta como original y **la única en la que los towns son una
> decisión**. Las otras dos son el juego después de quitársela.

### 5.4. Población y comida **[orig]**

**[orig]** La población crece **≈ 1,5% + 50 por turno**, se frena al
acercarse al máximo, y llega a cero o a negativo si se pasa. Vive en las
**towns**; la alimentan las **farms**. **Las unidades consumen
población**: ocupan espacio, y algunas tienen upkeep en población. Y
**las unidades comen antes que los civiles**: cuando falta comida, quien
se muere es la población.

**[orig]** **Los números están publicados** ([ORIGINAL.md §4.2](ORIGINAL.md),
confianza alta). Son dos topes **separados**, y manda el menor:

```
espacio = towns × 1.000 + farms × 100
comida  = farms × 500
población máxima = min(espacio − espacio que ocupa el ejército,
                       comida  − comida que come el ejército)
```

Tres cosas importan de esa forma:

1. **El espacio lo dan varios edificios y se suma.** Una farm aloja 100
   además de dar comida; no es solo comida.
2. **La comida sale solo de las farms**, y **todas** las unidades comen
   de ella. El espacio residencial, en cambio, **solo lo ocupan
   algunas**. Por eso los dos topes se restan por separado: restar el
   ejército una vez del mínimo daría de más en cuanto los dos no sean
   iguales.
3. **El punto de equilibrio es 2,5 farms por town**, no 3. Con 10 towns
   y 25 farms el espacio da 12.500 y la comida 12.500 — es el ejemplo
   trabajado de la wiki, y lo comprueba un test.

**Y eso explica el 3:1 de las guías.** A 3 farms por town el espacio da
1.300 por town y la comida 1.500: **sobran 200 de comida**, que es justo
lo que se come el ejército. Las dos cifras de las fuentes no se
contradicen — 2,5 es el equilibrio de un mago sin ejército, 3 es el
reparto de uno que piensa tener uno.

> **Corrección al diseño anterior (2026-09-21).** Aquí ponía `espacio =
> towns × 300` y `comida = farms × 100`, marcado `[nuestro]`, con el
> razonamiento de que esos coeficientes hacían salir sola la proporción
> 3:1. El razonamiento era bueno y el resultado estaba mal por partida
> doble: **la escala** —los topes reales alojan 4,3 veces más gente en la
> misma tierra— y **la forma**, porque teníamos los dos topes mezclados
> en uno con la farm haciendo de comida y sin aportar espacio.
>
> Esto es lo que más movió de toda la economía: el ingreso **es** la
> población, así que multiplicar el tope multiplica el geld. Las
> consecuencias medidas están en §17.2.

**[nuestro]** Cuánta comida come una unidad: **1**. El original dice que
todas comen de las mismas farms pero **no publica la ración**, así que se
pone una boca por unidad. El espacio residencial sí varía por unidad y va
en su ficha (§8).

### 5.5. Carga **[orig]**

Un turno se puede gastar en **M.P. charging** (duplica el maná que los
nodes producirían ese turno) o en **gelding** (duplica el geld del
turno). Es la válvula que permite salvar un upkeep que se te va de las
manos.

### 5.6. Colapso **[orig]**

Quedarse a cero **no es lo mismo en cada recurso**, y esto es diseño, no
detalle:

| A cero | Qué pasa |
|---|---|
| **Maná** | Stacks de unidades se disuelven **al azar**, los encantamientos se caen, las barriers se deshacen. |
| **Población** | Stacks se disuelven y el ingreso de geld se hunde durante mucho tiempo. |
| **Geld** | Las unidades desertan, se pierden edificios, y **los forts se reducen a la mitad cada turno**, sin recuperarse. |

**[orig]** **Del geld solo no se muere**, y es consecuencia del suelo de
1.000 por turno que publica la fórmula de ingreso (§5.3). Un fort cuesta
100 de mantenimiento, así que un mago con un fort y nada más **se
recupera**: medido, 43.541 de geld a los 40 turnos. Y un mago con 40
forts no cae a cero, sino que **se estabiliza en 10** — donde el
mantenimiento iguala al suelo.

La regla de que con 0 forts el mago muere (§4) sigue en pie; lo que ya no
puede es **dispararla la economía**. Para perder el último fort hace
falta la guerra. Es una consecuencia del original que descubrimos el
2026-09-21 al adoptar su fórmula, no una decisión nuestra — y es
coherente con que el original tope el desastre económico en «pierdes la
mitad de tus forts cada turno» en vez de en la muerte.

**[nuestro]** El colapso **se resuelve al gastar el turno**, nunca por
sorpresa entre sesiones: el jugador siempre ve venir el ingreso negativo
en la pantalla del reino (ver [INTERFAZ.md](INTERFAZ.md)) antes de que le
pase. Que el juego sea duro no significa que sea opaco.

**[nuestro]** Qué stack se disuelve al azar sale del `RandomSource` con
semilla, como todo ([ARQUITECTURA.md §5](ARQUITECTURA.md)): el jugador
puede ver en la crónica por qué perdió justo ése.

### 5.7. Net Power — cuánto vale cada cosa **[orig]** **[F4 como ranking, desde F1 como ancla]**

**[orig]** El original publica la fórmula completa de su ranking
([ORIGINAL.md §3.2](ORIGINAL.md), confianza alta), y **la adoptamos tal
cual**: 1.000 por acre, 19.360 extra por fortress, 6.500 extra por
barrier, 0,05 por maná almacenado, 0,02 por habitante, 0,0005 por geld,
1.000 por nivel de hechizo, 1.000 por lesser item, 100.000 por unique,
10.000 por aliado y 10.000 por nivel de héroe, más el ejército.

**Por qué importa ya en la fase 1, aunque el ranking sea de la fase 4.**
Esta tabla es **el propio original diciendo cuánto vale cada recurso
frente a los demás**: 1 maná = 100 geld, 1 habitante = 40 geld, 1 acre =
20.000 maná. Cualquier número que inventemos nosotros —un coste de
edificio, un ingreso, un upkeep— se comprueba contra ella. Es lo que
convierte «me he inventado un precio» en «he deducido un precio».

**[orig]** **El coeficiente de poder de cada unidad es su `Power Rank`**,
y está publicado en su ficha ([ORIGINAL.md §9.5](ORIGINAL.md), confianza
alta): 23 la Dríade, 423 el Treant, 36.883 el Fénix. Cerrado el
2026-09-21 al investigar la guerra; se implementa con la fase 3.

---

## 6. Escuelas de magia **[F2]**

**[orig]** Seis especialidades. Cinco colores con identidad, más
**Plain**, que es la magia neutra que todos pueden usar. El mago elige la
suya al crearse y **no la cambia durante la temporada** **[nuestro]** —
si pudiera, no habría identidad que defender.

| Escuela | Color | Identidad | Adyacentes | Opuestas |
|---|---|---|---|---|
| **Ascendant** | Blanco | Defensiva. Ángeles, unicornios, espíritus astrales. | Phantasm, Verdant | Nether, Eradication |
| **Verdant** | Verde | Naturaleza. Treefolk, elfos, animales. Flexible, muy dependiente del maná. | Ascendant, Eradication | Nether, Phantasm |
| **Eradication** | Rojo | Agresiva. Dragones, elementales, reptiles. Sus unidades comen población. | Nether, Verdant | Ascendant, Phantasm |
| **Nether** | Negro | Poder a un precio. Demonios y no-muertos. Exige población y maná. | Eradication, Phantasm | Ascendant, Verdant |
| **Phantasm** | Azul | Tramposa. Unidades mágicas y psíquicas, y la mayor variedad de hechizos. | Nether, Ascendant | Verdant, Eradication |
| **Plain** | — | Neutra y de utilidad. | — | — |

**[orig]** **La rueda no es decoración: decide qué puedes aprender** (§7).

---

## 7. Hechizos **[F2]**

**[orig]** Cinco rangos: **Simple, Average, Complex, Ultimate, Ancient**.

**[orig]** Quién puede aprender qué:

- **Simple** y **Average**: todos.
- **Complex**: tu escuela y las **adyacentes**.
- **Ultimate**: **solo la tuya**.
- **Ancient**: no se investigan. Solo en el **mercado negro** **[F4]**.

Consecuencia: **Phantasm llega a todo**, y por eso alcanza el nivel de
hechizo más alto. Es su identidad, y está equilibrado por ser la escuela
sin unidades dominantes.

**[orig]** Cada hechizo tiene **cuatro costes**, y son cuatro decisiones
distintas: **Research Cost** (investigarlo), **Cast Turn** (turnos que
tarda en completarse), **Cast M.P.** (maná al lanzarlo) y **Upkeep Cost**
(mantenimiento continuo, si lo tiene).

**[orig]** **Investigar** depende del número de **guilds**. Avanza sola
mientras haces otras cosas y se acelera dedicándole turnos. **No se puede
tener más de una copia de un hechizo.**

**[orig]** **Nivel de hechizo**: investigar lo sube, y sube más con lo
difícil — **+20** Ultimate, **+7** Complex, **+3** Average, **+1**
Simple. El nivel mejora la probabilidad de éxito, sobre todo fuera de tu
color.

**[orig]** **Lanzar cuesta maná aunque falles.** Lanzar algo complejo
fuera de tu escuela puede fallar por concentración.

**[orig]** **Encantamientos**: upkeep continuo, propios u ofensivos.
Varios distintos a la vez, **nunca el mismo dos veces**.

**[orig]** **Lanzar fuera de tu color cuesta más maná**, y cuánto más
depende del rango y de la distancia en la rueda
([ORIGINAL.md §6.1](ORIGINAL.md), confianza alta):

| Rango | Propio | Adyacente | Opuesto |
|---|---|---|---|
| Simple | 100% | 125% | 200% |
| Average | 100% | 150% | 350% |
| Complex | 100% | 200% | **600%** |
| Ultimate | 100% | — | — |
| Ancient | 100% | 125% | 200% |

**[orig]** Y el acceso a investigar es **más fino** de lo que decía
arriba: de tu color, los cuatro rangos investigables; de los
**adyacentes**, Simple, Average y Complex; de los **opuestos**, solo
Simple y Average. Junto con la tabla de costes, eso significa que un
Complex opuesto **se puede** lanzar si lo consigues — a seis veces su
precio.

**[orig]** **Nivel de hechizo** ([ORIGINAL.md §6.2](ORIGINAL.md)): sube
al aprender (+1/+3/+7/+20/+15 por Simple/Average/Complex/Ultimate/
Ancient), afecta a la potencia de hechizos y encantamientos, y vale
**1.000 de net power por nivel**. **Armageddon no suma.** Y un
encantamiento ya lanzado **no se actualiza** si tu nivel cambia después.

**[abierto]** La lista de hechizos de las **cinco escuelas restantes**.
La de Verdant y Plain se cierra en §7.1.

### 7.1. La magia de la fase 2 **[F2]**

**Spec del 2026-09-21.** Cierra la marca `[abierto]` que había aquí sobre
la lista de hechizos, para **Plain y Verdant**.

#### Qué problema resuelve

Hoy el maná se produce y **no sirve para nada**. Eso no es solo contenido
que falta: es lo que impide juzgar el equilibrio del juego. Los criterios
9 y 13 de §17.2 están aplazados con este motivo escrito — sin magia, el
reparto volcado a economía domina por definición. **La fase 2 es lo que
permite volver a medir.**

Y es lo que convierte la elección de escuela, que hoy es un campo en la
base de datos, en una decisión con consecuencias.

#### Alcance, decidido con el usuario

**[nuestro]** **Plain + Verdant, catálogo completo de lo que entra.**

Verdant porque es, con diferencia, **la escuela mejor documentada**
([ORIGINAL.md §6.4](ORIGINAL.md)): catorce hechizos nombrados, quince
unidades, fichas completas de tres rangos distintos, y hasta la lista de
qué encantamientos mantiene un mago verde de verdad. Menos documentación
significa más números inventados, y aquí hay poco que inventar.

**[nuestro]** **Los hechizos ofensivos quedan fuera hasta la fase 3.** Un
hechizo que apunta a otro mago no se puede *comprobar* sin otro mago, y
este proyecto no da por hecha una regla sin comprobarla
([ARQUITECTURA.md §6](ARQUITECTURA.md)). Lo mismo con los de batalla:
*Regeneration* cura tus bajas **al acabar un combate**, y no hay combate.

**No se olvidan: se reservan.** Los nombres confirmados que esperan a la
fase 3 son *Rust Armor*, *Call Hurricane*, *Summon Locust Swarm*,
*Serenity*, *Web of the Spider Woman* y *Regeneration*. Están escritos
aquí para que nadie los vuelva a «descubrir».

Así que «catálogo completo» quiere decir **completo de lo que sí entra**:
invocación, encantamientos propios y utilidad.

#### La escala de costes **[orig]**

Las anclas están publicadas ([ORIGINAL.md §6.3](ORIGINAL.md), confianza
alta), y tres de ellas son de Verdant:

| Rango | Turnos | Maná | Investigación | De dónde |
|---|---|---|---|---|
| Simple | 1 | **3.000** | 900 | *Summon Dryad*, Verdant |
| Average | 2 | **7.900** | 1.400 | *Summon Nymph*, Verdant |
| Complex | 4-6 | **30.000-77.700** | 2.500-10.000 | *Regeneration*, *Summon Unicorn/Hydra/Vampire* |
| Ultimate | **[abierto]** | **[abierto]** | **[abierto]** | no publicado |

**[nuestro]** Para Ultimate extrapolamos la progresión observada —de
Simple a Average el maná se multiplica por ~2,6 y la investigación por
~1,6; de Average a Complex, por ~4 y por ~2—: **8-12 turnos, 120.000 de
maná y 12.000 de investigación**. Es el rango más caro del juego y solo
se aprende en el propio color, así que tiene que doler.

**[orig]** **El coste de una invocación escala con el poder total
invocado, no con el número de unidades.** *Summon Nymph* trae 1.700-2.400
ninfas por 7.900 de maná; *Summon Vampire*, unos 295 vampiros por 77.700.
Es la regla que impide que una invocación barata sea la óptima.

**[orig]** **Lo invocado depende del nivel de hechizo**, y las cifras
publicadas son a nivel alto y en color.

#### Lo que la fase 2 tiene que hacer

1. **Investigar** **[orig]**. La velocidad depende del número de
   **guilds**. Avanza sola al gastar turnos en otra cosa, y se acelera
   dedicándole turnos. **No se puede tener dos copias de un hechizo.**
2. **El libro de hechizos** **[orig]**: qué puedes investigar sale de tu
   escuela y de la rueda. Lo que no te toca, no aparece.
3. **Lanzar** **[orig]**: cuesta **Cast M.P. aunque falles**, y los
   hechizos con *Cast Turn* tardan varios turnos en completarse.
4. **Fallar** **[orig]**: lanzar fuera de tu color puede fallar por
   concentración, y el **nivel de hechizo** mejora la probabilidad.
5. **Encantamientos** **[orig]**: upkeep continuo, varios distintos a la
   vez, **nunca el mismo dos veces**, y se caen si te quedas sin maná
   (§5.6, ya implementado).
6. **Invocar** **[orig]**: trae unidades al ejército, en cantidad que
   depende del nivel de hechizo.

**[nuestro]** **La unidad invocada se parte en dos, como la reclutada.**
La fase 1 dio a las tropas su mitad económica y dejó la de combate para
la fase 3 (§8.1). Las invocadas hacen lo mismo: coste de upkeep, espacio
de población y de qué escuela son ahora; ataque, defensa, HP e iniciativa
en la fase 3. Es coherente y evita inventar números que no se pueden
comprobar.

#### Criterios de aceptación

**Comprobables con tests del núcleo:**

1. **La rueda decide qué se investiga.** Un mago Verdant puede investigar
   Complex de Verdant, Ascendant y Eradication (adyacentes), pero **no**
   de Nether ni Phantasm (opuestas); de ésas, solo Simple y Average.
2. **El coste fuera de color es el de la tabla.** Un Complex de escuela
   opuesta cuesta **exactamente 6×** su Cast M.P.; uno adyacente, 2×.
3. **Lanzar cuesta maná aunque falle.** Con la semilla fijada en un fallo
   de concentración, el maná baja igual y el efecto no ocurre.
4. **El nivel de hechizo suma lo que dice la tabla.** Investigar un
   Complex sube 7; un Ultimate, 20. Un mago que aprende todo el catálogo
   de Verdant y Plain llega a un nivel concreto y reproducible.
5. **No hay duplicados.** Investigar algo que ya sabes es un error de
   dominio, no un maná gastado.
6. **Un encantamiento no se puede lanzar dos veces**, y lanzarlo suma su
   upkeep al ingreso neto que ve el jugador.
7. **Los `Cast Turn` se consumen de verdad**: un hechizo de 4 turnos no
   surte efecto hasta el cuarto, y gastar menos turnos lo deja a medias
   sin cobrar el efecto.
8. **Invocar respeta el espacio de población.** Si no cabe, el hechizo
   falla con error de dominio y **no** cobra el maná.
9. **Todo entero.** Ningún coste ni cantidad invocada tiene decimales, y
   el redondeo está en un solo sitio por fórmula.

**Comprobables con la simulación de temporada:**

10. **El maná ya sirve para algo.** ✅ **Cumple desde el 2026-09-21**,
    tras adoptar la economía publicada del original (§5.3, §5.4).

    A 2.000 turnos el reparto volcado a maná acaba en **3.301.483** de
    net power y el económico en **2.526.383**: el de maná va un **31% por
    delante**. No solo deja de ser peor — **gana**.

    **Y es la magia la que le da la vuelta**: sin magia, el económico
    sigue ganando por 259.181. La magia convierte el maná en ejército y
    en nivel de hechizo, y las dos cosas pesan en el ranking.

    **Por qué no se veía.** Tres errores nuestros, todos corregidos en la
    fase 3, y ninguno de balance:

    1. `netPower()` **no contaba el ejército**, porque el `powerRank`
       estaba `[abierto]` — estaba publicado (§9.1).
    2. Los **upkeeps de las invocadas estaban inventados**, entre 40 y
       100 veces más caros que los publicados.
    3. Los **topes de población estaban 4,3 veces por debajo**, lo que
       dejaba el net power siendo ~98% tierra: con la tierra mandando
       tanto, ningún reparto podía distinguirse de otro.

    El texto de abajo es el análisis original del 2026-09-21, y se
    conserva porque el razonamiento era correcto sobre unos datos que no
    lo eran.

    ---

    *Análisis original, ya superado:* se esperaba que al haber magia el
    reparto volcado a maná dejara de ser estrictamente peor que el
    económico. **Seguía siéndolo**: a 2.000 turnos, el económico acababa
    en 1.513.000 de net power y el de maná en 1.468.000, incluso jugando
    la magia bien.

    **El motivo, y no es un fallo de balance.** El maná compra tres cosas,
    y en la fase 2 **dos no pagan**:

    - **Nivel de hechizo** → net power. Sí paga, y es lo que acorta la
      distancia.
    - **Encantamientos** → economía. Paga, pero **paga más al mago
      económico**: los de Verdant suben farms y población, así que
      favorecen justo al que ya tiene muchas.
    - **Invocar** → ejército. **No paga nada**: las unidades cuestan maná
      para siempre y no pelean, porque no hay combate.

    Así que el maná no competirá mientras lo que compra sea un ejército
    que no sirve. **Aplazado a la fase 3**, igual que los criterios 9 y 13
    de §17.2 — y ahora con la causa medida en vez de supuesta.

    > **Consecuencia declarada: invocar es una trampa hasta la fase 3.**
    > Un jugador que invoque en la fase 2 empeora su maná neto sin ganar
    > nada. Está medido con un test, y la interfaz **no lo va a avisar**
    > (docs/INTERFAZ.md §1): aquí el juego está incompleto, no oculto.

    > ### ⚠ Corregido en la fase 3 (2026-09-21): esto era falso
    >
    > **Invocar no era una trampa; nuestros números lo eran.** La
    > recalibración de §9.1 encontró dos errores nuestros, no de balance:
    >
    > 1. **Los upkeeps de maná estaban inventados**, entre 40 y 100 veces
    >    más caros que los publicados: le puse 1 de maná a la Dríade y su
    >    ficha dice **0,01**; 24 al Treant, y son **0,63**.
    > 2. **`netPower()` no contaba el ejército**, porque el `powerRank`
    >    estaba `[abierto]`. Una unidad invocada pagaba upkeep y **no
    >    sumaba nada** en la única medida que dice quién es grande. Con
    >    eso, «invocar no paga» era cierto **por construcción**: ninguna
    >    medición podía salir de otra forma.
    >
    > Corregidos los dos con la ficha publicada (§9.1), a 2.000 turnos el
    > reparto volcado a ejército pasa a ser **el mejor de los cuatro**
    > (2.531.586 de net power, contra 2.188.345 del económico), y el maná
    > neto de invocar es **+1.436**, no negativo.
    >
    > **Lo que sí sobrevive**: el criterio 10 de §7.1 sigue sin cumplirse
    > —el reparto volcado a *nodes* sigue por debajo del económico, y por
    > más margen que antes—, pero **por otra razón**: no le falta maná,
    > le faltan **turnos**. Gasta los suyos manteniendo encantamientos e
    > invocando, y se queda en nivel 20 de hechizo mientras el económico
    > llega a 207. Eso es una cuestión de qué hace la estrategia
    > simulada, no de cuánto vale el maná.
11. **La progresión de investigación dura lo que debe.** Aprender el
    catálogo completo de Verdant y Plain lleva un número de turnos del
    orden que documenta el original para investigarlo todo —1.500-3.000
    turnos para las seis escuelas ([ORIGINAL.md §4.1](ORIGINAL.md))—,
    escalado a lo que aquí es una escuela.

#### Fuera de alcance de la fase 2

- **Los hechizos ofensivos y los de batalla**, con sus nombres reservados
  arriba. Fase 3.
- **Las otras cuatro escuelas.** Sigue `[abierto]` en §7.
- **Los hechizos Ancient** y el mercado negro que los vende. Fase 4.
- **La mitad de combate de las unidades invocadas.** Fase 3.
- **Los modificadores del maná por items y encantamientos** (*Alchemist*
  −10%, *Moon's Favour* +10%, [ORIGINAL.md §3.1](ORIGINAL.md)): los items
  son de la fase 4.
- **Armageddon**, que es un hechizo pero pertenece al final de temporada.
  Fase 5.

#### Plan técnico

**Escrito el 2026-09-21 con `/plan-tarea`.** Las tareas están en
[ROADMAP.md](../ROADMAP.md) «En curso».

##### Lo que planear destapó, y no estaba en la spec

**Casi todos los encantamientos reales de Verdant son buffs de
combate.** *Plant Growth* da +228% de ataque, contraataque y vida a los
treefolk; *Nature's Lore* sube el daño de los elfos; *Sunray* da
resistencia a magia enemiga ([ORIGINAL.md §6.4](ORIGINAL.md)). Los tres
necesitan combate, que es la fase 3.

Los que **sí hacen algo** en la fase 2 son los económicos: *Nature's
Favor* (producción de farms, ingreso de población, generación de
unidades) y *Weather Summoning* (producción de farms).

**Decisión**: la fase 2 implementa **solo los encantamientos cuyo efecto
se puede comprobar hoy**, que son los económicos. Los de combate se
escriben en el catálogo con su rango y sus costes, **marcados como no
lanzables todavía**, y se activan en la fase 3. Así el libro de hechizos
enseña la escuela entera —que es lo que hace que elegir escuela
signifique algo— sin que haya código que nadie puede verificar.

##### Qué cambia del contrato

Dos huecos en [SPECS.md §1](SPECS.md), y ninguno se resuelve en silencio:

1. **La investigación no tiene dónde guardar el progreso.**
   `spellbook.researching` es un `SpellId | null` y no dice cuánto falta.
   Se convierte en `{ spellId, progress } | null`. **No hace falta
   migración**: `spellbook` ya es `jsonb`.
2. **No hay dónde guardar un lanzamiento en curso.** Los hechizos con
   *Cast Turn* tardan varios turnos ([§7](SISTEMAS.md), `[orig]`), así
   que hace falta `casting: { spellId, turnsRemaining } | null`. Eso **sí
   es una columna nueva**, aditiva y anulable.

##### Los números que el plan tiene que cerrar

Tres marcas que la spec dejó abiertas y que **no se improvisan al
implementar**:

- **Velocidad de investigación.** El original dice que depende de los
  guilds y no publica la fórmula. Se cierra con
  `progreso por turno = guilds × factor`, y el factor se calibra contra
  el criterio 11 de §7.1: el catálogo completo de Verdant y Plain tiene
  que costar un número de turnos del orden del que documenta el original.
- **Escalado de la invocación con el nivel de hechizo.** Las cifras
  publicadas son a nivel **624**, y nuestro catálogo de una escuela llega
  a un máximo muy inferior: **207**, medido el 2026-09-21 al escribir el
  catálogo y expuesto como `MAX_SPELL_LEVEL`. *(El plan estimó «del orden
  de 150»; la cifra real es 207.)* Así que el nivel de referencia **es el
  nuestro, no el del original**: la cantidad invocada va de un suelo a la
  cifra publicada según `nivel / nivelMáximoDelCatálogo`.
- **Probabilidad de fallo por concentración.** No publicada. Sale del
  rango del hechizo y de la distancia en la rueda, y mejora con el nivel.
  **En color nunca falla**, que es lo que hace valiosa tu escuela.

##### Dónde va cada cosa

| | Va a | Por qué |
|---|---|---|
| La rueda, el multiplicador fuera de color, el nivel de hechizo, investigar, lanzar, el fallo, los encantamientos y la invocación | **`packages/core`** | Son reglas. Funciones puras. |
| El catálogo de hechizos de Plain y Verdant, y las unidades invocables con su mitad económica | **`packages/content`** | Son datos. Añadir un hechizo no toca código. |
| Las tres acciones nuevas y el estado que devuelven | **`packages/contract`** | Rompe los dos lados a la vez, que es lo que queremos. |
| La columna `casting` | **`apps/server`** | Migración aditiva. |
| `/magia` | **`apps/web`** | Ver [INTERFAZ.md §3.1](INTERFAZ.md). |

**El efecto de un hechizo es dato, no un `switch` por nombre.** Un
hechizo lleva un efecto de una forma cerrada —invocar, encantar,
recurso— y el núcleo sabe resolver esas formas. Si añadir un hechizo
obliga a tocar el núcleo, el modelo de efectos está mal.

##### Detalles con trampa

1. **El maná se cobra al iniciar el lanzamiento, no al terminarlo.** El
   original dice que cuesta **aunque falles** ([§7](SISTEMAS.md)), y un
   hechizo de 10 turnos que cobrara al final sería gratis si lo
   abandonas.
2. **Un encantamiento ya lanzado no se actualiza** si tu nivel de hechizo
   sube después ([ORIGINAL.md §6.2](ORIGINAL.md), confianza alta). Su
   potencia se congela al lanzarlo, así que se guarda **con** el
   encantamiento, no se recalcula.
3. **El upkeep de los encantamientos ya lo suma `upkeep()`** de la fase 1
   — el hueco estaba previsto. Lo que falta es que el ingreso neto de la
   pantalla del reino lo refleje, y eso sale solo.
4. **Invocar puede no caber.** Si el ejército no entra en la población,
   el hechizo falla **sin cobrar el maná**: es un error de dominio antes
   de empezar, no un lanzamiento fallido.

##### Orden de dependencias

```
rueda + coste fuera de color + nivel de hechizo (core)
   └─ catálogo de Plain y Verdant (content)
         └─ investigar ── libro de hechizos
               └─ lanzar: cast turns, coste aunque falles, concentración
                     ├─ invocar ── encantar (solo económicos)
                     └─ contrato → columna `casting` → servidor
                           └─ /magia
                                 └─ simulación: ¿compite ya el maná?
```

**La simulación va al final** porque el criterio 10 de §7.1 —que el
reparto volcado a maná deje de ser estrictamente peor— **no se puede
medir hasta que el maná compre algo**.

##### Riesgos

- **El catálogo es el trabajo grande, y la mayoría de sus números son
  nuestros.** La wiki publica ficha completa de tres hechizos de Verdant;
  el resto se deduce de la escala por rango. Si al simular sale que un
  rango está mal valorado, se mueve **el dato**, no el código.
- **El criterio 10 puede no cumplirse a la primera.** Es su razón de ser:
  si el maná sigue sin competir con magia, el problema está en los
  precios de los hechizos o en el rendimiento de los nodes, y ahí es
  donde hay que mirar.
- **Los buffs de combate quedan inertes hasta la fase 3.** Declarado
  arriba, no escondido.

**[nuestro]** Referencia de escala, del único hechizo con ficha pública
del original: *Summon Unicorn*, Ascendant, Complex — 4 cast turns, 30.000
de maná, 2.500 de investigación, sin upkeep, invoca **887-1010**
unicornios. Los números de este juego son **grandes**: decenas de miles
de maná y cientos de unidades por invocación. No lo diseñes a escala de
decenas.

---

## 8. Unidades **[F2 invocar / F3 combatir]**

**[orig]** Dos vías, y son dos economías distintas:

- **Reclutar** en los **barracks**, pagando **geld**: tropa básica
  (militia, phalanx, pikemen, archers, cavalry). **No cuesta turnos**,
  pero la tropa **llega poco a poco** durante los turnos siguientes, y
  **solo se recluta un tipo a la vez**. Exige ingreso positivo de maná y
  población, espacio de población y comida.
- **Invocar** con hechizos de tu escuela, pagando **maná**. Llega de
  golpe, en cientos.

**[orig]** Toda unidad **ocupa espacio de población** y tiene **upkeep**,
en geld o en población según el tipo.

**[orig]** La ficha: ataque primario con su **tipo de daño**, ataque
extra, y **habilidades** — *Marksmanship, Additional Strike, Bursting,
Siege, Endurance, Scales, Large Shield, Pike, Healing, Charm, Beauty,
Steal Life, Fear, Flying, Swift, Regeneration, Piercing, Paralyze,
Clumsiness*—, modificadores de velocidad de reclutamiento, y
**debilidades** a tipos de daño concretos.

**[orig]** **Cerrado el 2026-09-21** (fase 3, tarea 1). Decía que la wiki
no publicaba los números de combate. **Sí los publica**: la ficha completa
de cada unidad —ataque, contraataque, ataque extra, HP, iniciativa, tipos
de daño, habilidades, tabla de resistencias y `Power Rank`— está en
[ORIGINAL.md §9.5](ORIGINAL.md), confianza alta. Se copian tal cual para
las **siete** unidades con ficha publicada (Milicia, Dríade, Ninfa,
Arquero élfico, Druida, Treant, Fénix) y se interpolan las trece
restantes con una regla escrita: `powerRank ≈ 6 × √(ataque × HP)`.

**Y trajo una corrección.** Las fichas desmintieron los upkeeps y los
costes que §8.1 había supuesto —la Milicia cuesta **20** de geld, no 60, y
**0,32** de upkeep, no 1—, y revelaron que **varias unidades invocadas
cuestan geld además de maná**, que la fase 2 daba por imposible. Las
consecuencias están medidas en §9.1 y §17.2.

### 8.1. La mitad económica de una unidad **[nuestro]** **[F1]**

Cerrado el **2026-09-21** al implementar la fase 1: reclutar es de la
fase 1, así que **coste, upkeep, espacio y ritmo** hacían falta ya. Lo de
combate sigue abierto arriba.

> **Corregido el 2026-09-21 (fase 3).** Los números de abajo **se
> sustituyeron por las fichas publicadas** donde las hay. El razonamiento
> que sigue se conserva porque explica de dónde salió el upkeep medio de
> **2 geld**, y ese 2 resultó ser **2,19 veces** el real (0,914): es el
> factor por el que el ingreso de la fase 1 quedó generoso, y el motivo
> de que el criterio 11 de §17.2 dejara de cumplirse.

**De dónde salen.** Del ancla del original: un mago del turno 120, con
~1.250 acres, sostiene **10.000-20.000 unidades**
([ORIGINAL.md §4.1](ORIGINAL.md), confianza alta). Con los números de
§4.2, ese mago tiene **25.800 de geld neto por turno**; un upkeep medio
de **2 geld por unidad** deja el ejército sostenible en **12.900**,
dentro de la banda documentada. Ése es el número que fija la escala; los
demás se reparten alrededor.

| Unidad | Coste | Upkeep | Espacio | Por turno y barracks |
|---|---|---|---|---|
| Milicia | 60 | 1 | 1 | 5 |
| Falange | 100 | 2 | 1 | 3 |
| Piqueros | 120 | 2 | 1 | 3 |
| Arqueros | 150 | 2 | 1 | 2 |
| Caballería | 250 | 4 | 2 | 1 |

**[orig]** Las cinco son tropa de barracks y **no tienen escuela**
(`plain`): docs/ORIGINAL.md §7, confianza alta.

> **Estos números están mal, y se corrigen en la fase 3.** Las fichas
> publicadas del original dan **0,01 de maná** para la Dríade y **0,63**
> para el Treant ([ORIGINAL.md §9.5](ORIGINAL.md)); los de esta tabla se
> inventaron con un factor de entre 40 y 100 de más. La spec de §9.1
> adopta los del original y rehace la calibración. *(Anotado el
> 2026-09-21, al investigar la guerra.)*

**[abierto]** Como los de §4.2, son **primera tirada** y se calibran con
el simulador (§17.2), no discutiéndolos. Lo barato y lo caro tienen que
seguir siendo decisiones distintas cuando existan los números de combate:
si la caballería acaba siendo estrictamente mejor por punto de upkeep, la
tabla está mal.

**[nuestro]** **Las habilidades son datos, no casos especiales en el
código.** Una habilidad nueva es una entrada en el catálogo y una regla
en el resolutor, no un `if` con el nombre de la unidad.

---

## 9. Combate **[F3]**

**[orig]** Tres tipos de ataque, y son tres decisiones distintas:

| | Qué es | Victoria | Tierra |
|---|---|---|---|
| **Regular** | Campo abierto, sin penalización de asedio. | Derrotar ≥**10%** del ejército enemigo perdiendo menos que él. | Hasta el **5%**. **2,5 supervivientes por acre** para el máximo. Solo destruye forts si son mucha parte de su tierra. |
| **Siege** | Asedio. Las unidades **no voladoras sin habilidad *Siege* penalizan**, y el defensor cobra más bonus de fort. | Igual, **10%**. | Hasta el **10%**; el atacante se queda **un tercio** de lo destruido. **5 supervivientes por acre**. Destruye y captura forts. |
| **Pillage** | Saqueo de todo o nada. Roba geld, población e items; quema farms, towns, workshops y guilds. | Depende del **net power**, no del número. | Ninguna. Quema **hasta 100 acres**. Sin coste de batalla. |

**[orig]** **Atacar cuesta el upkeep de TODO tu ejército** antes de
resolver. Atacar sin poder pagarlo te hunde aunque ganes.

**[orig]** **Solo se puede pillar** a magos dentro del **50%** de tu net
power. Fuera de Armageddon.

**[orig]** **Cómo se resuelve:**

1. Los stacks se **ordenan** por `ataque × número de unidades`, con
   **voladores ×3/2** (promoción) y **a distancia ×2/3** (resguardo).
2. Golpea primero quien tiene más **iniciativa**, escala **0-7**. La 0 no
   ataca, solo contraataca. A igualdad, orden aleatorio.
3. **El daño se arrastra**: se acumula hasta matar unidades enteras.
4. Modifican: hechizos, items, **bonus de fort**, encantamientos,
   habilidades y resistencias, y **fatiga** (una unidad rinde menos
   después de atacar).

**[orig]** **La fórmula de daño está publicada**, y también la del
acierto y la fatiga ([ORIGINAL.md §9.1](ORIGINAL.md), confianza alta). La
`[abierto]` que había aquí queda cerrada en §9.1.

**[orig]** **El coeficiente de poder del ejército también estaba
publicado**: es el `Power Rank` de la ficha de cada unidad
([ORIGINAL.md §9.5](ORIGINAL.md)). Cerrado el 2026-09-21 (fase 3, tarea
1), y con él `netPower()` cuenta el ejército —`número × rango de poder`—
en vez de dejarlo fuera. Eso desbloqueó el criterio 13 de §17.2 y tumbó
una conclusión de la fase 2 (§7.1, criterio 10).

**[abierto]** Solo sigue sin publicarse **la curva del bonus de fort**
entre el 0,67% y el 2,33% de la tierra.

### 9.1. La guerra de la fase 3 **[F3]**

**Spec del 2026-09-21.** Cierra las marcas `[abierto]` de la fórmula de
daño, de los números de combate de las unidades (§8) y del coeficiente de
poder del net power (§5.7).

#### Qué problema resuelve

Tres cosas que el juego necesita y hoy no tiene:

1. **La tierra deja de tener techo.** Explorar se agota en 3.421 acres
   (§3); a partir de ahí **solo se crece atacando**. Sin guerra, el juego
   tiene un final silencioso.
2. **El maná empieza a pagar.** La fase 2 midió que de las tres cosas
   que compra el maná dos no pagaban, porque **invocar no servía sin
   combate**. **La tarea 3 de esta fase demostró que eso era un error
   nuestro** —upkeeps inventados y un net power que no contaba el
   ejército—, y corregido ya paga: el reparto de ejército es el que más
   net power saca (§17.2, criterio 13). Lo que la guerra añade ahora no
   es *que* pague, sino **para qué sirve** lo invocado: hoy un ejército
   es un número en el ranking y nada más.
3. **La elección de escuela pasa a tener consecuencias.** Las
   resistencias son por tipo de daño, así que llevar las unidades
   adecuadas contra las del rival **es** la decisión táctica del juego.

#### Alcance, decidido con el usuario

**[nuestro]** Los **tres tipos de ataque**, más **héroes** e **items de
batalla**. Es el alcance más grande de los que se plantearon, y se eligió
a sabiendas: héroes e items son dos sistemas que no tenían spec propia y
que aquí entran por la puerta del combate.

**Lo que eso arrastra, dicho por delante**: los héroes y los items
llegarán **solo con lo que toca una batalla**. La taberna del mercado
negro, la generación de items por guilds y el sistema de dioses siguen
siendo de la fase 4. Un héroe en la fase 3 se tiene o no se tiene; cómo
se consigue, después.

#### La corrección que esto obliga a hacer antes

**[nuestro]** **Los upkeeps de unidad de las fases 1 y 2 estaban mal, y
se corrigen.** Las fichas publicadas dan 0,01 de maná para la Dríade y
0,63 para el Treant ([ORIGINAL.md §9.5](ORIGINAL.md)); §8.1 tenía 1 y 24.
Un factor de entre 40 y 100.

Se adoptan **los números del original**: ataque, contraataque, ataque
extra, HP, iniciativa, tipo de daño, habilidades, tabla de resistencias,
`Power Rank` y upkeep. Con eso:

- Se cierra el `[abierto]` de §8 (números de combate).
- Se cierra el `[abierto]` de §5.7 (`Power Rank` **es** el coeficiente de
  poder del net power).
- **Y se invalidan las cifras medidas de las fases 1 y 2.** La
  calibración hay que rehacerla, y está en los criterios de abajo.

**[nuestro]** Los upkeeps publicados son **fraccionarios** (0,01, 0,63,
0,80). Los recursos son enteros (§17.1, criterio 8), así que la **tasa**
se guarda en punto fijo y **el total se redondea una sola vez**, al
sumar el ejército entero. Con miles de unidades el total es un entero
grande y la fracción deja de importar; con tres unidades, no cobrar nada
es lo correcto.

#### Lo que la recalibración midió, y lo que dejó abierto

> **Hecho el 2026-09-21, tarea 3.** El resultado completo está en §17.2;
> aquí va lo que hay que decidir.

**Tres cosas cambiaron de veredicto, y ninguna por el upkeep en sí.**

1. **Criterio 13 de §17.2, desbloqueado y cumpliendo.** El `powerRank`
   estaba publicado, así que el ejército entra en el net power. Deja de
   ser ~98% tierra y pasa a distinguir estrategias. *(Los porcentajes que
   se midieron aquí, del 50% al 79%, los volvió a mover la tarea 4: ver
   la tabla de §17.2.)*
2. **«Invocar es una trampa» era falso**, y lo era por construcción: sin
   `powerRank`, lo invocado no podía sumar. Corregido, el reparto de
   ejército es **el que más net power saca** de los cuatro.
3. **Criterio 11 de §17.2, roto.** Y es el que hay que decidir.

**El criterio 11, en corto.** El ejército que el ingreso sostiene a 600
turnos pasa de **13.636** a **29.838** unidades, contra la banda de
10.000-20.000 que documenta el original. Con milicia pura, **85.225**.

> **Resuelto en la tarea 4**, abajo. Y el diagnóstico de este párrafo
> resultó estar a medias: el factor 2,19 del upkeep era real, pero **el
> punto de medida estaba mal** —el ancla del original es el turno 120, no
> el 600— y los topes de población estaban 4,3 veces por debajo.

**Por qué, y de quién es la culpa.** No del upkeep: es `[orig]` y viene
de la ficha. La media real de la tropa reclutable es **0,914** de geld y
yo había supuesto **2**. Todo lo que se calibró contra ese 2 —la
producción de farms y towns, el `geldPerPopulation`— quedó **2,19 veces
generoso**. El error estaba en el ingreso desde la fase 1; la ficha solo
lo ha sacado a la luz.

**[nuestro]** **Decidido y hecho el 2026-09-21 (tarea 4): se baja el
ingreso a los valores del original.** La instrucción fue literal — *«todo
tiene que ser como el original»*—, y al ir a buscar esos valores apareció
lo que no esperábamos: **estaban publicados**. La economía dejó de ser
diseño nuestro y pasó a ser copia ([ORIGINAL.md §4.2](ORIGINAL.md)).

**Lo que se adoptó**, con su sección:

| | Publicado | Lo que teníamos |
|---|---|---|
| Geld por turno (§5.3) | `Pob × √((100+10×towns)/tierra) + 1.000` | `Pob × (0,75 + 2×%towns)` |
| Espacio por town (§5.4) | **1.000** | 300 |
| Espacio por farm (§5.4) | **100**, y **suma** | 0 (la farm solo daba comida) |
| Comida por farm (§5.4) | **500** | 100 |
| Crecimiento (§5.4) | 50 + 1,5% | 50 + 1,5% ✅ ya estaba bien |

**Y el resultado fue el contrario del que se buscaba, en la dirección
buena.** El encargo era *bajar* el ingreso; los números publicados lo
**suben**, porque los topes de población reales alojan **4,3 veces más
gente en la misma tierra** y el ingreso **es** la población. Aun así el
criterio 11 encaja, porque el problema nunca fue que el mago fuera
demasiado rico: era que **estábamos midiendo en el turno 600** un ancla
que el original da para el **turno 120**, y que en el turno 120 nuestro
mago estaba artificialmente pobre. Ver §17.2, criterio 11.

**Lo que se arregló, en una línea cada uno:**

- **Criterio 11 de §17.2**: vuelve a cumplirse, medido en el turno 120.
- **Criterio 10 de §7.1**: cumple **por primera vez**. El maná no solo
  compite: gana al reparto económico por un 31%.
- **Criterio 13 de §17.2**: la tierra baja del 98% al 37-55% del net
  power, así que el ranking por fin distingue estrategias.

**Y una regla nueva que salió de rebote**: con el suelo publicado de
1.000 de geld por turno, **del geld solo ya no se muere** (§5.6). Un mago
con un fort se recupera, y uno con 40 se estabiliza en 10. Perder el
último fort pide guerra.

#### El combate, regla a regla

Todo **[orig]** salvo lo que se marque, y todo de
[ORIGINAL.md §9.1-9.5](ORIGINAL.md), confianza alta.

**La fórmula.**

```
bajas de R = N_A × ataque_A × (acierto/100) × azar × eficiencia
             × (1 − resistencia_R) × habilidades_defensivas_R ÷ HP_R
```

**El acierto**, que pesa más que el ataque: base **30** en defensa y
ataque regular, **20 en asedio** —ésa es la penalización de asedio, en
números—, y su propia fórmula a tramos para los modificadores.

**[nuestro]** **Cómo se lee esa fórmula a tramos**, porque la fuente deja
dos cosas sin decidir y las dos se resolvieron al implementarla
(2026-09-21):

1. **El signo.** La fuente escribe el segundo tramo como `30 − A` con `A`
   negativo, lo que daría *más* acierto al penalizar. Se lee con **valor
   absoluto**, y no es una elección: es la única lectura con la que **los
   tres tramos empalman** en sus fronteras (en 15 los dos dan 15; en 30
   los dos dan 6). Comprobado con un test.
2. **Cómo pasa a la base 20 del asedio.** Los números de la fórmula
   —24 y 12— son `0,8×30` y `0,4×30`, y los cortes son `30/2` y `30`: la
   curva está escrita **en función de su base**, así que se reescribe con
   ella. Un punto de castigo cuesta un punto en los dos casos.

   La alternativa era multiplicar la curva entera por `base/30`, que
   daría dos tercios exactos con cualquier modificador, pero haría que un
   castigo de 15 puntos costase **solo 10** en asedio. Un modificador de
   acierto está en puntos de acierto y no puede valer distinto según el
   tipo de ataque.

   **Consecuencia declarada:** los dos tercios del criterio 2 son
   exactos **sin modificadores**, que es de lo que habla el criterio. Con
   castigo la proporción se mueve, y las dos curvas cruzan el cero en
   `2×base` — 40 en asedio y 60 en regular.

**El azar**: entre **0,25 y 0,75**, y **fijo en 0,5** para Magic y
Psychic. Sale del `RandomSource` y **la semilla se guarda**
([SPECS.md §5](SPECS.md), invariante 3): toda batalla se puede repetir
exacta, que es lo que permite enseñar la repetición
([VISION.md §1](VISION.md)).

**La fatiga**: la eficiencia empieza en 100 y **baja 15 por cada ataque
primario o contraataque**, **10 con *Endurance***. Los secundarios no la
bajan. **No depende del tamaño del stack**: una unidad fatiga igual que
veinte mil.

**Las resistencias son por tipo de daño**, con media cuando el ataque
tiene varios tipos, y una **debilidad mete −50%** en esa media. El
ejemplo de la fuente es literal: `Fire Ranged = (30% + 75%) / 2 = 52,5%`.

**La media diluye**, y ahí está la decisión táctica: un ataque de dos
tipos contra alguien que solo resiste uno le saca la mitad del provecho —
el Treant, con 67% a melee, cae al 33,5% si el ataque es Melee+Fire. Por
eso importa llevar **el tipo adecuado**, no llevar más tipos.

> **Corregido el 2026-09-21, el mismo día en que se escribió.** Aquí
> ponía que una debilidad mete **−50 en esa media**, y que por tanto se
> diluye como una resistencia. **Es falso**: la debilidad es un
> **multiplicador defensivo de 2,0** ([ORIGINAL.md §9.1](ORIGINAL.md)),
> y va con las habilidades, abajo. Se cazó al implementar las
> habilidades defensivas, cuando apareció que la debilidad estaba en las
> dos listas de la fuente.
>
> **Lo que cambia no es cosmético.** Como multiplicador **no se diluye**:
> basta con que el ataque *contenga* el tipo, así que un Melee+Fire
> aprovecha la debilidad del Treant **entera** mientras su resistencia al
> melee sí se queda a medias. Y el tope pasa de ×1,5 a **×2,0**.

**Las habilidades defensivas se multiplican entre sí** **[orig]**, no se
suman:

| Habilidad | Multiplicador | Cuándo |
|---|---:|---|
| Healing | 0,70 | siempre |
| Scales | 0,75 | siempre |
| Regeneration | 0,80 | siempre |
| Charm | 0,50 | solo contra el ataque **primario** |
| Large shield | 0,50 | solo contra ataques **a distancia** |
| **Debilidad** | **2,00** | si el ataque **contiene** su tipo |

Que sea un producto y no una resta es lo que las hace apilables sin
romperse: las tres incondicionales juntas dejan el daño en **0,42**, y
las cinco en **0,105**. Nunca llegan a cero, y una sola debilidad puede
más que dos defensas — el mejor defensor posible recibe 945 bajas donde
el neutro recibe 9.000, y el peor, 18.000.

**El orden y el emparejamiento**: los stacks se ordenan por un
multiplicador de tipo —1,0 a distancia, 1,5 el resto, 2,25 voladores—;
los voladores y los de distancia pegan a cualquiera, los de melee solo a
tierra y **se quedan sin objetivo** si no queda ninguna; y un stack solo
es objetivo si **vale al menos el 10%** del que ataca.

El multiplicador **solo decide el orden y no mejora a nadie**, y depende
**solo del tipo de unidad**: un stack de un volador va delante de veinte
mil de melee.

**[nuestro]** **La elección de objetivo es determinista**: de los que el
atacante alcanza y valen el 10%, se coge **el primero del orden**. Podría
ser al azar, pero entonces habría que guardar una semilla más para que la
repetición de la batalla cuadrara ([SPECS.md §5](SPECS.md), invariante 3)
— y no hace falta, porque el orden ya está fijado.

**Quién gana**: pierde quien pierda **más porcentaje** de ejército, y el
defensor necesita pasar del **10% de bajas** para perder tierra. Con un
ejército que pase del **200%** del rival, el atacante se lleva **1% de
bonus por cada 2%** que pase del doble.

**La tierra**: regular hasta el **5%**, asedio hasta el **10%**, y en los
dos **el atacante se queda un tercio**.

**[nuestro]** **La batalla termina cuando los dos bandos están agotados**,
no al llegar a un tope de rondas. Con 15 de fatiga por golpe, al séptimo
todo el mundo está a eficiencia 0. Se vio **mirando la repetición**: las
rondas 8, 9 y 10 eran tres pantallas de «0 bajas, eficiencia 0». Ningún
número estaba mal; sobraba el ruido. Queda un tope de 10 rondas para los
casos con *Endurance*, que aguantan diez golpes.

**[nuestro]** **La penalización de asedio es solo del que asedia.** El
defensor defiende con base 30 venga el ataque que venga: el asedio es
algo que se *hace*, no algo que se sufre. Se vio leyendo el log de la
repetición, donde los dos bandos pegaban con 20.

**[nuestro]** **Un defensor sin ejército pierde.** Con los dos bandos
perdiendo el 0% de su ejército, el empate daba la victoria al defensor —
así que **disolver el ejército protegía la tierra**. Es el exploit más
fácil de descubrir que puede tener un juego así, y lo encontró la pasada
de navegador.

**[nuestro]** **El 10% del objetivo es una preferencia, no un veto.** La
fuente dice que un stack «solo es objetivo» si vale el 10% del que ataca.
Al pie de la letra eso deja **invulnerable a un stack pequeño**: medido,
un millón de soldados no podía tocar a diez, y partir el ejército en
stacks minúsculos lo volvía intocable. Se prefiere un objetivo que valga
la pena y, si no hay ninguno, se pega al primero que se alcance.

**[nuestro]** **Supervivientes por acre: 50.** Las fuentes se
contradicen —el *Beginner's Guide* dice 2,5 y 5; *Battle Mechanics* dice
50 con un ejemplo aritmético que cuadra— y **nos quedamos con 50**,
porque viene con la cuenta hecha ([ORIGINAL.md §9.3](ORIGINAL.md)).

**[nuestro]** **El redondeo de la fórmula se protege del binario.** Las
bajas se truncan **una sola vez, al final** (invariante 7 de
[SPECS.md §5](SPECS.md)), pero los multiplicadores del original —0,7,
0,75, 0,8— casi nunca son representables en coma flotante: *healing* ×
*scales* debería dar 0,525 y da 0,52499999999999997, y con eso el
truncado devolvía **4.724** donde la cuenta exacta da **4.725**. Un
entero de menos, sin dar error, en un número que el jugador ve dos veces
—en la previsión y en el resultado—, que es precisamente el fallo que el
invariante existe para evitar. Se pega al entero **solo cuando la
distancia es error de representación**; media baja sigue siendo cero
bajas.

**[nuestro]** **Iniciativa 0-5.** Las fuentes dan 0-7, 0-6 y «1-5
típicamente»; las fichas reales que hemos visto usan 1, 3 y 5. Se adopta
**0-5**, que es lo que los datos soportan.

#### Héroes en la batalla **[orig]**

El de **mayor nivel lidera tu stack más potente**, y así hacia abajo.
Prefieren su raza y su color, y cuando los lideran dan un **bonus de
eficiencia igual a su nivel en puntos porcentuales**. Mueren si su stack
es aniquilado y queda daño para superar sus HP. Ganan experiencia por
turno y por liderar; subir cuesta **1.000 × nivel**.

**[abierto]** El efecto numérico de cada **habilidad de héroe**. La wiki
las nombra sin publicar cuánto hacen.

#### Items de batalla **[orig]**

Se usan **en combate** o se disparan solos por **assignment** al
defenderse, según el porcentaje de ejército enemigo que fijes. **En
defensa no se pueden bloquear.**

La escala está publicada y es la referencia: *Bubble Wine* +10% de ataque
y **+30% de HP**, *Potion of Valor* +20% de ataque, *Ash of Invisibility*
pone la iniciativa a 6, *Strange Metallic Can* resucita el **25%** de las
bajas.

**[abierto]** Qué items concretos entran en la fase 3 y sus números. La
lista completa es de la fase 4.

#### Criterios de aceptación

**Tests del núcleo:**

1. **La fórmula da lo que dice la fórmula.** Con acierto 30, azar fijo en
   0,5, eficiencia 100, resistencia 0 y sin habilidades, 1.000 Treants
   (ataque 4.200) contra Dríades (HP 70) matan exactamente
   `1000 × 4200 × 0,3 × 0,5 × 1 × 1 × 1 / 70 = 9.000` dríades.
2. **El asedio penaliza en el acierto.** La misma batalla en asedio hace
   exactamente **dos tercios** del daño: 20 en vez de 30 de acierto.
3. **La fatiga se acumula y el tamaño no importa.** Tras tres ataques
   primarios la eficiencia es 55; con *Endurance*, 70. Un stack de 1 y
   uno de 20.000 fatigan lo mismo.
4. **Las resistencias por tipo cambian el resultado.** El Treant, que
   resiste 67% a melee y 0% al fuego, recibe **tres veces más daño** de
   un ataque de fuego equivalente. Y su debilidad al fuego lo empeora
   otro tanto.
5. **El emparejamiento respeta los tipos.** Un ejército solo de melee
   contra uno solo de voladores **no hace daño**: se queda sin objetivo.
6. **Toda batalla es reproducible.** Misma semilla, mismo resultado, ronda
   a ronda. Dos ejecuciones dan logs idénticos.
7. **La condición de victoria es la del original.** Un defensor que pierde
   el 9% no pierde tierra; con el 11%, sí.
8. **La tierra sale de los supervivientes.** Con 18.250 supervivientes y
   un objetivo de 3.654 acres, un asedio le quita 365 y el atacante se
   queda 122.
9. **Todo entero.** Ninguna batalla deja unidades fraccionarias ni
   recursos en negativo, y el redondeo está en un solo sitio por fórmula.

**Simulación:**

10. **Ningún ejército de una sola unidad domina.** ✅ **Cumple, medido el
    2026-09-21** con doce unidades enfrentadas todas contra todas a igual
    net power y 6 semillas por duelo.

    **Ninguna queda invicta, y el ciclo es real:** el elemental de tierra
    gana a todo menos al grifo; el grifo gana a casi todo porque **vuela y
    el melee no lo alcanza**; y al grifo lo bajan la dríade y la ninfa,
    que pegan a distancia. No es una escalera, es un corro.

    **Lo que decide no es el precio, es el tipo.** Y eso obligó a corregir
    una suposición nuestra: **`powerRank` no es un precio de balance**.
    Entre las **siete fichas publicadas** el valor de combate por punto de
    net power va de **30** (Arquero élfico) a **157** (Treant) — un factor
    de **5,2**, con datos del original. Mide cuánto ocupas en la tabla, no
    cuánto rindes en batalla.

    **Consecuencia declarada:** *Arqueros* y *Caballería* **no ganan un
    solo duelo** a igual net power. No es un fallo de nuestra
    interpolación —los dos caen dentro de la banda de las publicadas, y el
    Arquero élfico, que es `[orig]`, está igual de abajo—: es que el net
    power **no es la moneda con la que se compran**. Una Caballería cuesta
    150 de geld y una Milicia 20.

    *(Texto original del criterio: «Simulando batallas
    entre composiciones —solo melee, solo voladores, solo a distancia,
    mezclado—, **la mezclada gana a las puras** más veces de las que
    pierde. Si una unidad sola domina, sus números están mal.
11. **El maná ya compite.** ✅ **Cumple**, y por partida doble: el
    criterio 10 de §7.1 pasó a cumplirse con la economía publicada (tarea
    4), y ahora **lo invocado además pelea**. A igual net power gana el
    **97%** de los duelos contra tropa de barracks — que es la otra cara
    del hallazgo del criterio 10: el net power no es un precio.

    *(Texto original: «el criterio 10 de §7.1, reabierto. Con
    combate, un reparto volcado a maná que invoque y ataque **deja de ser
    estrictamente peor** que el económico. **Éste es el criterio que
    cierra los criterios 9 y 13 de §17.2**, aplazados desde la fase 1.
12. **La economía sigue cuadrando tras corregir los upkeeps.** Rehecha la
    calibración de §17.2 con los números reales, los criterios 10, 11 y 12
    siguen cumpliéndose, o se dice cuál no y por qué.

#### Fuera de alcance de la fase 3

- **Cómo se consiguen héroes e items**: la taberna, el mercado negro, la
  generación por guilds y los dioses. Fase 4.
- **La lista completa de items**, y las habilidades de héroe con sus
  números. Fase 4.
- **Las otras cuatro escuelas.** Verdant tiene fichas publicadas; las
  demás siguen `[abierto]` en §7 y §8.
- **Los hechizos ofensivos de mago a mago** que no sean de batalla —
  robar turnos, quemar edificios a distancia. Entran cuando entre el
  mercado y los dioses.
- **Gremios, aliados y refuerzos.** Fase 5, aunque toquen la batalla: un
  aliado manda refuerzos, y eso es diplomacia antes que combate.
- **Combate táctico sobre un mapa.** Sigue fuera para siempre
  (§16).

#### Plan técnico

**Escrito el 2026-09-21 con `/plan-tarea`.** Las tareas están en
[ROADMAP.md](../ROADMAP.md) «En curso».

##### Lo que planear destapó, mirando el código

Tres cosas que la spec daba por hechas y **no existen**:

1. **No hay más de un mago.** `DEV_MAGE_ID` está fijo en `'dev'` y es el
   único registro que se crea. **No hay a quién atacar.** Sin
   autenticación —que sigue fuera de alcance
   ([ARQUITECTURA.md §9.6](ARQUITECTURA.md))— hace falta otra forma de
   que existan rivales.
2. **El repositorio bloquea una sola fila.** Un ataque toca **dos**
   magos, así que hay que bloquear las dos — y **en un orden
   determinista por id**, o dos ataques mutuos simultáneos se quedan
   esperándose para siempre. Es un caso nuevo del invariante 6.
3. **No hay dónde guardar una batalla.** La repetición exige guardar la
   semilla y el log ([INTERFAZ.md §3.3](INTERFAZ.md)), y eso es una
   tabla nueva.

##### Qué cambia del contrato

1. **La unidad gana su mitad de combate.** `UnitEconomySpec` pasa a ser
   la mitad de una ficha completa: ataque, contraataque, ataque extra,
   HP, iniciativa, tipos de daño, habilidades, **tabla de resistencias**
   y `powerRank`.
2. **El upkeep pasa a punto fijo.** Los valores publicados son
   fraccionarios —0,01, 0,63, 0,80— y los recursos son enteros
   (invariante 7). Se guardan en **centésimas** y **el total se redondea
   una sola vez**, al sumar el ejército entero.
3. **Tabla `battles`**, con la semilla, los dos participantes, el
   resultado y el log. Aditiva.
4. **`attack` como acción**, con su tipo. Y el resultado de una acción
   deja de afectar **solo a quien la hace**: es la primera vez, y el
   contrato tiene que decirlo.

##### Los números que el plan tiene que cerrar

- **La curva del bonus de fort** entre 0,67% y 2,33% de la tierra: es lo
  único del combate que el original no publica. Se cierra con una curva
  lineal entre los dos extremos y se valida con el criterio 10.
- **Qué items de batalla entran**, y sus números. La escala está
  publicada (§9.1); la lista es nuestra.
- **El efecto numérico de las habilidades de héroe.**

##### Dónde va cada cosa

| | Va a | Por qué |
|---|---|---|
| La fórmula de daño, el acierto, las resistencias, la fatiga, el emparejamiento, la ronda, quién gana, la tierra | **`packages/core`** | Son reglas. Funciones puras, con el azar por `Ctx`. |
| Las fichas de unidad, los items y las habilidades de héroe | **`packages/content`** | Son datos. |
| La acción `attack`, el resultado y el log | **`packages/contract`** | Rompe los dos lados a la vez. |
| La tabla `battles` y el bloqueo de dos filas | **`apps/server`** | Entrada y salida. |
| `/guerra` y `/batalla/:id` | **`apps/web`** | Ver [INTERFAZ.md §3.2 y §3.3](INTERFAZ.md). |

**La batalla entera es una función pura.** Entra `(atacante, defensor,
tipo, semilla)` y sale `(resultado, log)`. Eso es lo que permite las tres
cosas que la fase necesita: **previsualizar** en el cliente con el mismo
código, **repetir** una batalla exacta, y **simular** miles para calibrar
sin levantar nada.

##### Detalles con trampa

1. **Dos filas, un orden.** Se bloquean siempre **por id ascendente**,
   ataque quien ataque. Sin eso, A→B y B→A simultáneos se abrazan.
2. **El upkeep se cobra ANTES de resolver** ([orig], §9): atacar cuesta
   el upkeep de **todo** tu ejército. Un mago que ataca sin poder pagarlo
   se hunde aunque gane, y eso tiene que pasar de verdad.
3. **La previsión no es el resultado.** El cliente previsualiza con una
   semilla distinta de la que usará el servidor. Enseñar un número exacto
   que luego no sale sería peor que no enseñar nada: va **un rango**
   ([INTERFAZ.md §3.2](INTERFAZ.md)).
4. **La fatiga no depende del tamaño del stack** ([orig]). Es
   contraintuitivo y es fácil implementarlo «proporcional» sin querer.
5. **Las bajas se reparten sobre unidades enteras.** La fórmula da un
   número con decimales; se trunca **una vez**, y nunca puede matar más
   unidades de las que hay.

##### Orden de dependencias

```
fichas de unidad con su mitad de combate (content)
   └─ recalibrar las fases 1 y 2 con los upkeeps corregidos
         └─ daño → acierto → resistencias → habilidades defensivas
               └─ orden y emparejamiento → fatiga → la ronda
                     └─ la batalla entera, con semilla y log
                           ├─ quién gana → la tierra → los tres ataques
                           ├─ héroes en batalla
                           └─ items de batalla y assignment
                                 └─ varios magos → tabla de batallas
                                       └─ acción y rutas → /guerra → /batalla
                                             └─ calibración: ¿compite ya el maná?
```

**La recalibración va la segunda, no la última.** Si los upkeeps
corregidos rompen la economía, es mejor saberlo antes de construir el
combate encima.

##### Riesgos

- **Es la fase más grande del proyecto**, y con diferencia. El combate
  del original tiene resistencias por tipo, habilidades defensivas,
  ataques extra con su propia iniciativa, contraataques y fatiga. Se
  eligió fidelidad completa a sabiendas.
- **La recalibración puede salir mal.** Los upkeeps bajan entre 40 y 100
  veces, así que el maná sobrará donde antes faltaba. Puede obligar a
  mover los rendimientos de los nodes, y eso toca la fase 1.
- **Héroes e items llegan sin su spec de origen.** Entran solo por la
  puerta del combate; cómo se consiguen es fase 4. El hueco está
  declarado en «Fuera de alcance».
- **Sin autenticación, los rivales son artificiales.** Decidido con el
  usuario el 2026-09-21: **magos sembrados** de distintos tamaños y
  composiciones, creados al arrancar y borrados el día que haya cuentas.
  Lo que se mida contra ellos dice cómo funciona el combate, **no** cómo
  se comporta un jugador humano.

**[nuestro]** **Toda batalla guarda su semilla** y es reproducible exacta
([ARQUITECTURA.md §5](ARQUITECTURA.md)). El jugador puede ver la
repetición ronda a ronda, no solo el resultado. En un juego donde perder
un ejército cuesta días, «te han ganado» sin poder ver por qué es
inaceptable.

**[orig]** **Assignment**: el mago fija de antemano qué hechizos e items
se disparan solos al ser atacado, según el porcentaje de ejército
enemigo. **En defensa no se puede bloquear.**

---

## 10. Héroes **[F4]**

**[orig]** **El héroe de mayor nivel lidera tu stack más potente**, y así
hacia abajo. Prefieren unidades de su raza y color, y cuando las lideran
dan un **bonus de eficiencia igual a su nivel en puntos porcentuales**.
Mueren si su stack es aniquilado y queda daño para superar sus HP.

**[orig]** Ganan experiencia por turno y por liderar. Subir de nivel
cuesta **1.000 × nivel actual**. Los comprables empiezan en **nivel 8**;
las habilidades llegan a partir del 9, normalmente **dos**: una entre 8 y
10, otra entre 13 y 17.

**[orig]** Se consiguen en la **taberna** del mercado negro, por favor
divino, o con items concretos.

---

## 11. Items **[F4]**

**[orig]** Se generan solos al gastar turnos, a un ritmo que depende del
**% de guilds sobre tu tierra**; se compran en el mercado negro; salen de
otros items; se roban **pillando**; o los traen hechizos.

**[orig]** **Lesser items**, acumulables sin límite salvo un par con tope
de 3, y **unique items**, raros y con efecto propio.

**[orig]** Tres usos: **fuera de batalla** con efecto inmediato, **por
assignment** al defenderse, y **en combate**.

**[orig]** Escala de referencia, de items reales: *Bubble Wine* +10% de
ataque y **+30% de HP**; *Potion of Valor* +20% de ataque; *Ash of
Invisibility* pone la iniciativa a 6; *Strange Metallic Can* resucita el
**25%** de tus bajas. **Un item bueno cambia una batalla**, y ése es su
sitio en el diseño.

---

## 12. Habilidades **[F4]**

**[orig]** **10 habilidades de 20 niveles.** Llegar al 20 cuesta **210
puntos** acumulados (1 el primer rango, 20 el vigésimo).

- **De especialidad** (cuestan **el doble** fuera de tu color):
  *Legendary Artificer, Animal Mastery, Spell Penetration, Undead
  Mastery, Spell Mastery*.
- **Neutras**: *Barrier Proficiency, Grand Enchanter, Legendary
  Commander, Augment Summoning, Grand Conqueror*.

**[orig]** Los puntos se generan según la **raíz cuadrada del número de
guilds** y la velocidad del servidor. Referencia: 5.000 de tierra con 5%
de guilds en un servidor rápido da **un punto cada ~34 turnos**.

**[nuestro]** **Cerrado el 2026-09-21**: +1% por rango, hasta +20% al
nivel 20, sobre la magnitud que cada habilidad toca. La tabla entera y de
dónde sale cada número están en **§12.1**. Solo *Spell Mastery* tiene
efecto publicado, y es el ancla de escala.

---

### 12.1. El mundo de la fase 4 **[F4]**

**Spec del 2026-09-21.** Cierra la marca `[abierto]` del efecto de las
diez habilidades, y añade lo que el juego necesita para dejar de ser un
solitario: **cuentas, mercado, items, héroes que crecen y un ranking**.

#### Qué problema resuelve

Tres cosas que hoy faltan, y las tres se notan al jugar:

1. **No hay jugadores.** Todo el servidor corre con **un mago fijo**
   (`DEV_MAGE_ID`), y los rivales se siembran con un script. La fase 3
   dejó la guerra montada sobre magos que nadie juega: el ranking sería
   una tabla de maniquíes y el mercado no tendría contra quién pujar.
2. **El geld no tiene dónde gastarse tarde.** A partir de cierto punto un
   mago acumula millones y solo puede construir. Sin un sitio donde el
   dinero compre **ventaja** —items, héroes, hechizos—, la mitad de la
   economía deja de decidir nada.
3. **Los guilds solo sirven para investigar.** Producen puntos de
   habilidad e items en el original, y aquí no hacen ni una cosa ni la
   otra: el edificio existe y su segundo motivo de ser no.

#### Alcance, decidido con el usuario

**[nuestro]** Decidido el 2026-09-21, con las cuatro preguntas que
cambiaban el trabajo:

- **Las cuentas entran, y van primero.** Registro, sesión y **un mago por
  cuenta y servidor**. Es la tarea que desbloquea a las demás: sin ella
  el ranking y el mercado no tienen sujeto.
- **El mercado es una subasta entre jugadores**, como el original, y
  **no** una tienda con stock de la casa. Con el riesgo declarado que
  eso trae, abajo.
- **Las diez habilidades se cierran aquí**, deduciéndolas del ancla de
  net power (§5.7) y del único efecto publicado (*Spell Mastery*).
- **Gremios y alianzas se quedan en la fase 5.** Cambian el combate ya
  implementado —refuerzos automáticos, hechizos que ignoran la barrier— y
  eso pide su propia spec.

---

#### Cuentas y magos

**[nuestro]** **Con verificación por correo y recuperación de
contraseña**, decidido el 2026-09-21. Una temporada dura tres meses: sin
forma de recuperar una cuenta, perder la contraseña es perder la
temporada. El envío va detrás de una interfaz con dos implementaciones —
una real por SMTP y otra que **deja el mensaje en una tabla**, que es la
que usan los tests y el desarrollo— para no atar el proyecto a un
proveedor antes de tener jugadores.

**[nuestro]** Una **cuenta** es correo y contraseña; un **mago** es lo que
esa cuenta juega en un servidor. **Un mago por cuenta y servidor**, que en
el original es norma de convivencia y aquí es **regla del código**: si el
juego lo permite, alguien lo usa (§13).

**[nuestro]** Crear el mago pide **nombre y escuela**, y la escuela **no
cambia durante la temporada** — ya es el invariante 10 de
[SPECS.md §5](SPECS.md); lo nuevo es que ahora la elige un jugador en vez
de venir fijada.

**[nuestro]** El mago de desarrollo se queda, detrás de una bandera de
entorno. Quitarlo obligaría a registrarse para correr un test de
navegador, y eso encarece la comprobación más cara que tenemos.

> **Criterio 1.** Dos cuentas distintas ven dos magos distintos, y una
> misma cuenta **no puede crear dos magos en el mismo servidor**: el
> segundo intento es un error de dominio con su código, no un 500.
> *Test del servidor contra Postgres.*
>
> **Criterio 2.** Ninguna ruta devuelve el estado de un mago que no es
> del que pide. *Test: pedir el reino con la sesión de otro da 403, y
> atacar con un `mageId` ajeno también.*

---

#### El mercado negro

**[orig]** Subasta entre jugadores, con los números publicados
([ORIGINAL.md §7.1](ORIGINAL.md), confianza alta):

- **Pujar cuesta un turno**, y eso es lo que lo ata al resto del juego:
  el mercado compite con explorar y con lanzar, no es una ventana aparte.
- **Puja mínima siguiente: +5%** sobre la anterior.
- **Ventana de 30 minutos** para superar una puja; el lote está a la
  venta **al menos 2,5 horas** y se adjudica **30 minutos después** de la
  puja ganadora.
- **Una puja no se puede cancelar.** Al ser superado te devuelven tu
  geld.
- **Seis secciones**: *Antique Store* (items), *Tavern of Heroes*
  (héroes), *Exotic Mageware* (hechizos), *Spawning Hatchery* (unidades
  invocables), *Swords for Hire* (mercenarios) y *Altar of Darkness*
  (favores divinos).

**[nuestro]** **Entran cuatro secciones de las seis.** El *Altar of
Darkness* queda fuera porque **los dioses están fuera de alcance** (§16),
y *Swords for Hire* también: un mercenario es una unidad con su ficha, y
el catálogo de unidades ya está cerrado en §8 — meter mercenarios es
abrir una lista que decidimos no abrir.

**[nuestro]** **El reloj del mercado no es el reloj de los turnos.** Las
subastas van en **tiempo real** —30 minutos, 2,5 horas— porque así lo
publica el original, y eso **no rompe §2**: el tiempo real no produce
nada, solo cierra plazos. Lo que se produce sigue saliendo de gastar
turnos.

**[nuestro]** **De dónde salen los lotes.** De los propios jugadores: se
pone a la venta lo que se tiene. En la fase 4 **nadie pone lotes de la
nada**, así que el mercado se llena solo cuando alguien vende.

> **Riesgo declarado, y es el que el usuario aceptó al elegir fidelidad.**
> Con pocos magos activos **el mercado está vacío**, y una pantalla vacía
> parece rota. La respuesta no es inventar stock: es que **la pantalla lo
> diga** — «no hay nada a la venta; pon tú el primer lote»— en vez de
> enseñar una tabla en blanco. Si al calibrar resulta que está vacío la
> mayor parte del tiempo, **la decisión de meter stock de la casa se
> reabre**, y se reabre con el dato delante.

> **Criterio 3.** Pujar cuesta exactamente un turno, y **cobra el geld al
> pujar, no al ganar**. Al ser superado, el geld vuelve entero. *Test del
> núcleo, y test del servidor de que las dos cosas van en la misma
> transacción.*
>
> **Criterio 4.** Una puja que no supere el 5% es un error de dominio con
> su código. *Test del núcleo.*
>
> **Criterio 5.** Dos pujas simultáneas sobre el mismo lote **no se
> pisan**: gana una, la otra recibe su error y su geld sigue intacto.
> *Test contra Postgres con la fila del lote bloqueada, igual que las dos
> filas de una batalla (§9.1).*
>
> **Criterio 6.** Un lote se adjudica **30 minutos después** de la última
> puja, no antes, y el comprador recibe lo comprado **y** el vendedor su
> geld en la misma transacción. *Test del servidor con el reloj
> inyectado.*
>
> **Criterio 7.** Con cero lotes, la pantalla **dice por qué** está
> vacía. *Pasada de navegador.*

---

#### Items

**[orig]** Se generan solos al gastar turnos, a un ritmo que depende del
**porcentaje de guilds sobre la tierra**; se compran en el mercado; salen
de otros items; y **se roban pillando** — el saqueo de §9.1 ya está
implementado y hoy no roba items porque no los había.

**[orig]** **Lesser items**, acumulables, y **unique items**, con tope de
uno. Tres usos: fuera de batalla con efecto inmediato, **por assignment**
al defenderse, y en combate. Los dos últimos ya existen desde la fase 3.

**[orig]** **Los lesser items están publicados enteros**, con sus
números ([ORIGINAL.md §7.2](ORIGINAL.md), confianza alta). Se encontró el
2026-09-21, al ir a inventar dieciséis.

> **Esto cambió el alcance, y hacia arriba.** La spec decía «veinte
> items: cuatro publicados y dieciséis interpolados **con regla
> declarada**». No hace falta interpolar ninguno — pero los reales
> **traen mecánicas que el combate no tiene**: daño directo a todos los
> stacks, resistencias que suben y bajan, iniciativas que se fijan o se
> restan, unidades que vuelan sin volar, y bajas que resucitan. Copiar
> los números es gratis; **hacer que funcionen no**.

**[nuestro]** **Entran los lesser publicados, menos tres.** *Bottle of
Eversmoking*, *Cosmetics* y *Dozens of Silver-tipped Arrows* están
**deshabilitados en el propio original**, así que no se implementan. Los
**46 unique** quedan fuera: la wiki solo publica sus nombres.

**[nuestro]** **Los items de batalla se resuelven en la pre-batalla**, y
eso no es una decisión nueva: [ORIGINAL.md §9.4](ORIGINAL.md) ya describe
tres fases —pre-batalla con hechizos, items y **daño previo**; batalla;
post-batalla con resurrección—, y `battle.ts` dejó los dos huecos
declarados desde la fase 3. Ahora se rellenan.

**[nuestro]** **El ritmo de generación se ancla en el original**: un mago
con el **5% de su tierra en guilds** saca del orden de **un item cada 40
turnos**. Sale de la misma escala que los puntos de habilidad (un punto
cada ~34 turnos con 5% de guilds, [ORIGINAL.md §8](ORIGINAL.md)) y de que
un item bueno **cambia una batalla**: si salieran cada cinco turnos, no
la cambiaría ninguno.

> **Criterio 8 bis.** Los items publicados salen **clavados**: el *Sage
> Stone* da entre 1.000.000 y 2.000.000 de geld, el *Voodoo Doll*
> destruye entre 2 y 8 turnos, y la *Figurine of Ice Queen* hace
> `100.000 + [1-3 × unidades]` de daño de frío a cada stack. *Test del
> catálogo, y test del núcleo con la semilla fijada para los rangos.*
>
> **Criterio 8 ter.** Un item de batalla se aplica **en la pre-batalla**
> y su efecto se ve en el log: un *Drums of War* baja el ataque enemigo
> un 10% **en todos los golpes de la batalla**, no solo en el primero.
> *Test del núcleo con semilla fijada.*
>
> **Criterio 8.** Un mago con el 10% de su tierra en guilds genera items
> al doble de ritmo que uno con el 5%, y uno sin guilds **no genera
> ninguno**. *Test del núcleo.*
>
> **Criterio 9.** El saqueo roba items, y **no roba uniques**. *Test del
> núcleo: un pillage contra un mago con tres lesser y un unique se lleva
> lesser y deja el unique.*
>
> **Criterio 10.** Los uniques tienen tope de uno: comprar el segundo es
> un error de dominio. *Test del núcleo.*
>
> **Criterio 11.** Todo entero: ningún item genera cantidades
> fraccionarias, y el efecto se redondea **en un solo sitio**.

---

#### Héroes que crecen

**[orig]** Ganan experiencia **por turno y por liderar en batalla**.
Subir de nivel cuesta **1.000 × nivel actual**. Los comprables empiezan
en **nivel 8**; las habilidades llegan a partir del 9, normalmente dos:
una entre 8 y 10, otra entre 13 y 17.

**[nuestro]** La fase 3 dejó hecho **lo que un héroe hace en batalla** —
reparto por nivel, bonus de eficiencia por su raza y color, y la muerte
con su stack—. Lo que falta es **cómo se consigue y cómo crece**, que es
lo que lo convierte en una inversión y no en un modificador.

**[nuestro]** **Las habilidades de héroe siguen `[abierto]`.** Se le pone
número a las diez del mago (§12) porque hay un ancla publicada; de las de
héroe no hay ninguna, y **se declara el hueco en vez de rellenarlo**. Un
héroe de la fase 4 tiene nivel y bonus de eficiencia, nada más.

> **Criterio 12.** Un héroe de nivel 8 que lidera durante una temporada
> simulada **llega a nivel 12 o más**, y no a 20: subir tiene que costar
> lo suficiente para que un héroe veterano valga algo. *Simulación de
> temporada.*
>
> **Criterio 13.** La experiencia por turno sola **no basta** para subir
> de nivel a un ritmo razonable: liderar en batalla tiene que aportar
> más. *Test del núcleo comparando los dos ritmos.*

---

#### Las diez habilidades del mago

**[orig]** Diez habilidades de **20 niveles**; llegar al 20 cuesta **210
puntos** acumulados. Cinco están **ligadas a especialidad** y cuestan el
doble fuera de tu color; cinco son neutras. Los puntos se generan según
la **raíz cuadrada del número de guilds**: 5.000 de tierra con 5% de
guilds da **un punto cada ~34 turnos**.

**[orig]** El único efecto publicado es el de *Spell Mastery*: del orden
de **−1% de coste de maná por rango**, con fuente floja
([ORIGINAL.md §8](ORIGINAL.md), confianza baja).

**[nuestro]** **Se cierra la marca `[abierto]`, y así se deducen.** Ese
único dato da la **escala**: una habilidad al máximo vale del orden de un
**20%**, no de un 2% ni de un 200%. Con eso, y con la tabla de net power
de §5.7 —que es la equivalencia entre recursos según los propios
diseñadores—, las diez quedan en **+1% por rango, hasta +20% al nivel
20**, sobre la cosa que cada una toca:

| Habilidad | Toca | Al nivel 20 |
|---|---|---|
| *Spell Mastery* **[orig]** | coste de maná de todos los hechizos | −20% |
| *Spell Penetration* | fallo por lanzar fuera de color (§7) | −20% |
| *Grand Enchanter* | upkeep de maná de los encantamientos | −20% |
| *Augment Summoning* | unidades por invocación | +20% |
| *Animal Mastery* | ataque de las unidades animales | +20% |
| *Undead Mastery* | ataque de las unidades no muertas | +20% |
| *Legendary Commander* | acierto en batalla (§9.1) | +20% |
| *Grand Conqueror* | tierra que se arranca al ganar | +20% |
| *Barrier Proficiency* | efecto defensivo de las barriers | +20% |
| *Legendary Artificer* | ritmo de generación de items | +20% |

**Por qué +1% por rango y no una curva.** Porque el único dato publicado
es lineal en los tres primeros rangos, y **una curva inventada sería una
decisión de diseño escondida en una constante**. Si la calibración dice
que el 20% final es demasiado, se mueve el 20% — no la forma.

> **Criterio 14.** Cada habilidad al nivel 20 cambia su magnitud en un
> 20% exacto, y al nivel 0 no cambia nada. *Diez tests del núcleo, uno
> por habilidad.*
>
> **Criterio 15.** Llegar al 20 cuesta **210 puntos** y fuera de color
> **420**. *Test del núcleo.*
>
> **Criterio 16.** Un mago con 5.000 de tierra y 5% de guilds saca un
> punto cada **34 turnos**, ±2. *Test del núcleo contra el ancla
> publicada.*
>
> **Criterio 17.** **Ninguna habilidad sola cambia quién gana una
> temporada.** Con las diez al 20, el net power final sube menos de un
> 50% respecto a no tener ninguna. *Simulación de temporada.* Es el
> criterio que impide que las habilidades se coman el juego: son una
> ventaja, no una segunda economía.

---

#### El ranking

**[orig]** El **net power** es la medida oficial del tamaño de un mago, y
su fórmula está publicada (§5.7). Desde la fase 3 **cuenta el ejército**,
así que por fin distingue estrategias.

**[nuestro]** El ranking enseña **net power, tierra y escuela**, y **no**
el ejército ni el geld: saber exactamente con qué cuenta el rival
convierte la guerra en aritmética. El original tampoco lo enseña.

> **Criterio 18.** El ranking ordena por net power descendente y
> **coincide con `netPower()`**, sin recalcular nada por su cuenta
> (invariante 5). *Test del servidor.*
>
> **Criterio 19.** El ranking **no filtra** por protección: un mago
> protegido aparece, y se dice que lo está. Esconderlo haría que la lista
> mintiera sobre cuánta gente hay. *Test del servidor.*

---

#### Fuera de alcance de la fase 4

- **Gremios, alianzas y NAP.** Siguen `[F5]` (§13). Cambian el combate ya
  implementado y piden su propia spec.
- **Los dioses y el *Altar of Darkness*.** Ya estaban fuera (§16) y
  siguen fuera.
- **Mercenarios (*Swords for Hire*).** Abrirían el catálogo de unidades,
  que está cerrado (§8).
- **Las habilidades de héroe.** Sin ancla publicada; se declara el hueco.
- **Hechizos *ancient*.** La *Exotic Mageware* vende hechizos del
  catálogo existente; los *ancient* son una lista nueva y no hay
  investigación que los cubra.
- **Mensajería entre jugadores.** Es `[F5]`, con los gremios.
- **Chat en tiempo real.** Fuera para siempre (§16).

#### Plan técnico

**Escrito el 2026-09-21.** Lo que sigue es cómo se construye la spec de
arriba, no qué se construye.

**Lo primero, porque condiciona todo lo demás:** `packages/core` **no
sabe de cuentas**. Una cuenta no es una regla del juego —no produce, no
gasta turnos, no se puede simular— así que vive entera en
`apps/server`. El núcleo sigue sin importar nada
([SPECS.md §5](SPECS.md), invariante 1).

**Paquetes y módulos afectados**

| Qué | Dónde | Nuevo o tocado |
|---|---|---|
| Reglas del mercado | `packages/core/src/market.ts` | **nuevo** |
| Habilidades: puntos, coste, efecto | `packages/core/src/skills.ts` | **nuevo** |
| Items: generación, uso, robo | `packages/core/src/items.ts` | **nuevo** |
| Héroes: experiencia y niveles | `packages/core/src/heroes.ts` | tocado |
| El saqueo roba items | `packages/core/src/war.ts` | tocado |
| Las nueve fórmulas que las habilidades tocan | `casting.ts`, `economy.ts`, `magic.ts`, `combat.ts`, `battle.ts`, `land.ts` | tocados |
| Catálogo de items | `packages/content/src/items.ts` | **nuevo** |
| **La pre-batalla**: modificadores y daño previo | `packages/core/src/prebattle.ts` | **nuevo** |
| Catálogo de habilidades | `packages/content/src/skills.ts` | **nuevo** |
| Esquemas de cuenta, mercado, ranking | `packages/contract/src/index.ts` | tocado |
| Cuentas, sesión, contraseñas | `apps/server/src/auth.ts` | **nuevo** |
| Tablas y migración | `apps/server/src/schema.ts`, `db.ts` | tocados |
| Pujas y resolución de subastas | `apps/server/src/repository.ts` | tocado |
| Rutas | `apps/server/src/app.ts` | tocado |
| Pantallas | `apps/web/src/routes/{Portal,Mercado,Ranking,Habilidades}.tsx` | **nuevas** |

**Toca `packages/core`, `packages/contract`, `packages/content` y el
esquema de base de datos** — los cuatro que más cruzan con otros agentes
([AGENTES.md §1.1](AGENTES.md)).

**Dónde va cada cosa**

- **¿Es una regla?** El mínimo del +5%, que pujar cueste un turno, que un
  lote cierre a los 30 minutos de la última puja, cuántos puntos de
  habilidad da un número de guilds, cuánto sube un héroe: **todo eso es
  `packages/core`, y puro**. El servidor no decide nada de eso; carga,
  llama y guarda (invariante 8).
- **¿Es un número?** Los veinte items y las diez habilidades son
  **`packages/content`**, con su esquema Zod y su test de catálogo.
- **El reloj entra por parámetro.** Un lote «está cerrado» es una función
  de `(lote, now)`, no de `Date.now()` (invariante 2). El servidor le
  pasa su `deps.now()`, que ya es inyectable y es lo que hace que los
  tests del mercado no dependan del día.

**Una corrección de sitio que arrastra la fase 3.** Los cuatro items
publicados están hoy en `packages/core/src/heroes.ts` como
`BATTLE_ITEMS`. **Eso es dato en un paquete de código**: se mueven a
`packages/content/src/items.ts` y en el núcleo queda solo el tipo, como
con las unidades. Es un cambio pequeño y se hace al principio, no al
final, porque después habría veinte items en el sitio equivocado.

**El contrato cambia primero.** Los esquemas Zod de `packages/contract`
—registro, sesión, lote, puja, fila de ranking, habilidad— se escriben
antes que el servidor y que el cliente, para que un desajuste rompa la
compilación de los dos lados a la vez.

**La migración es aditiva.** Tablas nuevas `accounts`, `sessions`,
`market_lots` y `ranking_snapshots`, y **una columna nueva
`mages.account_id`, anulable**: el mago de desarrollo no tiene cuenta y
tiene que seguir funcionando. Nada se borra.

**Decisiones de arquitectura que la spec obliga a tomar**

1. **Contraseñas con `scrypt` de `node:crypto`.** Sin dependencia nueva:
   está en la biblioteca estándar y es la función que Node recomienda
   para esto. `apps/server` sí puede importar de `node:*`; el núcleo no.
2. **Sesión en cookie firmada, con tabla.** La cookie lleva un id de
   sesión y el servidor lo busca; no lleva el `mageId` dentro. Así cerrar
   sesión es borrar una fila, y no hay que esperar a que caduque un
   token.
3. **El id del mago sale de la sesión, nunca del cuerpo ni de la URL** —
   es el invariante 13, y la forma de no romperlo es que el id **no
   viaje**.
4. **La resolución de subastas es un proceso programado idempotente**,
   de los que [SPECS.md §3](SPECS.md) ya tiene listados. Se puede correr
   mil veces: solo toca lotes con `estado = abierto` y `cierra_en <=
   now`.
5. **Una puja bloquea la fila del lote** (invariante 14), igual que un
   ataque bloquea dos filas de mago. Cobrar la puja, devolver la
   anterior y guardar el lote son **una transacción**.
6. **El mago de desarrollo se queda tras una bandera de entorno.** Sin
   él, la pasada de navegador —la comprobación más cara que tenemos—
   tendría que registrarse cada vez.

**Orden de dependencias**

```
cuentas ──► todo lo demás (sin sujeto no hay ranking ni mercado)
catálogos (items, habilidades) ──► generación y efectos
habilidades ──► las nueve fórmulas que tocan
items ──► el saqueo que los roba, y el mercado que los vende
héroes ──► la taberna del mercado
mercado ──► su resolución programada
todo ──► una sola pasada de navegador
```

**Qué queda fuera, y va al docstring de cada módulo**

- Gremios, alianzas, dioses, mercenarios y hechizos *ancient*: declarados
  en la spec de arriba.
- **Las habilidades de héroe**: sin ancla publicada. Un héroe de la fase
  4 tiene nivel y bonus de eficiencia, nada más.
- **WebSocket y avisos en vivo.** Siguen `[abierto]` en
  [SPECS.md §6](SPECS.md). Nada de la fase 4 los necesita: una subasta se
  mira, no te avisa.

**Riesgos técnicos, declarados**

0. **Los items reales traen mecánicas nuevas al combate**, y es el riesgo
   que apareció al investigar, no al planear. Daño directo a todos los
   stacks, resistencias que suben y bajan, iniciativas que se fijan,
   *Flying* concedido, bajas que resucitan. La pre-batalla de §9.4 es el
   sitio donde caben todas sin tocar la ronda — pero **la ronda tiene que
   leer un ejército ya modificado**, y eso es una capa que hoy no existe.
   Si esa capa se filtra a la fórmula de daño, se rompe el invariante 7.

1. **Las habilidades tocan nueve fórmulas ya escritas y calibradas.** Es
   donde van a salir las regresiones, y no en el código nuevo. La defensa
   es doble: cada habilidad con su test del núcleo, y **los tests de
   calibración de las fases 1 a 3 como canario** — si una habilidad al
   nivel 0 cambia un solo número de los que ya están medidos, está mal
   enchufada.
2. **La autenticación toca todas las rutas a la vez.** Un fallo aquí no
   da error: **sirve el reino de otro**. Por eso el invariante 13 y por
   eso un test que lo intente explícitamente.
3. **El mercado vacío.** Está declarado en la spec y no es un riesgo
   técnico sino de diseño; lo que sí es técnico es que **la pantalla
   distinga «vacío» de «no ha cargado»**.
4. **Deuda que se hereda:** `DEV_MAGE_ID` está hoy en nueve sitios de
   `app.ts`. Quitarlo de golpe y dejar el id en la sesión es la mitad del
   trabajo de la primera tarea.

---

## 13. Gremios y diplomacia **[F5]**

**[orig]** Un gremio necesita **cinco fundadores**. Se entra por
solicitud o invitación.

**[orig]** Da: protección frente a los compañeros, listas de miembros y
enemigos, registros de batalla, y permiso para hablar de táctica por la
mensajería interna.

**[orig]** **Aliados** (1 o 2 según servidor): mandan **refuerzos
automáticos** cuando te atacan —salvo sus dos stacks más potentes— y te
lanzan hechizos **sin que la barrier los frene**. Un compañero de gremio
que no es aliado **no manda refuerzos**.

**[orig]** **NAP**: compromiso público de no atacarse. **No autoriza a
compartir táctica.**

**[nuestro]** Las reglas de convivencia del original (un mago por
servidor y cuenta, agremiados solo con agremiados) son **reglas del
código**, no normas de foro: si el juego las permite, alguien las usa.

---

## 14. La temporada **[F5]**

**[orig]** El servidor **se reinicia cada ~3 meses** y termina en
**Armageddon**. La cuenta persiste; el mago se borra. Se gana acabando
entre los 10 primeros (*Hall of Fame*) o destruyendo el mundo
(*Destroyer of Terra*).

**[nuestro]** La temporada no es una funcionalidad más: **es lo que hace
que este juego se pueda jugar más de una vez**, y es la respuesta a que
un veterano no sea inalcanzable. Está en la fase 5 por coste, no por
importancia.

**[orig]** **Cerrado el 2026-09-22.** Decía que el original no lo
documentaba de forma accesible; **sí lo hace**, y resulta ser lo más
interesante del diseño: Armageddon son **siete sellos** que rompen siete
magos distintos, uno cada 24 horas
([ORIGINAL.md §10.1](ORIGINAL.md), confianza alta). El final de la
temporada **no es una fecha, es una decisión colectiva** — la fecha solo
pone el tope. Todo el detalle, en §14.1.

---

### 14.1. La temporada y el mundo de la fase 5 **[F5]**

**Spec del 2026-09-22.** Cierra la marca `[abierto]` de qué hace
Armageddon, y añade lo que convierte esto en un juego que se puede jugar
**más de una vez**: gremios, alianzas, mensajería, dos servidores y un
final de temporada.

#### Qué problema resuelve

Tres cosas, y la tercera es la que de verdad importa:

1. **Nadie puede hablar con nadie.** Hay guerra desde la fase 3 y mercado
   desde la 4, pero **coordinarse es imposible dentro del juego**. Un
   pacto de no agresión no tiene dónde pactarse, y la subasta no tiene
   dónde negociarse. El juego empuja a los jugadores fuera de él.
2. **Atacar no tiene consecuencias sociales.** Sin gremios, todo el mundo
   es enemigo de todo el mundo por igual, y la diplomacia —que en el
   original es media partida— no existe.
3. **La partida no acaba nunca.** Y eso no es un detalle: **es la
   respuesta a que un veterano sea inalcanzable** (§14). Sin reset, el
   que empezó primero gana para siempre y el que llega tarde no tiene
   partida. La temporada es lo que hace que empezar de cero sea normal y
   no un castigo.

#### Alcance, decidido con el usuario

**[nuestro]** Decidido el 2026-09-22, con las cuatro preguntas que
cambiaban el trabajo:

- **Dos servidores**, uno normal y uno rápido. Lo justo para que el
  multiservidor exista y se pueda probar; añadir el tercero será dato y
  no código.
- **Armageddon con las dos vías**: los **siete sellos** y la **fecha
  tope**. Fiel al original, con el riesgo declarado de que los sellos no
  se usen al principio.
- **Gremios y alianzas completos**, incluidos los **refuerzos
  automáticos** — que tocan el combate ya calibrado de la fase 3.
- **Mensajería** entre magos y de gremio. Sin tiempo real: eso sigue
  fuera para siempre (§16).

---

#### Gremios

**[orig]** Un gremio necesita **cinco fundadores**
([ORIGINAL.md §10](ORIGINAL.md), confianza alta). Se entra por solicitud
o por invitación. Da: **protección frente a los compañeros**, listas de
miembros y de enemigos, registros de batalla, y permiso para hablar de
táctica por la mensajería interna.

**[nuestro]** «Protección frente a los compañeros» es **regla del
código**, no norma de foro: atacar a alguien de tu gremio **no se puede**,
y el intento es un error de dominio. Si el juego lo permite, alguien lo
usa (§13).

**[nuestro]** **Un mago, un gremio.** El original no lo dice
explícitamente, pero la protección entre compañeros no tiene sentido si
se puede estar en varios a la vez: sería inmunidad con pasos extra.

> **Criterio 1.** Un gremio no se funda con cuatro. Al quinto, se funda.
> *Test del servidor contra Postgres.*
>
> **Criterio 2.** Atacar a un compañero de gremio es un **422 con su
> código**, no un 500 ni un ataque que sale. *Test del núcleo y del
> servidor.*
>
> **Criterio 3.** Un mago no puede estar en dos gremios: la segunda
> solicitud aceptada es un error de dominio. *Test del servidor.*

---

#### Aliados, y lo que le hacen al combate

**[orig]** Se tienen **1 o 2 aliados** según el servidor. Los aliados
**mandan refuerzos automáticamente** cuando te atacan —**salvo sus dos
stacks más potentes**— y pueden lanzarte hechizos **sin que la barrier
los frene**. Un compañero de gremio que no sea aliado **no manda
refuerzos**.

**[nuestro]** **Los refuerzos entran en la pre-batalla**, que es la capa
que la fase 4 ya construyó (§9.1): se añaden al ejército del defensor
antes de la primera ronda, y **sus bajas son suyas**. Hacerlo así tiene
una consecuencia que conviene ver: **ayudar cuesta**, porque el aliado
pierde unidades de verdad en una batalla que no eligió.

**[nuestro]** **Los dos stacks más potentes se quedan en casa**, y eso es
del original. El efecto es que una alianza **no convierte a dos magos en
uno**: el que ayuda sigue pudiendo defenderse, y el que recibe ayuda no
recibe el ejército entero de nadie.

**[nuestro]** **Una alianza se rompe con aviso**, no al instante: **24
horas** desde que se pide. Sin eso, aliarse sería gratis —te ayudo
mientras me conviene y me borro justo antes de que me toque ayudar— y la
alianza dejaría de ser un compromiso.

> **Criterio 4.** Un defensor con aliado pelea con más unidades que uno
> sin él, y **el aliado pierde unidades** en esa batalla. *Test del
> núcleo con semilla fijada.*
>
> **Criterio 5.** Los **dos stacks más potentes del aliado no aparecen**
> en la batalla. *Test del núcleo: el aliado manda cinco stacks y llegan
> tres, y son los tres menos potentes.*
>
> **Criterio 6.** Un compañero de gremio que **no** es aliado no manda
> nada. *Test del núcleo.*
>
> **Criterio 7.** Romper una alianza tarda 24 horas, y durante ese plazo
> **los refuerzos siguen yendo**. *Test con el reloj inyectado.*

---

#### Mensajería

**[nuestro]** Bandeja de entrada, **mensajes directos entre magos** y un
**tablón de gremio**. Sin tiempo real, sin notificaciones push y sin
adjuntos: es correo interno, no un chat (§16).

**[nuestro]** **Un mago puede bloquear a otro.** Sin eso, el canal que
abre la diplomacia abre también el acoso, y en un juego de tres meses eso
expulsa gente antes que cualquier desequilibrio.

**[nuestro]** Los mensajes **se borran con la temporada**, como el mago.
Lo que sobrevive al reset es la cuenta, no lo que pasó en Terra.

> **Criterio 8.** Un mensaje llega a su destinatario y **no a nadie
> más**: pedir la bandeja de otro es un 403. *Test del servidor* — es el
> invariante 13 otra vez.
>
> **Criterio 9.** Un mago bloqueado no puede escribir, y el que bloquea
> **no recibe un aviso de que lo intentó**. *Test del servidor.*
>
> **Criterio 10.** El tablón de gremio solo lo leen sus miembros. *Test
> del servidor.*

---

#### Dos servidores

**[orig]** Varios servidores simultáneos, cada uno con su **cadencia de
turno y su tope** ([ORIGINAL.md §2](ORIGINAL.md), confianza alta):
Apprentice 15 min y tope 150; Blitz 5 min y tope 200.

**[nuestro]** **Entran dos**: uno normal —el `TERRA` de ahora, 10 minutos
y tope 180— y uno **rápido**, a 5 minutos y tope 200. Se elige al crear
el mago, y **un mago por cuenta y servidor** sigue siendo la regla, que
ya está implementada desde la fase 4.

**[nuestro]** **Las temporadas son independientes.** Cada servidor tiene
su fecha de final y sus siete sellos: que acabe uno no toca al otro. Es
lo que permite que alguien esté empezando en uno mientras el otro termina.

> **Criterio 11.** Una cuenta puede tener **un mago en cada servidor**, y
> **no dos en el mismo**. *Test del servidor.*
>
> **Criterio 12.** El servidor rápido devenga turnos al doble de ritmo y
> acumula hasta 200. *Test del núcleo.*
>
> **Criterio 13.** El ranking, el mercado y los objetivos de guerra
> **solo enseñan magos del mismo servidor**. *Test del servidor* — es lo
> que impide que dos mundos se toquen.

---

#### Armageddon: los siete sellos

**[orig]** Cerrada la marca `[abierto]` que llevaba desde la fase 1. No
es un hechizo que se lanza una vez, **es una carrera de siete**
([ORIGINAL.md §10.1](ORIGINAL.md), confianza alta):

- **Siete sellos.** Cada lanzamiento con éxito rompe uno; roto el
  séptimo, la ronda acaba.
- **Un sello cada 24 horas como mínimo.**
- **Un mago solo puede romper un sello** por secuencia: hacen falta
  **siete magos distintos**.
- El hechizo **se investiga al final**, después de todos los demás, y
  **no suma nivel de hechizo** — es el único del catálogo que no te hace
  más fuerte.
- **Los siete que rompieron sello entran en el Hall of Immortals.**
- Además, **una fecha tope anunciada**: uno o dos meses desde el inicio.

**[nuestro]** La fecha tope se fija en **90 días** desde que abre el
servidor, que es lo que §14 ya decía («~3 meses»). Los sellos permiten
acabar antes; la fecha garantiza que acaba.

> **Riesgo declarado, y es el mismo que el del mercado.** Coordinar
> **siete magos distintos** con un sello cada 24 horas pide una población
> que al principio no habrá. La respuesta no es bajar el número —eso
> sería dejar de copiar el original en lo que mejor tiene— sino que **la
> pantalla enseñe cuántos sellos van y cuánto falta para la fecha tope**,
> de modo que la vía automática sea visible y la de los sellos sea una
> aspiración, no un misterio.

**[nuestro]** **El coste del hechizo no está publicado.** Se fija en
**el doble del Ultimate más caro del catálogo**, porque romper un sello
tiene que ser un esfuerzo de mago grande y no un trámite. Se valida con
la simulación: un mago que llega al final de la temporada **puede
pagarlo, y no dos veces seguidas**.

> **Criterio 14.** Hacen falta **siete magos distintos**: el mismo mago
> no rompe dos sellos. *Test del núcleo.*
>
> **Criterio 15.** Dos sellos seguidos en menos de 24 horas **no**: el
> segundo es un error de dominio. *Test con el reloj inyectado.*
>
> **Criterio 16.** El hechizo *Armageddon* **no se puede investigar**
> hasta saber todos los demás, y **no sube el nivel de hechizo**. *Test
> del núcleo* — y esto último es comprobable porque el nivel es un número
> reproducible desde la fase 2.
>
> **Criterio 17.** Roto el séptimo sello, la temporada **acaba**, y
> también acaba sola al llegar a los 90 días sin sellos. *Test con el
> reloj inyectado, por las dos vías.*

---

#### El final, y lo que sobrevive

**[orig]** Al acabar: **la cuenta persiste y el mago se borra**. Se gana
acabando entre los diez primeros (*Hall of Fame*) o rompiendo un sello
(*Hall of Immortals*).

**[nuestro]** **Lo que sobrevive al reset es una lista, no un estado.**
Nombre, escuela, net power final y puesto — nada que dé ventaja en la
temporada siguiente. Un juego por temporadas donde lo anterior te hace
más fuerte no es un juego por temporadas.

**[nuestro]** **Todo muere con la temporada: gremios, alianzas y
mensajes.** Decidido el 2026-09-22. Un gremio que sobreviviera al reset
daría ventaja al grupo ya formado — y el reset existe justamente para que
empezar de cero sea normal y no un castigo (§14). Lo que persiste es la
cuenta y la lista de honor, nada más.

**[nuestro]** **El reset no borra: archiva.** La temporada que termina
queda guardada y legible, y la nueva empieza limpia. Borrar de verdad
haría imposible responder «qué pasó en la temporada 3», que es
exactamente lo que da ganas de jugar la cuarta.

> **Criterio 18.** Tras el reset, la **cuenta sigue** y puede crear un
> mago nuevo; el mago viejo **no se puede jugar**. *Test del servidor.*
>
> **Criterio 19.** El Hall of Fame guarda **los diez primeros por net
> power** y el Hall of Immortals **a los siete de los sellos**. *Test del
> servidor.*
>
> **Criterio 20.** Un mago de una temporada cerrada **no aparece** en el
> ranking ni en los objetivos de la nueva. *Test del servidor.*
>
> **Criterio 21.** Lo que sobrevive **no da ventaja**: un mago nuevo de
> una cuenta con Hall of Fame empieza exactamente igual que uno de una
> cuenta nueva. *Test del núcleo comparando los dos estados iniciales.*

---

#### Fuera de alcance de la fase 5

- **Chat en tiempo real.** Fuera para siempre (§16).
- **Los dioses y el favor divino.** Siguen fuera (§16), y con ellos el
  *Altar of Darkness* del mercado.
- **Los ocho servidores del original.** Entran dos; los demás serían
  dato, y algunos tienen reglas propias —en Arch y Solo no hay Armageddon
  de jugador— que pedirían su propia spec.
- **Los 46 unique items** y **las habilidades de héroe**: siguen
  `[abierto]` desde la fase 4, y no es esta spec quien los cierra.
- **Moderación y denuncias.** Hay bloqueo entre magos, que es lo que
  protege a una persona; un sistema de denuncias necesita a alguien que
  las lea, y eso no es código.
- **Migrar un mago entre servidores.** Cada mundo es suyo.

#### Plan técnico

**Escrito el 2026-09-22.** Cómo se construye la spec de arriba.

> **Una deuda heredada que hay que decir antes de nada.** `war.ts` llama a
> `resolveBattle()` **directamente** y **nunca a `prepareBattle()`**. La
> capa de pre-batalla de la fase 4 está escrita y probada con 21 tests,
> pero **un ataque de verdad no aplica los items**: se construyó la capa
> y no se enchufó. Se arregla en la tarea 2, antes de tocar nada de
> gremios, porque los refuerzos de aliado entran exactamente por ahí.

**Paquetes y módulos afectados**

| Qué | Dónde | Nuevo o tocado |
|---|---|---|
| Gremios: fundar, entrar, protección | `packages/core/src/guild.ts` | **nuevo** |
| Alianzas y refuerzos | `packages/core/src/alliance.ts` | **nuevo** |
| Los siete sellos | `packages/core/src/armageddon.ts` | **nuevo** |
| Fin de temporada y halls | `packages/core/src/season.ts` | **nuevo** |
| Enchufar la pre-batalla, y los refuerzos | `packages/core/src/war.ts` | tocado |
| El hechizo *Armageddon* | `packages/content/src/spells.ts` | tocado |
| Los dos servidores | `packages/content/src/index.ts` | tocado |
| Esquemas de gremio, mensaje, sello | `packages/contract/src/index.ts` | tocado |
| Tablas y migración | `apps/server/src/schema.ts`, `db.ts` | tocados |
| Consultas **por servidor** | `apps/server/src/repository.ts` | tocado |
| Rutas | `apps/server/src/app.ts` | tocado |
| Pantallas | `apps/web/src/routes/{Gremio,Mensajes,Temporada}.tsx` | **nuevas** |

**Toca `packages/core`, `packages/contract`, `packages/content` y el
esquema de base de datos** ([AGENTES.md §1.1](AGENTES.md)).

**Dónde va cada cosa**

- **¿Es una regla?** Que un gremio necesite cinco, que no se pueda atacar
  a un compañero, que un aliado mande todo menos sus dos mejores stacks,
  que un sello pida 24 horas y un mago distinto: **todo eso es
  `packages/core`, y puro**.
- **¿Es un número?** Los dos servidores con su cadencia y su tope, y el
  coste del hechizo *Armageddon*, son **`packages/content`**.
- **El reloj entra por parámetro**, como en el mercado: «han pasado 24
  horas desde el último sello» es función de `(estado, now)`, nunca de
  `Date.now()` (invariante 2).

**El invariante 16 es el trabajo de verdad de la primera tarea.**
`TERRA` aparece **26 veces** en `app.ts`, y hoy la regla «un mago solo ve
su servidor» se cumple **por accidente**: como solo hay un servidor, da
igual. Con dos deja de cumplirse sola. El plan es sacar el `serverId`
**del mago de la sesión**, igual que su id, y que toda consulta que
devuelva magos lo lleve — no como parámetro opcional, sino obligatorio,
por la misma razón que `netPower()` pide el catálogo.

**El contrato cambia primero**, y la **migración es aditiva**: tablas
nuevas `guilds`, `guild_members`, `alliances`, `messages`, `blocks`,
`seals` y `seasons`, y **una columna `mages.season_id`** anulable.

**Decisiones de arquitectura que la spec obliga a tomar**

1. **Los refuerzos se resuelven en la pre-batalla**, no en la ronda. Es
   la capa que ya existe: llegan como stacks extra del defensor antes del
   primer golpe. Así la ronda no sabe que las alianzas existen.
2. **Las bajas del aliado se separan al final.** Sus stacks van marcados,
   y al acabar se devuelven a su dueño con lo que quedó. Si no se
   marcaran, el defensor se quedaría con el ejército de su aliado — que
   es exactamente el bug que hace que ayudar sea un negocio.
3. **Romper una alianza es un plazo, no un evento.** Se guarda «pedido
   romper en T» y la alianza **sigue activa** hasta T+24h. Lo resuelve un
   proceso programado idempotente, de los de [SPECS.md §3](SPECS.md).
4. **Una temporada es una fila, no una bandera.** `seasons` tiene su
   inicio, su fecha tope y su estado; los magos apuntan a ella. Archivar
   es marcar la temporada cerrada, **no tocar los magos** — así el
   invariante 17 se cumple con una escritura y no con miles.
5. **El hechizo *Armageddon* no suma nivel.** Es el único del catálogo
   con esa propiedad, así que el catálogo necesita un campo para decirlo
   en vez de un caso especial en el código (§4 de SPECS: el contenido es
   dato).

**Orden de dependencias**

```
dos servidores ──► todo lo demás (el invariante 16 toca cada consulta)
enchufar la pre-batalla ──► refuerzos de aliado
gremios ──► alianzas ──► refuerzos
gremios ──► tablón de mensajes
hechizo Armageddon ──► sellos ──► fin de temporada
fin de temporada ──► halls y archivo
todo ──► una sola pasada de navegador
```

**Qué queda fuera, y va al docstring de cada módulo**

- Chat, dioses, los ocho servidores, unique items, habilidades de héroe,
  moderación y migrar magos entre servidores: declarados en la spec.
- **La ronda no sabe de alianzas.** Si un día hiciera falta que un aliado
  actuara *durante* la batalla —y no solo aportando tropa antes—, eso es
  otra spec.

**Riesgos técnicos, declarados**

1. **El invariante 16 se rompe sin dar error**, y es el riesgo mayor.
   Una consulta sin `serverId` devuelve magos del otro mundo y la
   pantalla los pinta igual. La defensa es un test que **crea dos
   servidores con un mago cada uno** y comprueba que ninguna lista los
   mezcla.
2. **Los refuerzos tocan el combate calibrado de la fase 3.** La defensa
   es la misma que con las habilidades: **sin aliado, el resultado tiene
   que ser idéntico al de antes**, y los tests de calibración existentes
   son el canario.
3. **La deuda de `prepareBattle`.** Al enchufarla, las batallas de la
   fase 3 pasan a resolverse por un camino nuevo. Si algún test de
   guerra cambia de resultado **sin que haya items de por medio**, la
   capa está mutando algo que no debería.
4. **Coordinar siete magos** no se puede probar con dos. El test
   construye los siete estados, **no los juega**.

---

## 15. Empezar a jugar **[F1]**

**[orig]** El original publica sus valores de partida
([ORIGINAL.md §4.1](ORIGINAL.md)) y **los adoptamos**:

| | |
|---|---|
| Tierra inicial | **200 acres** |
| Turnos iniciales | **180** — el almacén lleno |
| Periodo de protección | **los primeros 120 turnos gastados**: ni atacas ni te atacan |

**[nuestro]** Que los turnos iniciales sean el almacén lleno no es
casualidad del original: hace que **la primera sesión sea una sesión de
verdad** y no una espera. Lo mantenemos aunque cambiemos la cadencia del
servidor.

**[nuestro]** La protección se mide en **turnos gastados, no en tiempo
real**. Quien juega despacio no pierde su escudo por el calendario, y
quien quema los 120 turnos el primer día sale a la intemperie
inmediatamente — que es coherente con que el turno sea la moneda (§2).

**[nuestro]** Edificios de partida sobre esos 200 acres: **45 farms, 15
towns, 20 nodes, 10 workshops, 10 barracks, 5 guilds, 1 fortress** — 106
acres construidos y **94 yermos**. Elegidos para tres cosas: que el mago
arranque con ingreso positivo de los cuatro recursos, que farms y towns
estén ya cerca de la proporción de equilibrio —45 y 15 son 3:1, y el
equilibrio real es 2,5:1 (§5.4), así que arranca con un margen de comida
para el primer ejército—, y que **casi la mitad de la tierra esté sin
construir**, porque decidir en qué la gasta
es la primera decisión del juego y no se le puede dar hecha.

**[nuestro]** Recursos de partida: **100.000 geld**, **5.000 maná**,
**19.500 habitantes** — el tope de espacio (15×1.000 + 45×100), que es el
que manda: la comida de 45 farms daría 22.500. Empieza **justo lleno**,
con 3.000 de comida de margen para el primer ejército.

> **Rehecho el 2026-09-21.** Decía **4.500 habitantes**, «que es a la vez
> el tope de espacio de 15 towns y el de comida de 45 farms». Con los
> coeficientes publicados (§5.4) los mismos edificios alojan 19.500, y
> los dos topes ya **no** salen igualados.

Lo que eso produce por turno, remedido el 2026-09-21 con la economía
publicada: **200 de maná** (20 nodes son el 10% de 200 acres), **22.801
de geld** brutos y **22.106
netos** tras 695 de mantenimiento, y **342 habitantes** si hubiera sitio
(50 + 1,5% de 19.500).
Los 100.000 de geld dan para unos 60 edificios baratos: suficiente para
que la primera sesión construya de verdad, insuficiente para no tener
que elegir.

> **El fort inicial no es decorativo.** Con 0 forts el mago muere (§4).
> Empezar con exactamente uno significa que la primera lección del juego,
> cuando acabe la protección, es que hay que construir más.

---

## 16. Fuera de alcance, a propósito

Lo que **no** vamos a hacer, y por qué. Un hueco declarado es deuda; uno
callado es un fallo esperando a una temporada real.

- **Turnos, recursos o ventajas por dinero real.** El turno es el
  equilibrio entero del juego (§2). Si se compra, no hay juego.
- **Los dioses y el sistema de favor.** El original los tiene y la wiki
  no documenta el mecanismo ([ORIGINAL.md §11](ORIGINAL.md)). Inventarlo
  entero es una fase por sí misma.
- **Combate táctico sobre un mapa.** Las batallas se resuelven por stacks
  e iniciativa (§9), sin posiciones. Es lo que permite resolver una
  batalla de 40.000 unidades en milisegundos y lo que hace que el juego
  quepa en 15 minutos al día.
- **Aplicación móvil nativa.** La web tiene que funcionar bien en un
  móvil ([INTERFAZ.md](INTERFAZ.md)); una app aparte no.
- **Chat en tiempo real.** Mensajería interna sí **[F5]**; chat no.
- **Más de ocho edificios o más de seis escuelas.** Las dos listas están
  cerradas (§4, §6).

> Si lo que echas en falta está en esta lista, **no es un fallo: es una
> decisión**. Cambiarla es legítimo, pero entonces es una spec nueva
> (`/spec`), no un parche.

---

## 17. Criterios de aceptación de la economía

**Spec del 2026-09-21.** Los números de §3, §4.2, §5 y §15 están
**cerrados como primera tirada**: se implementan tal cual y se calibran
contra estos criterios. Ninguno se ajusta «a ojo» — cada uno tiene aquí
la comprobación que lo da por bueno.

### 17.1. Lo que tiene que cumplirse siempre (tests del núcleo)

Estos no son de calibración: si fallan, hay un fallo.

1. **La sierra del maná existe.** Con 10.000 acres, un mago con 3.980
   nodes (39,8%) produce **28.178** de maná por turno y uno con 4.000
   (40,0%) produce **28.000**. El primero produce más con menos nodes.
2. **El máximo está en ~56%, y es una meseta.** Implementado el
   2026-09-21 se midió que **truncar convierte el pico en un empate**:
   con 10.000 acres rinden lo mismo 54,99% y 55,99% (30.695 los dos), y
   con 200 acres empatan tres valores (54,50%, 55,50% y 56,50%, a 609).
   La fórmula exacta sí tiene un único máximo en 55,99%; el redondeo a
   entero de [ARQUITECTURA.md §9.2](ARQUITECTURA.md) lo aplana.

   **No es un fallo, y de hecho ayuda**: el jugador no tiene que clavar
   un número exacto de nodes para estar en el pico, lo que hace el
   «sin ayudas» de [INTERFAZ.md §1](INTERFAZ.md) menos cruel sin quitar
   la decisión.
3. **La sierra muerde según el tamaño.** El primer cruce de porcentaje
   que **resta** maná es el **41%** con 200 acres, el **20%** con 1.000,
   el **13%** con 3.500 y el **11%** con 10.000 o más. Es una tabla de
   test, no una regla escrita: si la implementación no la reproduce, la
   fórmula está mal copiada.

   *(Con 1.000 acres la fórmula exacta daba 19%; el truncamiento lo mueve
   a 20%. Medido el 2026-09-21.)*
4. **El almacén son los nodes.** El maná no pasa nunca de `nodes × 1.000`;
   lo que sobra se pierde y queda anotado como evento.
5. **La proporción de equilibrio sale sola, y es 2,5:1.** Con 2,5 farms
   por cada town el tope de espacio y el de comida son iguales. Con 2:1
   manda la comida; con 4:1 manda el espacio.

   **Decía 3:1** hasta el 2026-09-21, porque nuestros coeficientes
   inventados (300 por town, la farm como tope de comida) lo hacían salir
   en 3. Con los publicados ([ORIGINAL.md §4.2](ORIGINAL.md)) el
   equilibrio está en 2,5 — y el 3:1 que aconsejan las guías del original
   resulta ser **eso más el margen que se come el ejército** (§5.4). Las
   dos cifras de las fuentes dejan de contradecirse.
6. **La exploración muere en 3.500.** A 3.500 acres, explorar da 0 y
   **no gasta el turno**: el juego no te deja tirar un turno a la basura
   sin avisar.
7. **El colapso es en cascada y en orden.** Un mago a cero de geld
   pierde forts a la mitad por turno; a cero de maná pierde stacks y
   encantamientos; a cero de población, stacks e ingreso. Los tres se
   comprueban construyendo el estado, no jugando hasta él.
8. **Todo en enteros.** Ninguna secuencia de acciones deja un recurso en
   negativo por redondeo, y el mismo cálculo da el mismo número dos
   veces.

### 17.2. Lo que se calibra con la simulación de temporada

> **Tercera pasada, 2026-09-21 (fase 3, tarea 4).** Se adoptó la
> **economía publicada** del original ([ORIGINAL.md §4.2](ORIGINAL.md)),
> que estaba en «sin verificar» y resultó estar documentada: la fórmula
> de geld, los dos topes de población y comida, y el crecimiento.
> **Criterio 11 vuelve a cumplirse** —medido donde mide el original, el
> turno 120— y **el criterio 10 de §7.1 pasa a cumplirse por primera
> vez**: el maná compite, y de hecho gana al reparto económico.
>
> Lo que lo arregló **no fue bajar el ingreso**. Fue que nuestros topes
> de población estaban 4,3 veces por debajo de los reales, lo que tenía
> al mago artificialmente pobre en el turno 120 y volcaba el net power
> casi entero a la tierra. Con los topes reales el ingreso **sube**, y
> aun así el criterio 11 encaja, porque el ejército del original también
> es mayor de lo que teníamos.

> **Segunda pasada, 2026-09-21 (fase 3, tarea 3).** Se rehízo con los
> upkeeps **publicados** en vez de los que me inventé, y con el ejército
> contando en el net power. **Dos criterios cambian de veredicto**: el 11
> deja de cumplirse y el 13 se desbloquea y cumple. El 12 sigue en pie.
> El relato está en cada criterio; el resumen, en §9.1.
>
> **Lo que lo movió todo no fue el upkeep, fue el net power.** `netPower()`
> dejaba el ejército fuera porque el `powerRank` estaba `[abierto]`: una
> unidad pagaba y no sumaba. Con la ficha publicada (§9.1) el ejército
> cuenta, y el reparto volcado a ejército pasa de ser el tercero a ser
> **el mejor de los cuatro**.

> **Primera pasada de calibración, 2026-09-21.** El simulador existe
> (`packages/content/src/simulate.ts`) y **los números aguantan**: no se
> movió ninguno. Lo que sí cambió es **qué se puede juzgar todavía**, y
> está anotado criterio por criterio.
>
> **Un aviso sobre el instrumento.** La primera versión del simulador
> elegía qué construir por **déficit absoluto** respecto a la cuota, y
> con eso se obsesionaba con el edificio de cuota más grande y no
> construía towns nunca. Daba de todo: población congelada en 4.500 e
> ingreso neto **negativo** con el reparto que recomiendan las guías del
> original. **No era el juego: era el simulador.** Con déficit relativo
> —qué fracción de su cuota le falta a cada uno— los mismos números dan
> una economía sana. Si vuelves a ver un reparto «imposible», sospecha
> primero de la estrategia simulada.

Aquí es donde los siete números de §4.2 y los coeficientes de §5.3 y
§5.4 se mueven si hace falta:

9. **Nadie gana siempre con el mismo reparto.** ✅ **Desbloqueado y
   cumpliendo desde el 2026-09-21** (fase 3, tarea 22). Con el combate
   implementado, el resultado depende **de con qué vayas**, no solo de
   cuánto lleves: a igual net power, unos emparejamientos los gana el
   atacante y otros el defensor, y hay un ciclo real —elemental de tierra
   → grifo → dríade—. Ver el criterio 10 de §9.1.

   *(Motivo original del aplazamiento, que era correcto: «No se puede
   juzgar en
   la fase 1, y ahora sabemos por qué.** Sin magia y sin combate, el maná
   **no sirve para nada**, así que el reparto volcado a economía domina a
   los demás por definición: a 600 turnos da 62.664 de geld neto contra
   6.309 del volcado a maná. Eso no es un desequilibrio, es que falta
   medio juego. **Se reevalúa en la fase 3**, cuando el maná compre
   hechizos y el ejército sirva para tomar tierra.

   Lo que sí se comprobó: **el reparto a maná da más maná y el de
   economía más geld**, así que las dos decisiones existen y no hay una
   estrictamente mejor en su propio terreno.

   **Reevaluado el 2026-09-21, con magia ya implementada: sigue sin
   cumplirse.** Y ahora se sabe por qué: lo que el maná compra es, en dos
   tercios, un ejército que no pelea. Ver §7.1, criterio 10. La fase 3 es
   la que de verdad lo desbloquea.
10. **La curva de crecimiento se parece a la del original.** ✅
    **Cumple.** Llegar de 200 a **1.250 acres cuesta 61 turnos** de
    exploración, así que un mago que reparta sus 120 primeros turnos
    entre explorar y construir cae dentro de los **1.200-1.300 acres**
    que documenta el original ([ORIGINAL.md §4.1](ORIGINAL.md)).
    Comprobado con el simulador, que acaba en **1.253**.

    *(Explorando los 120 turnos seguidos se llega a 1.951 acres, por
    encima de la banda. No es un fallo de la curva: es que ningún jugador
    real hace eso, porque no tendría con qué explotar la tierra.)*
11. **El geld no es ni gratis ni asfixiante.** ✅ **Vuelve a cumplirse**,
    y esta vez **medido donde lo mide el original**: el turno 120.

    | Reparto (turno 120, ~1.253 acres) | Ejército sostenible |
    |---|---:|
    | Guías | 9.592 |
    | Maná | 9.725 |
    | **Ejército** | **19.242** |
    | Economía | 22.937 |

    La banda del original es **10.000-20.000** ([ORIGINAL.md
    §4.1](ORIGINAL.md), confianza media). El reparto volcado a ejército
    —que es el que un mago con ejército llevaría— cae **dentro**, y los
    otros tres la **bracketean**: los dos que no buscan crecer se quedan
    un 4% cortos y el económico se pasa un 15%. Para un ancla de
    confianza media, eso es cumplir.

    **Tres cosas tuvieron que corregirse para llegar aquí**, y las tres
    eran nuestras:

    1. **El upkeep medio era inventado.** Puse 2 geld; la ficha publicada
       de la Milicia dice 0,32 y la media real de la tropa reclutable es
       **0,914** (§9.1).
    2. **Los topes de población estaban 4,3 veces por debajo.** Los
       publicados (§5.4) alojan 19.500 en el reino de partida, no 4.500.
       Eso tenía al mago del turno 120 artificialmente pobre.
    3. **Se estaba midiendo en el sitio equivocado.** El ancla del
       original es el **turno 120**; la fase 1 movió la medida al turno
       600 «porque 5.000 acres son inalcanzables». A 600 turnos el mismo
       mago sostiene **181.644** unidades — y no es un fallo, es que ha
       construido cinco veces más. El original no dice nada de ese punto,
       así que no había contra qué comparar.

    *(Sigue siendo cierto que este criterio decía «a 5.000 acres» y que
    **5.000 acres son inalcanzables en la fase 1**: la exploración se
    agota en **3.421** (§3) y pasar de ahí exige atacar. El cuadro de
    §4.2 vale como comprobación de escala, no como estado alcanzable
    hasta que haya PvP.)*
12. **Ningún reparto es una trampa.** ✅ **Sigue cumpliendo**, remedido
    en la fase 3 con los upkeeps reales y **también jugando con magia**,
    que antes no se comprobaba. Ninguno de los cuatro repartos —guías,
    maná, economía, ejército— acaba con ingreso neto negativo de geld ni
    de maná a 600 turnos, con magia o sin ella. Remedido con la economía
    publicada: el más ajustado es el del maná, con **+2.346 de maná**, y
    en geld nadie baja de **+28.890**. Un reparto puede ser peor que
    otro; ninguno puede arruinarte por seguirlo.

    Y cae con él **una trampa que sí existía**: la fase 2 midió que
    *invocar* hundía el maná y lo llamó «trampa hasta la fase 3». Era
    verdad por dos errores nuestros —upkeeps inventados 40-100 veces más
    caros, y un net power que no contaba el ejército—, no por balance.
    Corregidos los dos, invocar es **la jugada más fuerte** de las
    medidas (§9.1).
13. **Net Power cuadra con la intuición.** ✅ **Cumple**, y la fase 3 lo
    cerró del todo: con el doble de net power se gana **9 de cada 10**
    batallas —no 10 de 10, y eso es deseable: el azar de cada ronda y el
    emparejamiento tienen que poder dar sorpresas—.

    **Con un matiz que la tarea 22 midió y que conviene no olvidar:** el
    net power dice **cuánto tienes**, no **cuánto rindes**. Entre las
    fichas publicadas, el valor de combate por punto de net power varía un
    factor de 5,2. Como ranking es bueno; como precio de balance no sirve,
    y usarlo así era una suposición nuestra (§9.1, criterio 10).

    *(Lo que ya decía, y sigue valiendo:* — estaba aplazado desde la fase 1 con el
    motivo escrito: sin el coeficiente de poder del ejército el net power
    era **~98% tierra** y no distinguía estrategias.

    El `powerRank` estaba publicado en la ficha de cada unidad (§9.1), no
    había que inventarlo. Con el ejército dentro, a 2.000 turnos y con
    magia, el net power **sí** distingue el reparto:

    | Reparto | Net power | Tierra | Ejército | Libro |
    |---|---:|---:|---:|---:|
    | Ejército | 3.428.365 | 37% | 53% | 3% |
    | Maná | 3.301.483 | 38% | 56% | 4% |
    | Economía | 2.526.383 | 50% | 26% | 8% |
    | Guías | 2.263.703 | 55% | 40% | 3% |

    *(Rehecha con la economía publicada. Antes la tierra iba del 50% al
    79%; ahora del 37% al 55%, y **el orden cambió**: los dos repartos
    que compran ejército se ponen delante de los dos que no.)*

    El ancla de §5.7 sigue valiendo para calibrar precios. Como ranking,
    queda **pendiente de la prueba de verdad**: que el que más net power
    tiene gane las batallas. Eso es la tarea 21 de la fase 3.

### 17.3. Fuera del alcance de esta spec

- **Los números de unidades** —ataque, defensa, HP, coste, upkeep— y el
  coeficiente de poder del ejército en net power. Son la spec del
  combate, fase 3.
- **Los costes de los hechizos.** Spec de la magia, fase 2.
- **El reclutamiento**: cuántas unidades por turno da un barracks. Va con
  la spec de unidades, porque sin saber qué unidad es no se puede poner
  el ritmo.
- **Los modificadores de la fórmula del maná** por items y
  encantamientos (*Alchemist* −10%, *Moon's Favour* +10%). Fase 2, cuando
  existan los encantamientos.
- **Rebalancear después de jugar.** Esta spec cierra la primera tirada.
  La segunda saldrá de partidas reales, y será otra spec.
