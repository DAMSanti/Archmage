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

### Magia de la fase 2 — spec escrita, sin implementar

**Spec y criterios de aceptación:
[docs/SISTEMAS.md §7.1](docs/SISTEMAS.md).** Escrita el 2026-09-21 con
`/spec`. La investigación que la sostiene, en
[docs/ORIGINAL.md §6.1-6.4](docs/ORIGINAL.md).

Qué cerró:

- **Plain + Verdant**, elegida por ser **la escuela mejor documentada**
  del original: catorce hechizos nombrados, quince unidades y fichas
  completas de tres rangos. Menos documentación es más números
  inventados, y aquí hay poco que inventar.
- **La escala de costes por rango está publicada** y sale de fichas
  reales: Simple 3.000 de maná, Average 7.900, Complex 30.000-77.700.
  Solo Ultimate queda `[abierto]`, extrapolado.
- **Los multiplicadores fuera de color**, publicados: un Complex de
  escuela opuesta cuesta **6×**. La rueda deja de ser decorativa.
- **La escala del nivel de hechizo**, publicada, con sus máximos por
  servidor.
- **Los ofensivos y los de batalla quedan fuera hasta la fase 3**, con
  sus nombres reservados para que nadie los vuelva a «descubrir». Un
  hechizo que apunta a otro mago no se puede comprobar sin otro mago.
- **Once criterios de aceptación**, nueve de test del núcleo y dos de
  simulación.

**Lo que esta fase desbloquea**: los criterios 9 y 13 de
`SISTEMAS §17.2` están aplazados desde la fase 1 porque **sin magia el
maná no sirve para nada** y el reparto económico domina por definición.
El criterio 10 de §7.1 es exactamente el que los reabre.

**Plan técnico**: [docs/SISTEMAS.md §7.1](docs/SISTEMAS.md), apartado
«Plan técnico». Escrito el 2026-09-21.

**Confirmado con el usuario el 2026-09-21**: los encantamientos de
combate van **en el catálogo con sus costes pero no lanzables** hasta la
fase 3, y se atacan **las 15 tareas seguidas**.

**La rueda y los costes**

- [x] **1. La rueda de adyacencia.** Qué escuela es adyacente, opuesta o
      propia de cuál, y qué rangos puede investigar cada una.
      *Test: un Verdant investiga Complex de Ascendant y Eradication pero
      no de Nether ni Phantasm — el criterio 1 de §7.1.*
      *Toca `packages/core`.*

      > **HECHO (2026-09-21).** `core/src/magic.ts`. *8 tests, incluido que
      > la rueda es **simétrica** y que cada color tiene exactamente dos
      > adyacentes y dos opuestas — si alguien la edita mal, salta.*
      >
      > **Decisión que hubo que tomar**: `plain` no está en el círculo. Se
      > resolvió que **Plain es color propio para todos** (si no, un mago
      > Plain no podría lanzar ni su propia magia) y que **un mago Plain no
      > tiene color propio**, así que todo lo demás le queda de opuesto. Es el
      > precio de no especializarse, y está escrito en `SISTEMAS §6`.
- [x] **2. El coste fuera de color.** La tabla 100/125/150/200/350/600
      según rango y distancia. *Test = criterio 2: un Complex opuesto
      cuesta exactamente 6× su Cast M.P.*

      > **HECHO (2026-09-21).** *6 tests con la tabla entera de ORIGINAL §6.1.*
      > Un Ultimate fuera de color devuelve `null` —no es que sea caro, es que
      > **no se puede lanzar**— y el multiplicador de 1,25 del Simple adyacente
      > se trunca **una sola vez**, como manda el invariante 7.
- [x] **3. El nivel de hechizo.** +1/+3/+7/+20/+15 al aprender, y el
      máximo del catálogo. *Test = criterio 4, y que el máximo sale
      reproducible del catálogo.*

      > **HECHO (2026-09-21).** *3 tests.* Incluye el **+15 de Ancient**, que
      > la primera investigación no tenía y apareció al ampliarla.

**El catálogo**

