# Assets

Qué arte hace falta, con qué estilo, y con qué prompt se genera.

Viene de la §12 del documento de diseño en PDF, que **sigue vigente**:
era la sección mejor pensada del PDF. Lo que ha cambiado es el
**inventario**, porque la lista real de edificios no es la que el PDF
suponía ([ORIGINAL.md §4](ORIGINAL.md)).

Los assets se generan con la cuenta **Gemini Pro** del usuario.

---

## 1. Guía de estilo

**Actualizada el 2026-09-21 con la spec del estilo visual**
([INTERFAZ.md §6](INTERFAZ.md)). El proyecto tiene **dos estilos a
propósito**, y conviven porque nunca se tocan:

| Estilo | Para qué | Dónde vive |
|---|---|---|
| **Icono vectorial plano** | Escuelas, edificios, recursos, rangos, unidades, barra | **Siempre dentro de un panel**, sobre `--panel` |
| **Pieza pintada** | Los ocho edificios **en la escena del reino** | Sobre el paisaje de `/reino`, con su placa opaca |
| **Ilustración pintada** | Un fondo por pantalla | **Detrás y alrededor de los paneles**, nunca bajo el texto |
| **Ornamento** | Marcos, esquinas, filetes | El borde de los paneles |

> **La «pieza pintada» es nueva del 2026-09-22**, y es una decisión del
> usuario a partir de su referencia visual. **Los ocho edificios se
> generan dos veces**: plano para las tablas y la barra, pintado para la
> escena.
>
> El motivo es sencillo de ver: una pieza plana sobre un paisaje pintado
> se ve **pegada encima**, no puesta dentro. Y el motivo de no hacerlo
> todo pintado también: un icono pintado a **24px** en la barra inferior
> es una mancha marrón (§8.3).
>
> **Lo que cuesta, dicho:** ocho generaciones más, y un presupuesto de
> peso más apretado en `/reino` ([INTERFAZ.md §6.7](INTERFAZ.md),
> criterio 17) — **≤ 120 KB de fondo y ≤ 12 KB por pieza**, frente a los
> 150 KB de fondo que tienen las demás pantallas.

**La regla que hace que no choquen: el icono plano nunca se dibuja sobre
la ilustración.** Si alguna vez hay que poner un icono encima de un
fondo pintado, es que falta un panel.

Para que los iconos encajen entre sí, **todo prompt de icono lleva esta
coletilla**:

```
flat vector game icon, clean bold outlines, simple shading,
dark fantasy medieval palette, centered composition,
transparent background, no text, no watermark
```

En los prompts de abajo aparece como `[estilo base]`.

**Los fondos y el ornamento rompen la coletilla** a propósito: son
pintados, y se dice en su prompt.

**Presupuesto de peso, y es un requisito, no un consejo**
([INTERFAZ.md §6.7](INTERFAZ.md)): **≤ 150 KB** por ilustración y
**≤ 250 KB** sumando ilustración y ornamento de una pantalla, en formato
moderno. Un fondo precioso de 2 MB está mal aunque sea precioso.

---

## 2. Proceso

1. **Genera primero uno o dos iconos de escuela y enséñalos** antes de
   hacer el resto del set. Repetir veinte generaciones con un estilo que
   no encaja es el error caro de esta parte.
2. **Guarda el prompt que de verdad se usó junto al asset exportado**, no
   el de este documento. Cuando haya que generar una variante coherente
   seis meses después, el prompt real es lo único que sirve.
3. Un set se genera **entero de una tanda**: los seis iconos de escuela
   tienen que leerse como un conjunto, y eso se pierde si se generan
   sueltos con semanas de diferencia.

---

## 3. Iconos de escuela

Seis, mismo encuadre y mismo peso visual. Los colores son los del
original ([SISTEMAS.md §6](SISTEMAS.md)) y sus valores exactos están en
[INTERFAZ.md §6.3](INTERFAZ.md).

