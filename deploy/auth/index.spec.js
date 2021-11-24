const sinon = require('sinon')
const { assert, expect } = require('chai')
const initPassportJsStub = sinon.stub()
const hbpOidcV2Stub = sinon.stub()

const appGetStub = sinon.stub()

describe('auth/index.js', () => {
  before(() => {
    require.cache[require.resolve('./util')] = {
      exports: { initPassportJs: initPassportJsStub, objStoreDb: new Map() }
    }
    require.cache[require.resolve('./hbp-oidc-v2')] = {
      exports: {
        bootstrapApp: hbpOidcV2Stub
      }
    }
  })

  beforeEach(() => {
    delete require.cache[require.resolve('./index.js')]
    hbpOidcV2Stub.returns({})
    hbpOidcV2Stub.resetHistory()
  })

  describe('#configureAuth', () => {
    
    it('> calls necessary dependencies', async () => {
      const { configureAuth } = require('./index.js')
      const dummyObj = { get: appGetStub }
      await configureAuth(dummyObj)
      
      assert(
        hbpOidcV2Stub.called,
        'hbpOidcV2 called'
      )

      assert(
        initPassportJsStub.called,
        'initPassportJs called'
      )
    })

    it('> retries up to three times', async () => {

      const { configureAuth } = require('./index.js')
      const dummyObj = { get: appGetStub }

      hbpOidcV2Stub.throws(`throw error`)

      try {

        await (() => new Promise((rs, rj) => {
          configureAuth(dummyObj)
            .then(rs)
            .catch(rj)
        }))()

        assert(
          false,
          'configureAuth should not resolve'
        )

      } catch (e) {
        
        assert(
          hbpOidcV2Stub.calledThrice,
          'hbpOidcv2 called thrice'
        )
  
      }
    })
  })
  describe('#ready', () => {
    it('> if everything resolves correctly ready should return true', async () => {

      const { configureAuth, ready } = require('./index.js')
      const dummyObj = { get: appGetStub }
      
      await configureAuth(dummyObj)
      
      const isReady = await ready()

      expect(isReady).to.equal(true)
    })

    it('> if oidc fails, ready fn returns false', async () => {

      const { configureAuth, ready } = require('./index.js')
      const dummyObj = { get: appGetStub }

      hbpOidcV2Stub.throws(`throw error`)

      try {
        await (() => new Promise((rs, rj) => {
          configureAuth(dummyObj)
            .then(rs)
            .catch(rj)
        }))()

      } catch (e) {
        
      }

      const isReady = await ready()
      expect(isReady).to.equal(false)
    })
  })
})
