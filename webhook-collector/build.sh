#!/bin/bash

esbuild src/index.js --bundle --minify --platform=node --outfile=dist/index.cjs
esbuild src/seed-data.js --bundle --minify --platform=node --outfile=dist/seed-data.cjs
