# Estado

**Las cifras medidas de hoy.** Ningún número de este documento es una
estimación: o está medido, o dice que no lo está.

Sirve para dos cosas: que nadie tenga que adivinar cuánto tarda algo, y
que se note cuando un documento afirma algo que ya no es cierto.

**Última actualización: 2026-09-21** (fase 1 implementada, tareas 1 a 21).

---

## 1. Código

El repositorio contiene, a día de hoy:

| | |
|---|---|
| Documentos en `docs/` | 9 |
| Comandos en `.claude/commands/` | 4 |
| Paquetes | **5** — `core`, `content`, `contract`, `server`, `web` |
| Tests | **121**, todos en verde |
| `tsc -b` | sale **0** |
| Bundle del cliente | **217 KB**, **63 KB** comprimido |

**La fase 1 está implementada: tareas 1 a 21 de 22.** Queda la **22**, la
tanda de assets, que espera una sesión con el usuario. Ver
[ROADMAP.md](../ROADMAP.md).

---

## 2. Instrumentos y lo que cuestan

Las expectativas son de [ARQUITECTURA.md §6](ARQUITECTURA.md); la
columna de la derecha es lo que se midió al implementar.

| Instrumento | Esperado | Medido (2026-09-21) |
|---|---|---|
| La suite entera (121 tests) | — | **~2,5 s** |
| `vitest packages/core` (68 tests) | milisegundos | **~90 ms** |
| Validación del catálogo de `content` | milisegundos | **~10 ms** |
| Simulación de temporada (9 tests, hasta 2.000 turnos) | segundos | **66 ms** |
| `vitest apps/server` (15 tests, Postgres real) | segundos | **~0,6 s** |
| `tsc -b` en todo el repo | segundos | **~3 s** |
| `vite build` del cliente | ~1 min | **~0,7 s** |
| Pasada de navegador (12 comprobaciones, 3 contextos) | minutos, turno exclusivo | **~12 s** |

**Casi todas las expectativas se quedaron cortas por el lado bueno.** La
simulación de temporada se presupuestó en «segundos» y son **66
milisegundos** para nueve escenarios de hasta 2.000 turnos; el build del
cliente se presupuestó en un minuto y tarda **menos de uno**; la pasada de
navegador se presupuestó en minutos y son **12 segundos**.

Comprobar este proyecto es barato, así que **no hay excusa para discutir
balance en vez de medirlo, ni para dar algo por bueno sin mirarlo**.

> Cuando midas uno, **ponlo aquí con la fecha**, y si una expectativa
> resultó falsa, dilo: la fila dice lo que se esperaba y lo que salió.

---

## 3. Huecos entre lo escrito y lo que existe

- `docs/` describe el juego entero por fases. **La fase 1 está
  implementada y se juega**: turnos, tierra, los ocho edificios, la
  economía, el colapso, las seis acciones, persistencia en Postgres,
  servidor y tres pantallas. **Las fases 2 a 5 no existen.**
- **No hay cuentas ni autenticación**: la fase 1 trabaja con un mago fijo
  de desarrollo. Es deuda declarada en
  [ARQUITECTURA.md §9.6](ARQUITECTURA.md), no un olvido.
- [SISTEMAS.md](SISTEMAS.md) tenía **catorce marcas `[abierto]`**; la
  spec de la economía del 2026-09-21 cerró las de economía, tierra,
  edificios y estado inicial. **Quedan siete**, y ninguna bloquea la
  fase 1:

  | Marca abierta | Se cierra en |
  |---|---|
  | Los siete números de coste y mantenimiento son primera tirada, a calibrar | con el simulador, §17.2 |
  | Coeficiente de poder de unidad en net power | fase 3 |
  | Lista de hechizos por escuela y rango | fase 2 |
  | Números de las unidades | fase 3 |
  | Fórmula de daño, acierto, fatiga y bonus de fort | fase 3 |
  | Efecto numérico de las 10 habilidades | fase 4 |
  | Qué hace Armageddon | fase 5 |

- [SPECS.md §6](SPECS.md) (el API) está abierto a propósito: se escribe
  al implementar la fase 1.
