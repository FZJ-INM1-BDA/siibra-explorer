#! /bin/bash

export CHROMIUM_VERSION=80.0.3987.106
export PPTR_VERSION=2.1.0
npm run wd -- update --versions.chrome=${CHROMIUM_VERSION}
npm i --no-save puppeteer@${PPTR_VERSION}