/* required or reflect metadata error will be thrown */

import 'reflect-metadata';
import 'zone.js/dist/zone'
import 'zone.js/dist/zone-testing'

import { getTestBed } from '@angular/core/testing'
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  { teardown: { destroyAfterEach: true }},
)

const testContext = require.context('../src', true, /\.spec\.ts$/)
testContext.keys().map(testContext)

const workerCtx = require.context('../worker', true, /\.spec\.js$/)
workerCtx.keys().map(workerCtx)

require('../common/util.spec.js')