- [INTERFAZ.md §6](INTERFAZ.md) (estilo visual) **quedó cerrado el
  2026-09-21**. **Ya no queda ninguna marca que bloquee código.**

---

## 4. Contenido del juego

| Catálogo | Entradas |
|---|---|
| Edificios | 8 definidos, **8 con coste, mantenimiento y efecto** (sin implementar) |
| Escuelas | 6 definidas, **0 con contenido** (la tropa básica no tiene escuela) |
| Hechizos | **0** |
| Unidades | **5**, solo con su mitad económica (coste, upkeep, espacio, ritmo) |
| Items | **0** |
| Héroes | **0** |
| Habilidades | 10 nombradas, **0 con efecto numérico** |
| Assets | 26 especificados con su prompt, **0 generados** — la interfaz corre con marcadores de posición |

---

## 5. Qué se ha comprobado de verdad

- **La investigación del original** ([ORIGINAL.md](ORIGINAL.md)) se hizo
  el 2026-09-21 contra la web y la wiki oficiales, y cada afirmación
  lleva su nivel de confianza. **Tres afirmaciones del PDF quedaron
  refutadas**: el maná no regenera con el reloj (son los turnos), los
  edificios no son los cuatro que suponía (son ocho, con fórmulas
  publicadas), y el combate no es una comparación de totales.
- **La ampliación del 2026-09-21** para la spec de la economía encontró
  publicado lo que se daba por no publicado: la **fórmula del maná**
  ([ORIGINAL.md §3.1](ORIGINAL.md)), la de **Net Power**
  ([§3.2](ORIGINAL.md)) y los **valores de partida**
  ([§4.1](ORIGINAL.md)). **Refutó además una afirmación propia**:
  `SISTEMAS.md §5.1` describía una curva suave con máximo en el 30% que
  yo había deducido de una sola frase, y el máximo real está en 55,99%
  con forma de sierra. Corregido en el documento, con la nota de qué
  decía antes.
- **Los contrastes de la paleta están calculados, no estimados**
  (2026-09-21). Sobre `--panel` `#1e1813`: texto **13,46:1**,
  texto-tenue 6,24, acento 7,79, positivo 6,33, negativo 4,71, aviso
  6,22; Nether **4,19:1** y Ascendant 14,67. El par de escuelas
  cromáticas más cercano es Phantasm-Nether, a **52,1° de tono**. Todos
  los criterios calculables de
  [INTERFAZ.md §6.7](INTERFAZ.md) pasan.

  **Dos tokens y un criterio se corrigieron por ese cálculo**: el rojo
  de estado no llegaba a 4,5:1, el violeta de Nether no llegaba a 3:1, y
  el criterio de «escuelas distinguibles» estaba escrito con razón de
  contraste, que mide claridad y no tono.
- **Los criterios de aceptación de la economía están ejecutados.** Los
  ocho de `SISTEMAS.md §17.1` son tests que pasan. De los cinco de
  §17.2, **tres cumplen** (curva de crecimiento, tamaño del ejército,
  ningún reparto es una trampa) y **dos quedaron aplazados a la fase 3**
  con el motivo escrito: sin magia ni combate, el maná no sirve para
  nada y el net power es ~98% tierra.
- **Los criterios visuales están ejecutados en navegador** (2026-09-21):
  **12 de 12**, en tres contextos —escritorio 1280×900, móvil 360×740 y
  con las imágenes bloqueadas—. Medido: sin scroll horizontal a 360px, el
  área de datos ocupa el **91,1%** del ancho, todas las zonas de toque
  pasan de 40px, cifras tabulares en todas las columnas, y ningún color de
  escuela pintando la interfaz.

  **La primera pasada falló dos**, y una era una violación de la propia
  spec: los avisos se dibujaban fuera de panel, sobre la ilustración.
- **Lo que sigue sin comprobarse**: nada de las fases 2 a 5, y el juego
  **no se ha jugado una sesión larga de verdad**. El simulador cubre la
  economía; que el bucle de quince minutos enganche, no lo sabe nadie aún.
