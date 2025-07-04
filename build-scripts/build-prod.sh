#!/bin/bash
tsc
mkdir -p ./dist/configs/
cp ./configs/.production.env ./dist/configs/