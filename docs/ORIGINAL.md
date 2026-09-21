# El juego original — investigación

Qué es **The Reincarnation** (antes **Archmage**) de verdad, y con qué
confianza lo sabemos. Este documento **no dice qué vamos a construir
nosotros** — eso es [SISTEMAS.md](SISTEMAS.md). Aquí solo está el
original, para poder decidir con conocimiento qué copiamos y qué no.

Toda afirmación lleva su nivel de confianza. **No los mezcles en
silencio**: si un número de `SISTEMAS.md` dice que viene de aquí, tiene
que poder rastrearse hasta una línea de este documento.

| Nivel | Qué significa |
|---|---|
| **Confirmado** | Leído literalmente en la web oficial o en la wiki oficial (`wiki.the-reincarnation.org`). |
| **Parcial** | La wiki nombra el mecanismo pero no da la cifra o la fórmula. Sabemos *que* existe, no *cuánto*. |
| **No verificado** | Ni la web ni la wiki lo documentan de forma accesible. Si aparece en nuestro diseño, es **decisión nuestra**, no herencia. |

Fecha de la investigación: **2026-09-21**. Fuentes en §12.

---

## 1. Qué es el juego

**Confirmado.** MMO de navegador, gratuito, online desde 2004. Cada
jugador es un archimago que gobierna un reino de fantasía en un mundo
llamado **Terra**, mediante magia y ejércitos. La web oficial dice
textualmente: *«Versions of this game have been around for over 10 years,
starting with the original Archmage»* — Archmage es el antecesor directo.

**Confirmado.** El eslogan de la web: *«A game that requires 15 minutes a
day to play... but is so addictive you'll want to play all day!»*. El
bucle de sesión corta y repetida es intencionado, no un accidente.

**Confirmado.** Varios servidores simultáneos con reglas distintas
(Arch, Blitz, Guildwar, Solo, Lightning, Beta, Recode, Apprentice). Cada
servidor **se reinicia cada ~3 meses** y termina en un evento llamado
**Armageddon**. La cuenta de portal es permanente; el mago de cada
servidor se borra en cada reset. El objetivo declarado es acabar entre
los 10 primeros (Hall of Fame) o destruir el mundo como *Destroyer of
Terra*.

> **Esto es lo primero que el documento de diseño en PDF no vio.** El PDF
> trata el juego como gestión de maná y ejército. El original es un **PvP
> por temporadas**: la economía existe para alimentar la guerra, y la
> guerra es de dónde sale la tierra. Ver §4 y §9.

---

## 2. El turno es la moneda, no el maná

**Confirmado.** El recurso que regenera con el reloj es el **turno**, y
cada servidor tiene su cadencia y su tope de acumulación:

| Servidor | Un turno cada | Tope acumulado |
|---|---|---|
| Apprentice | 15 min | 150 |
| Guild | 10 min | 180 |
| Blitz | 5 min | 200 |
| Beta | 5 min | 200 |

Los turnos se gastan en **construir, reclutar, explorar, investigar,
cargar maná y atacar**. Todo lo demás —geld, maná, población— se produce
**por turno gastado**, según los edificios que tengas.

> **Corrección al PDF, cerrada.** El PDF §3 afirma «+1 punto de maná cada
> 8 minutos de tiempo real» y lo marca como *confirmado por el usuario*.
> **Es falso, y el usuario lo desmintió el 2026-09-21**: lo que sube con
> el reloj son los turnos, y el maná lo producen los **nodes** al gastar
> turnos. La cifra de 8 minutos no vuelve a aparecer en ningún documento
> de este proyecto.
>
> El tope de acumulación (150-200) es lo que obliga a entrar dos veces al
> día: si te pasas, desperdicias regeneración. Ésa es la mecánica que el
> PDF intentaba capturar con el reloj del maná.

---

## 3. Recursos

**Confirmado.**

- **Turnos** — la moneda de acción. §2.
- **Geld (oro)** — lo producen **towns y farms** en función de la
  población y del % de tierra dedicado a towns. **Sin límite de
  almacenamiento.** Paga el mantenimiento de edificios y el upkeep de
  buena parte del ejército.
- **Maná (M.P.)** — lo producen **exclusivamente los nodes**, y el
  ingreso depende del **% de tierra** que ocupan. **Cada node almacena
  hasta 1.000 de maná** — el almacén es el propio edificio. Paga
  lanzamientos, encantamientos, barreras y el upkeep de las unidades
  mágicas.
- **Población** — crece sola, aproximadamente **1,5% + 50** de la
  población actual por turno, y se frena al acercarse al máximo. Vive en
  **towns**, la alimentan las **farms**, y **las unidades la consumen**:
  ocupan sitio, y algunas tienen upkeep en población.
- **Tierra (acres)** — el recurso maestro. Todo lo demás se mide como
  *porcentaje de tu tierra*. Se gana **explorando** o **atacando**.
- **Puntos de habilidad (skill points)** — se generan con el tiempo, en
  función de la **raíz cuadrada del número de guilds** y de la velocidad
  del servidor. Ejemplo confirmado: con 5.000 de tierra y 5% de guilds en
  Beta, **un punto cada ~34 turnos**.

**Confirmado — rendimientos decrecientes por porcentaje.** El maná es el
caso documentado: *«29.99% will usually generate more mana than 30%»*.
Pasarse de un umbral **reduce el ingreso total**, no solo el marginal. Es
la mecánica que obliga a repartir la tierra en vez de acumular un solo
edificio. La fórmula exacta está en §3.1 — y dice que esa frase es **un
ejemplo de una regla general**, no un umbral.

### 3.1. La fórmula del maná, publicada

**Confirmado** (página *Mana* de la wiki, ampliación del 2026-09-21). Con
`N` nodes y `L` acres de tierra:

```
X = floor(100 · N / L)            ← el porcentaje, truncado a entero
Rendimiento = X·L/100 + N·(100−X)/10
```

Y en un porcentaje exacto se simplifica a `Y = X·L·(110−X)/1000`.

**Lo que esta fórmula significa, y no es lo que parecía:**

