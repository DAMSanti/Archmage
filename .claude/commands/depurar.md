---
description: Algo no quedó como el usuario quería. Le preguntas hasta entender qué esperaba de verdad, decides si el fallo está en el código o en lo escrito, y lo arreglas donde esté.
argument-hint: <qué está mal, con tus palabras>
---

El usuario te va a decir que algo no quedó como quería. Puede ser un
fallo, o puede ser que lo implementado sea exactamente lo que pedía la
documentación y **la documentación esté mal**. Tu trabajo es averiguar
cuál de las dos cosas es antes de tocar nada.

La queja: $ARGUMENTS

> **La regla que gobierna este comando: no arregles la primera cosa que
> encuentres.** En un juego así, el síntoma casi nunca está donde
> aparece: «me ha bajado el maná al construir nodes» es la curva de
> decrecimiento funcionando bien; «se me disolvió medio ejército» puede
> ser un colapso de geld de hace tres turnos; «la batalla salió distinta
> de la previsión» es redondeo en dos sitios, no el combate. Arreglar el
> síntoma deja el fallo vivo y además esconde la pista.

---

## 1. Entiende el síntoma antes de buscarlo

Lee lo que dice el usuario y **búscalo en el código y en la documentación
antes de preguntar nada**. Las preguntas buenas salen de haber mirado:

- **¿Qué dice la documentación que debería pasar?**

  | Si la queja va de… | Lee |
  |---|---|
  | Turnos, tierra, edificios, economía, magia, unidades, combate, héroes, items, gremios, temporada | [docs/SISTEMAS.md](../../docs/SISTEMAS.md) |
  | El estado, una acción, un endpoint, un mensaje, un invariante | [docs/SPECS.md](../../docs/SPECS.md) |
  | Lo que se ve: rutas, pantallas, números mal presentados, móvil | [docs/INTERFAZ.md](../../docs/INTERFAZ.md) |
  | Un arte que no encaja | [docs/ASSETS.md](../../docs/ASSETS.md) |
  | Una cifra que no cuadra | [docs/ESTADO.md](../../docs/ESTADO.md) |
  | Cómo se mide o se comprueba | [docs/ARQUITECTURA.md](../../docs/ARQUITECTURA.md) |

  Y si el trabajo está abierto, [ROADMAP.md](../../ROADMAP.md) «En
  curso». Lo cerrado hace tiempo está en `docs/archivo/` — ahí sale **por
  qué** quedó como quedó, que suele ser la mitad de la respuesta.

- **¿Es esto el juego original funcionando?** Muchas de las cosas que
  sorprenden en este juego son **fieles a propósito**: que pasarse del
  30% de nodes **baje** el maná total, que las unidades coman antes que
  los civiles, que atacar cueste el upkeep de todo tu ejército, que 0
  forts sea la muerte. Antes de llamarlo fallo, mira
  [docs/ORIGINAL.md](../../docs/ORIGINAL.md). Si es `[orig]` y está
  confirmado, el fallo puede ser que **la interfaz no lo explica**
  ([docs/INTERFAZ.md §1](../../docs/INTERFAZ.md)), no que la regla esté
  mal.

- **¿Está declarado fuera de alcance?**
  [docs/SISTEMAS.md §16](../../docs/SISTEMAS.md) e
  [docs/INTERFAZ.md §7](../../docs/INTERFAZ.md) llevan lo que **no**
  hacemos, con su porqué. Si lo que el usuario echa en falta es uno de
  esos, **no es un bug — es una decisión con un porqué escrito**, y lo
  que toca es enseñársela y preguntar si quiere cambiarla.

- **¿Es una marca `[abierto]`?** Si el número que le chirría nunca se
  decidió, el fallo no está en el código: falta una spec.

- **¿Qué hace el código de verdad?**

- **¿Hay un test que ya cubra esto?** Si lo hay y está en verde, o el
  test comprueba otra cosa, o el usuario esperaba otra cosa. Las dos
  posibilidades importan.

---

## 2. Pregunta hasta saber qué esperaba

Con **AskUserQuestion**, y en serio: este comando existe porque la
explicación de una línea nunca basta.

Lo que hay que sacar, siempre:

- **Qué esperabas ver, exactamente.** No «que funcione mejor»: qué
  número, qué comportamiento, en qué momento, en qué pantalla. Si no se
  puede comprobar, no se puede arreglar.
- **Qué viste en su lugar.** Y **dónde**: `/reino`, `/ejercito`,
  `/magia`, `/guerra`, la repetición de una batalla, una respuesta del
  API.
- **Con qué mago y en qué estado.** En este juego casi todo depende del
  **porcentaje de tierra** y del ingreso **neto**. Un mismo número es
  correcto con 1.000 acres y un fallo con 100.000. Pide la tierra, el
  reparto de edificios, y el ingreso neto.
- **¿Fue de golpe o venía de antes?** El colapso de un recurso arrastra
  varios turnos: lo que se ve hoy puede haber empezado anteayer.
- **Si es una batalla, el identificador.** Está guardada con su semilla y
  se puede volver a jugar exacta. **No intentes reproducirla a ojo.**
- **¿Es esto lo que pedías, o has cambiado de idea?** Pregúntalo sin
  rodeos. Cambiar de idea es legítimo y cambia por completo qué hay que
  arreglar.

Y ofrece tu hipótesis como pregunta, con lo que has encontrado al mirar.
Es la forma más rápida de que el usuario te corrija pronto.

**Si las cifras del usuario no cuadran con las tuyas, sospecha de tu
instrumento antes que de su observación.** Lo que el usuario ve jugando
es el servidor con su estado real; tu script es un aparato que puede
estar mal enchufado — empezando por si estás mirando el estado **ya
devengado** o el de antes de devengar turnos.

