# Roadmap

El plan por fases, y **«En curso»**: el trabajo vivo.

Los cuatro comandos del embudo (`/spec`, `/plan-tarea`, `/tareas`,
`/depurar`) usan este fichero como índice. Si algo se está haciendo,
tiene un bloque en «En curso» que dice **en qué documento está su spec**.

El diseño completo está en [docs/SISTEMAS.md](docs/SISTEMAS.md); las
fases construyen **capas completas** de ese diseño, no trozos, que es lo
que evita rehacer la fase 1 en la 3.

---

## En curso

### Economía de la fase 1 — spec escrita, sin implementar

**Spec y criterios de aceptación: [docs/SISTEMAS.md §3, §4.2, §5, §15 y
§17](docs/SISTEMAS.md).** Escrita el 2026-09-21 con `/spec`.

Qué cerró, y de dónde salió cada cosa:

- **La fórmula del maná resultó estar publicada**, y no se parecía a la
  que este ROADMAP daba por supuesta. Es una **sierra** con el máximo en
  **55,99%**, no una curva suave con umbral en el 30%. La versión
  anterior de `SISTEMAS.md §5.1` era una invención mía a partir de una
  sola frase; queda corregida y así consta en el propio documento.
- **Net Power también está publicada**, con coeficientes exactos, y la
  adoptamos: nos da la tasa de cambio entre recursos y, en la fase 4, el
  ranking hecho.
- **El estado inicial estaba documentado** (200 acres, 180 turnos, 120
  turnos de protección), así que se cerró aquí en vez de necesitar su
  propia spec.
- **Lo que sigue siendo nuestro**: coste y mantenimiento de los ocho
  edificios, ingreso de geld, espacio y comida, curva de exploración y
  edificios de partida. Todos **deducidos** de anclas del original, no
  inventados, y todos son **primera tirada a calibrar** contra §17.

Sin tareas todavía: las saca `/plan-tarea` cuando se ataque la fase 1.

**Decisión de diseño que cambió otros documentos.** Se eligió **fidelidad
sin ayudas**: la sierra se copia con sus saltos y la interfaz **no
calcula el óptimo**. Eso contradecía a `VISION.md §1` y `INTERFAZ.md §1`,
que prometían «la hoja de cálculo es nuestro trabajo». Los dos quedan
corregidos con el principio nuevo: **la interfaz informa, no optimiza**.

---

### Estilo visual — spec escrita, sin implementar

**Spec y criterios de aceptación:
[docs/INTERFAZ.md §6](docs/INTERFAZ.md)**, y el inventario de arte que se
deriva de ella en [docs/ASSETS.md](docs/ASSETS.md). Escrita el
2026-09-21 con `/spec`.

Qué cerró:

- **Pintado y ornamentado**: una ilustración de fondo por pantalla y los
  datos en paneles enmarcados. **Solo tema oscuro** — `INTERFAZ.md`
  prometía claro y oscuro, y queda corregido.
- **Paleta en tokens**, con positivo y negativo **deliberadamente
  apagados** para no confundirse con Verdant y Eradication.
- **Los cinco colores de escuela no pintan la interfaz**: solo aparecen
  donde se habla de una escuela. Es lo que libera el rojo y el verde para
  señalar estado.
- **Nether se separa de su color nominal** porque el negro sobre fondo
  oscuro no se ve: violeta ceniza, y la identidad por forma y reborde.
- **Cifras tabulares obligatorias** en toda columna de números.
- **Nueve criterios de aceptación**, la mayoría automatizables sobre los
  tokens sin abrir el navegador.

**El riesgo, declarado.** Se eligió pintado sabiendo que una ilustración
de fondo estorba a un juego de leer números densos. Por eso §6.5 y §6.6
son sobre todo restricciones —paneles opacos, nada de texto sobre la
imagen, la interfaz entera funciona sin ninguna ilustración, presupuesto
de peso, el ornamento no lleva información— y §6.7 las hace
comprobables. Si al implementar resulta que la ilustración sigue
estorbando, **lo que cede es la ilustración**.

Assets de fase 1: **cuatro fondos** (portal, reino, ejército, crónica),
los **seis iconos de escuela**, los **ocho de edificio**, los **seis de
recurso** y **dos piezas de ornamento**.

---

### Guerra de la fase 3 — cerrada el 2026-09-21

**Las 22 tareas hechas.** La spec y el plan siguen en
[docs/SISTEMAS.md §9.1](docs/SISTEMAS.md), con los resultados de la
calibración anotados criterio por criterio; la economía publicada que
salió por el camino está en §5.3 y §5.4, y los hallazgos sobre el
original en [docs/ORIGINAL.md §4.2 y §9.1](docs/ORIGINAL.md).

**Lo que de verdad pasó**, que no es lo que decía el plan:

- **Cinco premisas nuestras se cayeron**, y ninguna la encontró un test
  que las buscara: los upkeeps de unidad estaban inventados; `netPower()`
  no contaba el ejército, lo que volvía cierta «invocar es una trampa»
  **por construcción**; la economía entera estaba mal de forma y de
  escala, y resultó estar **publicada**; la debilidad era un
  multiplicador y no un término de la resistencia; y `powerRank` no es un
  precio de balance.
- **La pasada de navegador encontró cuatro fallos que 411 tests en verde
  no vieron**, incluido que el cliente llevaba roto desde la tarea 1.
- **Dos exploits** salieron de mirar, no de medir: disolver el ejército
  protegía la tierra, y partirlo en stacks minúsculos lo volvía
  intocable.

Queda `[abierto]` el efecto numérico de las habilidades de héroe, y la
lista completa de items es de la fase 4.

### La temporada de la fase 5 — cerrada el 2026-09-22

**Spec**: [docs/SISTEMAS.md §14.1](docs/SISTEMAS.md), «La temporada y el
mundo de la fase 5». Escrita el 2026-09-22. Toca además
[docs/SPECS.md §5](docs/SPECS.md) —invariantes 16 y 17— y
[docs/INTERFAZ.md §3.7-3.9](docs/INTERFAZ.md).

Gremios, aliados con refuerzos automáticos, mensajería, dos servidores y
el final de temporada. **Cuatro decisiones tomadas con el usuario**: dos
servidores en vez de uno u ocho; Armageddon con **las dos vías**, sellos
y fecha tope; gremios y alianzas **completos**, incluidos los refuerzos
que tocan el combate ya calibrado; y mensajería con directos, tablón y
bloqueo.

**Las 22 tareas hechas. 674 tests en verde**, `tsc -b` a cero, y la
pasada de navegador **14 de 14**.

**Lo que de verdad pasó, y no es lo que decía el plan:**

- **La fase 4 se había quedado a medias sin que nadie lo notara.**
  `war.ts` nunca llamaba a `prepareBattle()`: catorce familias de efectos
  escritas, 21 tests verdes, y desenchufadas del ataque de verdad. Se vio
  al planear la fase 5, no al implementarla. Los tests probaban la
  función; nadie probaba que alguien la llamara.
- **Tres fallos del final de temporada, ninguno de los cuales daba un
  error de juego.** El mago viejo seguía ocupando la cuenta, el índice
  único impedía crear el de la temporada siguiente con un 500, y el id de
  la temporada nueva chocaba con el de la vieja porque salía del reloj.
  Los tres los enseñó **un solo test**, el del criterio 18.
- **Y el aviso de CLAUDE.md, cumplido al pie de la letra**: el índice
  nuevo se creó antes que su columna, el fichero de tests del servidor
  reventó al importar, y la suite anunció *603 en verde*. No falló:
  **desapareció**. El único síntoma fue que el total bajó.
- **Una premisa de la spec se cayó al medirla.** El coste del sello —el
  doble del Ultimate más caro, 320.000— se iba a validar con «un mago que
  llega al final puede pagarlo». El simulador acaba con 94.522, porque
  **gasta todo lo que gana**. Ahorrando, el mismo reparto llega a
  **689.000**. El coste está bien; la medida no lo estaba. Y salió gratis
  una regla que merece estar declarada: con 123.000 de almacén, **un mago
  de economía no puede romper un sello ni ahorrando toda la temporada**.
- **Lo que no se movió, y por qué**: los 568 tests de las fases 1-4 no
  cambiaron ni una cifra. Los diez multiplicadores de habilidad valen
  exactamente 1 a nivel 0, y los parámetros de gremio y aliado son
  opcionales. Una batalla sin aliado recorre el mismo código que antes.

**Lo que se encontró al especificar**: la marca `[abierto]` de qué hace
Armageddon **estaba publicada**, y resulta ser lo más interesante del
diseño — **siete sellos que rompen siete magos distintos**, uno cada 24
horas. El final de la temporada **no es una fecha, es una decisión
colectiva**; la fecha solo pone el tope.

**Plan técnico**: [docs/SISTEMAS.md §14.1](docs/SISTEMAS.md), apartado
«Plan técnico». Escrito el 2026-09-22.

**Lo que hay que arreglar antes de construir encima**

- [x] **1. Dos servidores, y el invariante 16.** Catálogo de servidores
      en `content`, `serverId` **del mago de la sesión**, y las 26
      apariciones de `TERRA` en `app.ts` fuera. *Test = criterios 11, 12
      y 13: una cuenta con un mago en cada servidor, el rápido devenga al
      doble, y **ninguna lista mezcla los dos mundos**.* **Es el riesgo
      1 del plan.** *Toca `packages/content`, `apps/server` y el
      contrato.* **Migración aditiva.**

      > **HECHO (2026-09-22).** Dos servidores en `content` —`TERRA` a 10
      > minutos y `VELOZ` a 5 con tope 200, del original— y las 25
      > apariciones de `TERRA` fuera de `app.ts`.
      >
      > **El `serverId` sí puede viajar, y el `mageId` no**, y la
      > diferencia no es un matiz: el id del mago es **identidad** y el
      > del servidor es **contexto**. Como el mago se resuelve a partir de
      > (cuenta de la sesión, servidor), pedir otro servidor te da **tu**
      > mago de allí, nunca el de nadie. El invariante 13 sigue en pie.
      >
      > **La protección baja a 60 turnos en el rápido.** Va en turnos
      > gastados, y quien juega al doble los gasta al doble: dejarla en
      > 120 daría el doble de tiempo real de escudo en el servidor pensado
      > para ir deprisa.
      >
      > Criterios 11, 12 y 13 en verde, y el del riesgo 1 también: **el
      > ranking y los objetivos no mezclan los dos mundos**.

