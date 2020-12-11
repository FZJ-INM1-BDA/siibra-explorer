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

    it('> configureAuth and refresh called with correct param', async () => {
      const { getPublicAccessToken } = require('./util')
      const token = await getPublicAccessToken()

      const {
        access_token,
        refresh_token,
        id_token,
        configureAuthStub,
        refreshSpy,
        jwtDecodeReturn,
        jwtDecodeStub
      } = oidcStub
      const { HBP_CLIENTID, HBP_CLIENTSECRET, HOSTNAME, HOST_PATHNAME, REFRESH_TOKEN } = env
      
      // configuAuthStub
      assert(
        configureAuthStub.called,
        'expect configureAuthStub to have been called once'
      )
      const { args } = configureAuthStub.firstCall
      const arg = args[0]
      expect(arg).to.include({
        clientId: HBP_CLIENTID,
        clientSecret: HBP_CLIENTSECRET,
        redirectUri: `${HOSTNAME}${HOST_PATHNAME}/hbp-oidc/cb`
      })

      // refresh spy
      assert(refreshSpy.calledWith(REFRESH_TOKEN))
      
      // jwtStub
      assert(jwtDecodeStub.calledWith(access_token))

      // return val
      expect(token).to.be.equal(access_token)
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

    it('> refresh getPublicAccessToken will reject', async () => {
      const { getPublicAccessToken } = require('./util')

      try {
        await getPublicAccessToken()
        assert(false, 'get public access token should be rejected')
      } catch (e) {
        assert(true)
      }
    })
  })
})
