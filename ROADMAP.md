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

### Guerra de la fase 3 — spec escrita, sin implementar

**Spec y criterios de aceptación:
[docs/SISTEMAS.md §9.1](docs/SISTEMAS.md).** Escrita el 2026-09-21 con
`/spec`. La investigación que la sostiene, en
[docs/ORIGINAL.md §9.1-9.5](docs/ORIGINAL.md).

Qué cerró:

- **La fórmula de daño está publicada**, y también la del acierto, la
  fatiga y el emparejamiento. Eran cuatro marcas `[abierto]` y ya no lo
  son.
- **Las fichas de unidad también**, con su `Power Rank` — que cierra de
  paso el `[abierto]` del coeficiente de poder en net power.
- **Alcance: los tres ataques, más héroes e items de batalla.** Es el más
  grande de los que se plantearon, elegido a sabiendas.
- **Doce criterios de aceptación**, nueve de test y tres de simulación.

**Lo que obliga a hacer antes, y no es menor.** Los upkeeps de unidad que
inventé en las fases 1 y 2 **están mal por un factor de entre 40 y 100**:
la Dríade cuesta 0,01 de maná y yo puse 1; el Treant 0,63 y yo puse 24.
Se corrigen a los números del original, y eso **invalida las cifras
medidas de las fases 1 y 2**: hay que rehacer la calibración, y es el
criterio 12 de §9.1.

**Lo que esta fase desbloquea**: el criterio 10 de `SISTEMAS §7.1` falló
en la fase 2 porque **invocar no paga sin combate**. Éste es el que lo
arregla, y con él los criterios 9 y 13 de §17.2, aplazados desde la
fase 1.

**Plan técnico**: [docs/SISTEMAS.md §9.1](docs/SISTEMAS.md), apartado
«Plan técnico». Escrito el 2026-09-21.

**Decidido con el usuario el 2026-09-21:**

- **Los rivales son magos sembrados** de distintos tamaños y
  composiciones, creados al arrancar. No juegan: están para atacarlos y
  para que te ataquen. Se borran el día que haya cuentas. **Lo que se
  mida contra ellos dice cómo funciona el combate, no cómo juega un
  humano**, y eso queda dicho.
- **Se para en la tarea 3**, tras recalibrar. Los upkeeps bajan entre 40
  y 100 veces, y si eso desequilibra la economía hay que decidir qué se
  mueve **antes** de tener el combate encima.

**Las fichas, y la deuda de atrás**

- [x] **1. La ficha de combate de una unidad.** Ataque, contraataque,
      ataque extra, HP, iniciativa, tipos de daño, habilidades, tabla de
      resistencias y `powerRank`. Y el **upkeep en punto fijo**, porque
      los valores publicados son fraccionarios.
      *Test: la ficha del Treant sale clavada — 4.200/1.680/2.500/4.200,
      iniciativa 1, powerRank 423.* **Cambia el contrato.**
      *Toca `packages/core` y `packages/content`.*

      > **HECHO (2026-09-21).** `packages/core/src/units.ts` con
      > `UnitSpec` entero: ataque, ataque extra con su propia iniciativa,
      > contraataque, HP, 12 tipos de daño, 19 habilidades como lista
      > cerrada, resistencias por tipo y por escuela, y `powerRank`. El
      > upkeep va en **centésimas** y `upkeep()` redondea **una sola vez**
      > al sumar el ejército entero. Test: la ficha del Treant sale
      > clavada (4.200/1.680/2.500/4.200, iniciativa 1, rank 423).
      >
      > **Lo que apareció y no estaba previsto:** `netPower()` dejaba el
      > ejército fuera **porque este `powerRank` estaba `[abierto]`** —lo
      > decía en su propio docstring—. Cerrarlo aquí obligaba a
      > arreglarlo, y resultó ser lo que más movió la recalibración de la
      > tarea 3. Se cambió la firma a `netPower(state, catalog)` con el
      > catálogo **obligatorio**, no opcional, y eso es ahora el
      > invariante 12 de docs/SPECS.md.