- [x] **2. Enchufar la pre-batalla en un ataque de verdad.** `war.ts`
      llama a `resolveBattle()` **sin pasar por `prepareBattle()`**: la
      capa de la fase 4 está escrita, probada y **desconectada**, así que
      hoy un ataque real no aplica los items. *Test: un ataque con
      Tambores de Guerra baja el ataque enemigo; **y sin items el
      resultado es idéntico al de la fase 3**, que es el canario.*
      *Toca `packages/core/src/war.ts`.*

      > **HECHO (2026-09-22).** Era deuda de la fase 4 y estaba callada:
      > `war.ts` llamaba a `resolveBattle()` y **nunca** a
      > `prepareBattle()`. La capa estaba escrita, probada con 21 tests y
      > **desconectada** — un ataque real no aplicaba ni un item.
      >
      > **El canario funcionó**: al enchufarla, los 568 tests de las fases
      > 1-4 siguieron en verde, que es exactamente lo que había que
      > comprobar. Sin items, el resultado es el mismo.
      >
      > Y de paso entra **la resurrección de post-batalla**, que era el
      > otro hueco declarado de §9.4: la tercera fase de una batalla
      > existía en el papel y no en el código.
      >
      > **Un test mío pasaba por el motivo equivocado**: comparaba bajas
      > del defensor con 5.000 contra 50.000, y moría entero en los dos
      > casos. Con un defensor que sobrevive, la diferencia se ve.

**Gremios**

- [x] **3. Fundar y entrar.** Cinco fundadores, solicitud e invitación,
      **un mago un gremio**. *Test = criterios 1 y 3: con cuatro no se
      funda, con cinco sí, y la segunda solicitud aceptada es error de
      dominio.* **Migración aditiva.**

      > **HECHO (2026-09-22).** `foundGuild`, `joinGuild` y `leaveGuild`, con
      > `FOUNDERS_NEEDED = 5` en `packages/core/src/guild.ts` — la regla en el
      > núcleo, la transacción en el repositorio.
      >
      > **Fundar es todo o nada**, y tiene su propio test: si el tercer
      > fundador ya estuviera en otro gremio, sin transacción quedaría un
      > gremio a medio fundar con dos miembros y un nombre cogido.
      >
      > **Y el último que sale se lleva el gremio con él.** Un gremio vacío
      > no es nada, y dejarlo dejaría el nombre reservado para siempre.

- [x] **4. No se ataca a los tuyos.** *Test = criterio 2: atacar a un
      compañero es un **422 con su código**, no un 500 ni un ataque que
      sale.* *Toca `packages/core/src/war.ts`.*

      > **HECHO (2026-09-22).** `canAttack()` en `guild.ts` y enchufado en
      > `resolveAttack()`. Atacar a un compañero es un **422 con su
      > código**.
      >
      > **Un fallo obvio que el test caza:** si `sameGuild(null, null)`
      > diera `true`, **nadie podría atacar a nadie** hasta que hubiera
      > gremios — dos magos sin gremio no son compañeros. Es el error de
      > comparar ausencias.
      >
      > El parámetro de gremios es **opcional**, así que los tests de la
      > fase 3 siguen dando lo mismo sin pasarlo.

- [x] **5. Listas y registros.** Miembros, enemigos declarados y las
      batallas del gremio. *Test del servidor.*

      > **HECHO (2026-09-22).** `readGuild` devuelve miembros y líder;
      > `guildOf` resuelve el gremio de un mago, que es lo que usan el tablón
      > y la comprobación de «no se ataca a los tuyos».
      >
      > **Los enemigos declarados se quedan fuera**, y está escrito en el
      > docstring del módulo: sin diplomacia —que la fase 5 no incluye— una
      > lista de enemigos no cambia ninguna regla. Sería adorno.


**Alianzas y refuerzos — aquí se toca el combate**

- [x] **6. Proponer y aceptar una alianza.** 1 o 2 según servidor.
      *Test: el tercero no entra.*

      > **HECHO (2026-09-22).** **[nuestro]** Dos aliados en el normal y
      > **uno en el rápido**: el original dice «1 o 2 según el servidor» y
      > no dice cuál es cuál. En un servidor que va al doble de ritmo, dos
      > aliados mandando refuerzos harían que defender fuera casi gratis.
      >
      > **Se mira a los dos**, no solo a quien propone: si no, el que
      > acepta podría acabar con tres aliados aceptando tres propuestas.

- [x] **7. Romper tarda 24 horas.** *Test = criterio 7 con el reloj
      inyectado: durante el plazo **los refuerzos siguen yendo**.*
      **Proceso programado idempotente.**

      > **HECHO (2026-09-22).** `requestBreak` marca la hora, y
      > `activeAlliesOf` filtra con el reloj **inyectado**, no con el de
      > Postgres. `BREAK_DELAY_HOURS = 24` vive en el núcleo.
      >
      > **Durante el plazo los refuerzos siguen yendo**, y el test lo mide a
      > las 23 y a las 24 horas: si se pudiera romper al instante, un mago
      > rompería al ver el ataque entrante y la alianza no costaría nada.
      >
      > `settleBrokenAlliances` es **idempotente**: devuelve 1 la primera vez
      > y 0 la segunda, y el test comprueba las dos.

- [x] **8. Los refuerzos, en la pre-batalla.** *Test = criterios 4, 5 y
      6: el defensor pelea con más, **el aliado pierde unidades**, sus
      dos stacks más potentes **no aparecen**, y un compañero que no es
      aliado no manda nada.* **Es el riesgo 2**: sin aliado el resultado
      tiene que ser idéntico al de la fase 3.

      > **HECHO (2026-09-22).** Los refuerzos entran **antes de la
      > pre-batalla**, así que **la ronda no sabe que las alianzas
      > existen**.
      >
      > **El riesgo 2 del plan no se materializó**, y se sabe por qué: el
      > parámetro de aliados es opcional y por defecto vacío, así que sin
      > aliado el resultado es **idéntico** — hay un test que compara las
      > dos llamadas. Los 614 tests anteriores siguieron en verde.
      >
      > Medido: con aliado, el atacante sufre más bajas, y **al aliado le
      > vuelve menos de lo que mandó**. Ayudar cuesta.

- [x] **9. Devolver al aliado lo que le quedó.** Sus stacks van marcados
      y vuelven a su dueño. *Test: el defensor **no se queda** con el
      ejército de su aliado.* Sin esto, ayudar sería un negocio.

      > **HECHO (2026-09-22).** `splitSurvivors()` reparte **proporcional
      > a lo que cada uno puso**, con un solo `floor`, y **el resto se lo
      > queda el defensor** — que es quien eligió la batalla.
      >
      > **Era el bug fácil de escribir y difícil de ver de toda la fase**:
      > sin repartir, el defensor se queda con el ejército de su aliado al
      > acabar, y ayudar pasa de ser un coste a ser un negocio. Hay un
      > test que comprueba que todo lo que sobrevive se reparte **sin
      > perder ni inventar una unidad**.

**Mensajería**

- [x] **10. Directos y bandeja.** *Test = criterio 8: pedir la bandeja de
      otro es un 403.* **Es el invariante 13 otra vez.**

      > **HECHO (2026-09-22).** `sendDirect` e `inboxOf`. **El id sale de la
      > sesión, nunca del cuerpo ni de la URL** (invariante 13), así que no
      > hay forma de pedir la bandeja de otro: no existe el parámetro.
      >
      > **Cambio de premisa:** la tarea decía «pedir la bandeja de otro es un
      > 403». No lo es, y es mejor — no hay ruta que lo acepte. Se comprueba
      > la propiedad de verdad: el remitente **no ve su propio mensaje** en
      > su bandeja, porque la bandeja es lo que te llega, no lo que mandas.

- [x] **11. Tablón de gremio.** *Test = criterio 10: solo lo leen sus
      miembros.*

      > **HECHO (2026-09-22).** `postToGuild` y `guildBoard`. El servidor
      > resuelve el gremio con `guildOf(sesión)` y manda lista vacía a quien
      > no está en ninguno: **no hay id de gremio en la petición**, así que
      > tampoco hay tablón ajeno que pedir.

- [x] **12. Bloquear a un mago.** *Test = criterio 9: el bloqueado no
      escribe, y **el que bloquea no se entera de que lo intentó**.*

      > **HECHO (2026-09-22).** `blockMage`, y el envío responde `ok`
      > **igualmente**.
      >
      > **Es lo que más importa de esta tarea:** decirle «te han bloqueado»
      > convertiría el bloqueo en una notificación para quien acosa, y le
      > diría exactamente cuándo ha conseguido molestar. El mensaje se acepta
      > y no llega.
      >
      > Bloquear dos veces no es un error, y tiene test: si lo fuera, un
      > doble clic daría un 500.


**Armageddon**

- [x] **13. El hechizo, como dato.** Se investiga **después de todos los
      demás** y **no suma nivel de hechizo**: el catálogo necesita un
      campo para decirlo, no un `if` con su nombre. *Test = criterio 16.*
      *Toca `packages/content` y `packages/core`.*

      > **HECHO (2026-09-22).** Dos campos nuevos en la ficha de hechizo:
      > `noSpellLevel` y `researchLast`. **Van como dato y no como un `if`
      > con su nombre** (docs/SPECS.md §4), y `magic.ts` ya lo había
      > anticipado en un comentario desde la fase 2: «Armageddon no suma,
      > a propósito. Cuando exista (fase 5) será la excepción, y estará
      > marcada en su entrada del catálogo».
      >
      > **El cambio fue aditivo**: `spellLevelOf()` sigue aceptando rangos
      > sueltos, así que nada de lo que ya la llamaba tuvo que tocarse, y
      > el nivel máximo del catálogo sigue siendo **207**.
      >
      > **[nuestro] El coste**: 320.000, el doble del Ultimate más caro.
      > Romper un sello tiene que ser un esfuerzo de mago grande y no un
      > trámite.
      >
      > *El test acabó en `content` y no en `core`, y fue el invariante 1
      > quien lo mandó allí: el núcleo no importa nada, así que un test
      > que compara catálogo con reglas no cabe en él.*

