#!/usr/bin/env sh

npm link rbi-nodejs-agent &&
#node --preserve-symlinks httpIntegration.test.js &&
#node --preserve-symlinks postgresIntegration.test.js &&
#node --preserve-symlinks mongoIntegration.test.js &&
#node --preserve-symlinks mysqlIntegration.test.js
jest mysqlIntegration.test.js
