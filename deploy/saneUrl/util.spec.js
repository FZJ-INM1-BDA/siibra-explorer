const { ProxyStore, NotExactlyPromiseAny } = require('./util')
const { expect, assert } = require('chai')
const sinon = require('sinon')
const { NotFoundError } = require('./store')

const _name = 'foo-bar'
const _stringValue = 'hello world'
const _objValue = {
  'foo': 'bar'
}
const _req = {}

describe('> saneUrl/util.js', () => {
  describe('> ProxyStore', () => {
    let store = {
      set: sinon.stub(),
      get: sinon.stub(),
      del: sinon.stub(),
    }
    beforeEach(() => {
      store.set.returns(Promise.resolve())
      store.get.returns(Promise.resolve('{}'))
      store.del.returns(Promise.resolve())
    })
    afterEach(() => {
      store.set.resetHistory()
      store.get.resetHistory()
      store.del.resetHistory()
    })
    describe('> StaticGet', () => {
      it('> should call store.get', () => {
        ProxyStore.StaticGet(store, _req, _name)
        assert(store.get.called, 'called')
        assert(store.get.calledWith(_name), 'called with right param')
      })
      describe('> if not hit', () => {
        const err = new NotFoundError('not found')
        beforeEach(() => {
          store.get.rejects(err)
        })
        it('should throw same error', async () => {
          try{
            await ProxyStore.StaticGet(store, _req, _name)
            assert(false, 'Should throw')
          } catch (e) {
            assert(e instanceof NotFoundError)
          }
        })
      })
      describe('> if hit', () => {
        describe('> if expired', () => {
          beforeEach(() => {
            store.get.returns(
              Promise.resolve(
                JSON.stringify({
                  expiry: Date.now() - 1000
                })
              )
            )
          })
          it('> should call store.del', async () => {
            try {
              await ProxyStore.StaticGet(store, _req, _name)
            } catch (e) {

            }
            assert(store.del.called, 'store.del should be called')
          })
          it('> should throw NotFoundError', async () => {
            try {
              await ProxyStore.StaticGet(store, _req, _name)
              assert(false, 'expect throw')
            } catch (e) {
              assert(e instanceof NotFoundError, 'throws NotFoundError')
            }
          })
        })
        describe('> if not expired', () => {
          it('> should return .value, if exists', async () => {
            store.get.returns(
              Promise.resolve(
                JSON.stringify({
                  value: _objValue,
                  others: _stringValue
                })
              )
            )
            const returnObj = await ProxyStore.StaticGet(store, _req, _name)
            expect(returnObj).to.deep.equal(_objValue)
          })
          it('> should return ...rest if .value does not exist', async () => {
            store.get.returns(
              Promise.resolve(
                JSON.stringify({
                  others: _stringValue
                })
              )
            )
            const returnObj = await ProxyStore.StaticGet(store, _req, _name)
            expect(returnObj).to.deep.equal({
              others: _stringValue
            })
          })
        })
      })

    })

    describe('> get', () => {
      let staticGetStub
      beforeEach(() => {
        staticGetStub = sinon.stub(ProxyStore, 'StaticGet')
        staticGetStub.returns(Promise.resolve())
      })
      afterEach(() => {
        staticGetStub.restore()
      })
      it('> proxies calls to StaticGet', async () => {
        const store = {}
        const proxyStore = new ProxyStore(store)
        await proxyStore.get(_req, _name)
        assert(staticGetStub.called)
        assert(staticGetStub.calledWith(store, _req, _name))
      })
    })

    describe('> set', () => {
      let proxyStore
      beforeEach(() => {
        proxyStore = new ProxyStore(store)
        store.set.returns(Promise.resolve())
      })
      
      describe('> no user', () => {
        it('> sets expiry some time in the future', async () => {
          await proxyStore.set(_req, _name, _objValue)
          assert(store.set.called)

          const [ name, stringifiedJson ] = store.set.args[0]
          assert(name === _name, 'name is correct')
          const payload = JSON.parse(stringifiedJson)
          expect(payload.value).to.deep.equal(_objValue, 'payload is correct')
          assert(!!payload.expiry, 'expiry exists')
          assert((payload.expiry - Date.now()) > 1000 * 60 * 60 * 24, 'expiry is at least 24 hrs in the future')

          assert(!payload.userId, 'userId does not exist')
        })
      })
      describe('> yes user', () => {
        let __req = {
          ..._req,
          user: {
            id: 'foo-bar-2'
          }
        }
        it('> does not set expiry, but sets userId', async () => {
          await proxyStore.set(__req, _name, _objValue)
          assert(store.set.called)

          const [ name, stringifiedJson ] = store.set.args[0]
          assert(name === _name, 'name is correct')
          const payload = JSON.parse(stringifiedJson)
          expect(payload.value).to.deep.equal(_objValue, 'payload is correct')
          assert(!payload.expiry, 'expiry does not exist')

          assert(payload.userId, 'userId exists')
          assert(payload.userId === 'foo-bar-2', 'user-id matches')
        })
      })
    })
  })

  describe('> NotExactlyPromiseAny', () => {
    describe('> nothing resolves', () => {
      it('> throws not found error', async () => {
        try {
          await NotExactlyPromiseAny([
            (async () => {
              throw new Error(`not here`)
            })(),
            new Promise((rs, rj) => setTimeout(rj, 100)),
            new Promise((rs, rj) => rj('uhoh'))
          ])
          assert(false, 'expected to throw')
        } catch (e) {
          assert(e instanceof NotFoundError, 'expect to throw not found error')
        }
      })
    })
    describe('> something resolves', () => {
      it('> returns the first to resolve', async () => {
        try {

          const result = await NotExactlyPromiseAny([
            new Promise((rs, rj) => rj('uhoh')),
            new Promise(rs => setTimeout(() => rs('hello world'), 100)),
            Promise.resolve('foo-bar')
          ])
          assert(result == 'foo-bar', 'expecting first to resolve')
        } catch (e) {
          assert(false, 'not expecting to throw')
        }
      })
    })
  })
})
