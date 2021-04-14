const objStorateRootUrl = `http://fake.obj`
process.env['OBJ_STORAGE_ROOT_URL'] = objStorateRootUrl
const DATA_PROXY_URL = process.env['DATA_PROXY_URL'] = 'http://localhost:1234'
const DATA_PROXY_BUCKETNAME = process.env['DATA_PROXY_BUCKETNAME'] = 'tmp_bucket'
const tempHost = 'http://localhost:5678'
const tempPath = '/tmpurl/'
const tempUrl = `${tempHost}${tempPath}`
const sinon = require('sinon')

const mockClient = {
  refresh: sinon.stub()
}
const HbpOidcv2 = require('../auth/hbp-oidc-v2')
const OIDC = require('../auth/oidc')

const { Store } = require('./store')
const { expect } = require("chai")
const nock = require('nock')

const objName = `objname`
const objContent = `objContent`

describe('> store.js', () => {
  
  describe('> Store', () => {

    let store,
      getClientStub,
      jwtDecodeStub

    before(() => {
      getClientStub = sinon.stub(HbpOidcv2, 'getClient').returns(Promise.resolve(mockClient))
      jwtDecodeStub = sinon.stub(OIDC, 'jwtDecode')
      const nockedProxy = nock(DATA_PROXY_URL)
      const queryObj = {
        lifetime: 'very_long'
      }
      nockedProxy.get(`/tempurl/${DATA_PROXY_BUCKETNAME}`)
        .query(queryObj)
        .reply(200, {
          url: tempUrl
        })
      nockedProxy.put(`/tempurl/${DATA_PROXY_BUCKETNAME}`)
        .query(queryObj)
        .reply(200, {
          url: tempUrl
        })

      const nockedObjProxy = nock(tempHost)
      nockedObjProxy
        .get(`${tempPath}${objName}`)
        .reply(200, objContent)
    })

    after(() => {
      nock.restore()
      getClientStub.restore()
      jwtDecodeStub.restore()
      store.dispose()
    })
    afterEach(() => {
      getClientStub.resetHistory()
      jwtDecodeStub.resetHistory()
    })

    describe('> get', () => {
      let doRefreshTokensStub,
        initStub,
        result
      before(async () => {
        doRefreshTokensStub = sinon.stub(Store.prototype, 'doRefreshTokens').returns(Promise.resolve())
        initStub = sinon.stub(Store.prototype, 'init').returns(Promise.resolve())
        jwtDecodeStub.returns({
          exp: 1337
        })
        store = new Store()
        result = await store.get(objName)
      })

      after(() => {
        doRefreshTokensStub.restore()
        initStub.restore()
        store.dispose()
      })

      it('> returns value is as expected', () => {
        expect(result).to.equal(objContent)
      })
    })

    describe('> set', () => {

      describe('> if no need to refresh', () => {

        before(async () => {
  
          store = new Store()
          await store.set('key', 'value')
        })
  
        after(() => {
          store.dispose()
        })
  
      })

      describe('> if need to refresh', () => {

        before(async () => {
          await store.set('key', 'value')
        })
  
        after(() => {
          store.dispose()
        })
      })
    })
  })
})
