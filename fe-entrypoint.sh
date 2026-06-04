#! /bin/sh

rm -rf node_modules packages/form/node_modules packages/manager/node_modules

pnpm install --frozen-lockfile
pnpm run build:watch
