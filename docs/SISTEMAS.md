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
| Población máxima | **97.800** |
| Ingreso de geld | **86.100/turno**, **45.100 netos** |
| Ingreso de maná | **14.625/turno**, con almacén de 2.250.000 |

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

**[nuestro]** Los coeficientes no están publicados. Primera tirada:

```
geld por turno = población × (0,75 + 2 × %towns)
```

con `%towns` en tanto por uno. **Sin sierra ni penalización**: el freno
es que cada town es un acre que no es farm, y las farms son las que
sostienen la población que produce el geld (§5.1).

### 5.4. Población y comida **[orig]** la forma, **[nuestro]** los números

**[orig]** La población crece **≈ 1,5% + 50 por turno**, se frena al
acercarse al máximo, y llega a cero o a negativo si se pasa. Vive en las
**towns**; la alimentan las **farms**. **Las unidades consumen
población**: ocupan espacio, y algunas tienen upkeep en población. Y
**las unidades comen antes que los civiles**: cuando falta comida, quien
se muere es la población.

**[nuestro]** Dos topes, y manda el menor de los dos:

```
espacio = towns × 300
comida  = farms × 100
población máxima = min(espacio, comida) − espacio ocupado por el ejército
```

**De dónde salen esos dos números.** De que la wiki recomienda mantener
farms y towns en proporción **≈3:1**
([ORIGINAL.md §4.1](ORIGINAL.md)): con 300 y 100, los dos topes se
igualan exactamente en 3 farms por town. Es decir, los coeficientes están
elegidos para que **la proporción que el original recomienda sea la que
sale sola**, en vez de ser un consejo que el jugador tiene que leer en
una guía.

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

10. **El maná ya sirve para algo.** ❌ **No se cumple, y se midió por
    qué** (2026-09-21).

    Se esperaba que al haber magia el reparto volcado a maná dejara de ser
    estrictamente peor que el económico. **Sigue siéndolo**: a 2.000
    turnos, el económico acaba en 1.513.000 de net power y el de maná en
    1.468.000, incluso jugando la magia bien.

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
   ser ~98% tierra y pasa a distinguir estrategias: del 50% de tierra en
   el reparto de ejército al 79% en el de las guías.
2. **«Invocar es una trampa» era falso**, y lo era por construcción: sin
   `powerRank`, lo invocado no podía sumar. Corregido, el reparto de
   ejército es **el que más net power saca** de los cuatro.
3. **Criterio 11 de §17.2, roto.** Y es el que hay que decidir.

**El criterio 11, en corto.** El ejército que el ingreso sostiene a 600
turnos pasa de **13.636** a **29.838** unidades, contra la banda de
10.000-20.000 que documenta el original. Con milicia pura, **85.225**.

**Por qué, y de quién es la culpa.** No del upkeep: es `[orig]` y viene
de la ficha. La media real de la tropa reclutable es **0,914** de geld y
yo había supuesto **2**. Todo lo que se calibró contra ese 2 —la
producción de farms y towns, el `geldPerPopulation`— quedó **2,19 veces
generoso**. El error estaba en el ingreso desde la fase 1; la ficha solo
lo ha sacado a la luz.

**[abierto] Qué se mueve, y no se decide aquí.** Hay tres salidas y
ninguna es obviamente la buena:

- **Bajar el ingreso un 2,19.** Devuelve el criterio 11 a la banda y deja
  el upkeep intacto. Es lo más fiel al original, y **rehace la
  calibración entera de la fase 1**: los cuadros de §4.2, la curva de
  crecimiento y los tiempos de §17.2.
- **Subir el coste de reclutar en vez del upkeep.** El coste de recluta
  también está publicado (Milicia 20), así que tocarlo es separarse del
  original igual, pero en un sitio que no arrastra la economía entera.
- **No mover nada y aceptar ejércitos más grandes.** Es defendible: las
  10.000-20.000 del original son de confianza *media* y de una fase del
  juego que aquí no existe todavía. Pero entonces hay que decirlo en el
  criterio, no dejarlo como fallo.

**Esta decisión va antes de construir el combate encima.** Un ejército
2,19 veces mayor del previsto cambia cuánta tierra se toma por ataque,
cuánto dura una guerra y qué se siente al perder. Calibrar el daño contra
un tamaño de ejército que luego se mueve es hacerlo dos veces.

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
tiene varios tipos, y una **debilidad mete −50%** en esa media.

**El orden y el emparejamiento**: los stacks se ordenan por un
multiplicador de tipo —1,0 a distancia, 1,5 el resto, 2,25 voladores—;
los voladores y los de distancia pegan a cualquiera, los de melee solo a
tierra y **se quedan sin objetivo** si no queda ninguna; y un stack solo
es objetivo si **vale al menos el 10%** del que ataca.

**Quién gana**: pierde quien pierda **más porcentaje** de ejército, y el
defensor necesita pasar del **10% de bajas** para perder tierra. Con un
ejército que pase del **200%** del rival, el atacante se lleva **1% de
bonus por cada 2%** que pase del doble.

**La tierra**: regular hasta el **5%**, asedio hasta el **10%**, y en los
dos **el atacante se queda un tercio**.