- [x] **4. La forma de un hechizo y de su efecto.** Esquema Zod, con el
      efecto como **forma cerrada** —invocar, encantar, recurso—, no un
      nombre que el núcleo tenga que reconocer. *Test: el catálogo valida,
      y añadir una entrada no toca `core`.*
      *Toca `packages/content` y `packages/core` (los tipos).*

      > **HECHO (2026-09-21).** `core/src/spells.ts`. El efecto es una **forma
      > cerrada** —`summon`, `enchantment`, `resource`, `combat`—, así que
      > añadir un hechizo es añadir una entrada de datos. *Comprobado con un
      > test: todo lo que no es `combat` se puede lanzar, y todo lo `combat`
      > no.*
      >
      > **Cambió el contrato sin estar previsto**: las unidades invocadas
      > cuestan **maná** de mantener, no geld, y `UnitEconomySpec` no tenía
      > `upkeepMana`. Se añadió al tipo, al esquema Zod y a `upkeep()`. Es lo
      > que hace a Verdant «muy intensiva en maná» como dice el original, y lo
      > que da sentido a volcar la tierra en nodes.
- [x] **5. Plain y Verdant, el catálogo entero.** Los hechizos con sus
      cuatro costes; los de combate **marcados como no lanzables hasta la
      fase 3**. Las unidades invocables con su mitad económica.
      *Test: los tres hechizos con ficha publicada salen clavados —
      Dryad 3.000/900, Nymph 7.900/1.400, Regeneration 30.000/3.000.*

      > **HECHO (2026-09-21).** **33 hechizos** y **15 unidades invocables**,
      > todas con nombre confirmado en el original. *22 tests.*
      >
      > Las tres fichas publicadas salen clavadas, y **también los costes
      > sueltos que rompen la escala**: *Web of the Spider Woman* cuesta 600 y
      > no 3.000, *Call Hurricane* 20.000, *Sunray* 100 de upkeep. Cuando el
      > original y la escala se contradicen, **manda el original**, y hay un
      > test que lo fija.
      >
      > **Una estimación del plan salió mal**: decía que el nivel máximo del
      > catálogo sería «del orden de 150», y son **207**. Medido y expuesto
      > como `MAX_SPELL_LEVEL`, porque es lo que escala las invocaciones.
      > Corregido en `SISTEMAS §7.1`.
      >
      > Cada entrada lleva su `source` con tres niveles que **no se mezclan**:
      > `[orig] ficha` (los cuatro costes publicados), `[orig] nombre` (existe
      > en el original, números por escala) y `[nuestro]` (inventado, con su
      > porqué). Un test comprueba que ninguna entrada se queda sin decirlo.

**Las reglas**

- [x] **6. Investigar.** Progreso por turno según guilds, sin duplicados.
      *Test = criterio 5: investigar algo sabido es error de dominio y no
      gasta nada.* **Cambia el contrato**: `spellbook.researching` pasa a
      llevar progreso.

      > **HECHO (2026-09-21).** Progreso por turno = guilds x 2 dedicado, la
      > mitad pasivo. *Calibrado contra el criterio 11: el catálogo son
      > 117.100 puntos, y un mago del turno 120 (125 guilds) tarda **469
      > turnos** — dentro de los 300-600 que le corresponden a una escuela
      > según el original.* 7 tests.
      >
      > **Decisión que hubo que tomar**: cambiar de hechizo **tira el progreso
      > del anterior**. Es lo que hace que elegir qué investigar importe.
- [x] **7. El libro de hechizos.** Qué puede investigar este mago y a qué
      precio le saldría lanzarlo. Función de consulta pura, para que la
      pantalla no recalcule nada.

      > **HECHO (2026-09-21).** `spellbookFor()`, consulta pura. *Verificado
      > que enseña **el precio que pagaría él**: 3.000 en color, 35.000 el
      > mismo rango en la opuesta.* Lo que no puede aprender no aparece.
