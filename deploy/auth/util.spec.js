const chai = require('chai')
const { OIDCStub } = require('./spec-helper')
chai.use(require('chai-as-promised'))
const { stub, spy } = require('sinon')
const { expect, assert, should } = require('chai')

should()

const crypto = require('crypto')

describe('mocha.js', () => {
  it('mocha works properly', () => {
    assert(true)
  })
})

describe('chai-as-promised.js', () => {
  it('resolving promise is resolved', () => {

    return Promise.resolve(2 + 2).should.eventually.equal(4)
    
  })
  it('rejecting promise is rejected', () => {
    return Promise.reject('no reason').should.be.rejected
  })
})

const oidcStubInstance = new OIDCStub()
const setupOIDCStub = oidcStubInstance.setupOIDCStub.bind(oidcStubInstance)

describe('util.js', async () => {

  describe('> if configureAuth throws', () => {

    let cleanup
    before(() => {
      const obj = setupOIDCStub({ rejects: true })
      cleanup = obj.cleanup
    })

    after(() => cleanup())

    it('> calling util throws', async () => {
      const util = require('./util')
      try {
        await util()
        assert(false, 'Util funciton should throw/reject')
      } catch (e) {
        assert(true)
      }
    })
  })

  describe('> if configureauth does not return object', () => {
    let cleanup
    before(() => {
      const obj = setupOIDCStub({
        client: 42
      })
      cleanup = obj.cleanup
    })

    after(() => {
      cleanup()
    })

    it('> calling util throws', () => {
      try {
        require('./util')()
        assert(false, 'if configure auth does not return object, calling util throw throw')
      } catch (e) {
        assert(true)
      }
    })
  })

  const env = {
    HOSTNAME : 'http://localhost:3333',
    HOST_PATHNAME : '/testpath',
    HBP_CLIENTID : crypto.randomBytes(16).toString('hex'),
    HBP_CLIENTSECRET : crypto.randomBytes(16).toString('hex'),
    REFRESH_TOKEN : crypto.randomBytes(16).toString('hex'),
  }

  describe('> if env var is provided', () => {

    const tmp = {}
    let cleanup
    let oidcStub
    before(() => {

      delete require.cache[require.resolve('./util')]

      for (const key in env) {
        tmp[key] = process.env[key]
        process.env[key] = env[key]
      }
      try {

        const obj = setupOIDCStub()
        cleanup = obj.cleanup
        
        oidcStub = obj
      } catch (e) {
        console.log(e)
      }
    })

    after(() => {
      for (const key in env) {
        process.env[key] = tmp[key]
      }
      cleanup()
    })

  })

  describe('> if refresh token is missing', () => {

    const noRefreshEnv = {
      ...env,
      REFRESH_TOKEN: null
    }
    const tmp = {}
    let cleanup
    before(() => {
      
      delete require.cache[require.resolve('./util')]

      for (const key in noRefreshEnv) {
        tmp[key] = process.env[key]
        process.env[key] = noRefreshEnv[key]
      }
      try {

        const obj = setupOIDCStub()
        cleanup = obj.cleanup
      } catch (e) {
        console.log(e)
      }
    })

    after(() => {
      for (const key in noRefreshEnv) {
        process.env[key] = tmp[key]
      }
      cleanup()
    })

  })
})
