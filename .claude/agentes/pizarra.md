# Pizarra de agentes

Quién está tocando qué, ahora mismo. El protocolo completo está en
[docs/AGENTES.md](../../docs/AGENTES.md).

Cada agente añade su bloque **antes** de la primera edición, lo actualiza
si cambia el plan, y **lo borra al terminar**.

Plantilla:

```
## <agente> — <hora de inicio>
tarea: <bloque de «En curso» y tarea, o qué se está depurando>
toco: <rutas, separadas por comas>
puede que toque: <rutas>
```

Declara también lo que **puede** que toques: es la parte que evita el
cruce de verdad.

Los turnos de recurso exclusivo (base de datos + servidores, navegador)
van aparte, en `.claude/agentes/turno-*/` — ver
[docs/AGENTES.md §2](../../docs/AGENTES.md). No se anotan aquí: se toman
con `mkdir`.

---

<!-- Los bloques van debajo de esta línea. Si no hay ninguno, nadie está
     trabajando y el repositorio está libre. -->

## claude — /plan-tarea la magia de la fase 2
tarea: plan técnico de la fase 2 y su lista de tareas
toco: docs/SISTEMAS.md, ROADMAP.md
puede que toque: docs/SPECS.md, docs/ARQUITECTURA.md

## claude — Magia fase 2, tareas 1-15
tarea: implementación de la magia
toco: packages/core, packages/content, packages/contract, apps/server, apps/web, ROADMAP.md
puede que toque: docs/SISTEMAS.md, docs/SPECS.md, docs/ESTADO.md, docs/INTERFAZ.md

