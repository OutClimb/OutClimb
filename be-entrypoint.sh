#! /bin/sh

go mod download
wgo run -xdir ./.github  -xdir ./.husky -xdir ./node_modules -xdir ./packages -xdir ./web ./main.go service