- **No hay un umbral. Hay una sierra.** Dentro de cada punto porcentual,
  `X` es constante y el rendimiento **crece** con cada node añadido, a
  razón de `(100−X)/10`. Pero **el node que hace subir `X` de golpe puede
  costarte maná**: el salto al cruzar al `k`%, deducido de la fórmula,
  vale

  ```
  L·(10−k)/1000 + (101−k)/10
  ```

  Así que el óptimo local está siempre en `k−1,99%`: el último node antes
  de cruzar.
- **Y aquí está lo que no es evidente: la sierra muerde según lo grande
  que seas.** El término dominante es `L·(10−k)/1000`, así que el primer
  cruce que resta depende de la tierra:

  | Tierra | Primer cruce que **resta** |
  |---|---|
  | 200 acres | 41% |
  | 1.000 | 19% |
  | 3.500 | 13% |
  | 10.000 o más | 11% |

  Un mago pequeño puede construir nodes casi sin pensar; uno grande tiene
  que ser quirúrgico. **La dificultad crece con el jugador**, sin que
  haya ninguna regla que lo diga: sale de la fórmula.
- **El máximo global está en ~56%** a cualquier tamaño: 55,50% con 200
  acres, 55,99% con 10.000. La envolvente de porcentajes exactos,
  `Y = X·L·(110−X)/1000`, tiene su máximo en `X = 55`.
- La cita del *Beginner's Guide* sobre el 29,99% era **un ejemplo** de la
  regla general, no el umbral. Y el *«effectiveness diminishes above 10%
  of total land»* del manual encaja con la tabla de arriba para un mago
  grande, que es de quien hablan las guías. Las dos fuentes describen la
  misma sierra desde sitios distintos.

Comprobaciones con la fórmula (L = 10.000, calculadas el 2026-09-21): al
20% → 18.000; al 39,8% → **28.178**, contra 28.000 al 40% exacto; al
29,99% → 24.193 contra 24.000 al 30%; al 55,99% → **30.695** contra
30.240 al 56%. Coincide con los ejemplos de la wiki.

**Confirmado — modificadores.** La fórmula la alteran items y
encantamientos: *Alchemist* la reduce un 10%, *Moon's Favour* la aumenta
un 10%, y hay más.

### 3.2. Net Power — la fórmula del ranking

**Confirmado** (página *Net Power*, 2026-09-21). Es la medida oficial del
tamaño de un mago, y **también la tabla de equivalencias entre recursos
según los propios diseñadores**:

| Concepto | Net Power |
|---|---|
| Un acre de tierra (construido o yermo) | **1.000** |
| Cada fortress, **además** de su acre | **19.360** |
| Cada barrier, además de su acre | **6.500** |
| Cada punto de maná almacenado | **0,05** |
| Cada habitante | **0,02** |
| Cada geld | **0,0005** |
| Cada nivel de hechizo | **1.000** |
| Cada lesser item | **1.000** |
| Cada unique item | **100.000** |
| Cada aliado | **10.000** |
| Cada nivel de héroe (de batalla y de fuera de batalla) | **10.000** |
| Ejército | `número × rango de poder`, sumado por stack |

De ahí salen las tasas de cambio que el original considera justas:
**1 maná = 100 geld**, **1 habitante = 40 geld**, **1 maná = 2,5
habitantes**, **1 acre = 20.000 maná = 2.000.000 de geld**, y **una
fortress vale 19,36 acres**.

**Parcial.** El coeficiente del «rango de poder» de cada unidad no está
publicado.

**Confirmado — carga.** Se puede gastar un turno en **M.P. Charging**
(duplica lo que los nodes producirían ese turno) o en **gelding**
(duplica el ingreso de geld del turno).

**Confirmado — colapso económico.** Quedarse a cero tiene consecuencias
distintas según el recurso, y son cascada:

| A cero | Qué pasa |
|---|---|
| **Maná** | Stacks de unidades se disuelven al azar, los encantamientos se cancelan, las barreras se deshacen. |
| **Población** | Stacks se disuelven, y el ingreso de geld se hunde durante mucho tiempo. |
| **Geld** | Las unidades desertan, se pierden edificios, y **los forts se reducen a la mitad cada turno sin recuperarse**. |

> Ésta es la tensión central del juego, y el PDF la tenía a medias:
> acertó en que el ejército se desvanece si no puedes mantenerlo, pero lo
> colgó solo del maná. En el original el ejército puede caerse por **tres
> recursos distintos**, y cada caída se siente diferente.

---

## 4. Tierra y edificios

**Confirmado.** La tierra se mide en **acres** y se consigue explorando
(seguro, y cada vez menos rentable: algunos servidores lo topan en 3.500
acres) o **atacando a otros magos** (la vía real a partir de cierto
tamaño). Los edificios ocupan acres, y su efecto se calcula casi siempre
como **porcentaje de tu tierra total**, no como número absoluto.

**Confirmado — los ocho edificios:**

| Edificio | Qué hace |
|---|---|
| **Farms** | Producen comida. Sostienen población y ejército. **Las unidades comen antes que los civiles.** |
| **Towns** | Alojan población y generan geld. |
| **Nodes** | Producen maná y lo almacenan (1.000 cada uno). |
| **Workshops** | Aumentan la velocidad de construcción de todo, **incluidos más workshops**. |
| **Barracks** | Permiten reclutar tropa básica y determinan la velocidad de reclutamiento. |
| **Guilds** | Investigan hechizos, aceleran skills y **generan items** (a partir del turno 150). Mantenimiento alto. |
| **Fortresses** | Bonus defensivo. **Si llegas a 0 forts, estás muerto: se acabó la partida.** |
| **Barriers** | Resistencia a magia e items enemigos. Upkeep de maná considerable. |

**Confirmado — velocidad de construcción por turno**, en función de los
workshops (`W`), con `base = (W / 10) + 0.1`:

| Edificio | Por turno |
|---|---|
| Farms, Barracks | `base × 2` |
| Workshops | `base` |
| Guilds | `base / 2` |
| Towns, Nodes | `base / 3` |
| Fortresses | `base / 30` |
| Barriers | **1 por turno, siempre** |

Corolario confirmado: **299 workshops permiten construir un fort por
turno**. Y el truco de eficiencia que da la guía: si puedes construir
10,50 nodes en un turno, añade farms o barracks en el mismo turno para no
desperdiciar la fracción.

**Confirmado — topes de efectividad:**

- **Barriers**: máximo **75% de resistencia**, alcanzado al **2,5% de la
  tierra**. Más barriers no dan más resistencia.
