# Archmage

Remake de **The Reincarnation** (antes *Archmage*): MMO de navegador por
temporadas, con magia, economía y PvP. Qué es y por qué, en
[docs/VISION.md](docs/VISION.md).

**A día de hoy no hay código.** Hay diseño, y está terminado. Ver
[docs/ESTADO.md](docs/ESTADO.md).

---

## Los documentos, y cuál es cuál

`docs/` tiene un **conjunto fijo**. **No crees documentos nuevos**: lo
que aprendas va dentro del que le toca.

| Documento | Qué lleva |
|---|---|
| [docs/VISION.md](docs/VISION.md) | Qué juego es, para quién, y qué tiene que ser verdad para que funcione. |
| [docs/ORIGINAL.md](docs/ORIGINAL.md) | **El juego original**, investigado, con niveles de confianza. La fuente de autoridad de cualquier regla heredada. |
| [docs/SISTEMAS.md](docs/SISTEMAS.md) | **Las reglas de nuestro juego.** El documento de diseño definitivo. |
| [docs/SPECS.md](docs/SPECS.md) | El contrato técnico: estado, acciones, API, y **los invariantes**. Corto a propósito. |
| [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) | Stack, cómo está troceado, convenciones, y **cómo se comprueba**. |
| [docs/INTERFAZ.md](docs/INTERFAZ.md) | Rutas, pantallas, reglas de presentación, móvil. |
| [docs/ASSETS.md](docs/ASSETS.md) | Inventario de arte y los prompts. |
| [docs/ESTADO.md](docs/ESTADO.md) | **Las cifras medidas de hoy.** Nada estimado. |
| [docs/AGENTES.md](docs/AGENTES.md) | Cómo no pisarse si sois varios. |
| [ROADMAP.md](ROADMAP.md) | Las fases, y **«En curso»**: el trabajo vivo. |

`docs/archivo/` guarda el relato de los bloques cerrados que valga la
pena conservar. **El conjunto de `docs/` no crece.**

---

## El embudo

```
/spec       intención        →  el qué y el por qué, medible
/plan-tarea spec             →  plan, tareas, y las IMPLEMENTA y documenta
/tareas     retomar trabajo  →  implementa lo pendiente de ROADMAP «En curso»
/depurar    algo no cuadra   →  preguntas, y arreglo donde esté el fallo
```

La spec **no vive en un fichero propio**: se escribe **dentro del
documento permanente del que trata**, y [ROADMAP.md](ROADMAP.md) «En
curso» lleva la línea que dice en cuál.

---

## Las cinco cosas que más se rompen aquí

Las completas están en [docs/SPECS.md §5](docs/SPECS.md). Éstas son las
que fallan **en silencio**:

1. **`packages/core` no importa nada**, y no llama a `Date.now()` ni a
   `Math.random()`. El tiempo y el azar entran por parámetro. Si se
   rompe, el cliente deja de poder previsualizar y los tests empiezan a
   depender del día.
2. **Todo azar sale del `RandomSource`, y la semilla se guarda.** Si no,
   la repetición de batalla que se le enseña al jugador **miente**.
3. **El estado y sus eventos se guardan en la misma transacción.** Si no,
   la crónica pierde hechos y nadie se entera.
4. **Ningún endpoint lleva reglas.** Valida, carga, `core.apply()`,
   guarda, responde.
5. **Los recursos son enteros**, y cada fórmula redondea en un solo sitio
   documentado. Si el servidor y el cliente redondean distinto, la
   previsión y el resultado se separan sin dar error.

---

## Convenciones

- **Español en la documentación, inglés en el código.**
- **Los nombres del dominio se quedan como en el original**: `geld`,
  `mana`, `node`, `fort`, `barrier`, `stack`, `upkeep`, `pillage`. No los
  traduzcas — la wiki del original es parte de la documentación de este
  proyecto.
- **El comentario dice el porqué y de dónde sale el número**, no lo que
  hace la línea. Si viene del original, con su nivel de confianza; si es
  nuestro, con qué se midió.
- **Lo que dejes fuera, escríbelo** en el docstring del módulo, en su
  bloque de *fuera de alcance*. Un hueco declarado es deuda; uno callado
  es un fallo esperando a una temporada real.
- **TDD en `packages/core`.** El test se escribe primero y tiene que
  fallar antes del cambio.

---

## Cómo se comprueba

Detalle y costes en
[docs/ARQUITECTURA.md §6](docs/ARQUITECTURA.md). En corto:

- **Una regla del juego se comprueba con un test del núcleo**, no jugando.
- **Un estado lejano se construye, no se simula.** Escribe el estado del
  mago a cero de geld con 3 forts y aplica una acción.
- **Una batalla se comprueba con su semilla fijada.** Sin semilla, es un
  test intermitente disfrazado.
- **El navegador solo si la pregunta es visual**, y con turno
  ([docs/AGENTES.md §2](docs/AGENTES.md)).
- **Compilar no es funcionar.**

Y **si la suite se pone en rojo, o el total de tests baja, paras y lo
dices.** Un fichero que revienta al importar no falla: desaparece.

---

## No malgastes contexto

Busca con `grep -n` y lee el trozo, no el fichero. Filtra la salida de
los tests. No pegues ficheros en el chat.

Y la contraria, que aquí importa más: **leer lo que hace falta es barato,
adivinarlo no.** Este proyecto ya tiene un documento de diseño que
supuso cuatro edificios donde había ocho documentados, y propuso una
arquitectura sin backend para un juego que es PvP por temporadas. Mirar
habría costado diez minutos.
