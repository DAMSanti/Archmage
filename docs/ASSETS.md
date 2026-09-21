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
| **Icono vectorial plano** | Escuelas, edificios, recursos, rangos, unidades | **Siempre dentro de un panel**, sobre `--panel` |
| **Ilustración pintada** | Un fondo por pantalla | **Detrás y alrededor de los paneles**, nunca bajo el texto |
| **Ornamento** | Marcos, esquinas, filetes | El borde de los paneles |

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

**[abierto]** El inventario completo depende de la lista de unidades, que
todavía no está cerrada ([SISTEMAS.md §8](SISTEMAS.md)). El patrón, con
la única unidad confirmada del original:

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
| Reino `/reino` | 1 | `a wizard's tower interior at dusk, maps and ledgers on a great table` |
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