- **Fortresses**: el bonus defensivo aparece por encima del **0,67% de la
  tierra** y es **máximo al 2,33-2,5%**.

**Confirmado — proporción de referencia** que da la guía para repartir la
tierra: `1 Fort = 10 Nodes/Towns = 15 Guilds = 30 Workshops = 60 Farms/Barracks`.

**Confirmado — y esa proporción es exactamente el tiempo de
construcción** (deducido de la tabla de arriba, 2026-09-21). Una segunda
fuente da las mismas fórmulas en otra forma —`(W+1)/5` farms, `(W+1)/10`
workshops, `(W+1)/20` guilds, `(W+1)/30` towns y nodes, `(W+1)/300`
fortresses— que es algebraicamente idéntica. Normalizando a la farm: la
farm cuesta 1, el workshop 2, el guild 4, el town y el node 6, el fort
**60**. La «proporción de referencia» no es un consejo de reparto: es la
misma tabla dicha al revés.

Corolario confirmado por la segunda fuente: con **599 workshops** se
reconstruye un fort en un solo turno.

**Parcial, y menos de lo que parecía.** Esta nota decía que la wiki «no
publica el coste en geld ni las fórmulas exactas de ingreso» de towns,
farms y nodes. **De las tres cosas, dos sí están publicadas** y se
encontraron el 2026-09-21: el ingreso de geld y los topes de población y
comida están en **§4.2**, y la fórmula del maná en §3.1. Lo único que
sigue sin publicarse es el **coste en geld** de cada edificio y su
**mantenimiento**.

> **Corrección al PDF.** El PDF §7 inventa «Torre del mago, Biblioteca,
> Cuartel, Defensas» y los marca como *supuesto de diseño*. No hacía
> falta suponer: los edificios reales son los ocho de arriba, con
> fórmulas publicadas. Y el concepto que el PDF no tenía —**la tierra
> como recurso maestro y todo medido en porcentaje de ella**— es el que
> hace que el juego tenga decisiones.

### 4.1. Valores de partida y exploración

**Confirmado** (*HalfDone Wiki Startup Guide*, ampliación del
2026-09-21):

| | |
|---|---|
| Tierra inicial | **200 acres** (220 si exploras una vez) |
| Turnos iniciales | **180** en Apprentice, **200** en normal y Blitz |
| Periodo de protección | **los primeros 120 turnos**: ni atacas ni te atacan |
| Exploración al principio | **18-26 acres por turno**; unos 200 acres en 10 turnos |
| Exploración al final | **0-1 acres por turno**; tope de 3.500 acres en algunos servidores |
| Tierra esperable al turno 120 | **1.200-1.300 acres** |
| Ejército esperable al turno 120 | **10.000-20.000 unidades** |
| Investigarlo todo | **1.500-3.000 turnos**, cosa de una semana de juego diario |

**Confirmado — proporciones que recomiendan las guías**, útiles como
comprobación de que una economía nuestra no es absurda:

- **Nodes: 25-35%** para Eradication y Nether, **35-50%** para Ascendant,
  **40-50%** para Verdant y Phantasm. Coherente con que el máximo de la
  fórmula de §3.1 esté en 55,99%: las escuelas que más maná queman se
  acercan más al pico.
- **Workshops**: al menos 100, unos 300 es razonable.
- **Guilds**: 1.000-1.600 mientras se investiga.
- **Forts**: 15-20 unidades típicamente, o en torno al 1% de la tierra.
- **Barriers**: 2,5% de la tierra.
- **Farms y towns en proporción ≈ 3:1** para sostener la población.

> **Conflicto entre fuentes, sin resolver.** Sobre la cadencia de turnos,
> el *Beginner's Guide* da 15/10/5 minutos (Apprentice/Guild/Blitz) y el
> *Startup Guide* da 12/7/5. Son guías de épocas distintas del juego y
> los valores han cambiado con los años. **Ninguna de las dos es
> autoridad sobre la otra**; nuestra elección de 10 minutos cae dentro
> del rango de las dos.

---

### 4.2. La economía, publicada

**Encontrado el 2026-09-21.** Esto estaba en §11 como «sin verificar» —
«cuánto geld da exactamente un town, cuánta comida una farm, cuánta
población cabe en un town»— y **sí está publicado**, en las páginas de
`Geld`, `Population` y `Farms` de la wiki. Se sale de §11.

#### El ingreso de geld **(confianza alta)**

La wiki da la fórmula y **su historia**, que importa:

| Versión | Fórmula |
|---|---|
| Original | `Pob × ((100 + 10×Towns) / Tierra) ^ 0,5 + 1000` |
| Blitz, feb. 2009 | `Pob × ((100 + 10×Towns) / Tierra) ^ 0,0000005 + 1000` |
| Actual | *«parece ser simplemente»* `Pob + 1000` |

El cambio de 2009 pone el exponente en 0,0000005, que hace el paréntesis
≈ 1 para cualquier valor: **anula el término de towns**. Por eso la
tercera fila es la segunda vista de lejos, no un cambio aparte.

> **Cuál es «el original».** La primera. Es la que la wiki etiqueta como
> tal, la única en la que **los towns hacen algo por el geld**, y la que
> describe la guía para principiantes («el ingreso de geld depende de la
> población y del porcentaje de tierra en towns»). Las otras dos son el
> juego después de que le quitaran esa decisión.

Sin tope máximo de geld acumulado, y **con suelo de 1.000 por turno**
aunque la población sea cero.

#### Población: espacio y comida son **dos topes separados** **(confianza alta)**

Ésta es la parte que nuestro diseño tenía con la forma equivocada:

- **Espacio residencial** — lo dan **todos** los edificios y **se suman**:
  un town da **1.000**, una farm **100**. Forts y towns son los que más
  alojan por acre.
- **Producción de comida** — la dan **solo las farms**: **500** cada una.

La población sostenible es **el menor de los dos**, y el ejército
**compite por los dos**: todas las unidades comen de las mismas farms, y
algunas ocupan además espacio residencial.

**El ejemplo trabajado de la wiki**, que confirma los tres números:

> «10 towns = 10k de población máxima» · «25 farms = 2,5k de población
> máxima + 12,5k de comida»