---

## 3. Decide dónde está el fallo, y dilo

Cinco casos, y hay que nombrar cuál es **antes** de tocar código:

| | Qué pasa | Qué se arregla |
|---|---|---|
| **A** | La documentación dice X, el código hace Y, el usuario quería X | El código |
| **B** | La documentación dice X, el código hace X, el usuario quería Y | **La documentación primero**, luego el código |
| **C** | La documentación no dice nada de esto | Se decide con el usuario qué debería decir, se escribe, y luego se implementa |
| **D** | Está declarado **fuera de alcance** a propósito | Se le enseña el porqué escrito y **él decide** si entra en alcance |
| **E** | La regla es correcta y **fiel al original**, pero la interfaz no la explica | **La interfaz**, no la regla |

El caso **E** es frecuente aquí y es fácil de confundir con un bug: este
juego tiene mecánicas que sorprenden por diseño, y
[docs/INTERFAZ.md §1](../../docs/INTERFAZ.md) dice que **enseñar la
consecuencia antes de gastar el turno es nuestro trabajo**. Si el usuario
se sorprendió, mira primero si se le avisó.

En el caso **B**, no cambies la documentación por tu cuenta: enséñale al
usuario qué dice hoy y confirma que quiere cambiarlo. Y si la regla está
marcada `[orig]`, di **de qué nos estamos separando**.

El caso **D** es bueno que exista: significa que alguien ya pensó en eso
y decidió. Que el usuario cambie de idea es legítimo, pero entonces **es
una spec nueva**, no un parche — sugiere `/spec`.

Y en cualquiera de los cinco, **si el síntoma tiene pinta de ser una
regla escrita en varios sitios, búscalos todos antes de tocar uno**. La
queja que se repite después de arreglarla viene siempre de la copia que
no tocaste. Los sospechosos habituales en este repo:

- **Un cálculo que existe en `packages/core` y otra vez en el cliente**
  «para la interfaz». Ése es el que separa la previsión del resultado, y
  es justo lo que la arquitectura existe para impedir
  ([docs/ARQUITECTURA.md §1](../../docs/ARQUITECTURA.md)).
- **Un redondeo en dos sitios.**
- **Un número metido en el código que debería estar en
  `packages/content`.**

---

## 4. Arregla

1. **Escribe primero la comprobación, y la más barata que sirva.** Un
   test del núcleo si es una regla; una llamada real al API si es de
   integración. Tiene que fallar **antes** del arreglo. Si no consigues
   que falle, todavía no entiendes el fallo.

   **Reproducir un fallo no es jugar hasta que aparezca.** Si el síntoma
   sale con un mago a cero de geld, con 3 forts y 40.000 unidades,
   **construye ese estado y aplica un paso**. Y si es una batalla,
   **vuelve a jugarla con su semilla**: está guardada para esto.

   Si es un fallo visual, la comprobación es mirar — pero **toma el turno
   de navegador** antes (`mkdir .claude/agentes/turno-navegador`).

2. **Arregla la causa, no el síntoma.**

3. **Deja el porqué en el código**, no el qué. Si la cifra viene del
   original, la sección de `ORIGINAL.md` y su nivel de confianza; si es
   nuestra, el porqué y qué se midió. Y si el arreglo destapó algo que la
   documentación daba por cierto y no lo era, escríbelo.

4. **Actualiza lo escrito.** La spec de la que salió, si la hubo;
   `docs/SPECS.md` si cambió un contrato; `docs/SISTEMAS.md` si cambió
   una regla —y su marca de procedencia—; `docs/ORIGINAL.md` si lo que
   aprendiste es sobre el juego original; `docs/ESTADO.md` si cambió una
   cifra de las que afirma.

---

## 5. Comprueba, y comprueba las dos cosas

```bash
pnpm test
pnpm -w exec tsc -b
```

- Que esté **en verde**.
- Y que el **total de tests no haya bajado**. Un fichero que revienta al
  importar no falla: desaparece. Línea base en
  [docs/ESTADO.md](../../docs/ESTADO.md).

**Si una prueba sale intermitente, no la aceptes como intermitente**:
casi siempre es una semilla sin fijar, y eso es un invariante roto
([docs/SPECS.md §5](../../docs/SPECS.md)), no mala suerte.

Si tocaste el cliente: **compilar no es funcionar.** Si el arreglo toca
algo que se ve, míralo antes de darlo por hecho.

Y si era una cifra de balance sacada de una simulación, **córrela con
varias semillas**. Un resultado leído de una sola corrida no es un
resultado.

---

## 6. Cuenta lo que pasó de verdad

Al usuario, y en el documento si lo hay. Incluidas las sorpresas: qué
creías que era, qué era, y qué apareció por el camino. Si te has dejado
algo sin arreglar, dilo tú antes de que lo pregunte.

---

**Y no malgastes contexto.** Busca con `grep -n` y lee el trozo, no el
fichero; filtra la salida de los tests; no pegues ficheros en el chat.
Reglas en [CLAUDE.md](../../CLAUDE.md) — y la contraria también: leer lo
que hace falta es barato, adivinarlo no.

---

## Si vais a ser varios

Lee y firma en `.claude/agentes/pizarra.md` antes de editar, y **toma el
turno** del recurso que vayas a usar: `turno-db` si vas a medir contra la
base de datos de desarrollo o levantar los servidores,
`turno-navegador`. Protocolo completo en
[docs/AGENTES.md](../../docs/AGENTES.md).

Depurar es justo el trabajo que más mide y más edita, así que es el que
más fácil pisa a otro. Declara también los ficheros que **puede** que
toques.