- [x] **8. Lanzar, con sus cast turns.** Maná cobrado **al iniciar**,
      turnos consumidos de verdad. *Test = criterio 7: un hechizo de 4
      turnos no surte efecto hasta el cuarto.* **Cambia el contrato**:
      columna `casting`.

      > **HECHO (2026-09-21).** *Verificado el criterio 7 literal, y que **el
      > maná se cobra al iniciar**: con 1 turno de 4 gastado ya está pagado.*
      > La columna `casting` se añade con `ALTER TABLE ... IF NOT EXISTS`, así
      > que una base de datos de la fase 1 sigue funcionando sin tocar nada.
- [x] **9. Fallar por concentración.** Nunca en color; fuera de color
      según rango, distancia y nivel. *Test = criterio 3, con la semilla
      fijada en un fallo: el maná baja y el efecto no ocurre.*

      > **HECHO (2026-09-21).** En color **nunca falla**, que es lo que hace
      > valiosa tu escuela; fuera de color la base va del 10% al 50% según
      > rango y distancia, y el nivel de hechizo la baja hasta la mitad.
      >
      > **Y aquí saltó el fallo más serio de la fase.** El test de
      > concentración fallaba «cinco de cinco» con un 30% de probabilidad.
      > No era el test: **el generador de azar tenía un sesgo**. Era un
      > xorshift32 sembrado directamente, con **tres copias** en el
      > repositorio, y con semillas pequeñas las primeras tiradas salían casi
      > cero — con semilla 1, 0,00006. Toda comprobación del tipo «¿sale menos
      > que el umbral?» **se cumplía siempre**.
      >
      > Ninguno de los 186 tests de entonces estaba en rojo. Lo destapó
      > implementar esta tarea. Ahora hay **una sola implementación**
      > (`core/src/random.ts`, splitmix32) con **9 tests de distribución sobre
      > 200 semillas**, y el invariante 3 de `SPECS.md` lo dice explícito:
      > determinista no basta, tiene que estar bien distribuido desde la
      > primera tirada.
- [x] **10. Invocar.** Cantidad escalada por nivel de hechizo, contra el
      máximo de **nuestro** catálogo. *Test = criterio 8: si no cabe en la
      población, falla **sin cobrar** el maná.*

      > **HECHO (2026-09-21).** Escalado contra `MAX_SPELL_LEVEL` = 207, el de
      > **nuestro** catálogo. *Verificado el criterio 8: sin sitio, error de
      > dominio y el maná intacto.* A nivel cero se invoca el 25%; a nivel
      > máximo, el rango entero.
- [x] **11. Encantar.** Solo los económicos. Potencia **congelada al
      lanzar**, no recalculada. *Test = criterio 6: no se puede lanzar dos
      veces, y su upkeep aparece en el ingreso neto.*

      > **HECHO (2026-09-21).** Solo los económicos, como decidiste. *Los
      > modificadores se **congelan al lanzar**, no se recalculan* — [orig],
      > y verificado con un test.
      >
      > Los modificadores se **multiplican** entre sí: +25% y +15% dan 143,75%,
      > no 140%. Y los seis que existen —comida, geld, maná, población,
      > construcción, investigación— son una lista cerrada: ampliarla es una
      > decisión de diseño, no un detalle.

**Servidor y cliente**

- [ ] **12. Las tres acciones en el contrato y el servidor.** `Research`,
      `CastSpell`, `DispelEnchantment`, más la migración aditiva de
      `casting`. *Tests contra Postgres real.*
      *Toca `packages/contract` y `apps/server`.*
- [ ] **13. `/magia`.** Libro, investigación en curso, lanzamiento en
      curso y encantamientos activos, con las reglas de
      [docs/INTERFAZ.md §3.1](docs/INTERFAZ.md). *Se verifica en **una
      sola pasada de navegador** con la tarea 14.*
- [ ] **14. La crónica y el reino, al día.** Los eventos nuevos
      traducidos a frases, y el upkeep de encantamientos visible en el
      ingreso neto. *Misma pasada de navegador que la 13.*

**Calibración**

- [ ] **15. ¿Compite ya el maná?** Rehacer la simulación de §17.2 con
      magia. *Criterio 10 de §7.1, y **el que reabre los criterios 9 y 13
      de §17.2**, aplazados desde la fase 1.* Aquí es donde se mueven los
      precios si hace falta — en `content`, no en el código.

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