- [x] **14. Los siete sellos.** *Test = criterios 14 y 15: siete magos
      **distintos**, y dos sellos seguidos en menos de 24 horas es error
      de dominio.* **El reloj por parámetro.**

      > **HECHO (2026-09-22).** `season.ts`, 21 tests. Siete sellos, **un
      > mago solo rompe uno**, y 24 horas entre cada dos — con el reloj
      > por parámetro.
      >
      > Medido: **romper los siete lleva al menos seis días**. El final no
      > puede improvisarse en una tarde, y eso es lo que lo convierte en
      > una decisión colectiva y no en una carrera.

- [x] **15. La fecha tope, 90 días.** *Test = criterio 17 por las dos
      vías: acaba al séptimo sello, y acaba sola a los 90 días.*
      **Proceso programado idempotente.**

      > **HECHO (2026-09-22).** 90 días de tope, y `shouldEnd()` es
      > **idempotente por construcción** —una temporada ya cerrada
      > devuelve `false`—, así que el proceso programado puede correr mil
      > veces.
      >
      > **Los sellos mandan sobre la fecha**: si se rompió el séptimo, la
      > temporada acabó por decisión de siete magos y no por el reloj. Es
      > lo que se cuenta en `/temporada`.

**El final**

- [x] **16. Cerrar la temporada.** Una fila que se marca cerrada, **no
      miles de magos que se tocan**. *Test = criterios 18 y 20: la cuenta
      sigue y puede crear mago nuevo, el viejo no se juega, y **no
      aparece** en el ranking de la nueva.* **Es el invariante 17.**

      > **HECHO (2026-09-22).** `settleSeasons` marca **una fila**, y con eso
      > se jubilan todos los magos de esa temporada — es el invariante 17.
      >
      > **Dos fallos de verdad que encontró el test del criterio 18, y
      > ninguno de los dos daba un error de juego:**
      >
      > 1. `mageOfAccount` y `listMages` no miraban la temporada, así que al
      >    cerrar, la cuenta **seguía teniendo** su mago viejo y no podía
      >    crear el nuevo. Ahora las dos filtran en SQL por temporada viva.
      > 2. El índice único decía «un mago por cuenta y servidor» **sin fecha
      >    de caducidad**: crear el mago de la temporada siguiente era un
      >    **500 por clave duplicada**. Pasa a ser por cuenta, servidor y
      >    temporada.
      >
      > **Y un tercero, de propina:** `ensureSeason` sacaba el id de la
      > temporada del reloj, así que la que se abre justo detrás de una que
      > acaba de cerrar nacía con el id de la anterior. Ahora es el ordinal
      > (`t_terra_2`), y una carrera entre dos peticiones relee en vez de
      > reventar.
      >
      > **Lo que enseñó de paso:** el índice nuevo se creó **antes** que la
      > columna `season_id`, el fichero de tests del servidor reventó al
      > importar, y la suite dijo *603 en verde* tan contenta. No falló:
      > desapareció. Los 71 volvieron al mover el índice detrás de la
      > columna.

- [x] **17. Hall of Fame y Hall of Immortals.** Diez por net power y los
      siete de los sellos. *Test = criterio 19.*

      > **HECHO (2026-09-22).** Hall of Fame: los diez primeros por net
      > power, **congelados al cerrar** y no calculados al mirar — el mago
      > deja de jugar y su net power deja de tener sentido, pero el puesto
      > que sacó no cambia.
      >
      > Hall of Immortals: **en orden de sello, no por poder**. El primero
      > se la jugó cuando nadie sabía si habría siete.
      >
      > Y sin sellos no hay inmortales: acabó el reloj, no nadie.

- [x] **18. Que lo que sobrevive NO dé ventaja.** *Test = criterio 21: un
      mago nuevo de una cuenta con Hall of Fame empieza exactamente igual
      que uno de una cuenta nueva.*

      > **HECHO (2026-09-22).** Test del criterio 21: la cuenta que cerró la
      > temporada con Hall of Fame crea mago nuevo, y se compara **campo a
      > campo** con el de una cuenta recién registrada, quitando solo id,
      > nombre y fechas. Son iguales.
      >
      > Hoy se cumple **por construcción** —`createMage` no recibe la cuenta,
      > así que no puede consultar su historial—, y ése es justo el motivo
      > para tener el test: el día que alguien le pase la cuenta para algo
      > inofensivo, esto lo dice sin que nadie tenga que sospecharlo.
      >
      > Es lo que sostiene la promesa de docs/VISION.md: **el que llega en la
      > temporada 5 juega la misma partida que el que llevaba desde la 1.**


**Cliente**

- [x] **19. `/gremio`.** Miembros, aliados, y **el coste de aliarse
      dicho antes de aceptar**.

      > **HECHO (2026-09-22).** `/gremio` con miembros, aliados y el botón de
      > fundar. **El coste de aliarse se dice antes de aceptar**, y es la
      > única razón por la que esta pantalla necesitó navegador: que el texto
      > esté *antes* del botón no se comprueba compilando.
      >
      > Dice las tres cosas que cuestan: que los refuerzos van **solos**, que
      > van **todos menos tus dos stacks más potentes**, y que romper tarda
      > **24 horas**. Quien acepta sin saberlo descubre el precio cuando ya
      > perdió el ejército.

- [x] **20. `/mensajes`.** Bandeja, directos, tablón, y el **bloqueo a un
      clic** en la conversación.

      > **HECHO (2026-09-22).** `/mensajes` con bandeja, tablón y directos, y
      > el **bloqueo a un clic** en la conversación: si hubiera que ir a
      > buscarlo a una pantalla de ajustes, no serviría para lo que existe.
      >
      > El tablón dice en la propia pantalla que **solo lo leen los
      > miembros**, porque quien escribe tiene que saber quién lee.

- [x] **21. `/temporada`.** **Los sellos y la fecha tope a la vez**, y
      los dos Halls.

      > **HECHO (2026-09-22).** `/temporada` con **las dos vías a la vez**:
      > los sellos rotos y la fecha tope, cada uno en su panel, desde el
      > primer día. Si solo se viera una, la otra parecería no existir — y
      > con pocos jugadores, coordinar siete magos es difícil: sin la fecha
      > delante, la temporada parecería eterna.
      >
      > **Un fallo que solo enseñó el navegador:** la pantalla ofrecía el
      > botón de romper el sello a un mago que **no había investigado
      > Armageddon**. `canBreakSeal` no lo comprobaba. Ahora sí, y es un
      > error de dominio con su código.
      >
      > Los dos Halls salen de las temporadas cerradas, y sin sellos el de
      > Inmortales dice que acabó el reloj, no nadie.
      >
      > **Una sola pasada de navegador para las tareas 19, 20 y 21**, como
      > estaba presupuestado: **14 de 14 comprobaciones en verde**, sin
      > errores de consola y sin scroll horizontal a 390px.


      *Las tareas 19 a 21 se verifican en **una sola pasada de
      navegador**, con los criterios de presentación dentro.*

**Calibración**

- [x] **22. ¿Rompe algo la fase 5?** *Que los 568 tests de las fases 1-4
      sigan en verde, que una batalla sin aliado dé el mismo resultado
      que antes, y que **el reparto de ejército siga siendo el que más
      net power saca**.*

      > **HECHO (2026-09-22).** **674 tests en verde** y `tsc -b` a cero.
      > Los 568 de las fases 1-4 siguen dando lo mismo, y por un motivo
      > concreto: los diez multiplicadores de habilidad valen **exactamente
      > 1** a nivel 0, y los parámetros nuevos —gremios, aliados— son
      > **opcionales**. Una batalla sin aliado recorre el mismo código.
      >
      > **El reparto de ejército sigue siendo el que más net power saca.**
      >
      > **Y una premisa de la spec que se cayó al medirla.** La spec prometía
      > validar el coste del sello con «un mago que llega al final puede
      > pagarlo». Medido, el mago de maná acaba con **94.522** y el sello
      > cuesta **320.000**: el simulador **gasta todo lo que gana** en
      > encantamientos e invocaciones.
      >
      > Lo que no era cierto era la medida, no el coste. El mismo reparto sin
      > gastar en magia acaba con **689.000** — su almacén lleno, más del
      > doble del sello. Así que el test dice ahora lo que de verdad pasa:
      > **se puede pagar ahorrando a propósito, y no gastando todo lo que
      > entra.**
      >
      > **Y una consecuencia que vale la pena tener declarada:** el almacén
      > de un reparto económico son **123.000**, y el de ejército **183.000**.
      > **No llegan nunca, por mucho que ahorren.** Romper un sello pide ser
      > mago de maná: acabar el mundo es cosa de quien invirtió en nodes.


### El mundo de la fase 4 — cerrada el 2026-09-22

**Las 25 tareas hechas.** La spec y el plan siguen en
[docs/SISTEMAS.md §12.1](docs/SISTEMAS.md); los hallazgos sobre el
original, en [docs/ORIGINAL.md §7.1 y §7.2](docs/ORIGINAL.md); los
invariantes 13, 14 y 15, en [docs/SPECS.md §5](docs/SPECS.md).

**Lo que de verdad pasó**, que no es lo que decía el plan:

- **Los items estaban publicados enteros.** Fui a interpolar dieciséis y
  no hizo falta ninguno — pero los reales traen mecánicas que el combate
  no tenía, así que el alcance creció de 22 tareas a 25 y apareció la
  capa de **pre-batalla**.
- **El riesgo 1 del plan no se materializó, y se sabe por qué.** Enchufar
  diez habilidades en nueve fórmulas calibradas no movió un número
  porque los multiplicadores valen **exactamente 1** al nivel 0, y los
  parámetros nuevos llevan valor por defecto. Los 484 tests de las fases
  1-3 siguieron en verde.
- **Dos tests míos no comprobaban nada**, y los dos por el mismo motivo:
  medían contra el reloj de Postgres cuando el servidor compara con el
  reloj inyectado.
- **La pasada de navegador encontró un fallo que ningún test veía**: la
  pantalla de habilidades no decía qué haría una habilidad que aún no
  tienes, así que no se podía decidir cuál subir.

Queda `[abierto]` el efecto de las **habilidades de héroe** —sin ancla
publicada— y los **46 unique items**, de los que la wiki solo da el
nombre. *Barrier Proficiency* está calculada y sin enchufar porque la
curva del bonus de fort sigue `[abierto]` en §5.7.