> **Nether es el caso difícil.** Su color nominal es el negro, que sobre
> nuestro fondo oscuro no se ve. Su icono tiene que funcionar **por la
> forma y por un reborde claro**, no por el relleno. Genéralo y míralo
> sobre `#1e1813` antes de dar el set por bueno: es el único de los seis
> que puede salir perfecto en el visor y desaparecer en la aplicación.

| Escuela | Color | Prompt |
|---|---|---|
| Eradication | Rojo | `fantasy game icon representing destructive fire and ruin magic, cracked earth and flame motif, [estilo base]` |
| Verdant | Verde | `fantasy game icon representing nature and life magic, leaf and vine motif, [estilo base]` |
| Ascendant | Blanco | `fantasy game icon representing holy and celestial magic, light rays and star motif, [estilo base]` |
| Phantasm | Azul | `fantasy game icon representing illusion and mind magic, swirling eye and mist motif, [estilo base]` |
| Nether | Negro | `fantasy game icon representing death and shadow magic, skull and void motif, [estilo base]` |
| Plain | — | `fantasy game icon representing neutral raw arcane magic, simple glowing rune motif, [estilo base]` |

---

## 4. Iconos de edificio

**Ocho, y son los del juego real** — ésta es la corrección al PDF, que
proponía «Torre del mago, Biblioteca, Cuartel, Defensas».

| Edificio | Prompt |
|---|---|
| **Farm** | `fantasy game icon of medieval farmland with wheat and a small barn, [estilo base]` |
| **Town** | `fantasy game icon of a small medieval walled town with rooftops, [estilo base]` |
| **Node** | `fantasy game icon of a glowing arcane mana node, floating crystal over a ley-line circle, [estilo base]` |
| **Workshop** | `fantasy game icon of a medieval craftsman workshop, hammer anvil and scaffolding, [estilo base]` |
| **Barracks** | `fantasy game icon of a medieval barracks building, banners spears and training post, [estilo base]` |
| **Guild** | `fantasy game icon of an arcane mage guild building, floating books and runes, [estilo base]` |
| **Fortress** | `fantasy game icon of a stone fortress keep with battlements, [estilo base]` |
| **Barrier** | `fantasy game icon of a glowing magical ward barrier, translucent hexagonal shield over stone, [estilo base]` |

---

## 5. Iconos de recurso

| Recurso | Prompt |
|---|---|
| Maná | `fantasy game icon of a glowing blue mana crystal droplet, [estilo base]` |
| Geld | `fantasy game icon of a pile of medieval gold coins, [estilo base]` |
| Población | `fantasy game icon representing a population of townsfolk, silhouette crowd motif, [estilo base]` |
| Comida | `fantasy game icon of a sack of grain and bread, [estilo base]` |
| Tierra | `fantasy game icon of a parcel of land, rolling fields seen from above, [estilo base]` |
| Turno | `fantasy game icon of an hourglass with arcane sand, [estilo base]` |

El **turno** es el icono más importante del juego: es la moneda
([SISTEMAS.md §2](SISTEMAS.md)). Merece más de un intento.

---

## 6. Rangos de hechizo

Cinco, **el mismo icono base ganando ornamento y brillo** en cada rango
—Simple, Average, Complex, Ultimate, Ancient—, para que el rango se lea
sin texto:

```
fantasy magic gem icon representing spell power level [N] of 5,
more ornate and glowing at higher levels, [estilo base]
```

---

## 7. Unidades

**La lista ya no está abierta: son 113**, publicadas enteras
([ORIGINAL.md §7.3](ORIGINAL.md), 2026-09-22) — 93 de las cinco escuelas
y 20 de Plain.

**Pero no entran en la tanda del 2026-09-22**, y el motivo es concreto:
**93 de esas 113 son de las cuatro escuelas que todavía no están en el
catálogo** ([SISTEMAS.md §7.2](SISTEMAS.md) es una spec sin implementar).
Generar su arte ahora es generar arte para unidades que aún pueden
cambiar de ficha, de habilidad o de nombre al implementarlas.

Se generan **después**, y en su propia tanda. El patrón, con la única
unidad confirmada del original:

```
fantasy game icon of a majestic unicorn charging into battle,
Ascendant magic school theme, glowing mane, [estilo base]
```