10 towns × 1.000 = 10.000 de espacio; 25 farms × 100 = 2.500 más, total
**12.500**. Y 25 farms × 500 = **12.500** de comida. Los dos topes salen
**iguales**, y por eso la wiki aconseja **2,5 farms por town**: es el
reparto que hace que ninguno de los dos sobre. *(La página de
`Population` dice «3:1» y la de `Farms` «2,5»; la de 2,5 trae el ejemplo
numérico, así que es la que se adopta.)*

#### Crecimiento de población **(confianza alta)**

> «El crecimiento típico es **50 de población por turno + 1,5%** de la
> población actual.»

Decrece al acercarse al máximo (entre el 90% y el 100%), llega a cero en
el máximo y **se vuelve negativo si se pasa**. Si las unidades que comen
población superan al crecimiento, entra en **espiral de población**: cada
turno se pierde más, y se puede llegar a cero.

#### Velocidad de construcción **(confianza media)**

> «Farms y Barracks: `((Workshops / 10) + 0,1) × 2`»

Encaja con el coste relativo de §4 —la farm cuesta 1 y el barracks
también— y con el corolario de los 599 workshops.

#### Lo que sigue sin publicarse

El **coste en geld** de cada edificio y su **mantenimiento**, y cuánto
espacio residencial da un **fort**.

## 5. Escuelas de magia

**Confirmado.** Seis especialidades. Cinco son colores con identidad, y
**Plain** es la ausencia de especialidad (magia neutra y administrativa,
accesible a todos).

| Escuela | Color | Identidad | Adyacentes | Opuestas |
|---|---|---|---|---|
| **Ascendant** | Blanco | Defensiva. Ángeles, unicornios, espíritus astrales. Depende de maná y geld. | Phantasm, Verdant | Nether, Eradication |
| **Verdant** | Verde | Naturaleza. Treefolk, elfos, animales. Flexible. Muy dependiente del maná. | Ascendant, Eradication | Nether, Phantasm |
| **Eradication** | Rojo | Agresiva. Dragones, elementales, reptiles. Unidades que comen población. | Nether, Verdant | Ascendant, Phantasm |
| **Nether** | Negro | «Poder a un precio». Demonios y no-muertos. Exige mucha población y maná. | Eradication, Phantasm | Ascendant, Verdant |
| **Phantasm** | Azul | Tramposa. Unidades mágicas y psíquicas, y **la mayor variedad de hechizos**. | Nether, Ascendant | Verdant, Eradication |
| **Plain** | — | Magia neutra y de utilidad. | — | — |

**Confirmado.** La rueda de adyacencia **no es decorativa: define qué
puedes aprender**. Ver §6.

---

## 6. Hechizos

**Confirmado — cinco rangos**, de menor a mayor: **Simple, Average,
Complex, Ultimate, Ancient**.

**Confirmado — quién puede aprender qué:**

- **Simple** y **Average**: aparecen en **todos** los libros.
- **Complex**: en el libro propio y en el de las **adyacentes**.
- **Ultimate**: **solo** en el libro de tu propia especialidad.
- **Ancient**: no se investigan — se consiguen en el **Black Market**
  (*Exotic Mageware*).

Consecuencia confirmada: **Phantasm aprende de todas las
especialidades**, y por eso alcanza el nivel de hechizo más alto.

**Confirmado — ficha de un hechizo** (ejemplo real: *Summon Unicorn*,
Ascendant, Complex): **Cast Turn** (turnos que tarda en completarse el
lanzamiento; 4), **Cast M.P.** (coste al lanzar; 30.000), **Research
Cost** (coste de investigarlo; 2.500), **Upkeep Cost** (mantenimiento
continuo; ninguno en este caso, pero existe en otros), y la unidad que
invoca si invoca alguna (unicornios, **887-1010 de golpe**).

**Confirmado — investigación.** La velocidad depende del **número de
guilds**. La investigación avanza sola mientras haces otras cosas, y se
puede acelerar dedicándole turnos. La guía recomienda **investigarlo
todo** salvo quizá Armageddon, y menciona que mucha gente mantiene
**1.000+ guilds** mientras investiga. **No se puede tener más de una
copia de un hechizo.**

**Confirmado — nivel de hechizo.** Investigar sube un contador de nivel,
y sube más con hechizos difíciles: **+20 Ultimate, +7 Complex, +3
Average, +1 Simple**. El nivel mejora la probabilidad de éxito,
especialmente al lanzar fuera de tu color.

**Confirmado — lanzar.** Cuesta maná **aunque falles**. Los efectos de
muchos hechizos no son exactamente predecibles. Lanzar algo complejo
fuera de tu especialidad puede fallar por *concentration*.

**Confirmado — encantamientos.** Tienen **upkeep continuo**. Los hay
propios (sobre tu reino) y ofensivos (sobre otro). Puedes tener varios
distintos a la vez, pero **no el mismo dos veces**.

### 6.1. El coste de lanzar fuera de tu color, publicado

**Confirmado** (ampliación del 2026-09-21). Lanzar un hechizo que no es de
tu escuela cuesta **más maná**, y cuánto más depende del rango y de la
distancia en la rueda:

| Rango | Propio | Adyacente | Opuesto |
|---|---|---|---|
| Simple | 100% | 125% | 200% |
| Average | 100% | 150% | 350% |
| Complex | 100% | 200% | **600%** |
| Ultimate | 100% | — | — |
| Ancient | 100% | 125% | 200% |

**Y el acceso a investigar es más fino de lo que decía §6.** Confirmado:
de tu propio color aprendes **los cuatro rangos investigables**; de los
**adyacentes**, Simple, Average y Complex; de los **opuestos**, solo
Simple y Average.

La combinación de las dos tablas es lo que hace que la rueda importe: un
Complex opuesto **se puede** lanzar si lo consigues, pero a **seis veces**
su precio.

### 6.2. Nivel de hechizo: la escala, publicada

**Confirmado** (página *Spell level*, 2026-09-21).

- Sube al **aprender** hechizos: **+1** Simple, **+3** Average, **+7**
  Complex, **+20** Ultimate y **+15** Ancient.
- **Armageddon no suma nivel**, a propósito.
- **Máximos por servidor** (datos de 2012-2013): Beta **709** (634 de
  base más 5 Ancient × 15), Blitz 667, Lightning 646, Arch 627, Solo 589.