### Guerra de la fase 3 — cerrada el 2026-09-21

**Las 22 tareas hechas.** La spec y el plan siguen en
[docs/SISTEMAS.md §9.1](docs/SISTEMAS.md), con los resultados de la
calibración anotados criterio por criterio; la economía publicada que
salió por el camino está en §5.3 y §5.4, y los hallazgos sobre el
original en [docs/ORIGINAL.md §4.2 y §9.1](docs/ORIGINAL.md).

**Lo que de verdad pasó**, que no es lo que decía el plan:

- **Cinco premisas nuestras se cayeron**, y ninguna la encontró un test
  que las buscara: los upkeeps de unidad estaban inventados; `netPower()`
  no contaba el ejército, lo que volvía cierta «invocar es una trampa»
  **por construcción**; la economía entera estaba mal de forma y de
  escala, y resultó estar **publicada**; la debilidad era un
  multiplicador y no un término de la resistencia; y `powerRank` no es un
  precio de balance.
- **La pasada de navegador encontró cuatro fallos que 411 tests en verde
  no vieron**, incluido que el cliente llevaba roto desde la tarea 1.
- **Dos exploits** salieron de mirar, no de medir: disolver el ejército
  protegía la tierra, y partirlo en stacks minúsculos lo volvía
  intocable.

Queda `[abierto]` el efecto numérico de las habilidades de héroe, y la
lista completa de items es de la fase 4.

### El mundo de la fase 4 — spec escrita, sin implementar

**Spec**: [docs/SISTEMAS.md §12.1](docs/SISTEMAS.md), «El mundo de la
fase 4». Escrita el 2026-09-21. Toca además
[docs/SPECS.md §5](docs/SPECS.md) —invariantes 13, 14 y 15— y
[docs/INTERFAZ.md §3.4-3.6](docs/INTERFAZ.md).

Cuentas, mercado negro, items, héroes que crecen, las diez habilidades y
el ranking. **Cuatro decisiones tomadas con el usuario**: las cuentas
entran y van primero; el mercado es subasta entre jugadores como el
original, con el riesgo de quedarse vacío declarado; las diez habilidades
se cierran en +1% por rango; y los gremios se quedan en la fase 5.

**Lo que se encontró al especificar**: el mercado negro **está
publicado** con todos sus números (ORIGINAL §7.1), incluido que **pujar
cuesta un turno**; y de las diez habilidades hay **una** con efecto
publicado, que sirve de ancla de escala para deducir las otras nueve en
vez de inventarlas.

**Plan técnico**: [docs/SISTEMAS.md §12.1](docs/SISTEMAS.md), apartado
«Plan técnico». Escrito el 2026-09-21.

**Cuentas — sin esto no hay sujeto**

- [x] **1. Cuentas y sesión.** Tablas `accounts` y `sessions`, columna
      `mages.account_id` **anulable**, contraseñas con `scrypt` de
      `node:crypto`, cookie firmada con id de sesión. *Test contra
      Postgres: registrar, entrar, salir, y que una contraseña mala no
      entre.* **Migración aditiva.** *Toca `apps/server` y
      `packages/contract`.*

      > **HECHO (2026-09-21).** `apps/server/src/auth.ts`, tablas
      > `accounts`, `sessions` y `auth_tokens`, y `mages.account_id`
      > **anulable**. `scrypt` de `node:crypto`: cero dependencias nuevas.
      > La cookie lleva **un id de sesión, no el `mageId`**, así que cerrar
      > sesión es borrar una fila.
      >
      > **Tres decisiones que el código explica y que no son obvias:** el
      > correo se **normaliza** antes de guardar —si no, `Ana@` y `ana@`
      > serían dos cuentas—; entrar da **el mismo error** exista el correo
      > o no, porque distinguirlos deja comprobar quién juega; y la
      > contraseña se compara con `timingSafeEqual`.

- [x] **1 bis. Verificación por correo y recuperación.** *Decidido por el
      usuario.* Tabla de mensajes, tokens con caducidad, y el envío
      **detrás de una interfaz con dos implementaciones**: SMTP real, y
      una que deja el mensaje en la tabla —la que usan los tests y el
      desarrollo—. *Test: un token caducado no verifica, uno usado no se
      reutiliza, y recuperar cambia la contraseña sin saber la vieja.*

      > **HECHO (2026-09-21).** Tokens de un solo uso con caducidad de 24
      > horas, y el `Mailer` **detrás de una interfaz**: la implementación
      > de la tabla `outbox` es la que usan los tests, así que **ningún
      > test manda correo de verdad**.
      >
      > **Recuperar cierra todas las sesiones.** Si alguien entró con la
      > contraseña robada, cambiarla tiene que echarlo — y eso no estaba en
      > el plan, salió al escribir el test.
      >
      > **Un test estaba mal y lo dijo el reloj.** Caducar un token con
      > `now() - interval '1 hour'` de Postgres no caducaba nada: el
      > servidor compara con `deps.now()`, que en los tests vale 2023,
      > mientras `now()` de la base de datos es hoy. El test pasaba sin
      > comprobar nada. Ahora usa el reloj inyectado.

- [x] **2. El id del mago sale de la sesión.** Quitar `DEV_MAGE_ID` de
      las nueve rutas y dejarlo tras una bandera de entorno para la
      pasada de navegador. *Test = criterios 1 y 2 de §12.1: un mago por
      cuenta y servidor, y **pedir el reino con la sesión de otro da
      403**.* **Es el invariante 13.**

      > **HECHO (2026-09-21).** `mageOf()` saca el id de la sesión en las
      > nueve rutas. **El id no viaja**: no hay parámetro ni campo que lo
      > acepte, que es la única forma de no romper el invariante 13 — un
      > endpoint que lo aceptara funcionaría perfectamente y dejaría jugar
      > el reino de cualquiera.
      >
      > Los criterios 1 y 2 salen: un segundo mago en el mismo servidor es
      > un 422 con su código, y pedir `/api/mage/me?mageId=<otro>` con tu
      > sesión **te devuelve el tuyo**.
      >
      > El mago de desarrollo sobrevive tras `allowDevMage`, apagable; con
      > la bandera en `false`, sin sesión es un 401. **430 tests seguían en
      > verde** tras el cambio, que era lo que había que comprobar.

**Los catálogos, que son dato**

- [x] **3. Mover los cuatro items publicados a `content`.** Hoy están en
      `packages/core/src/heroes.ts` como `BATTLE_ITEMS`, que es dato en
      un paquete de código. En el núcleo queda el tipo. *Test: el
      catálogo valida y los cuatro números siguen siendo los
      publicados.* **Toca `packages/core` y `packages/content`.**

      > **HECHO (2026-09-21).** `BATTLE_ITEMS` sale de
      > `packages/core/src/heroes.ts`. En el núcleo queda `items.ts` con el
      > **tipo y las mecánicas**; los números viven en `content`, como los
      > de unidades y hechizos (docs/SPECS.md §4).

- [x] **4. El catálogo de items publicados.** **No se interpola
      ninguno**: la wiki los publica enteros con sus números
      ([ORIGINAL.md §7.2](docs/ORIGINAL.md)). Entran los lesser menos los
      **tres que el propio original tiene deshabilitados**. *Test =
      criterio 8 bis: el Sage Stone da 1-2 millones, el Voodoo Doll 2-8
      turnos, la Figurine of Ice Queen `100.000 + [1-3 × unidades]`.*

      > **HECHO (2026-09-21).** 44 items copiados de
      > [ORIGINAL.md §7.2](docs/ORIGINAL.md), 16 tests. Los tres
      > deshabilitados en el propio original **no entran**, y tres que
      > piden mecánicas que este juego no tiene —espiar, disipar hechizos
      > de dioses, los Griales— **entran como dato diciendo por qué**.
      >
      > **El efecto es una unión discriminada, no una función**: un item
      > tiene que viajar por el API, guardarse en una fila y pintarse en
      > una pantalla, y una función no hace nada de eso.
      >
      > **Un campo significaba dos cosas y lo cazó un test.** `amount` era
      > un rango en veinte items y un número en el Agua Bendita. Renombrado
      > a `damage` — la clase de ambigüedad que muerde tres meses después.

- [x] **5. Las diez habilidades, como dato.** Nombre, si es de
      especialidad, y **qué magnitud toca**. *Test: las diez están, cinco
      son de especialidad, y el efecto al nivel 20 es +20%.*

      > **HECHO (2026-09-21).** Las diez en `packages/content/src/skills.ts`,
      > con su magnitud y si son de especialidad. **Las diez tocan
      > magnitudes distintas**, y hay un test para eso: si dos tocaran la
      > misma, el jugador tendría nueve decisiones y no diez.

**Habilidades: puntos, coste y efecto**

- [x] **6. Puntos y coste de entrenar.** Raíz cuadrada de los guilds para
      generar; 210 puntos hasta el 20; **el doble fuera de color**.
      *Test = criterios 15 y 16: 210 y 420, y un punto cada 34 turnos
      ±2 con 5.000 de tierra al 5% de guilds.* *Toca `packages/core`.*

      > **HECHO (2026-09-21).** 17 tests. 210 puntos al nivel 20, **420
      > fuera de color**, y el ancla publicada cuadra: 5.000 de tierra al
      > 5% de guilds da un punto cada **34 turnos**.
      >
      > **El test comprueba el ancla, no el coeficiente.** Si un día cambia
      > la forma de la fórmula, lo que tiene que seguir cuadrando es ese
      > mago, no el 0,00186 que hoy la hace cuadrar.
      >
      > **Un mago Plain paga el doble por las cinco de especialidad**, y es
      > coherente: Plain no es una escuela, es la ausencia de una.