**Regla**: toda unidad lleva **el tema cromático de su escuela** en el
prompt. Es lo que hace que un ejército de una escuela se lea como un
ejército y no como una colección.

---

## 8. Fondos pintados — uno por pantalla

**Una ilustración por pantalla**, ni una por estado ni una por escuela
([INTERFAZ.md §6.5](INTERFAZ.md)). Todos llevan esta coletilla en lugar
de la de icono:

```
wide fantasy game background, dark medieval fantasy atmosphere,
painterly style, muted warm palette, no characters, no text,
composition with an empty central area
```

**«Empty central area» no es un capricho**: los paneles de datos se
ponen en el centro y taparían cualquier cosa interesante que hubiera
ahí. La ilustración se ve por los bordes, así que **lo bueno va en los
bordes**.

| Pantalla | Fase | Motivo |
|---|---|---|
| Portal `/` | 1 | `a vast night sky over the world of Terra seen from a tower balcony` |
| Reino `/reino` | 1 | **Ver §8.2**: es el único que no sigue la coletilla de arriba. |
| Ejército `/ejercito` | 1 | `a muster field below a castle at dawn, empty banners and tents` |
| Crónica `/cronica` | 1 | `a candlelit scriptorium, open chronicles and quills` |
| Magia `/magia` | 2 | `an arcane library vault, floating tomes and a rune circle` |
| Guerra `/guerra` | 3 | `a war camp at night overlooking a besieged fortress` |
| Batalla `/batalla/:id` | 3 | `a battlefield seen from a high ridge after the fighting, smoke and standards` |
| Mercado `/mercado` | 4 | `a shadowy night bazaar of curiosities under lantern light` |
| Ranking `/ranking` | 4 | `a hall of stone tablets bearing carved names` |
| Gremio `/gremio` | 5 | `a round council chamber with an empty table and hanging banners` |

**Fase 1 necesita cuatro.** El resto se generan cuando toque su fase: un
fondo de una pantalla que no existe es trabajo guardado en un cajón.

---

## 8.1. Ornamento

**[nuestro]** Marcos y filetes en bronce, para enmarcar los paneles
([INTERFAZ.md §6.6](INTERFAZ.md)). Poco y reutilizable:

- **Esquina** (una sola, se refleja en las otras tres):
  `ornate bronze corner flourish for a game UI frame, medieval fantasy metalwork, transparent background, no text`
- **Filete divisorio**:
  `thin ornate bronze horizontal divider with a central motif, medieval fantasy metalwork, transparent background, no text`

**Se generan una vez y se reutilizan en todas las pantallas.** El
ornamento **no lleva información y desaparece en móvil**, así que no
merece más de estas dos piezas.

---

## 8.2. El fondo del reino es distinto

**Spec del 2026-09-22**, a partir de una referencia visual del usuario.
`/reino` lleva una **escena** con piezas encima
([INTERFAZ.md §6.5](INTERFAZ.md)), y eso le cambia el encargo respecto a
los otros nueve fondos.

**Lo que decía antes, y por qué deja de valer.** El prompt era `a
wizard's tower interior at dusk, maps and ledgers on a great table`: un
**interior**. Sobre una mesa de despacho no se pueden colocar una granja
y unos barracones. La escena pide **exterior**.

**Y la coletilla también cambia.** Los demás fondos piden `composition
with an empty central area` porque los paneles se ponen en el centro y
taparían lo interesante. Aquí el centro **es** lo interesante: hace falta
terreno donde apoyar las piezas.

```
wide fantasy game background, a green valley seen from above at dusk,
forest and mountains framing the edges, winding dirt paths,
dark medieval fantasy atmosphere, painterly style, muted warm palette,
no characters, no buildings, no text,
open uncluttered ground across the middle with clear flat areas
```

**`no buildings` es lo que más importa de este prompt**, y es lo que
más fácil ignora un generador al oír «reino». Los edificios **son las
piezas**, que se colocan encima: si el fondo ya trae un castillo
pintado, el reino enseña algo que el mago no ha construido.

