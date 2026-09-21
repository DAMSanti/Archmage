# La aplicación entera en una imagen: el API y el cliente ya construido, en
# un solo proceso y un solo puerto.
#
# Postgres NO va aquí, y es deliberado: si la base de datos viviera en el
# mismo contenedor, borrar el contenedor se llevaría la partida, y arrancar
# dos procesos en uno hace frágil pararlo y reiniciarlo. Va en su servicio,
# con su volumen (ver docker-compose.yml).

# --- Construcción ---------------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Primero los manifiestos: si no cambian, Docker reutiliza la capa de
# dependencias y la reconstrucción es de segundos.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/core/package.json      packages/core/
COPY packages/content/package.json   packages/content/
COPY packages/contract/package.json  packages/contract/
COPY apps/server/package.json        apps/server/
COPY apps/web/package.json           apps/web/
RUN pnpm install --frozen-lockfile

# Y ahora el código.
COPY tsconfig.base.json tsconfig.json ./
COPY packages/ packages/
COPY apps/ apps/

# Que compile es parte de construir la imagen: una imagen que no
# typechequea no debería llegar a ejecutarse.
RUN pnpm -w exec tsc -b
RUN pnpm --filter @archmage/web build

# --- Ejecución ------------------------------------------------------------
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY --from=build /app/ ./

# 0.0.0.0 para que el puerto publicado del contenedor sea alcanzable desde
# el anfitrión; en local el servidor escucha en 127.0.0.1.
ENV HOST=0.0.0.0
ENV PORT=3001
EXPOSE 3001

# `tsx` porque los paquetes del monorepo exportan TypeScript directamente,
# que es lo que hace cómodo compartir el núcleo entre servidor y cliente.
CMD ["pnpm", "--filter", "@archmage/server", "start"]
