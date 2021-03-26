const objStorateRootUrl = `http://fake.obj`
process.env['OBJ_STORAGE_ROOT_URL'] = objStorateRootUrl
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
      let tryGetFromSwiftObjStub,
        tryGetFromSeafileStub,
        doRefreshTokensStub,
        initStub,
        result
      before(async () => {
        doRefreshTokensStub = sinon.stub(Store.prototype, 'doRefreshTokens').returns(Promise.resolve())
        tryGetFromSwiftObjStub = sinon.stub(Store.prototype, 'tryGetFromSwiftObj').returns(Promise.resolve(objContent))
        tryGetFromSeafileStub = sinon.stub(Store.prototype, 'tryGetFromSeafile').returns(Promise.resolve(objContent + objContent))
        initStub = sinon.stub(Store.prototype, 'init').returns(Promise.resolve())
        jwtDecodeStub.returns({
          exp: 1337
        })
        store = new Store()
        result = await store.get(objName)
      })

      after(() => {
        doRefreshTokensStub.restore()
        tryGetFromSwiftObjStub.restore()
        tryGetFromSeafileStub.restore()
        initStub.restore()
        store.dispose()
      })

      it('> first tries to get from tryGetFromSwiftObj', () => {
        expect(tryGetFromSwiftObjStub.called).to.be.true
      })

      it('> does not try to fetch from tryGetFromSeafile', () => {
        expect(tryGetFromSeafileStub.called).to.be.false
      })

      it('> returns value is as expected', () => {
        expect(result).to.equal(objContent)
      })
    })

    describe('> set', () => {
      let initStub,
        fakeSeafileHandle = {
          uploadFile: sinon.stub()
        },
        fakeRepoId,
        refreshSeafileHandleStub

      describe('> if no need to refresh', () => {

        before(async () => {
          initStub = sinon.stub(Store.prototype, 'init').callsFake(async function(){
            this.seafileHandle = fakeSeafileHandle
            this.seafileRepoId = fakeRepoId
            return this.seafileHandle
          })
  
          store = new Store()
          fakeSeafileHandle.uploadFile.returns(Promise.resolve())
          refreshSeafileHandleStub = sinon.stub(Store.prototype, 'refreshSeafileHandle').returns(Promise.resolve())
          await store.set('key', 'value')
        })
  
        after(() => {
          fakeSeafileHandle.uploadFile.resetHistory()
          fakeSeafileHandle.uploadFile.resetBehavior()
          refreshSeafileHandleStub.restore()
          initStub.restore()
          store.dispose()
        })
  
        it('> calls this.seafileHandle.uploadFile', () => {
          expect(fakeSeafileHandle.uploadFile.called).to.be.true
        })
        it('> calls this.seafileHandle.uploadFile only once', () => {
          expect(fakeSeafileHandle.uploadFile.calledOnce).to.be.true
        })

        it('> does not call refreshSeafileHandle', () => {
          expect(refreshSeafileHandleStub.called).to.be.false
        })

        it('> calls this.seafileHandle.uploadFile with the correct arguments', done => {
          const arg = fakeSeafileHandle.uploadFile.args
          const [ arg1, arg2 ] = arg[0]
          expect(arg2.repoId).to.equal(fakeRepoId, 'expecting repoId to match')
          expect(arg2.dir).to.equal('/saneurl/', 'expecting path to be saneurl')
          expect(arg1.filename).to.equal(`key`, 'not so important... expecting filename to match')

          let output = ''
          arg1.readStream.on('data', chunk => {
            output += chunk
          })
          arg1.readStream.on('end', () => {
            arg1.readStream.destroy()
            expect(output).to.equal('value', 'expecitng value of uptload to match')
            done()
          })
        })
      })

      describe('> if need to refresh', () => {

        before(async () => {
          initStub = sinon.stub(Store.prototype, 'init').callsFake(async function(){
            this.seafileHandle = fakeSeafileHandle
            this.seafileRepoId = fakeRepoId
            return this.seafileHandle
          })
  
          store = new Store()
          fakeSeafileHandle.uploadFile.onCall(0).returns(Promise.reject())
          fakeSeafileHandle.uploadFile.onCall(1).returns(Promise.resolve())
          refreshSeafileHandleStub = sinon.stub(Store.prototype, 'refreshSeafileHandle').returns(Promise.resolve())
          await store.set('key', 'value')
        })
  
        after(() => {
          fakeSeafileHandle.uploadFile.resetHistory()
          fakeSeafileHandle.uploadFile.resetBehavior()
          refreshSeafileHandleStub.restore()
          initStub.restore()
          store.dispose()
        })
        it('> calls this.seafileHandle.uploadFile twice', () => {
          expect(fakeSeafileHandle.uploadFile.calledTwice).to.be.true
        })

        it('> calls refreshSeafileStub', () => {
          expect(refreshSeafileHandleStub.called).to.be.true
        })
      })
    })
  })
})