> **Lo que sí puede traer pintado** es paisaje de fondo lejano —
> montañas, bosque, un camino—. La referencia del usuario lleva una
> ciudadela grande en el centro y **ésa no entra**: no es uno de los
> ocho edificios ([SISTEMAS.md §4](SISTEMAS.md)).

**Las piezas no son arte nuevo.** Son **los ocho iconos de edificio de
§4**, los mismos que las tablas. Es la razón por la que esta spec sale
casi gratis en arte, y la prueba de que se eligió bien la escena
emblemática: la cuantitativa habría pedido variantes y agrupaciones.

**Lo único que hay que revisar de los ocho** es que funcionen **a dos
tamaños**: pequeños en una tabla y grandes sobre el paisaje. Si alguno
solo lee bien en uno de los dos, se regenera ése, no los ocho.

**Estado el 2026-09-22: la escena está construida y el arte no.** Las
piezas se pintan hoy como una inicial sobre un recuadro de bronce, y el
paisaje es un degradado. **No es un apaño provisional mal puesto: es lo
que obliga la regla 3 de [INTERFAZ.md §6.5](INTERFAZ.md)** —la interfaz
tiene que funcionar entera sin ninguna ilustración—, así que este es el
estado normal con las imágenes bloqueadas, y se comprueba en la pasada de
navegador.

**Los huecos concretos que espera esta tanda**, para que nadie tenga que
deducirlos:

| Hueco | Dónde se usa hoy |
|---|---|
| El fondo exterior de `/reino` | `.escena-reino`, hoy un degradado radial |
| Los ocho iconos de edificio **en grande** | `.escena__figura`, hoy una inicial |
| Los siete iconos de la barra | `.marco__enlace`, hoy solo la etiqueta de texto |

Y el peso: los **criterios 6 y 17** de §6.7 (≤ 250 KB por pantalla,
piezas incluidas) **no se pueden comprobar todavía** y quedan pendientes
de esta tanda. No están marcados como hechos.

---

## 8.3. Los iconos de la barra de navegación

**Spec del 2026-09-22.** El marco persistente
([INTERFAZ.md §6.9](INTERFAZ.md)) necesita un icono por entrada de la
barra inferior.

**Cuántos son es `[abierto]`**: depende de cómo se agrupen las trece
rutas, y eso lo cierra `/plan-tarea`. Lo que sí está decidido:

- **Se reutiliza lo que ya hay** siempre que se pueda. La barra tendrá
  entradas de edificios, de ejército y de magia, y para eso están los
  iconos de §4, §7 y §6.
- **Los que falten son de acción, no de cosa**: explorar, guerra,
  crónica. Mismo estilo base, y **más simples que los de tabla** —
  a 24px un icono con detalle es una mancha.
- **Llevan etiqueta de texto debajo**, así que **el icono no tiene que
  cargar solo con el significado**. Es lo que permite que sean simples.

```
simple fantasy game UI icon of <motivo>, bold silhouette,
minimal detail, legible at 24 pixels, [estilo base]
```

---

## 8.4. La tanda del 2026-09-22 — qué se genera y en qué orden

**Spec del 2026-09-22.** Cierra la tarea de assets de la fase 1, que
llevaba pendiente desde el 2026-09-21 y **estaba marcada como hecha por
error** (ver el ROADMAP).

**Son 55 piezas.** La tarea original hablaba de 26 —las de la fase 1—,
pero desde entonces se implementaron las trece pantallas, el marco
persistente y la escena del reino, así que el inventario de entonces se
quedó corto. Decidido con el usuario: **entra todo lo que ya se ve**.

| Tanda | Qué | Cuántas | Estilo |
|---|---|---:|---|
| **0** | La prueba: Verdant y Nether | 2 | plano |
| **1** | Iconos de escuela | 6 | plano |
| **2** | Iconos de edificio | 8 | plano |
| **3** | Iconos de recurso | 6 | plano |
| **4** | Iconos de la barra inferior | 7 | plano |
| **5** | Rangos de hechizo | 5 | plano |
| **6** | Ornamento | 2 | pintado |
| **7** | El paisaje de `/reino` | 1 | pintado |
| **8** | Las piezas pintadas de la escena | 8 | **pintado** |
| **9** | Los otros doce fondos | 12 | pintado |