- Afecta a **la potencia de los hechizos y de los encantamientos**, y al
  net power (1.000 por nivel, que cuadra con §3.2).
- **No todos los efectos dependen del nivel**, y un encantamiento ya
  lanzado **no se actualiza** si tu nivel cambia después.

> El máximo base de ~634 es una cifra útil: dice que el catálogo completo
> de una escuela son **decenas** de hechizos, no un puñado.

### 6.3. Fichas de hechizo reales

**Confirmado** (páginas individuales de la wiki, 2026-09-21). Son las
anclas de escala para inventar el resto:

| Hechizo | Escuela | Rango | Turnos | Maná | Investigación | Upkeep |
|---|---|---|---|---|---|---|
| *Summon Dryad* | Verdant | Simple | 1 | **3.000** | 900 | — |
| *Summon Nymph* | Verdant | Average | 2 | **7.900** | 1.400 | — |
| *Regeneration* | Verdant | Complex | — (batalla) | **30.000** | 3.000 | — |
| *Summon Unicorn* | Ascendant | Complex | 4 | **30.000** | 2.500 | — |
| *Summon Hydra* | Eradication | Complex | 5 | **41.700** | 4.000 | — |
| *Aureate Conversion* | Phantasm | Complex | 10 | **50.000** | 4.000 | **100 maná** |
| *Summon Vampire* | Nether | Complex | 6 | **77.700** | 10.000 | — |

**Cantidades invocadas, y son reveladoras**: *Summon Nymph* trae
**1.700-2.400** ninfas (nivel 624), *Summon Unicorn* **887-1010**,
*Summon Hydra* **700-800**, *Summon Vampire* **~295**. El coste **no
escala con el número de unidades sino con el poder total invocado**: un
vampiro vale por muchas ninfas.

**Confirmado — la invocación depende del nivel de hechizo** y de si el
hechizo es de tu color: las cifras de arriba son a nivel alto y en color.

**Confirmado — efectos con número**: *Regeneration* cura el **15%** de
tus bajas en color, 5% fuera de color y 2% en la opuesta. *Plant Growth*
da **+228%** de ataque, contraataque y vida a los treefolk a nivel 428.
*Call Hurricane* cuesta **20.000** de maná. *Web of the Spider Woman*,
**600**. *Sunray* mantiene **100 de maná** de upkeep.

### 6.4. Verdant, en detalle

**Confirmado** (guías de la wiki, 2026-09-21). Es la escuela que más
documentación accesible tiene, y por eso es la que menos hay que
inventar.

**Hechizos nombrados**: *Summon Dryad*, *Summon Nymph*, *Regeneration*,
*Wooden Soul*, *Rust Armor*, *Call Hurricane*, *Plant Growth*, *Weather
Summoning*, *Summon Locust Swarm*, *Nature's Favor*, *Nature's Lore*,
*Serenity*, *Sunray*, *Web of the Spider Woman*.

**Unidades nombradas**: Dryad, Nymph, Treant, Elven Archer, Elven
Magician, Druid, Griffon, Werebear, Mandrake, Gorilla, Creeping Vines,
Earth Elemental, Faerie Dragon, Swanmay, Phoenix.

**Confirmado — lo que un mago verde mantiene encantado**: *Plant Growth*,
*Nature's Favor*, *Nature's Lore*, *Weather Summoning* y *Sunray*. Cinco
encantamientos a la vez, que es lo que hace a Verdant **cara de
mantener**: la wiki la describe como muy intensiva en maná.

**Confirmado — identidad**: naturaleza, con treefolk, elfos y animales.
*Treants* son el corazón de muchos ejércitos verdes; el *Phoenix* es una
unidad mágica de mucho daño, inmune al fuego y con estallido al ser
atacada.

**Confirmado — tipos de efecto**: invocación, encantamiento, ofensivo,
defensivo, utilidad/recursos, y hechizos que solo funcionan en batalla.

---

## 7. Unidades, héroes e items

### Unidades

**Confirmado.** Hay dos vías: **reclutar** tropa básica en los barracks
pagando geld (militia, phalanx, pikemen, archers, cavalry), o
**invocarla** con hechizos de invocación de tu escuela.

**Confirmado.** Reclutar **no cuesta turnos**, pero la tropa llega poco a
poco a lo largo de varios turnos, y **solo se puede reclutar un tipo a la
vez**. Hace falta ingreso positivo de maná y población, sitio en la
población, y comida suficiente.

**Confirmado.** Toda unidad ocupa **sitio de población** y tiene
**upkeep**, en geld o en población según el tipo.

**Confirmado — la ficha de unidad** incluye ataque primario (con su tipo
de daño: melee, a distancia, aliento…), ataque extra, y **habilidades**.
Las habilidades documentadas incluyen: *Marksmanship, Additional Strike,
Bursting, Siege, Endurance, Scales, Large Shield, Pike, Healing, Charm,
Beauty, Steal Life, Fear, Flying, Swift, Regeneration, Piercing,
Paralyze, Clumsiness*, modificadores de velocidad de reclutamiento, y
**debilidades a tipos de daño concretos** (fuego, frío, sagrado…).

**Parcial.** La wiki lista las unidades y sus habilidades **sin dar los
números** de ataque, defensa, HP ni upkeep.

### Héroes

**Confirmado.** Se compran en la **Tavern** del Black Market, los regala
un dios, o llegan con items concretos (*Love Potion #9*, *Lipstick of
Enslavement*, *The Magic Mirror*). Los de nivel 20+ requieren el estatus
*Lucifer's Most Favored*.

**Confirmado.** **El héroe de mayor nivel lidera tu stack más potente**,
y así sucesivamente. Prefieren liderar unidades de su raza y color, y
cuando lo hacen dan un **bonus de eficiencia igual a su nivel en puntos
porcentuales** al empezar la batalla. Un héroe muere si su stack es
aniquilado y queda daño suficiente para superar sus HP.

**Confirmado.** Ganan experiencia por turno y por liderar en batalla.
Subir de nivel cuesta **1.000 × nivel actual** de experiencia. Los
comprables empiezan en nivel 8; la mayoría de habilidades se desbloquean
a partir de 9. Un héroe suele tener **dos habilidades**: una entre los
niveles 8-10 y otra entre 13-17, de batalla o de fuera de batalla.

### Items