**[nuestro]** **Supervivientes por acre: 50.** Las fuentes se
contradicen —el *Beginner's Guide* dice 2,5 y 5; *Battle Mechanics* dice
50 con un ejemplo aritmético que cuadra— y **nos quedamos con 50**,
porque viene con la cuenta hecha ([ORIGINAL.md §9.3](ORIGINAL.md)).

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

10. **Ningún ejército de una sola unidad domina.** Simulando batallas
    entre composiciones —solo melee, solo voladores, solo a distancia,
    mezclado—, **la mezclada gana a las puras** más veces de las que
    pierde. Si una unidad sola domina, sus números están mal.
11. **El maná ya compite** — el criterio 10 de §7.1, reabierto. Con
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

**[abierto]** El **efecto numérico** de cada habilidad.

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

**[abierto]** Qué hace exactamente el hechizo **Armageddon** y cómo se
resuelve el final. El original no lo documenta de forma accesible.

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
estén ya en la proporción de equilibrio 3:1 (§5.4), y que **casi la
mitad de la tierra esté sin construir**, porque decidir en qué la gasta
es la primera decisión del juego y no se le puede dar hecha.

**[nuestro]** Recursos de partida: **100.000 geld**, **5.000 maná**,
**4.500 habitantes** — que es a la vez el tope de espacio de 15 towns y
el de comida de 45 farms, así que empieza justo lleno y con los dos
límites igualados.

Lo que eso produce por turno, comprobado el 2026-09-21: **200 de maná**
(20 nodes son el 10% de 200 acres), **4.050 de geld** brutos y **3.355
netos** tras 695 de mantenimiento, y **~118 habitantes** si hubiera sitio.
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
5. **La proporción 3:1 sale sola.** Con 3 farms por cada town, el tope
   de espacio y el de comida son iguales. Con 2:1 manda la comida; con
   4:1 manda el espacio.
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

9. **Nadie gana siempre con el mismo reparto.** ⏸ **No se puede juzgar en
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
11. **El geld no es ni gratis ni asfixiante.** ❌ **Ya no cumple, y es
    el hallazgo de la fase 3.** El reparto de las guías, a 600 turnos y
    1.253 acres, sostiene **29.838 unidades**: por encima de las
    10.000-20.000 del original, y **85.225 si son todas milicia**.

    **Por qué cambió.** Cumplía con un upkeep medio de **2 geld que me
    inventé**. La ficha publicada de la Milicia (§9.1, confianza alta)
    dice **0,32**, y la media real de la tropa reclutable es **0,914**:
    2,19 veces más barata. El mismo ingreso paga 2,19 veces más tropa.

    **Dónde está el error, y dónde no.** El upkeep es `[orig]` y no se
    toca: viene de la ficha. Lo que sobra es **ingreso** — nuestro
    `geldPerPopulation` y la producción de farms y towns se calibraron
    contra un upkeep inventado, así que el 2,19 es el factor por el que
    el ingreso quedó generoso. Mover eso es una decisión de balance con
    consecuencias en toda la fase 1, **y está sin tomar a propósito**:
    ver §9.1, «Lo que la recalibración dejó abierto».

    *(Lo anterior sigue siendo cierto y se mantiene: este criterio decía
    «a 5.000 acres», y **5.000 acres son inalcanzables en la fase 1** —
    la exploración se agota en **3.421** (§3), y pasar de ahí exige
    atacar. El cuadro de §4.2 vale como comprobación de escala, no como
    estado alcanzable hasta que haya PvP.)*
12. **Ningún reparto es una trampa.** ✅ **Sigue cumpliendo**, remedido
    en la fase 3 con los upkeeps reales y **también jugando con magia**,
    que antes no se comprobaba. Ninguno de los cuatro repartos —guías,
    maná, economía, ejército— acaba con ingreso neto negativo de geld ni
    de maná a 600 turnos, con magia o sin ella. El más ajustado es el de
    las guías con magia: **+843 de geld**. Un reparto puede ser peor que
    otro; ninguno puede arruinarte por seguirlo.

    Y cae con él **una trampa que sí existía**: la fase 2 midió que
    *invocar* hundía el maná y lo llamó «trampa hasta la fase 3». Era
    verdad por dos errores nuestros —upkeeps inventados 40-100 veces más
    caros, y un net power que no contaba el ejército—, no por balance.
    Corregidos los dos, invocar es **la jugada más fuerte** de las
    medidas (§9.1).
13. **Net Power cuadra con la intuición.** ✅ **Cumple, y se
    desbloqueó en la fase 3** — estaba aplazado desde la fase 1 con el
    motivo escrito: sin el coeficiente de poder del ejército el net power
    era **~98% tierra** y no distinguía estrategias.

    El `powerRank` estaba publicado en la ficha de cada unidad (§9.1), no
    había que inventarlo. Con el ejército dentro, a 2.000 turnos y con
    magia, el net power **sí** distingue el reparto:

    | Reparto | Net power | Tierra | Ejército | Libro |
    |---|---:|---:|---:|---:|
    | Ejército | 2.531.586 | 50% | 48% | 1% |
    | Economía | 2.188.345 | 58% | 30% | 9% |
    | Maná | 1.720.914 | 74% | 24% | 1% |
    | Guías | 1.611.634 | 79% | 19% | 1% |

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