**El orden no es capricho, y ahorra trabajo:**

1. **La tanda 0 es una prueba, no un entregable.** Dos iconos, y de los
   dos **el que importa es Nether**: es la única escuela cuyo color
   nominal —negro— es invisible sobre `--panel`, así que es donde el
   estilo se rompe primero. Si esos dos no convencen, se cambia la
   coletilla **antes** de las otras cincuenta y tres. Repetir veinte
   generaciones con un estilo que no encaja es el error caro de esta
   parte (§2).
2. **Los planos antes que los pintados**, porque son más baratos de
   repetir y porque fijan la paleta.
3. **El paisaje de `/reino` antes que sus piezas** (tanda 7 antes que la
   8). Las piezas hay que juzgarlas **sobre el fondo en el que van a
   estar**, no sobre blanco — es el riesgo propio de tener dos estilos.
4. **Los otros doce fondos al final**, porque son los que menos dependen
   de lo demás y los más caros de generar.

---

### Tanda 0 — la prueba

Dos, y se enseñan antes de seguir.

```
flat vector game icon of a verdant nature magic sigil, an oak leaf
wrapped in vines over a circular rune, deep green #4e9e4a,
flat vector game icon, clean bold outlines, simple shading,
dark fantasy medieval palette, centered composition,
transparent background, no text, no watermark
```

```
flat vector game icon of a nether death magic sigil, a horned skull
over a hollow circular void, dark body with a bright ash-violet rim
#8574a0, the silhouette must stay readable against a very dark
background, flat vector game icon, clean bold outlines, simple shading,
dark fantasy medieval palette, centered composition,
transparent background, no text, no watermark
```

> **Nether lleva instrucción propia y es a propósito.** Su color canónico
> es el negro, y el negro sobre `#1e1813` no se ve
> ([INTERFAZ.md §6.3](INTERFAZ.md)). La identidad la llevan **la forma
> —calavera, vacío— y un reborde claro**, no el relleno. Es la única
> escuela que se separa de su color nominal, y se separa porque el color
> nominal es invisible.

---

### Tanda 1 — los seis iconos de escuela

Los dos de arriba más estos cuatro. **De una sola tanda**, porque tienen
que leerse como un conjunto (§2).

```
flat vector game icon of an ascendant holy magic sigil, radiant winged
halo over a circular rune, warm off-white #f2ead8, [estilo base]
```

```
flat vector game icon of an eradication fire magic sigil, a bursting
flame over a cracked circular rune, red #d1442c, [estilo base]
```

```
flat vector game icon of a phantasm illusion magic sigil, a spiral eye
over a circular rune, blue #3f7fc4, [estilo base]
```

```
flat vector game icon of a plain colourless magic sigil, an empty
circular rune with no element inside, muted grey-brown, deliberately
the least ornate of the six, [estilo base]
```

> **Plain tiene que verse como el punto de partida**, no como una sexta
> escuela: es el mago sin color (§3 de [SISTEMAS.md](SISTEMAS.md)). Si
> sale tan vistoso como los otros cinco, está mal.

---

### Tanda 2 — los ocho edificios, planos

Para las tablas y la barra. Los prompts están en **§4** y no se repiten
aquí; lo único que se añade es que **se juzgan a 24px además de a tamaño
de tabla**, porque tres de ellos acaban también en la barra inferior.

---

### Tanda 3 — los seis recursos

En **§5**. El del **turno merece más de un intento**: es la moneda del
juego ([SISTEMAS.md §2](SISTEMAS.md)) y va en el marco persistente, a la
vista en las trece pantallas.

---

### Tanda 4 — los siete de la barra inferior

Siete, que son las entradas cerradas en
[INTERFAZ.md §6.9](INTERFAZ.md). **Llevan etiqueta de texto debajo**, así
que el icono no carga solo con el significado — por eso pueden ser
simples, y a 24px tienen que serlo.