**Confirmado — de dónde salen.** Se generan solos al gastar turnos, a un
ritmo que depende del **% de guilds sobre tu tierra**; se compran en el
**Black Market**; los regalan los dioses; salen de otros items
(*Treasure Chest*, *Letter of the Thieves' Guild*); se roban
**pillando**; o los traen hechizos (*Steal Artifact*, *Locate Artifact*).

**Confirmado — dos clases.** **Lesser items**, comunes y acumulables sin
límite salvo el *Magical Compass* y la *Minor Indulgence* (máximo 3); y
**Unique items**, raros y con efectos propios.

**Confirmado — tres formas de usarlos**: *Use Item* fuera de batalla con
efecto inmediato; **Assignment**, que los dispara solos al defenderse
según el tamaño del ejército enemigo; y en combate.

**Confirmado — ejemplos reales**, útiles para calibrar la escala de los
efectos: *Ash of Invisibility* (pone la iniciativa a 6), *Bubble Wine*
(+10% AP primario/extra/contraataque y **+30% HP**), *Potion of Valor*
(+20% AP), *Figurine of Ice Queen* (daño de frío `100.000 + [1-3 × nº de
unidades del stack]`), *Voodoo Doll* (**destruye 2-8 turnos** del mago
enemigo), *Strange Metallic Can* (resucita el **25%** de tus bajas al
acabar la batalla).

> Fíjate en el *Voodoo Doll*: en este juego **los turnos son un objetivo
> militar**. Eso solo tiene sentido si el turno es la moneda, como en §2.

---

## 8. Habilidades (skills)

**Confirmado.** **10 habilidades, de 20 niveles cada una.** Subir al 20
cuesta **210 puntos acumulados** (1 el primer rango, 20 el vigésimo).

- **Ligadas a especialidad** (cuestan **el doble** fuera de tu color):
  *Legendary Artificer, Animal Mastery, Spell Penetration, Undead
  Mastery, Spell Mastery*.
- **Neutras**: *Barrier Proficiency, Grand Enchanter, Legendary
  Commander, Augment Summoning, Grand Conqueror*.

**Parcial.** La wiki no publica el efecto numérico de cada habilidad.

---

## 9. Combate

**Confirmado — tres tipos de ataque**, y son tres decisiones distintas:

| | Qué es | Condición de victoria | Tierra |
|---|---|---|---|
| **Regular** | Combate a campo abierto. Sin penalización de asedio. | Derrotar al menos el **10%** del ejército enemigo perdiendo menos de lo que pierde él. | Hasta el **5%**. Hacen falta **2,5 unidades supervivientes por acre** para llevarse el máximo. Solo destruye forts si son un % alto de su tierra. |
| **Siege** | Asedio. **Las unidades no voladoras sin la habilidad *Siege* sufren penalización**, y el defensor recibe un bonus de fort mayor. | Igual, el **10%**. | Hasta el **10%** (el atacante se queda **un tercio** de lo destruido). Hacen falta **5 unidades supervivientes por acre**. Destruye y captura forts. |
| **Pillage** | Saqueo de todo o nada: roba geld, población e items, y quema farms, towns, workshops y guilds. | Depende del **Net Power** del ejército, no de su tamaño. | Ninguna. Quema **hasta 100 acres**. Sin coste de batalla. |

**Confirmado — coste de atacar.** Cualquier batalla cuesta **el upkeep de
TODAS tus unidades** antes de resolverse.

**Confirmado — límite de objetivos.** Fuera de Armageddon solo se puede
pillar a magos dentro del **50%** de tu net power.

**Confirmado — cómo se resuelve:**

1. Los stacks se ordenan antes de la batalla por **ataque × número de
   unidades**, con los **voladores ×3/2** (promoción) y los **de
   distancia ×2/3** (resguardo).
2. Golpea primero quien tiene más **iniciativa**, en una escala de **0 a
   7**. Iniciativa 0 no ataca, solo contraataca. A igualdad, el orden es
   aleatorio.
3. **El daño se arrastra** entre unidades: se acumula hasta matar
   individuos enteros.
4. Modifican el resultado: hechizos, items, **bonus de fort**,
   encantamientos, habilidades y resistencias de las unidades, y
   **fatiga** (una unidad rinde menos después de atacar).

### 9.1. La fórmula de daño, publicada

**Confirmado** (páginas *Damage Formula* y *Battle Mechanics*, ampliación
del 2026-09-21). La `Parcial` que había aquí **queda cerrada**: sí está
publicada.

```
bajas de R = N_A × ataque_A × (acierto/100) × azar × eficiencia
             × (1 − resistencia_R/100) × habilidades_defensivas_R
             ÷ HP_R
```

Cada término, con sus números:

- **N_A** — cuántas unidades atacan.
- **ataque_A** — el *Attack Power* de la ficha. Lo modifican encantamientos,
  items, héroes y hechizos de batalla.
- **acierto** — **base 30** en defensa y ataque regular, **20 en asedio**.
  Ésa es la penalización de asedio, dicha en números. La wiki insiste en que
  **el acierto pesa más que el ataque**: *«3% de acierto da el mismo bono que
  10% de ataque»*.
- **azar** — aleatorio entre **0,25 y 0,75**; **fijo en 0,5** para ataques
  de tipo Magic y Psychic. *(Una segunda fuente da 0,2-0,8 para el rango
  físico; la media de 0,5 coincide en las dos.)*
- **eficiencia** — empieza en 100% y **baja 15 puntos por cada ataque
  primario o contraataque**; **10 con la habilidad *Endurance***. Los ataques
  secundarios **no** la bajan. Eso es la fatiga.
- **resistencia_R** — la del defensor **al tipo de daño concreto**. Con
  varios tipos se hace la media: *«Fire Ranged = (30% + 75%) / 2 = 52,5%»*.
  Una **debilidad** mete **−50%** en esa media.
- **habilidades defensivas** — se multiplican entre sí: *healing* 0,7,
  *scales* 0,75, *regeneration* 0,8, *charm* 0,5 (contra primarios),
  *large shield* 0,5 (contra a distancia), y **weakness 2,0** cuando el tipo
  coincide.
- **HP_R** — los puntos de vida del defensor.

**Confirmado — la fórmula del acierto**, a tramos, donde `A` es la suma de
modificadores:

```
A ≥ 0        → acierto = 30 + A
−15 ≤ A < 0  → acierto = 30 − A
−30 ≤ A < −15 → acierto = 24 − (3/5)·A
A < −30      → acierto = 12 − (1/5)·A
```

> **Cómo hay que leerla, comprobado el 2026-09-21.** Tal cual está
> escrita, los tres últimos tramos usan `A` negativo y darían **más**
> acierto al penalizar. La lectura buena es con **|A|**, y no es una
> conjetura: es la única con la que **los tramos empalman** en sus
> fronteras — con |A| = 15 los dos primeros dan 15, y con |A| = 30 los dos
> últimos dan 6. Es una curva continua de castigo decreciente, no tres
> reglas sueltas.
>
> Lo que la fuente **no** dice es cómo pasa esta curva a la base 20 del
> asedio. Eso es decisión nuestra y está en [SISTEMAS.md §9.1](SISTEMAS.md).

### 9.2. Cómo se ordena y se empareja

**Confirmado.** Los stacks se ordenan por un multiplicador **que depende
solo del tipo de unidad**, y la wiki avisa de que *«el multiplicador solo
decide el ORDEN, no mejora sus capacidades»*:

| Tipo | Multiplicador | Dónde acaba |
|---|---|---|
| A distancia | **1,0** | atrás |
| Ni volador ni a distancia | **1,5** | en medio |
| Volador | **2,25** | delante |

*(Relativo al de en medio son ×1,5 y ×2/3 — que es exactamente lo que decía
§9 con otra normalización. Las dos fuentes concuerdan.)*

**Confirmado — quién puede pegar a quién**: los **voladores** pegan a
cualquiera; los de **distancia**, a cualquiera; los de **melee**, solo a
unidades de tierra, y **se quedan sin objetivo** si no queda ninguna.

**Confirmado — un stack solo es objetivo si vale al menos el 10%** del poder
del stack que ataca.

**Confirmado — iniciativa**: ataca antes quien la tiene más alta, y con 0 no
ataca. *(Conflicto entre fuentes: §9 daba 0-7; estas páginas hablan de 1-5
«típicamente» y de 0-6. Las fichas de unidad que hemos visto usan 1, 3 y 5.)*
La modifican *Animal/Undead Mastery* nivel 20 (+1), *Slow* (−1 a todos),
*Paralyze* (−6 a uno al azar) y el item *Spider's Web* (−1 a todos).

**Confirmado — contraataques.** Una unidad atacada contraataca, y el
contraataque **genera fatiga aparte**. La fatiga **no depende del tamaño del
stack**: una unidad y veinte mil fatigan igual, que es por lo que se usan
stacks pequeños de alta iniciativa solo para fatigar.

### 9.3. Quién gana, y cuánta tierra se lleva

**Confirmado.**

- **Gana quien pierde menos porcentaje de ejército.** El defensor necesita
  pasar del **10% de bajas** para perder tierra.
- **Bonus de batalla**: si un ejército pasa del **200%** del otro, el
  atacante gana **1% por cada 2%** que pase del doble. Un ejército que
  duplica y además se pasa un 100% del doble se lleva un **50% de bonus**.
- **Tierra**: el ataque regular quita hasta el **5%**, el asedio hasta el
  **10%**, y en los dos el atacante **se queda un tercio** — los otros dos
  tercios se destruyen.
- **Supervivientes por acre**: *«por cada 50 unidades que te sobrevivan, el
  objetivo pierde 1 acre»*, con ejemplo trabajado: 3.654 acres, asedio de
  365 como máximo, hacen falta **18.250 supervivientes**; el atacante se
  lleva 122 y se destruyen 243.

> **Conflicto entre fuentes, sin resolver.** El *Beginner's Guide* daba
> **2,5 supervivientes por acre** en regular y **5** en asedio (§9); estas
> páginas dan **50 para los dos**. Es un factor de 10 a 20. La cifra de 50
> viene con un ejemplo aritmético que cuadra consigo mismo, así que es la
> más creíble, pero son guías de épocas distintas y **ninguna es autoridad
> sobre la otra**.

### 9.4. Las tres fases de una batalla

**Confirmado.**

1. **Pre-batalla** — hechizos e items. El del defensor por *assignment*
   **siempre entra**; el del atacante tiene que pasar **tres resistencias**:
   la barrier (máx. 75%), la del color (máx. 75%) y la de la unidad. Luego
   las habilidades de héroe, y el daño previo.
2. **Batalla** — ataques por orden de iniciativa hasta que se agotan.
3. **Post-batalla** — resurrección. *Regeneration* y compañía se combinan
   multiplicando los complementos: healing 30% + hechizo 20% + item 25% da
   `1 − (0,70 × 0,80 × 0,75) ≈ 58%`.

### 9.5. La ficha de una unidad, con números reales

**Confirmado** (páginas individuales, 2026-09-21). Tres unidades de Verdant
que cubren la escala entera:

| | Dríade | Treant | Fénix |
|---|---|---|---|
| Ataque | 240 | 4.200 | 200.000 |
| Contraataque | 0 | 1.680 | 40.000 |
| Ataque extra | — | 2.500 | 600.000 |
| HP | 70 | 4.200 | 70.000 |
| Iniciativa | 3 | 1 | 1 (extra: 5) |
| **Power Rank** | **23** | **423** | **36.883** |
| Upkeep | 0,80 geld + 0,01 maná | 0,63 maná | 60 maná |
| Tipo de ataque | Magic, Ranged | Melee | Magic; extra Magic+Ranged |
| Habilidades | Beauty, Charm | Additional Strike, Endurance, debilidad al fuego | Bursting (fuego, 50.000), Flying, Regeneration |

**Y el `Power Rank` cierra un hueco**: es el «coeficiente de poder» que el
net power necesitaba (§3.2), y que hasta ahora estaba sin publicar.

**Confirmado — las resistencias son una tabla por unidad**, con un valor por
**escuela de magia** y otro por **tipo de ataque**. El Treant resiste 90% al
veneno, 67% a melee, 0% al fuego —su debilidad—; la Dríade resiste 40% a
melee y 0% a casi todo. Es lo que hace que importe **qué unidades llevas
contra cuáles**.

**Confirmado — capacidad de aguante**, una fórmula de la propia wiki para
juzgar si una unidad defiende bien:

```
aguante = HP / (acierto × (1 − resistencia) × habilidades × power_rank)
```

Con su baremo: más de 100 excelente, más de 65 buena, más de 40 aceptable,
menos de 30 mala.

**Confirmado — defensa pasiva.** *Assignment* lanza hechizos y usa items
automáticamente al ser atacado, según el porcentaje de ejército enemigo
que fijes, **y no se puede bloquear en defensa**.

> **Corrección al PDF.** El PDF §8 propone «comparar ataque total contra
> defensa total con algo de aleatoriedad» como sustituto del PvP. El
> combate real es por **stacks ordenados, con iniciativa, arrastre de
> daño, fatiga y habilidades** — y es la mitad del juego. Reducirlo a una
> resta hace un juego distinto.

---

## 10. Gremios y diplomacia

**Confirmado.** Crear un gremio exige **cinco miembros fundadores**; quien
lo registra es el líder. Se entra por solicitud desde *Guilds of Terra* o
por invitación.

**Confirmado — qué da el gremio**: protección frente a ataques de tus
compañeros, listas de miembros y de enemigos, registros de batalla e
historia del gremio, visibilidad de las pujas en el Black Market, y
permiso para compartir información táctica por mensajería interna.

**Confirmado — aliados.** Se tienen **1 o 2 aliados** según el servidor.
Los aliados **mandan refuerzos automáticamente** cuando te atacan —salvo
sus dos stacks más potentes— y pueden lanzarte hechizos **sin que la
barrera los frene**. Un compañero de gremio que no sea aliado **no manda
refuerzos**.

**Confirmado — NAP** (pacto de no agresión): compromiso público de no
atacarse. **No autoriza a compartir información táctica**; hacerlo es
infracción. Coordinarse con quien no es de tu gremio ni de un gremio
aliado es *illegal guild activity*.

**Confirmado — reglas de convivencia.** Un mago por servidor y cuenta.
Los agremiados solo se alían con agremiados; los sin gremio, entre ellos.

---

## 11. Lo que sigue sin verificar

Si algo de esto aparece en [SISTEMAS.md](SISTEMAS.md), es **diseño
nuestro** y allí se dice:

- **Coeficientes de economía**: el **coste en geld** de cada edificio y
  su **mantenimiento**, y el espacio residencial de un **fort**. *(El
  maná salió de esta lista el 2026-09-21: su fórmula está publicada,
  §3.1. Y el mismo día salieron **el ingreso de geld, la comida, el
  espacio por edificio y el crecimiento de población**: están publicados
  en §4.2. Lo que queda es solo lo de arriba.)*
- **La curva exacta de exploración**. Tenemos los extremos medidos
  (§4.1), no la función.
- **La curva del bonus de fort.** La fórmula de daño, la de acierto y la
  fatiga **dejaron de estar aquí el 2026-09-21**: están publicadas (§9.1).
  Lo que sigue sin publicarse es cuánto exactamente multiplica el bonus
  defensivo de los forts entre el 0,67% y el 2,33% de la tierra.
- **Los números de las unidades** de las escuelas que no hemos mirado.
  Los de Verdant **están publicados** (§9.5), con su `Power Rank` y su
  tabla de resistencias.
- **El efecto numérico de las 10 habilidades.**
- **La lista completa de hechizos** por escuela y rango, con sus cuatro
  costes.
- **Armageddon**: qué hace exactamente el hechizo y cómo se resuelve el
  final de temporada.
- **Los dioses** y el sistema de favor: la wiki los menciona (regalan
  items y héroes, existe *Lucifer's Most Favored*) sin documentar el
  mecanismo.

---

## 12. Fuentes

- Web oficial — <https://the-reincarnation.com>
- Wiki oficial — <https://wiki.the-reincarnation.org>
  - [Beginner's Guide to TR](https://wiki.the-reincarnation.org/index.php/Beginner's_Guide_to_TR) — la fuente más densa: turnos, recursos, fórmulas de construcción, colores, combate.
  - [Groentje Players Manual](https://wiki.the-reincarnation.org/index.php/Groentje_Players_Manual), cap. [4](https://wiki.the-reincarnation.org/index.php/Groentje_Players_Manual_Ch4) (interior y economía), [5](https://wiki.the-reincarnation.org/index.php/Groentje_Players_Manual_Ch5) (magia), [6](https://wiki.the-reincarnation.org/index.php/Groentje_Players_Manual_Ch6) (guerra), [8](https://wiki.the-reincarnation.org/index.php/Groentje_Players_Manual_Ch8) (gremios).
  - [Buildings](https://wiki.the-reincarnation.org/index.php/Buildings), [Units](https://wiki.the-reincarnation.org/index.php/Units), [Spells](https://wiki.the-reincarnation.org/index.php/Spells), [Items](https://wiki.the-reincarnation.org/index.php/Items), [Heroes](https://wiki.the-reincarnation.org/index.php/Heroes), [Skills](https://wiki.the-reincarnation.org/index.php/Skills), [Common Terminology](https://wiki.the-reincarnation.org/index.php/Common_Terminology).
  - **Ampliación del 2026-09-21, para la spec de la economía**:
    [Mana](https://wiki.the-reincarnation.org/Mana) (la fórmula de §3.1),
    [Net Power](https://wiki.the-reincarnation.org/Net_Power) (§3.2),
    [Population](https://wiki.the-reincarnation.org/Population),
    [HalfDone Wiki Startup Guide](https://wiki.the-reincarnation.org/HalfDoneWikiStartupGuide) (los valores de partida de §4.1),
    [Knight of Dawn's Simplified Guide](https://wiki.the-reincarnation.org/index.php/Knight_of_Dawn's_The_Reincarnation_Simplified_Guide) (segunda forma de las fórmulas de construcción).
- Documento de diseño en PDF, `Remake de The Reincarnation (ex-Archmage) — Documento de diseño.pdf`, 2026-09-21. **Superado por este conjunto de documentos**; se conserva como registro de la conversación inicial. Sus §7, §8 y §11 están corregidas aquí y en [ARQUITECTURA.md](ARQUITECTURA.md).

> **Si amplías esta investigación**, escribe el hallazgo aquí con su nivel
> de confianza **antes** de usarlo en ningún otro documento, y di qué
> línea de `SISTEMAS.md` cambia por él.