- [x] **2. Las veinte unidades con sus números reales.** Las 15
      invocables de Verdant y las 5 de barracks. *Test: los upkeeps son
      los publicados — Dríade 0,01 de maná, Treant 0,63, Fénix 60 — y
      **ya no los que me inventé**.*

      > **HECHO (2026-09-21).** Veinte unidades en
      > `packages/content/src/units.ts`: **siete con ficha publicada**
      > (Milicia, Dríade, Ninfa, Arquero élfico, Druida, Treant, Fénix) y
      > trece interpoladas con una regla escrita,
      > `powerRank ≈ 6 × √(ataque × HP)`. 18 tests, y las siete
      > publicadas se comprueban **número a número**.
      >
      > **Se cayeron dos premisas más, además de los upkeeps de maná:**
      > la tropa de barracks también estaba mal (la Milicia cuesta **20**
      > de geld, no 60, y **0,32** de upkeep, no 1), y **varias unidades
      > invocadas cuestan geld además de maná** —el Arquero élfico, 1,04—,
      > cosa que la fase 2 daba por imposible. Tres tests de las fases 1 y
      > 2 afirmaban los números viejos y se corrigieron; el del colapso
      > por geld **ya no se puede provocar con tropa barata**, porque una
      > falange cuesta 0,60 y la población que la aloja rinde 0,75: hace
      > falta caballería.

- [x] **3. Recalibrar las fases 1 y 2.** Rehacer la simulación de §17.2
      con los upkeeps corregidos. *Criterio 12 de §9.1: los criterios 10,
      11 y 12 de §17.2 siguen cumpliéndose, o se dice cuál no y por qué.*
      **Va aquí y no al final**: si los upkeeps rompen la economía, mejor
      saberlo antes de construir el combate encima.

      > **HECHO (2026-09-21).** Rehecha la simulación. Resultado completo
      > en docs/SISTEMAS.md §17.2; el resumen, en §9.1, «Lo que la
      > recalibración midió, y lo que dejó abierto».
      >
      > **Tres veredictos cambiaron, y ninguno por el upkeep en sí:**
      >
      > - **Criterio 13, desbloqueado y cumpliendo.** Estaba aplazado
      >   desde la fase 1 porque el net power era ~98% tierra. Con el
      >   ejército dentro va del **50%** de tierra (reparto de ejército)
      >   al **79%** (guías): ya distingue estrategias.
      > - **«Invocar es una trampa» era falso**, y lo era **por
      >   construcción**: sin `powerRank`, lo invocado no podía sumar, así
      >   que ninguna medición podía salir de otra forma. Corregido, el
      >   reparto de ejército es **el que más net power saca** de los
      >   cuatro (2.531.586 contra 2.188.345 del económico).
      > - **Criterio 11, roto.** El ejército sostenible a 600 turnos pasa
      >   de **13.636** a **29.838**, fuera de las 10.000-20.000 del
      >   original; con milicia pura, **85.225**.
      >
      > **El criterio 12 sigue cumpliendo**, y ahora también medido
      > jugando con magia, que antes no se comprobaba.
      >
      > **La causa del 11 no es el upkeep**, que es `[orig]`: es que el
      > ingreso de la fase 1 se calibró contra un upkeep medio de **2
      > geld inventado** cuando el real es **0,914**. El ingreso quedó
      > **2,19 veces generoso**. Se arregló de paso un número obsoleto
      > que lo escondía: `sustainableArmy` dividía por ese 2 a mano, y
      > ahora sale del catálogo.
      >
      > **Se para aquí**, como estaba decidido. Qué se mueve —bajar el
      > ingreso, subir el coste de recluta, o aceptar ejércitos mayores—
      > está `[abierto]` en §9.1 con las tres salidas y sus
      > consecuencias, y es decisión del usuario.
      >
      > Suite: **233 tests en verde** (eran 212), `tsc -b` en 0.

