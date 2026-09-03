FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json

RUN pnpm install --frozen-lockfile --filter @openboard/api...

COPY packages/db packages/db
COPY packages/shared packages/shared
COPY apps/api apps/api

ENV NODE_ENV=production
EXPOSE 3000
WORKDIR /app/apps/api
CMD ["pnpm", "start"]
