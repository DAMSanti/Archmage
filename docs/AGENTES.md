# Agentes

Cómo trabajar sin pisarse cuando hay más de un agente en el repositorio.
Si trabajas solo, te basta con §1.

---

## 1. La pizarra

**Antes de la primera edición**, añade tu bloque a
`.claude/agentes/pizarra.md`, con la plantilla que hay allí:

```
## <agente> — <hora de inicio>
tarea: <bloque de «En curso» y tarea, o qué se está depurando>
toco: <rutas, separadas por comas>
puede que toque: <rutas>
```

Y **léelo antes**. Si un fichero que necesitas ya está declarado por
otro, **no lo edites**: háblale (`ListAgents` / `SendMessage`) y mientras
tanto haz lo que no dependa de él.

**Declara también lo que *puede* que toques.** Es la parte que evita el
cruce de verdad: los choques no vienen del fichero que sabías que ibas a
tocar, vienen del que descubriste a mitad.

**Borra tu bloque al terminar**, o actualízalo a la tarea siguiente.

### 1.1. Los ficheros que más se cruzan

En un monorepo con un núcleo compartido, casi todo pasa por unos pocos
sitios. Si tu plan toca alguno, **dilo explícitamente**:

- `packages/core/` — cualquier cosa. Es el paquete por el que pasan todas
  las reglas.
- `packages/contract/` — un cambio aquí rompe la compilación del servidor
  y del cliente a la vez, que es su gracia y su peligro.
- `packages/content/` — dos agentes añadiendo contenido a la vez chocan
  en el mismo fichero de catálogo.
- El esquema de base de datos y sus migraciones.

---

## 2. Turnos de recurso exclusivo

Algunos recursos no se comparten. Se toman con `mkdir`, que es atómico:
si el directorio ya existe, el turno es de otro.

| Turno | Para qué |
|---|---|
| `.claude/agentes/turno-db` | La base de datos de desarrollo, o levantar los servidores. |
| `.claude/agentes/turno-navegador` | Sesión de navegador. |

```bash
mkdir .claude/agentes/turno-navegador   # falla si está ocupado
rmdir .claude/agentes/turno-navegador   # suéltalo SIEMPRE, aunque saliera mal
```

**Correr los tests no necesita turno.** Los de `packages/core` son
funciones puras y los de `apps/server` usan cada uno su base de datos
temporal — nunca la de desarrollo
([SPECS.md](SPECS.md), [ARQUITECTURA.md §6](ARQUITECTURA.md)).

Los turnos son **estado de la máquina, no del repositorio**: están en el
`.gitignore` de `.claude/agentes/`.

---

## 3. Qué se puede hacer a la vez y qué no

**Sí, en paralelo:**

- Dos tareas en paquetes distintos que no comparten fichero.
- Tests de `packages/core` de dos agentes a la vez: son funciones puras,
  no tocan nada.
- Escribir documentación de temas distintos.

**No:**

- **Dos agentes editando `packages/core`** salvo que sean módulos
  claramente distintos y los dos lo hayan declarado.
- **Dos agentes midiendo contra la base de datos de desarrollo.** De ahí
  el `turno-db`.
- **Dos sesiones de navegador.**
- **Dos agentes tocando [ROADMAP.md](../ROADMAP.md) a la vez.** Lo tocan
  los cuatro comandos del embudo, así que es el fichero que más se pisa:
  decláralo siempre.

---

## 4. Lo que no se negocia, seas uno o seas cuatro

- **Si la suite se pone en rojo, paras y lo dices.** No sigues con la
  tarea siguiente encima de algo roto, y no marcas nada hecho «pendiente
  de arreglar».
- **Si el total de tests baja, también paras.** Un fichero que revienta
  al importar no falla: desaparece, y ese número es lo único que lo
  delata.
- **Suelta el turno aunque la tarea saliera mal.**
