const { NotFoundError, Store } = require('./store')
const sinon = require('sinon')
const { expect } = require("chai")
const nock = require('nock')

const fakeToken = `token-123-token`
const objStorateRootUrl = `http://fake.obj`
const objName = `objname`
const objContent = `objContent`

describe('> store.js', () => {
  
  describe('> Store', () => {
    const getTokenSpy = sinon
      .stub(Store.prototype, 'getToken')
      .returns(Promise.resolve(fakeToken))
    
    const store = new Store({ objStorateRootUrl })

    afterEach(() => {
      getTokenSpy.resetHistory()
    })

    it('> spy works', async () => {
      expect(getTokenSpy.called).to.be.true

      const token = await store.getToken()
      expect(token).to.equal(fakeToken)
    })

    it('> spy gets reset', async () => {
      expect(getTokenSpy.notCalled).to.be.true
    })

    it('> get works', async () => {
      const scope = nock(objStorateRootUrl)
        .get(`/${objName}`)
        .reply(200, objContent)

      const content = await store.get(objName)
      expect(content).to.equal(objContent)
      expect(scope.isDone()).to.be.true

    })

    it('> set works', async () => {

      const scope = nock(objStorateRootUrl)
        .put(`/${objName}`)
        .reply(200)

      scope.on('request', (req, int, body) => {
        expect(body).to.equal(objContent)
      })

      await store.set(objName, objContent)
      expect(scope.isDone()).to.be.true
    })

    it('> set retries if at first fails', async () => {
      let index = 0
      const scope = nock(objStorateRootUrl)
        .put(`/${objName}`)
        .twice()
        .reply((_uri, _reqBody, cb) => {
          cb(null, [ index % 2 === 0 ? 401 : 200 ])
          index ++
        })
      
      await store.set(objName, objContent)
      expect(scope.isDone()).to.be.true
      expect(getTokenSpy.called).to.be.true
    })
  })
})
