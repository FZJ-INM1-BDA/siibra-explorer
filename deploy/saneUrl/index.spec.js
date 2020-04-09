const sinon = require('sinon')
const { Store } = require('./store')

sinon
  .stub(Store.prototype, 'getToken')
  .returns(Promise.resolve(`--fake-token--`))

const userStore = require('../user/store')

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

const express = require('express')
const router = require('./index')
const got = require('got')
const { expect } = require('chai')

const app = express()
let user
app.use('', (req, res, next) => {
  req.user = user
  next()
}, router)

const name = `nameme`

const payload = {
  ver: '0.0.1',
  queryString: 'test_test'
}

describe('> saneUrl/index.js', () => {

  describe('> router', () => {

    let server, setStub
    before(() => {

      setStub = sinon
        .stub(Store.prototype, 'set')
        .returns(Promise.resolve())
      server = app.listen(50000)
    })

    afterEach(() => {
      setStub.resetHistory()
    })

    after(() => {
      server.close()
    })
    
    it('> works', async () => {
      const body = {
        ...payload
      }
      const getStub = sinon
        .stub(Store.prototype, 'get')
        .returns(Promise.resolve(JSON.stringify(body)))
      const { body: respBody } = await got(`http://localhost:50000/${name}`)

      expect(getStub.calledWith(name)).to.be.true
      expect(respBody).to.equal(JSON.stringify(body))
      getStub.restore()
    })

    it('> get on expired returns 404', async () => {
      const body = {
        ...payload,
        expiry: Date.now() - 1e3 * 60
      }
      const getStub = sinon
        .stub(Store.prototype, 'get')
        .returns(Promise.resolve(JSON.stringify(body)))
        
      const { statusCode } = await got(`http://localhost:50000/${name}`, {
        throwHttpErrors: false
      })
      expect(statusCode).to.equal(404)
      expect(getStub.calledWith(name)).to.be.true
      getStub.restore()
    })

    it('> set works', async () => {

      await got(`http://localhost:50000/${name}`, {
        method: 'POST',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const [ storedName, _ ] = setStub.args[0]

      expect(storedName).to.equal(name)
      expect(setStub.called).to.be.true
    })

    describe('> set with unauthenticated user', () => {

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

    describe('> set with authenticated user', () => {
      
      before(() => {
        user = {
          id: 'test/1',
          name: 'hello world'
        }
      })

      afterEach(() => {
        readUserDataStub.resetHistory()
        saveUserDataStub.resetHistory()
      })

      after(() => {
        user = null
        readUserDataStub.restore()
        saveUserDataStub.restore()
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