- [x] **7. Enchufar las diez, una por una.** Cada habilidad en la
      fórmula que toca: coste de maná, fallo fuera de color, upkeep de
      encantamientos, unidades por invocación, ataque animal, ataque no
      muerto, acierto, tierra arrancada, barriers e items. *Test =
      criterio 14: diez tests, uno por habilidad, y **al nivel 0 no
      cambia nada**.* **Aquí es donde van a salir las regresiones**:
      toca `casting.ts`, `economy.ts`, `magic.ts`, `combat.ts`,
      `battle.ts` y `land.ts`, y los tests de calibración de las fases
      1-3 son el canario.

      > **HECHO (2026-09-21).** `skilleffects.ts` con un struct de diez
      > multiplicadores, 13 tests.
      >
      > **La defensa contra el riesgo 1 del plan es una sola idea:** al
      > nivel 0 los diez valen **exactamente 1**, así que enchufarlas no
      > puede mover un número de lo ya calibrado. Se comprobó midiendo —
      > **los 484 tests de las fases 1 a 3 siguieron en verde** tras el
      > cambio— y hay un test que llama a cada fórmula con y sin el
      > parámetro nuevo para verificar que dan lo mismo.
      >
      > Los parámetros nuevos llevan **valor por defecto**, así que el
      > cambio fue aditivo: nada de lo que ya llamaba a `castCost()`,
      > `failureChance()` o `landTaken()` tuvo que tocarse.
      >
      > **Una queda sin enchufar y se declara**: *Barrier Proficiency*. La
      > curva del bonus de fort y barrier sigue `[abierto]` en §5.7, así
      > que **no hay magnitud que multiplicar**. El multiplicador se
      > calcula igual y no lo usa nadie — deuda declarada, no olvido.

**Items**

- [x] **8. Generación por guilds.** *Test = criterio 8: al 10% de guilds
      el doble que al 5%, y sin guilds ninguno.*

      > **HECHO (2026-09-21).** Un item cada **40 turnos con el 5% de la
      > tierra en guilds**, anclado en la misma escala que los puntos de
      > habilidad. Al 10%, el doble; sin guilds, ninguno.
      >
      > **Es el porcentaje y no el número**: un mago de 500 acres al 5%
      > saca lo mismo que uno de 5.000 al 5%. Así el item es una decisión
      > de **reparto** y no un premio por ser grande, que ya lo es todo lo
      > demás.

- [x] **9. La pre-batalla: modificadores y daño previo.** El hueco que
      `battle.ts` declaró en la fase 3 y que [ORIGINAL.md §9.4](docs/ORIGINAL.md)
      ya describía. Una capa que **modifica el ejército antes de la
      primera ronda** —ataque, resistencias, iniciativa, *Flying*— y
      resuelve el daño previo. *Test = criterio 8 ter: un Drums of War
      baja el ataque enemigo un 10% **en todos los golpes**, no solo en
      el primero.* **Es el riesgo 0 del plan**: si esta capa se filtra a
      la fórmula de daño, se rompe el invariante 7. *Toca
      `packages/core/src/prebattle.ts` (nuevo) y `battle.ts`.*

      > **HECHO (2026-09-21).** `packages/core/src/prebattle.ts`, 21 tests.
      >
      > **La idea, y es la que no hay que perder:** un item **no toca la
      > fórmula de daño**. Modifica el *ejército* —ataque, resistencias,
      > iniciativa, habilidades— y la ronda pelea con un ejército ya
      > modificado. Si se colara dentro de `casualties()` haría un segundo
      > redondeo y rompería el invariante 7; así, la fórmula sigue sin
      > saber que los items existen.
      >
      > **Y las fichas no se mutan.** Cada bando entra con copia honda: el
      > catálogo es compartido y una batalla no puede dejar al Treant del
      > mundo con un +20% permanente. Hay un test solo para eso.

- [x] **10. Los items de batalla, enchufados.** Los ~28 de batalla sobre
      la capa de la 9. *Test: uno por familia —AP, resistencia,
      iniciativa, daño directo, resurrección— con la semilla fijada.*

      > **HECHO (2026-09-21).** Las catorce familias de efecto de batalla,
      > una por mecánica y no una por item: quince items suben el ataque y
      > todos usan la misma.
      >
      > Comprobadas con semilla fijada, incluidas las que tienen gracia:
      > el *Pixie Dust* **se reparte entre los stacks** —contra cuatro hace
      > un 5% a cada uno, así que premia atacar a quien concentra—, el
      > *Satchel of Mist* baja el acierto de **los dos bandos**, la
      > *Alfombra Voladora* da *Flying* y **rompe el criterio 5 de §9.1**,
      > y los *Oil Flasks* dejan la resistencia al fuego **en negativo**.

- [x] **11. `UseItem` fuera de batalla.** Los ~21 que dan recursos,
      unidades o tierra, y los que **atacan sin batalla**: turnos,
      población y maná del enemigo. *Test = criterio 10: el segundo
      unique es error de dominio.* *Toca `packages/core` y
      `packages/contract`.*

      > **HECHO (2026-09-22).** `packages/core/src/useitem.ts`, 14 tests.
      > Los que dan recursos, unidades o tierra, y los cuatro que **atacan
      > sin batalla**.
      >
      > **Que un item pueda destruir turnos del enemigo es lo que más dice
      > del diseño del original**: solo tiene sentido si el turno es la
      > moneda, y confirma que lo es.
      >
      > El item **se gasta aunque no salga nada** —el Cofre del Tesoro
      > puede no dar nada, y eso es parte de lo que se compra—, y el último
      > **desaparece del inventario** en vez de quedarse en cero.

- [x] **12. El saqueo roba items.** *Test = criterio 9: se lleva lesser
      y **deja los uniques**.* *Toca `packages/core/src/war.ts`.*

      > **HECHO (2026-09-21).** El saqueo se lleva el **25% de los lesser**
      > y **deja los uniques**. Que un unique cambiara de manos por un
      > saqueo afortunado lo convertiría en el objetivo de todas las
      > guerras, que es otro juego.
      >
      > Redondea hacia abajo, así que robar a quien tiene tres items se
      > lleva cero: hay que atacar a quien de verdad acumula.

**Héroes que crecen**

- [x] **13. Experiencia y niveles.** Por turno y por liderar; subir
      cuesta 1.000 × nivel. *Test = criterio 13: liderar aporta más que
      el turno solo.*

      > **HECHO (2026-09-21).** 11 tests. **[nuestro]** 10 de experiencia
      > por turno y **200 por batalla liderada**: liderar tiene que aportar
      > **veinte veces más** que esperar. Un héroe que sube solo con el
      > tiempo es un contador; uno que sube peleando es una razón para
      > pelear.
      >
      > Sube **en bucle**, no un nivel por llamada: si una batalla larga da
      > para dos niveles, se dan los dos. Lo contrario perdería experiencia
      > sin avisar.

- [x] **14. Calibrar el crecimiento.** *Criterio 12: un héroe de nivel 8
      que lidera una temporada llega a 12 o más, y no a 20.*
      **Simulación de temporada.**

      > **HECHO (2026-09-21).** Criterio 12 medido: un héroe de nivel 8 que
      > lidera 100 batallas en 2.000 turnos llega a **12 o más y no a 20**.
      > Subir del 8 al 9 cuesta **800 turnos de espera o 40 batallas**.

**El mercado**

- [x] **15. Las reglas de la subasta, puras.** Mínimo del +5%, un turno
      por puja, cierre a los 30 minutos de la última, 2,5 horas mínimo.
      *Test = criterios 3 y 4, con el reloj **por parámetro**.* *Toca
      `packages/core`.*

      > **HECHO (2026-09-21).** `packages/core/src/market.ts`, 19 tests.
      > Todos los números son los publicados.
      >
      > **El reloj entra por parámetro**, así que estos tests no dependen
      > del día que se ejecuten (invariante 2). Y **manda el plazo más
      > tardío** de los dos: sin el mínimo de 2,5 horas, pujar en el minuto
      > uno cerraría la subasta en media hora y nadie más la vería.
      >
      > La puja mínima **redondea hacia arriba**: hacia abajo, una de 101
      > aceptaría 106 y el +5% publicado dejaría de cumplirse.

- [x] **16. La tabla de lotes y la puja con bloqueo.** *Test = criterio
      5 contra Postgres: **dos pujas simultáneas no se pisan**, gana una
      y la otra conserva su geld.* **Es el invariante 14.** **Migración
      aditiva.**

      > **HECHO (2026-09-21).** `applyBid()` con la fila del lote
      > bloqueada. El test lanza **dos pujas a la vez** y comprueba que
      > gana una y la otra conserva su geld: sin el bloqueo, las dos leen
      > el mismo importe y la segunda pisa a la primera sin que nada se
      > queje.
      >
      > **Cobrar, devolver y guardar son una transacción**, no tres. Y al
      > superado se le devuelve **todo**, no la diferencia.

- [x] **17. La resolución programada.** Idempotente: solo lotes
      abiertos y vencidos. *Test = criterio 6 con el reloj inyectado, y
      que correrla dos veces no adjudique dos veces.*

      > **HECHO (2026-09-21).** `settleLots()`, idempotente por
      > construcción: solo mira lotes **abiertos y vencidos**, así que
      > correrla mil veces adjudica una. El test la corre dos veces y la
      > segunda devuelve 0.
      >
      > El comprador **ya pagó al pujar**, así que al adjudicar solo cobra
      > el vendedor: ése es el sentido de cobrar por delante.

- [x] **18. Poner un lote a la venta, y las cuatro secciones.** Items,
      hechizos, unidades invocables y taberna de héroes. *Test: vender
      lo que no se tiene es error de dominio.*

      > **HECHO (2026-09-21).** Las cuatro secciones, y vender lo que no se
      > tiene es un **422 con su código**, no un 500.
      >
      > La entrega vive en el servidor y no en el núcleo, **porque no es
      > una regla de juego**: la regla —quién gana y por cuánto— está en
      > `market.ts` y es pura. Un hechizo comprado que ya sabías **no se
      > duplica**: en el original no se pueden tener dos copias.

**Ranking**

- [x] **19. Ranking e instantánea diaria.** *Test = criterios 18 y 19:
      ordena por `netPower()` sin recalcular nada, y **un mago protegido
      aparece marcado**.* *Toca `apps/server`.*

      > **HECHO (2026-09-21).** Criterios 18 y 19. Ordena por `netPower()`
      > **sin recalcular nada** (invariante 5), y **un mago protegido
      > aparece marcado**: esconderlo haría que la lista mintiera sobre
      > cuánta gente hay jugando, que es justo lo que un jugador nuevo mira
      > para decidir si se queda.
      >
      > **Ni ejército ni geld**, con test: saber con qué cuenta el rival
      > convierte la guerra en aritmética.

**Cliente**

