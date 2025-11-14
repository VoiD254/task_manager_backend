#!/usr/bin/env bash
set -e

if [ -f ./configs/.production.env ]; then
  set -o allexport
  source ./configs/.production.env
  set +o allexport
fi

tsc
mkdir -p ./dist/configs/
if [ -f ./configs/.production.env ]; then
  cp ./configs/.production.env ./dist/configs/
fi