- [x] **4. Bajar el ingreso a los valores del original.** *Decidido por
      el usuario tras ver la recalibración de la tarea 3: «todo tiene que
      ser como el original».*

      > **HECHO (2026-09-21).** Y salió otra cosa de la que se pedía.
      >
      > **Fui a buscar los valores del original para bajarlos y resultó
      > que estaban publicados.** La economía estaba en
      > docs/ORIGINAL.md §11 como «sin verificar» —«cuánto geld da un
      > town, cuánta comida una farm, cuánta población cabe en un
      > town»— y la wiki la documenta entera. Está ahora en **§4.2**,
      > confianza alta, y sale de §11.
      >
      > **Lo adoptado**, todo `[orig]`:
      >
      > - Geld por turno: `Pob × √((100 + 10×towns) / tierra) + 1.000`.
      >   Con **rendimiento decreciente** en los towns, con el geld por
      >   cabeza pudiendo **bajar de 1** si creces en tierra sin
      >   construir towns, y con **suelo de 1.000**. Nuestra recta
      >   `Pob × (0,75 + 2×%towns)` no tenía ninguna de las tres.
      > - Espacio y comida son **dos topes separados**: espacio =
      >   `towns×1.000 + farms×100` (se **suman**), comida =
      >   `farms×500`. Teníamos `min(towns×300, farms×100)` — mal de
      >   escala **y de forma**.
      > - Crecimiento 50 + 1,5%: **ya lo teníamos bien**.
      >
      > **El encargo era bajar el ingreso y los números publicados lo
      > suben.** Los topes reales alojan **4,3 veces más gente en la
      > misma tierra**, y el ingreso *es* la población. Aun así el
      > criterio 11 encaja, porque el problema no era que el mago fuera
      > rico: **se estaba midiendo en el turno 600 un ancla que el
      > original da para el turno 120**, y en el turno 120 nuestro mago
      > estaba artificialmente pobre.
      >
      > **Tres criterios se arreglaron:**
      >
      > - **11 de §17.2** ✅ vuelve a cumplirse. En el turno 120 el
      >   reparto de ejército sostiene **19.242** unidades, dentro de la
      >   banda 10.000-20.000; los otros tres la bracketean (9.592,
      >   9.725, 22.937).
      > - **10 de §7.1** ✅ **cumple por primera vez.** El reparto
      >   volcado a maná acaba en 3.301.483 de net power contra
      >   2.526.383 del económico: gana por un 31%. Sin magia pierde,
      >   así que es la magia la que le da la vuelta.
      > - **13 de §17.2** ✅ la tierra baja del 98% al **37-55%** del net
      >   power, y el orden de los repartos cambia: los dos que compran
      >   ejército se ponen delante.
      >
      > **Dos consecuencias que no se buscaban:**
      >
      > - **Del geld solo ya no se muere.** Con el suelo de 1.000, un
      >   mago con un fort se recupera (43.541 de geld a los 40 turnos) y
      >   uno con 40 forts **se estabiliza en 10**, donde el
      >   mantenimiento iguala al suelo. Perder el último fort pide
      >   guerra. Es del original, no decisión nuestra.
      > - **La proporción de equilibrio es 2,5 farms por town, no 3** — y
      >   eso **explica** el 3:1 de las guías: a 3:1 sobran 200 de comida
      >   por town, que es lo que se come el ejército. Las dos cifras de
      >   las fuentes dejan de contradecirse.
      >
      > *Toca `packages/core` (`economy.ts`, `EconomyTuning`) y
      > `packages/content`.* Suite: **248 tests en verde** (eran 233),
      > `tsc -b` en 0.

**El combate, pieza a pieza**

- [ ] **5. La fórmula de daño.** *Test = criterio 1 de §9.1, con el
      número exacto: 1.000 Treants contra Dríades matan **9.000**.*
- [ ] **6. El acierto.** Base 30, **20 en asedio**, y la fórmula a tramos
      para los modificadores. *Test = criterio 2: el asedio hace
      exactamente dos tercios del daño.*
- [ ] **7. Resistencias por tipo de daño.** Media con varios tipos, y la
      debilidad metiendo −50%. *Test = criterio 4: el Treant recibe tres
      veces más daño de fuego que de melee.*
- [ ] **8. Habilidades defensivas.** Healing 0,7, scales 0,75,
      regeneration 0,8, charm 0,5, large shield 0,5, weakness 2,0,
      multiplicándose. *Test: cada una por separado y dos combinadas.*
