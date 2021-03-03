#!/usr/bin/env sh

npm link rbi-nodejs-agent &&
node --preserve-symlinks httpIntegration.test.js
