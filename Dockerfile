FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./

COPY .yarn .yarn

RUN yarn install --frozen-lockfile

FROM base AS build

COPY . .

RUN yarn prisma generate 

RUN yarn build

FROM base AS production

WORKDIR /app

COPY --from=build /app/package.json /app/yarn.lock ./

RUN yarn install --production --frozen-lockfile

COPY --from=build /app/dist ./dist

COPY --from=build /app/prisma/generated ./prisma/generated

CMD ["node", "dist/main"]