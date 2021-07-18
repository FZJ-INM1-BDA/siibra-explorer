const sinon = require('sinon')
const got = require('got')
const cookie = require('cookie')
const { expect } = require('chai')
const express = require('express')

let NotFoundError
const userStore = require('../user/store')

class StubStore {
  async set(key, val) {

  }
  async get(key) {

  }
}

class StubNotFoundError extends Error{}

const savedUserDataPayload = {
  otherData: 'not relevant data',
  savedCustomLinks: [
    '111222',
    '333444'
  ]
}

const readUserDataStub = sinon
  .stub(userStore, 'readUserData')
  .returns(Promise.resolve(savedUserDataPayload))

const saveUserDataStub = sinon
  .stub(userStore, 'saveUserData')
  .returns(Promise.resolve())


describe('> saneUrl/index.js', () => {
  const name = `nameme`,
    payload = {
      ver: '0.0.1',
      queryString: 'test_test'
    }

  let DepObjStub,
    depcGetStub,
    SaneUrlStoreObjStub,
    getStub,
    setStub
    
  before(() => {
    const SaneUrlStore = require('./store')
    const DepcStore = require('./depcObjStore')
    NotFoundError = SaneUrlStore.NotFoundError

    getStub = sinon.stub()
    setStub = sinon.stub()
    class StubbedStoreObj {
      constructor(){
        this.get = getStub
        this.set = setStub
      }
    }
    depcGetStub = sinon.stub()
    class DepcStubbedObj {
      constructor() {
        this.get = depcGetStub
      }
    }
    DepObjStub = sinon.stub(DepcStore, 'Store').value(DepcStubbedObj)
    SaneUrlStoreObjStub = sinon.stub(SaneUrlStore, 'Store').value(StubbedStoreObj)
  })
  after(() => {
    SaneUrlStoreObjStub.restore()
    DepObjStub.restore()
  })

  beforeEach(() => {
    depcGetStub.callsFake(async () => {
      throw new NotFoundError()
    })
  })

  afterEach(() => {
    depcGetStub.resetHistory()
    depcGetStub.resetBehavior()
    getStub.resetHistory()
    getStub.resetBehavior()
    setStub.resetHistory()
    setStub.resetBehavior()
  })

  before(() => {
    getStub = sinon.stub(StubStore.prototype, 'get')
    setStub = sinon.stub(StubStore.prototype, 'set')
    require.cache[require.resolve('../lruStore')] = {
      exports: {
        redisURL: null
      }
    }

    let server, user
    before(() => {
      const { router } = require('./index')
      const app = express()
      app.use('', (req, res, next) => {
        req.user = user
        next()
      }, router)
      
      server = app.listen(50000)
    })
    after(() => {
      console.log('closing server')
      
      server.close()
    })
    
    describe('> works', () => {

      const body = {
        ...payload
      }

      beforeEach(() => {
        setStub.returns(Promise.resolve())
        getStub.returns(Promise.resolve(JSON.stringify(body)))
      })
      afterEach(() => {
        setStub.resetHistory()
        setStub.resetBehavior()
        getStub.resetHistory()
        getStub.resetBehavior()
      })

      it('> works', async () => {
        const { body: respBody } = await got(`http://localhost:50000/${name}`)
        expect(getStub.calledWith(name)).to.be.true
        expect(respBody).to.equal(JSON.stringify(body))
      })
    })

    describe('> expired', () => {
      beforeEach(() => {
        const body = {
          ...payload,
          expiry: Date.now() - 1e3 * 60
        }
  
        getStub.returns(Promise.resolve(JSON.stringify(body)))
      })

      it('> get on expired returns 404', async () => {
          
        const { statusCode } = await got(`http://localhost:50000/${name}`, {
          throwHttpErrors: false
        })
        expect(statusCode).to.equal(404)
        expect(getStub.calledWith(name)).to.be.true
      })
      it('> get on expired with txt html header sets cookie and redirect', async () => {
          
        const { statusCode, headers } = await got(`http://localhost:50000/${name}`, {
          headers: {
            'accept': 'text/html'
          },
          followRedirect: false
        })
        expect(statusCode).to.be.greaterThan(300)
        expect(statusCode).to.be.lessThan(303)
  
        expect(getStub.calledWith(name)).to.be.true
  
        const c = cookie.parse(...headers['set-cookie'])
        expect(!!c['iav-error']).to.be.true
      })
    })

    describe('> set', () => {

      describe('> error', () => {
        describe('> entry exists', () => {
          beforeEach(() => {
            getStub.returns(Promise.resolve('{}'))
          })

          it('> returns 409 conflict', async () => {
            const { statusCode } = await got(`http://localhost:50000/${name}`, {
              method: 'POST',
              headers: {
                'Content-type': 'application/json'
              },
              body: JSON.stringify(payload),
              throwHttpErrors: false
            })
      
            expect(statusCode).to.equal(409)
            expect(getStub.called).to.be.true
            expect(setStub.called).to.be.false
          })
        })

        describe('> other error', () => {
          beforeEach(() => {
            getStub.callsFake(async () => {
              throw new Error(`other errors`)
            })
          })
          it('> returns 500', async () => {
            const { statusCode } = await got(`http://localhost:50000/${name}`, {
              method: 'POST',
              headers: {
                'Content-type': 'application/json'
              },
              body: JSON.stringify(payload),
              throwHttpErrors: false
            })
      
            expect(statusCode).to.equal(500)
            expect(getStub.called).to.be.true
            expect(setStub.called).to.be.false
          })
        })
      })

      describe('> success', () => {
        beforeEach(() => {
          getStub.callsFake(async () => {
            throw new NotFoundError()
          })
        })
        it('> checks if the name is available', async () => {
          debugger
          await got(`http://localhost:50000/${name}`, {
            method: 'POST',
            headers: {
              'Content-type': 'application/json'
            },
            body: JSON.stringify(payload)
          })
    
          const [ storedName, _ ] = setStub.args[0]
    
          expect(storedName).to.equal(name)
          expect(getStub.called).to.be.true
          expect(setStub.called).to.be.true
        })

        describe('> anony user', () => {
          beforeEach(() => {
            user = null
          })

          it('> set with anonymous user has user undefined and expiry as defined', async () => {
    
            await got(`http://localhost:50000/${name}`, {
              method: 'POST',
              headers: {
                'Content-type': 'application/json'
              },
              body: JSON.stringify(payload)
            })
      
            expect(setStub.called).to.be.true
            const [ _, storedContent] = setStub.args[0]
            const { userId, expiry } = JSON.parse(storedContent)
            expect(!!userId).to.be.false
            expect(!!expiry).to.be.true
      
            // there will be some discrepencies, but the server lag should not exceed 5 seconds
            expect( 1e3 * 60 * 60 * 72 - expiry + Date.now() ).to.be.lessThan(1e3 * 5)
          })  
          })

        describe('> authenticated user', () => {
          beforeEach(() => {
            user = {
              id: 'test/1',
              name: 'hello world'
            }
          })
          it('> userId set, expiry unset', async () => {
    
            await got(`http://localhost:50000/${name}`, {
              method: 'POST',
              headers: {
                'Content-type': 'application/json'
              },
              body: JSON.stringify(payload)
            })
      
            expect(setStub.called).to.be.true
            const [ _, storedContent] = setStub.args[0]
            const { userId, expiry } = JSON.parse(storedContent)
            expect(!!userId).to.be.true
            expect(!!expiry).to.be.false
      
            expect( userId ).to.equal('test/1')
          })
          it('> readUserDataset saveUserDataset data stubs called', async () => {
    
            await got(`http://localhost:50000/${name}`, {
              method: 'POST',
              headers: {
                'Content-type': 'application/json'
              },
              body: JSON.stringify(payload)
            })
            
            expect(readUserDataStub.called).to.be.true
            expect(readUserDataStub.calledWith(user)).to.be.true
            
            expect(saveUserDataStub.called).to.be.true
            expect(saveUserDataStub.calledWith(user, {
              ...savedUserDataPayload,
              savedCustomLinks: [
                ...savedUserDataPayload.savedCustomLinks,
                name
              ]
            })).to.be.true
          })
        })

      })
    })
  })
})

