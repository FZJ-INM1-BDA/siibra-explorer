const { expect, assert } = require('chai')
const fs = require('fs')
const express = require('express')
const got = require('got')
const sinon = require('sinon')

let server
const PORT=12345

describe('authentication', () => {
  
  /**
   * memorystore (or perhaps lru-cache itself) does not properly close when server.close()
   * use default memory store for tests
   */
  process.env['USE_DEFAULT_MEMORY_STORE'] = true

  const fakeFunctionObj = {
    fakeAuthConfigureAuth: (req, res, next) => next(),
    fakeAuthReady: async () => true,
    fakeUserRouterFn: (req, res, next) => res.status(200).send()
  }

  before(async () => {
    const auth = require('./auth')
    const authConfigureAuthStub = sinon.stub(auth, 'configureAuth')
    const authIsReadyStub = sinon.stub(auth, 'ready')
  
    require.cache[require.resolve('./datasets')] = {
      exports: {
        router: (req, res, next) => next(),
        ready: async () => true
      }
    }
  
    require.cache[require.resolve('./saneUrl')] = {
      exports: (req, res, next) => next()
    }

    require.cache[require.resolve('./user')] = {
      exports: fakeFunctionObj.fakeUserRouterFn
    }

    require.cache[require.resolve('./constants')] = {
      exports: {
        indexTemplate: ``
      }
    }
  
    authConfigureAuthStub.callsFake(app => {
      app.use(fakeFunctionObj.fakeAuthConfigureAuth)
      return Promise.resolve()
    })

    const expressApp = express()
    const app = require('./app')    
    expressApp.use(app)
    server = expressApp.listen(PORT)
  })

  after(() => {
    server.close()
  })
  
  it('fakeAuthConfigureAuth is called before user router', async () => {
    const spyFakeAuthConfigureAuth = sinon.spy(fakeFunctionObj, 'fakeAuthConfigureAuth')
    const spyFakeUserRouterFn = sinon.spy(fakeFunctionObj, 'fakeUserRouterFn')
    await got(`http://localhost:${PORT}/user`)
    assert(
      spyFakeAuthConfigureAuth.calledBefore(spyFakeUserRouterFn),
      'fakeAuthConfigureAuth is called before user router'
    )
  })
})