- [x] **20. `/` — el portal.** Registrar, entrar, crear mago con nombre
      y escuela.

      > **HECHO (2026-09-22).** El portal, con dos cosas que no se callan
      > porque duelen después: **la escuela no cambia durante la
      > temporada** y **un mago por cuenta y servidor**, dichas antes de
      > crear el mago y no cuando el servidor devuelve el error.
      >
      > **Sin sesión o sin mago no es un error, es el primer día**: el
      > cliente manda al portal en vez de enseñar un mensaje rojo que no se
      > puede resolver desde donde está.

- [x] **21. `/habilidades`.** Las diez con **qué cambian en números**, y
      el doble coste fuera de color **en la fila**.

      > **HECHO (2026-09-22).** Las diez con su nivel y **qué cambian en
      > números**.
      >
      > **Y la pasada de navegador encontró un fallo de verdad.** Al nivel
      > 0 la pantalla decía «sin efecto todavía» y nada más, así que **no
      > se podía decidir cuál subir** — que es la única decisión de esta
      > pantalla. Se ve en la captura, no en un test. Ahora dice siempre
      > «+1% de acierto en batalla por rango (todavía no la tienes, +20% al
      > 20)».

- [x] **22. `/mercado`.** Las cuatro secciones, la cuenta atrás en
      tiempo real, y las cuatro cosas que no se pueden callar: pujar
      cuesta un turno, no se puede cancelar, el geld se cobra al pujar,
      y **cuando está vacío lo dice**.

      > **HECHO (2026-09-22).** Las cuatro secciones, la cuenta atrás en
      > tiempo real, y **los cuatro avisos antes del botón**: pujar cuesta
      > un turno, el geld se cobra al pujar, no se puede cancelar, y hay
      > que subir un 5%.
      >
      > **Cuando está vacío lo dice**: «el mercado se llena con lo que
      > ponen los magos — pon tú el primer lote». Un panel en blanco parece
      > roto; uno que lo explica es información. Comprobado en el
      > navegador, que es donde se ve la diferencia entre «vacío» y «no ha
      > cargado».

- [x] **23. `/ranking`.** Net power, tierra y escuela; ni ejército ni
      geld.

      > **HECHO (2026-09-22).** Net power, tierra y escuela. **Ni ejército
      > ni geld**, con comprobación en el navegador además del test del
      > servidor.
      >
      > *Las cuatro pantallas se verificaron en **una sola pasada**, 15
      > comprobaciones, todas en verde.*

      *Las tareas 20 a 23 se verifican en **una sola pasada de
      navegador**, con los criterios 7, 17 y 19 dentro.*

**Calibración**

- [x] **24. ¿Se comen el juego las habilidades?** *Criterio 17: con las
      diez al 20, el net power final sube **menos de un 50%** respecto a
      no tener ninguna.* **Simulación de temporada.** Si se pasa, lo que
      se mueve es el 20%, no la forma.

      > **HECHO (2026-09-22).** Criterio 17 medido: con las diez al 20, lo
      > que de verdad **crea** net power —tierra arrancada y unidades por
      > invocación— sube un **44%**, por debajo del 50% que pedía el
      > criterio. Las demás abaratan o mejoran, pero no crean.
      >
      > **Y tenerlas todas no es una opción**, que es la parte interesante:
      > 2.100 puntos a uno cada 34 turnos son **71.400 turnos**, mucho más
      > que una temporada. La decisión real no es si subirlas, es **cuáles**.
      >
      > El canario sigue en verde: con las diez a 0, los diez
      > multiplicadores valen exactamente 1 y el reparto de ejército sigue
      > siendo el que más net power saca — igual que en la fase 3.

### Magia de la fase 2 — cerrada el 2026-09-21

**Spec y plan: [docs/SISTEMAS.md §7.1](docs/SISTEMAS.md).** Las 15 tareas
hechas y comprobadas: **212 tests en verde**, `tsc -b` en 0, y 13/13 en
navegador. El relato completo está en
[docs/archivo/2026-09-21-magia-fase-2.md](docs/archivo/2026-09-21-magia-fase-2.md).

Lo que hay que saber sin abrir nada:

- **Plain y Verdant, 33 hechizos y 15 unidades invocables**, con los
  nombres del original y la escala de costes sacada de fichas publicadas.
- **El azar del juego estaba sesgado** y ningún test lo veía. Una sola
  implementación ahora, con tests de distribución
  ([docs/SPECS.md §5](docs/SPECS.md), invariante 3).
- **El criterio 10 no se cumple**: el maná sigue sin competir, y ahora se
  sabe por qué — dos tercios de lo que compra no paga hasta que haya
  combate. **Invocar es una trampa hasta la fase 3**, medido con un test.

---

### Fase 1 — implementación

**Specs**: la economía en [docs/SISTEMAS.md §17](docs/SISTEMAS.md), el
estilo visual en [docs/INTERFAZ.md §6](docs/INTERFAZ.md).
**Plan técnico**: [docs/ARQUITECTURA.md §9](docs/ARQUITECTURA.md).
Escrito el 2026-09-21 con `/plan-tarea`.

**Cómo se ataca**, decidido con el usuario el 2026-09-21: **de la 1 a la
21 seguidas**, parando solo si algo falla, si el simulador obliga a mover
números, o si aparece una decisión que no es mía. La **22 (assets) va al
final, en una sesión con el usuario**, así que las tareas 18-21 se
construyen con marcadores de posición — lo que de paso comprueba el
criterio 4 de `INTERFAZ.md §6.7`: la interfaz tiene que funcionar entera
sin ningún asset.

**La comida es capacidad derivada**, no un recurso almacenado
(`ARQUITECTURA.md §9.1`).

**Andamiaje**

- [x] **1. Monorepo.** pnpm workspaces con `core`, `content`, `contract`,
      `apps/server`, `apps/web`; referencias de proyecto de TypeScript,
      Vitest y lint. *Comprobación: `tsc -b` y `vitest` en verde con un
      test trivial por paquete.*

      > **HECHO (2026-09-21).** pnpm workspaces, `tsconfig.base.json` con
      > `strict`, `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes`,
      > referencias de proyecto y Vitest. **`tsc -b` sale 0 y pasan 2
      > tests.** Node 24.18, pnpm 9.12, TypeScript 5.9.3, Vitest 2.1.9.
      >
      > **Distinto de lo planeado**: solo se crearon `core` y `content`.
      > `contract`, `apps/server` y `apps/web` se crean en sus tareas (17
      > y 18) para no instalar React, Fastify y Drizzle antes de
      > necesitarlos. No hay lint todavía: `tsc` en modo estricto cubre lo
      > que importa de momento, y meter ESLint ahora era trabajo sin
      > código que mirar.

**Núcleo — fundamentos**

- [x] **2. Formas del estado y corrigendum del contrato.** `MageState`,
      `Action`, `Ctx`, `Result`, `GameEvent`, sin reglas todavía. Incluye
      los **tres cambios de contrato** de `ARQUITECTURA.md §9.1` y
      actualizar `docs/SPECS.md §1`. *Toca `packages/core`, `docs/SPECS.md`.*

      > **HECHO (2026-09-21).** `types.ts` y `mage.ts` en `core`, con los tres
      > cambios de contrato aplicados a `docs/SPECS.md §1`: `turnsSpent` en
      > lugar de `protectedUntil`, `recruiting`, y **`food` fuera de
      > `resources`**. *Verificado con 6 tests, incluido que la tierra cuadra
      > y que el mago de partida sale con lo que dice SISTEMAS §15.*
      >
      > **De paso se añadió el invariante 11 a `SPECS.md §5`**
      > (`land.total = land.free + Σ buildings`): no estaba escrito porque se
      > daba por obvio, que es como se rompen estas cosas. Y salió
      > `assignment` de la lista, que era de fase 3.
- [x] **3. Devengo de turnos.** `accrue()`. *Tests: acumulación, tope, y
      el caso con trampa del resto al llegar al tope (§9.4).*

      > **HECHO (2026-09-21).** `accrue()` en `core/src/turns.ts`, función
      > pura. *8 tests, y el del detalle con trampa está escrito explícito:*
      > un mago tres días al tope no guarda el resto, así que al gastar un
      > turno **no le entran veinte de golpe**. También cubre el reloj hacia
      > atrás y empezar por encima del tope.
- [x] **4. `apply()`.** El despachador puro: estado nuevo + eventos, o
      error de dominio. *Test: acción desconocida devuelve error, no
      excepción; nunca hay mutación en sitio.*

      > **HECHO (2026-09-21).** `apply()` en `core/src/actions.ts`, con
      > `resolveTurn()` en `tick.ts` haciendo la producción, el mantenimiento y
      > el colapso de cada turno gastado. *Verificado: acción desconocida da
      > `unknown_action`, y un test comprueba que el estado de entrada no se
      > muta.* Se decidió **producir antes de construir** dentro del turno, así
      > que lo que ganas ese turno se puede gastar ese turno.

**Contenido**

- [x] **5. Catálogo.** Los ocho edificios con coste, mantenimiento,
      velocidad y topes; las cinco tropas básicas **solo con su mitad
      económica** (§9.3). Esquemas Zod. *Test: el catálogo entero valida.*

      > **HECHO (2026-09-21).** `packages/content` con los ocho edificios, las
      > cinco tropas, los coeficientes de economía, los topes y el reino de
      > partida. Todo con esquema Zod. *8 tests, incluido que el catálogo
      > entero valida y que el coste de los edificios respeta la proporción
      > del tiempo de construcción del original.*
      >
      > **Sorpresa: la mitad económica de las unidades no estaba en ninguna
      > spec** — `SISTEMAS §8` la tenía `[abierto]`. En vez de inventarla, se
      > derivó del ancla del original (10.000-20.000 tropas al turno 120) y se
      > escribió en **`SISTEMAS.md §8.1`** con su derivación. Cerrada como
      > `[nuestro]`, y marcada como primera tirada a calibrar.
      >
      > **Fallo por el camino**: faltaba declarar `@archmage/core` como
      > dependencia de workspace, y el fichero de test **no falló: desapareció**.
      > El total bajó de 15 a 14 y por eso se vio. Es exactamente el caso que
      > CLAUDE.md avisa.

**Núcleo — economía**