```
simple fantasy game UI icon of a castle keep with a banner,
bold silhouette, minimal detail, legible at 24 pixels, [estilo base]
```

```
simple fantasy game UI icon of a crossed sword and spear,
bold silhouette, minimal detail, legible at 24 pixels, [estilo base]
```

```
simple fantasy game UI icon of an open spellbook with a rune,
bold silhouette, minimal detail, legible at 24 pixels, [estilo base]
```

```
simple fantasy game UI icon of a war banner over crossed blades,
bold silhouette, minimal detail, legible at 24 pixels, [estilo base]
```

```
simple fantasy game UI icon of an open chronicle scroll with a quill,
bold silhouette, minimal detail, legible at 24 pixels, [estilo base]
```

```
simple fantasy game UI icon of a sealed letter with a wax seal,
bold silhouette, minimal detail, legible at 24 pixels, [estilo base]
```

```
simple fantasy game UI icon of three horizontal dots in a row meaning
more options, bold silhouette, minimal detail, legible at 24 pixels,
[estilo base]
```

---

### Tanda 5 — los cinco rangos de hechizo

El patrón está en **§6**: el mismo icono base ganando ornamento y brillo,
de Simple a Ancient. **Se generan los cinco juntos o la progresión no se
lee**: lo que tiene que quedar claro no es cada uno, sino que el cuarto
es más que el tercero.

---

### Tanda 6 — el ornamento

Las dos piezas de **§8.1**. Se generan una vez y se reutilizan en las
trece pantallas, y **desaparecen en móvil**, así que no merecen más.

---

### Tanda 7 — el paisaje de `/reino`

**Uno solo, y es el más importante de todos los fondos**, porque es el
único que lleva piezas encima. El prompt entero está en **§8.2**, con su
`no buildings` — que es lo que más fácil ignora un generador al oír
«reino», y lo que lo estropearía del todo.

**Presupuesto: ≤ 120 KB**, no los 150 de los demás. El porqué está en
[INTERFAZ.md §6.7](INTERFAZ.md), criterio 17.

---

### Tanda 8 — las ocho piezas pintadas de la escena

**Las mismas ocho de la tanda 2, otra vez y con otro estilo.** Van sobre
el paisaje de la tanda 7, así que **se juzgan sobre él**.

La coletilla es distinta, y sustituye a `[estilo base]`:

```
painterly fantasy building, three-quarter view from slightly above,
dark medieval fantasy atmosphere, muted warm palette, soft rim light,
transparent background, no ground shadow, no text, no characters,
readable as a single silhouette at 46 pixels
```

En los ocho prompts aparece como `[estilo pieza]`.

```
a medieval farmstead with wheat fields and a small barn, [estilo pieza]
```

```
a small walled town with tiled rooftops and a gate, [estilo pieza]
```

```
a glowing arcane mana node, a floating crystal over a ley-line circle,
[estilo pieza]
```

```
a craftsman workshop with an anvil, a chimney and scaffolding,
[estilo pieza]
```

```
a barracks with banners, a weapon rack and a training post,
[estilo pieza]
```

```
an arcane mage guild hall with a domed roof and floating runes,
[estilo pieza]
```

```
a stone fortress keep with battlements and a portcullis, [estilo pieza]
```

```
a translucent magical ward barrier, a glowing hexagonal shield over
standing stones, [estilo pieza]
```

> **`no ground shadow` no es un detalle.** Cada pieza se coloca por CSS
> sobre el paisaje, y una sombra pintada llevaría dentro un sol que no
> coincide con el del fondo. La sombra, si hace falta, la pone el CSS.
>
> **Y `readable as a single silhouette at 46 pixels`** es el tamaño real
> al que se pintan hoy. Una pieza preciosa con detalle de tejado que a
> 46px es una mancha está mal aunque sea preciosa.

---

### Tanda 9 — los otros doce fondos

**Doce, no nueve.** §8 listaba diez pantallas y desde entonces se
implementaron tres más —`/habilidades` en la fase 4, `/mensajes` y
`/temporada` en la fase 5—, así que la tabla de §8 se quedó corta. Menos
`/reino`, que ya salió en la tanda 7, quedan doce.

