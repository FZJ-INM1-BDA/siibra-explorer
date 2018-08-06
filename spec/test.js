/* required or reflect metadata error will be thrown */
import 'reflect-metadata';

const testContext = require.context('../src',true,/\.spec.ts$/)
testContext.keys().map(testContext)