- [ ] **9. Orden de stacks y emparejamiento.** Multiplicadores
      1,0/1,5/2,25; voladores y distancia pegan a todo, melee solo a
      tierra; objetivo solo si vale ≥10%. *Test = criterio 5: melee puro
      contra voladores puros **no hace daño**.*
- [ ] **10. Fatiga.** −15 por primario o contraataque, −10 con
      *Endurance*, los secundarios no. *Test = criterio 3, incluido que
      **un stack de 1 fatiga igual que uno de 20.000**.*
- [ ] **11. La ronda.** Orden de iniciativa, ataques extra con la suya,
      y contraataques. *Test: el orden sale reproducible con la semilla.*
- [ ] **12. La batalla entera.** Pre-batalla, batalla y post-batalla, con
      **semilla guardada y log ronda a ronda**. *Test = criterio 6: misma
      semilla, log idéntico.*
- [ ] **13. Quién gana, y el bonus de batalla.** *Test = criterio 7: con
      9% de bajas el defensor no pierde tierra; con 11%, sí.*
- [ ] **14. La tierra y los tres ataques.** Regular 5%, asedio 10%, un
      tercio para el atacante, 50 supervivientes por acre, y el saqueo.
      *Test = criterio 8, con el ejemplo trabajado del original.*

**Héroes e items**

- [ ] **15. Héroes en batalla.** El de mayor nivel lidera el stack más
      potente; bonus de eficiencia igual a su nivel; mueren con su stack.
      *Test: el reparto de héroes es determinista, y el bonus se aplica
      solo con su raza y color.*
- [ ] **16. Items de batalla y assignment.** Usarlos en combate, y que se
      disparen solos al defenderse según el porcentaje de ejército
      enemigo. *Test: en defensa **no se pueden bloquear**.*

**Varios magos, y la persistencia**

- [ ] **17. Que exista contra quién luchar.** Hoy solo hay un mago.
      *Test: hay objetivos, y el límite del 50% de net power para el
      saqueo se aplica.*
- [ ] **18. La tabla de batallas y el bloqueo de dos filas.** Siempre
      **por id ascendente**. *Test contra Postgres: dos ataques mutuos
      simultáneos **no se bloquean entre sí**, y la batalla queda
      guardada con su semilla.*
- [ ] **19. La acción y las rutas.** `attack` en el contrato, el
      resultado con su log, y la ruta de la batalla.
      *Toca `packages/contract` y `apps/server`.*

**Cliente**

- [ ] **20. `/guerra`.** Lista de objetivos, los tres ataques como tres
      decisiones, el coste del upkeep dicho antes, y la previsión **con
      un rango, no con un número**.
- [ ] **21. `/batalla/:id`.** La repetición ronda a ronda, con el acierto,
      la resistencia y la eficiencia que se aplicaron. *Las tareas 19 y 20
      se verifican en **una sola pasada de navegador**.*

**Calibración**

- [ ] **22. ¿Compite ya el maná?** *Criterio 11 de §9.1, y **el que cierra
      los criterios 9 y 13 de §17.2**, aplazados desde la fase 1.* Y el
      criterio 10: ningún ejército de una sola unidad domina.

---

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

- [ ] **22. Tanda de fase 1.** 4 fondos, 6 iconos de escuela, 8 de
      edificio, 6 de recurso y 2 de ornamento
      ([docs/ASSETS.md](docs/ASSETS.md)). **Una sola sesión con el
      usuario**, y Nether se mira sobre `#1e1813` antes de dar el set por
      bueno.

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

- [ ] Varios magos y ranking.
- [ ] Mercado negro: items, hechizos ancient, taberna.
- [ ] Items: generación por guilds, uso, assignment.
- [ ] Héroes: niveles, liderazgo de stacks, bonus de eficiencia.
- [ ] Las 10 habilidades.
- [ ] Cliente: `/mercado`, `/ranking`.

## Fase 5 — Temporada

- [ ] Gremios, aliados y refuerzos automáticos.
- [ ] NAP y diplomacia.
- [ ] Varios servidores a velocidades distintas.
- [ ] Armageddon, Hall of Fame y reset de temporada.
- [ ] Cliente: `/gremio`.

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