Los nueve de §8 conservan su motivo. Los tres que faltaban:

```
a study table with an open ledger of personal disciplines and a
polished mirror, [coletilla de fondo]
```

```
a quiet message room with pigeonholes, sealed letters and a
noticeboard, [coletilla de fondo]
```

```
a vast starry vault with seven great seals carved in stone, one of them
cracked, [coletilla de fondo]
```

> El de `/temporada` lleva **siete sellos y uno roto** a propósito: es la
> pantalla que contesta «¿para qué juego?»
> ([INTERFAZ.md §3.9](INTERFAZ.md)), y puede permitirse ser solemne. Lo
> que no puede es prometer un número de sellos distinto de siete.

---

## 9. Fuera de alcance

- **Retratos de héroe individuales.** Son decenas y cambian con el
  contenido; en fase 4 se resuelven con un icono por clase de héroe.
- **Animación**, parallax y partículas de ambiente. Ver
  [INTERFAZ.md §6.8](INTERFAZ.md).
- **Una ilustración por escuela** de la misma pantalla, y variantes de
  fondo por estado. Una por pantalla y ya.
- **Ornamento a medida por pantalla.** Dos piezas reutilizadas (§8.1).
- **Assets para un tema claro.** No hay tema claro
  ([INTERFAZ.md §6.1](INTERFAZ.md)).
- **Arte generado en tiempo de ejecución.** Todo asset se genera una vez,
  se revisa y se exporta al repositorio.
- **Los 113 iconos de unidad** (§7), hasta que las cuatro escuelas estén
  implementadas. Es la tanda siguiente, no ésta.
- **Piezas pintadas de nada que no sean los ocho edificios.** La escena
  es emblemática ([INTERFAZ.md §6.5](INTERFAZ.md)): ocho piezas y no
  crece.

---

## 10. Criterios de aceptación

1. **Los seis iconos de escuela se leen como un set** y **se distinguen
   entre sí** sobre `--panel`. Nether incluido (§3).
2. **Ningún asset pasa su presupuesto**: ≤ 150 KB por ilustración,
   ≤ 250 KB por pantalla sumando ornamento (§1). Se mide en el build.
3. **Cada asset exportado tiene guardado el prompt que de verdad se
   usó**, no el de este documento (§2).
4. **Los fondos dejan el centro libre** y siguen leyéndose bien cuando un
   panel opaco les tapa el 70% central (§8).
5. **La interfaz se ve completa sin ningún asset cargado**
   ([INTERFAZ.md §6.7](INTERFAZ.md)). Si falta un icono, hay texto.

**Y los de la tanda del 2026-09-22:**

6. **Los iconos de la barra se leen a 24px.** Se mira **a tamaño real**,
   no ampliados: un icono se juzga al tamaño al que se va a ver, y a
   24px la mitad del detalle desaparece. *Se comprueba en la pasada de
   navegador, que ya mira la barra.*
7. **`/reino` cabe en su presupuesto repartido**: fondo ≤ 120 KB, cada
   pieza pintada ≤ 12 KB, y el total de la pantalla ≤ 250 KB. *Se mide
   en el build.* Es más apretado que el de las demás pantallas, y el
   porqué está en [INTERFAZ.md §6.7](INTERFAZ.md), criterio 17.
8. **Las ocho piezas pintadas se leen como un conjunto entre sí Y con el
   paisaje** sobre el que van. Es el riesgo propio de tener dos estilos:
   ocho piezas preciosas que parecen recortadas de ocho cuadros
   distintos. *Se mira la escena entera, no pieza a pieza.*
9. **Nether se mira sobre `#1e1813` antes de dar el set por bueno.** Es
   la única escuela cuyo color nominal es invisible sobre el fondo
   ([INTERFAZ.md §6.3](INTERFAZ.md)), y la que más fácil sale mal.
10. **Ningún fondo trae edificios pintados.** El de `/reino` sobre todo
    (§8.2): si el paisaje ya trae un castillo, el reino enseña algo que
    el mago no ha construido. *Se mira el fondo solo, sin piezas.*