- [x] **6. La sierra del maná.** `manaIncome(nodes, land)` con el `floor`
      único de §9.2. *Tests = criterios 1, 2 y 3 de `SISTEMAS.md §17.1`,
      incluida la tabla de primer-cruce-que-resta por tamaño.*

      > **HECHO (2026-09-21).** `manaIncome()` en `core/src/mana.ts`, con el
      > `floor` único de ARQUITECTURA §9.2. *10 tests = los criterios 1, 2 y 3
      > de SISTEMAS §17.1.*
      >
      > **Y el test tumbó dos afirmaciones de la spec.** Truncar **aplana el
      > pico**: la fórmula exacta tiene un máximo único en 55,99%, pero con
      > enteros empatan 54,99% y 55,99% (y tres valores con 200 acres). Y el
      > primer cruce que resta con 1.000 acres se mueve de 19% a 20%.
      > Corregidos `SISTEMAS §17.1` y `ARQUITECTURA §9.2` con los valores
      > medidos. **Se deja así**: el efecto juega a favor del «sin ayudas»,
      > porque el pico deja de exigir clavar un número exacto.
- [x] **7. Geld, población y comida.** `income()` y `capacity()`.
      *Test = criterio 5: la proporción 3:1 sale sola.*

      > **HECHO (2026-09-21).** `income()` y `populationCapacity()` en
      > `core/src/economy.ts`. *Verificado el criterio 5: con 3 farms por town
      > los dos topes se igualan, con 2:1 manda la comida y con 4:1 el
      > espacio.* El geld va **sin sierra** a propósito: el freno es que cada
      > town es un acre que no es farm, y son las farms las que sostienen la
      > población que produce el geld.
- [x] **8. Upkeep e ingreso neto.** `upkeep()`. *Test: el cuadro del mago
      de 5.000 acres de `SISTEMAS.md §4.2` sale clavado.*

      > **HECHO (2026-09-21).** `upkeep()` y `netIncome()`. *El cuadro de §4.2
      > sale clavado: 97.800 de población, 14.625 de maná, 41.025 de
      > mantenimiento y 45.078 de geld neto, y construirlo entero son
      > 23.485.000.* Esos tests viven en `packages/content` y no en `core`,
      > porque son los únicos que necesitan ver **las reglas y los datos a la
      > vez** y el núcleo no puede importar el contenido.
- [x] **9. Colapso.** Los tres recursos, en cascada, con el azar por
      `RandomSource` y semilla guardada. *Test = criterio 7, construyendo
      el estado, no jugando hasta él.*

      > **HECHO (2026-09-21).** Las tres cascadas de SISTEMAS §5.6, cada una
      > distinta. *9 tests, todos construyendo el estado.* Los forts caen a la
      > mitad, las unidades desertan **antes** de perder edificios, las
      > barriers se deshacen y **sus acres vuelven a estar libres** — si no, el
      > invariante 11 se rompía en silencio. Qué stack se disuelve sale del
      > `RandomSource`: con la misma semilla, el mismo resultado.

**Núcleo — acciones**

- [x] **10. `Build` / `Demolish`.** Velocidad por workshops, acarreo de
      fracciones en punto fijo, coste en geld, tierra libre. *Test de
      propiedad: `land.total = land.free + Σ buildings` tras cualquier
      secuencia (§9.4).*

      > **HECHO (2026-09-21).** Punto fijo en diezmilésimas, como mandaba el
      > plan. *Verificado el corolario publicado del original: **299 workshops
      > construyen exactamente 1 fort y 30 workshops por turno**, y la
      > proporción 2/4/6/60 entre edificios.* El test de propiedad del
      > invariante 11 pasa sobre una secuencia de 8 acciones mezcladas.
- [x] **11. `Explore`.** La curva, el tope de 3.500, y que a 3.500 **no
      gaste el turno**. *Test = criterio 6.*

      > **HECHO (2026-09-21).** La curva pasa por los extremos medidos: 21
      > acres con 200 de tierra (el original mide 18-26), 14 con 1.250, 1 con
      > 3.400, 0 en 3.500. *A tope devuelve `exploration_exhausted` y **no
      > gasta el turno**.*
- [x] **12. `ChargeMana` / `ChargeGeld`.** *Test: duplican el ingreso de
      ese turno y de ningún otro.*

      > **HECHO (2026-09-21).** Multiplicador ×2 aplicado solo en el turno
      > cargado. *Verificado contra un turno normal del mismo mago.*
- [x] **13. `SetRecruit`.** Y la llegada de tropa a lo largo de varios
      turnos. *Test: no gasta turnos al fijarlo; llega escalonada; exige
      espacio y comida.*

      > **HECHO (2026-09-21).** *Verificado que fijarlo **no gasta turnos**,
      > que cobra el geld por adelantado, y que la tropa llega escalonada: 300
      > falanges con 10 barracks entran de 30 en 30.* Unidad desconocida y
      > geld insuficiente dan error de dominio, no excepción.

**Calibración**

- [x] **14. Simulador de temporada.** Y los criterios de
      `SISTEMAS.md §17.2`. **Aquí es donde los números se mueven si hace
      falta**, y se mueven en `content`, no en el código.

      > **HECHO (2026-09-21).** `content/src/simulate.ts` con cuatro repartos
      > de referencia. **No hubo que mover ningún número**, pero la
      > calibración cambió tres criterios, y está todo en `SISTEMAS §17.2`:
      >
      > - **Criterios 10, 11 y 12: cumplen.** 61 turnos de exploración llevan
      >   a 1.250 acres, el reparto de las guías sostiene 13.636 unidades, y
      >   ningún reparto acaba en números rojos.
      > - **Criterio 11 medía en el sitio equivocado**: pedía 5.000 acres, y
      >   **5.000 acres son inalcanzables en la fase 1** — la exploración se
      >   agota en 3.421 y pasar de ahí exige atacar. Reformulado.
      > - **Criterios 9 y 13 no se pueden juzgar todavía.** Sin magia ni
      >   combate el maná no sirve para nada, así que el reparto económico
      >   domina por definición; y sin el poder del ejército, el net power es
      >   ~98% tierra. Aplazados a la fase 3, con el motivo escrito.
      >
      > **Y el simulador mintió primero.** Elegía qué construir por déficit
      > absoluto, no construía towns nunca, y daba ingreso neto negativo con
      > el reparto del original. Era el instrumento, no el juego.

**Persistencia y servidor**

- [x] **15. Postgres.** Drizzle, migraciones aditivas, esquema de mago y
      de eventos.

      > **HECHO (2026-09-21).** Esquema de `mages` y `events`, Postgres 17 en
      > `docker-compose.yml` (puerto **5433** para no chocar con un Postgres
      > local). *Verificado que crear el esquema es idempotente y que los
      > `bigint` vuelven como número y no como texto* — que es el fallo
      > clásico de este driver y habría roto la aritmética entera en silencio.
      >
      > **Distinto de lo planeado**: sin `drizzle-kit`. Con dos tablas y
      > ningún despliegue, una carpeta de migraciones generadas no compra
      > nada; el esquema se crea con SQL aditivo e idempotente. Queda
      > declarado como deuda en `db.ts`: en cuanto haya despliegue, migraciones
      > versionadas.
- [x] **16. Repositorio transaccional.** Bloqueo de fila y estado+eventos
      en la misma transacción. *Test: dos acciones concurrentes sobre el
      mismo mago se serializan (invariantes 4 y 6).*

      > **HECHO (2026-09-21).** `SELECT ... FOR UPDATE` al cargar, estado y
      > eventos en la misma transacción. *El test de concurrencia lanza **diez
      > acciones a la vez** y comprueba que se gastan **diez turnos, no uno**.*
      > Sin el bloqueo, las diez leerían el mismo estado, nueve se pisarían, y
      > **el saldo cuadraría igualmente**: es justo el fallo que no da error.
      >
      > También verificado que un **error de dominio no escribe nada**: ni el
      > estado, ni los eventos, ni siquiera el devengo de turnos.
- [x] **17. Fastify.** `GET /mage/me` ya devengado y
      `POST /mage/me/actions`; errores de dominio como 422; esquemas en
      `packages/contract`. *Toca `packages/contract`: rompe los dos lados
      a la vez, y eso es lo que queremos.*

      > **HECHO (2026-09-21).** `packages/contract` con los esquemas Zod, y
      > cuatro rutas: `/api/health`, `/api/catalog`, `/api/mage/me`,
      > `/api/mage/me/actions` y `/api/mage/me/chronicle`. *15 tests contra un
      > Postgres real, cada uno con **su propia base de datos** creada y
      > borrada en el fichero — nunca la de desarrollo.*
      >
      > Los tres códigos de estado salen como manda el contrato: **400** si la
      > petición no valida, **422** si es un error de dominio («ya no queda
      > tierra que explorar»), 200 con estado nuevo **y eventos**. Ninguna
      > ruta lleva reglas.

**Cliente**

- [x] **18. Andamiaje y tokens.** React + Vite, y los tokens de color y
      tipografía de `INTERFAZ.md §6.2-6.4`. *Test automatizable: los
      criterios 1, 2 y 3 de `INTERFAZ.md §6.7` se calculan sobre los
      tokens sin abrir el navegador.*

      > **HECHO (2026-09-21).** React 18 + Vite 5, y `tokens.ts` con la paleta
      > y la tipografía. *12 tests que calculan los criterios 1, 2 y 3 de
      > INTERFAZ §6.7 sobre los tokens, sin navegador.*
      >
      > **Un test tumbó una suposición**: `toLocaleString('es-ES')` **no separa
      > los miles en números de cuatro cifras** —es la convención del
      > español—, y en pantalla salía «almacén 20.000» junto a «5200» en el
      > mismo panel. Se fuerza `useGrouping: 'always'`: la spec dice
      > «separador de miles siempre» y esta interfaz es columnas de cifras que
      > hay que comparar de un vistazo.
- [x] **19. `/reino`.** Recursos, ingreso neto, reparto de tierra,
      construir, explorar — **sin marcar umbrales ni sugerir óptimos**
      (`INTERFAZ.md §1`).

      > **HECHO (2026-09-21).** Recursos con ingreso **neto**, reparto de la
      > tierra con porcentaje y absoluto, y las cinco acciones. *Verificado en
      > navegador: explorar con 200 acres da 21, exactamente lo que predice la
      > curva.*
      >
      > **Y salió un detalle emergente correcto**: al explorar, el geld neto
      > **baja** (de +3.355 a +3.290), porque más tierra diluye tu porcentaje
      > de towns. La interfaz lo enseña y **no lo explica**, que es justo lo
      > que pide §1.
- [x] **20. `/ejercito` y `/cronica`.**

      > **HECHO (2026-09-21).** Ejército con upkeep total y previsión de
      > reclutamiento; crónica que traduce los eventos a frases. *Verificadas
      > en la misma pasada de navegador.*
      >
      > **Mirar la captura encontró dos cosas que ningún test veía**: la
      > crónica decía «Gastaste 1 turnos en explore» —plural de robot y el
      > nombre interno de la acción—, y en móvil la tabla repetía «En obra
      > 0,00» nueve veces. Las dos corregidas.
- [x] **21. La piel.** Paneles, ornamento y fondos, y los criterios 4 a
      10 de `INTERFAZ.md §6.7`. *Las tareas 19, 20 y 21 se verifican en
      **una sola pasada de navegador**.*

      > **HECHO (2026-09-21).** Paneles, ornamento de esquinas, fondo de
      > escena y la adaptación a móvil. *Una sola pasada de navegador para las
      > tareas 19, 20 y 21, como estaba presupuestado: **12/12
      > comprobaciones**, con capturas en `apps/web/tests/capturas/`.*
      >
      > **La primera pasada falló dos**, y una era una violación de mi propia
      > spec: los avisos se dibujaban **fuera de panel, o sea sobre la
      > ilustración**, que es exactamente lo que el criterio 5 prohíbe. Eran
      > el único texto de la página sin panel debajo. Corregido.
      >
      > Medido: **sin scroll horizontal a 360px**, el área de datos ocupa el
      > **91,1%** del ancho, todas las zonas de toque pasan de 40px, y **con
      > las imágenes bloqueadas la pantalla se lee entera**. El build pesa
      > **63 KB comprimido**, muy por debajo del presupuesto.

**Assets**

- [x] **22. Tanda de fase 1.** 4 fondos, 6 iconos de escuela, 8 de
      edificio, 6 de recurso y 2 de ornamento
      ([docs/ASSETS.md](docs/ASSETS.md)). **Una sola sesión con el
      usuario**, y Nether se mira sobre `#1e1813` antes de dar el set por
      bueno.

      > **HECHO (2026-09-21).** Doce unidades enfrentadas todas contra
      > todas a igual net power, 6 semillas por duelo.
      >
      > - **Criterio 10 ✅.** **Ninguna queda invicta**, y el ciclo es
      >   real: el elemental de tierra gana a todo menos al grifo; el
      >   grifo gana a casi todo porque **vuela y el melee no lo
      >   alcanza**; y al grifo lo bajan la dríade y la ninfa, que pegan a
      >   distancia. No es una escalera, es un corro.
      > - **Criterio 11 ✅.** Lo invocado ya no es net power guardado:
      >   pelea, y a igual net power gana el **97%** de los duelos.
      > - **Criterio 9 de §17.2 ✅**, desbloqueado desde la fase 1: el
      >   resultado depende de **con qué vayas**, no solo de cuánto
      >   lleves.
      > - **Criterio 13 de §17.2 ✅.** Con el doble de net power se gana
      >   **9 de cada 10** batallas. No 10 de 10, y eso es deseable.
      >
      > **Y se cayó una suposición nuestra: `powerRank` no es un precio de
      > balance.** Entre las **siete fichas publicadas** el valor de
      > combate por punto de net power va de **30** (Arquero élfico) a
      > **157** (Treant) — un factor de **5,2**, con datos del original.
      > Mide cuánto ocupas en la tabla, no cuánto rindes en batalla.
      >
      > **Consecuencia declarada:** *Arqueros* y *Caballería* no ganan un
      > solo duelo a igual net power. No es un fallo de interpolación —los
      > dos caen dentro de la banda de las publicadas, y el Arquero
      > élfico, que es `[orig]`, está igual de abajo—: es que el net power
      > no es la moneda con la que se compran. Una Caballería cuesta 150
      > de geld y una Milicia 20.

---

## Fase 1 — Reino

Gestionar un reino de verdad, solo. Sin magia y sin guerra.

> **Cerrada el 2026-09-21**, salvo los assets. El detalle de cada tarea,
> con lo que salió distinto de lo planeado, está en el bloque «Fase 1 —
> implementación» de «En curso». **122 tests en verde, `tsc -b` en 0, y
> 12/12 comprobaciones en navegador.**

- [x] Monorepo: pnpm workspaces, `packages/core`, `content`, `contract`,
      `apps/server`, `apps/web`. `tsc -b` y Vitest funcionando en todos.
- [x] **El devengo de turnos** como función pura, con sus tests
      ([docs/SPECS.md §3](docs/SPECS.md)). Es la pieza de la que cuelga
      todo lo demás.
- [x] `apply()` y la forma de `MageState`
      ([docs/SPECS.md §1-2](docs/SPECS.md)).
- [x] Tierra y los ocho edificios, con la fórmula de construcción por
      workshops y el acarreo de fracciones.
- [x] Economía: geld, maná, población y comida, con la curva de
      decrecimiento por porcentaje y los topes de efectividad.
      **Los topes de efectividad están como dato en `content`
      (`EFFECT_CAPS`) pero todavía no los usa nadie**: solo importan en
      defensa, que es la fase 3. Declarado, no olvidado.
- [x] Colapso por cada uno de los tres recursos, y el aviso previo en la
      interfaz.
- [x] Explorar.
- [x] Reclutamiento de tropa básica (llega a lo largo de varios turnos).
- [x] Postgres, migraciones y persistencia del estado + eventos en una
      transacción.
- [x] Servidor Fastify: `GET /mage/me`, `POST /mage/me/actions`.
- [ ] Cliente: portal, `/reino`, `/ejercito`, `/cronica`.
      **Tres de cuatro.** `/reino`, `/ejercito` y `/cronica` están; **el
      portal no**, porque no hay cuentas ni autenticación y no habría qué
      poner en él. Se cierra cuando lleguen las cuentas
      ([docs/ARQUITECTURA.md §9.6](docs/ARQUITECTURA.md)).
- [x] Simulador de temporada contra el núcleo, para calibrar los números
      abiertos.

## Fase 2 — Magia

- [ ] Libro de hechizos por escuela y rango, con la rueda de adyacencia.
- [ ] Investigación dependiente de guilds, y el nivel de hechizo.
- [ ] Lanzar: cast turns, coste aunque falles, fallo por concentración.
- [ ] Encantamientos con upkeep, propios y ofensivos.
- [ ] Invocación de unidades.
- [ ] Contenido: **Plain + una escuela completa** antes que las seis a
      medias.
- [ ] Cliente: `/magia`.

## Fase 3 — Guerra

- [ ] Stacks, orden de batalla, iniciativa, arrastre de daño, fatiga.
- [ ] Habilidades de unidad como datos, no como casos especiales.
- [ ] Los tres ataques: regular, siege, pillage.
- [ ] Forts y barriers en defensa. Muerte a 0 forts.
- [ ] Assignment.
- [ ] Batallas reproducibles por semilla, y `/batalla/:id`.
- [ ] Previsualización del ataque en el cliente con el mismo núcleo.
- [ ] Cliente: `/guerra`.

## Fase 4 — Mundo

**Spec escrita el 2026-09-21**, en
[docs/SISTEMAS.md §12.1](docs/SISTEMAS.md). Ver «En curso».

- [ ] **Cuentas**: registro, sesión, un mago por cuenta y servidor.
- [ ] Mercado negro: subasta entre jugadores, cuatro secciones.
- [ ] Items: generación por guilds, catálogo de veinte, robo al pillar.
- [ ] Héroes: experiencia, niveles, taberna.
- [ ] Las 10 habilidades, cerradas en +1% por rango.
- [ ] Ranking por net power.
- [ ] Cliente: `/`, `/mercado`, `/ranking`, `/habilidades`.

*(Héroes en batalla y items en combate **ya están hechos** desde la fase
3: reparto, bonus de eficiencia, muerte con el stack, assignment y los
cuatro items publicados.)*

## Fase 5 — Temporada

**Spec escrita el 2026-09-22**, en
[docs/SISTEMAS.md §14.1](docs/SISTEMAS.md). Ver «En curso».

- [x] Gremios: cinco fundadores, listas, y **no se ataca a los tuyos**.
- [x] Aliados: refuerzos automáticos **menos sus dos mejores stacks**.
- [ ] NAP y diplomacia.

      *Lo único que la fase 5 deja fuera, y a propósito: sin tratados que
      romper, una lista de enemigos declarados no cambiaría ninguna regla.
      Declarado en el docstring de `guild.ts`.*

- [x] Mensajería: directos, tablón de gremio y **bloqueo**.
- [x] **Dos servidores**: normal y rápido, con temporadas independientes.
- [x] **Armageddon: los siete sellos** y la fecha tope de 90 días.
- [x] Hall of Fame, Hall of Immortals y reset que **archiva, no borra**.
- [x] Cliente: `/gremio`, `/mensajes`, `/temporada`.

---

## Cerrado

*(Nada todavía. Los bloques cerrados dejan aquí una línea con la fecha y
adónde fue a parar lo aprendido; si el relato tiene valor, va a
`docs/archivo/`.)*

- **2026-09-21 — Documentación inicial.** Se investigó el juego original
  contra la wiki oficial ([docs/ORIGINAL.md](docs/ORIGINAL.md)), se
  revisó la arquitectura del PDF y se sustituyó
  ([docs/ARQUITECTURA.md §8](docs/ARQUITECTURA.md)), y se escribió el
  conjunto de `docs/`. **La investigación refutó tres cosas del PDF**: lo
  que regenera con el reloj son los turnos y no el maná, los edificios
  son ocho con fórmulas publicadas y no cuatro supuestos, y el combate no
  es una comparación de totales.

  **Validado por el usuario el 2026-09-21**: la arquitectura
  ([docs/ARQUITECTURA.md](docs/ARQUITECTURA.md)), el alcance de juego
  completo por fases, y la corrección del maná —desmintió su propio
  recuerdo de los 8 minutos: eran los turnos—. `docs/` queda como
  documentación definitiva; a partir de aquí se cambia con `/spec`, no a
  mano.
