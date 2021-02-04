const router = require('./index')
const app = require('express')()
const sinon = require('sinon')
const { stub, spy } = require('sinon')
const { default: got } = require('got/dist/source')
const { expect, assert } = require('chai')

const sessionObj = {
  permittedCspVal: {},
  get permittedCsp(){
    return this.permittedCspVal
  },
  set permittedCsp(val) {

  }
}

const permittedCspSpy = spy(sessionObj, 'permittedCsp', ['get', 'set'])

const middleware = (req, res, next) => {
  req.session = sessionObj
  next()
}

describe('> user/index.js', () => {
  let server
  
  before(done => {
    app.use(middleware)
    app.use(router)
    server = app.listen(1234)
    setTimeout(() => {
      done()
    }, 1000);
  })

  afterEach(() => {
    permittedCspSpy.get.resetHistory()
    permittedCspSpy.set.resetHistory()
    sessionObj.permittedCspVal = {}
  })

  after(done => server.close(done))

  describe('> GET /pluginPermissions', () => {
    it('> getter called, setter not called', async () => {
      await got.get('http://localhost:1234/pluginPermissions')

      assert(
        permittedCspSpy.get.calledOnce,
        `permittedCsp getter accessed once`
      )

      assert(
        permittedCspSpy.set.notCalled,
        `permittedCsp setter not called`
      )
    })
    it('> if no value present, returns {}', async () => {
      sessionObj.permittedCspVal = null
      const { body } = await got.get('http://localhost:1234/pluginPermissions')
      expect(JSON.parse(body)).to.deep.equal({})
    })

    it('> if value present, return value', async () => {
      const val = {
        'hot-dog': {
          'weatherman': 'tolerable'
        }
      }
      sessionObj.permittedCspVal = val

      const { body } = await got.get('http://localhost:1234/pluginPermissions')
      expect(JSON.parse(body)).to.deep.equal(val)
    })
  })

  describe('> POST /pluginPermissions', () => {
    it('> getter called once, then setter called once', async () => {
      const jsonPayload = {
        'hotdog-world': 420
      }
      await got.post('http://localhost:1234/pluginPermissions', {
        json: jsonPayload
      })
      assert(
        permittedCspSpy.get.calledOnce,
        `permittedCsp getter called once`
      )
      assert(
        permittedCspSpy.set.calledOnce,
        `permittedCsp setter called once`
      )

      assert(
        permittedCspSpy.get.calledBefore(permittedCspSpy.set),
        `getter called before setter`
      )

      assert(
        permittedCspSpy.set.calledWith(jsonPayload),
        `setter called with payload`
      )
    })

    it('> if sessio obj exists, will set with merged obj', async () => {
      const prevVal = {
        'foo-bar': [
          123,
          'fuzz-buzz'
        ],
        'hot-dog-world': 'baz'
      }
      sessionObj.permittedCspVal = prevVal

      const jsonPayload = {
        'hot-dog-world': [
          'fussball'
        ]
      }

      await got.post('http://localhost:1234/pluginPermissions', {
        json: jsonPayload
      })
      assert(
        permittedCspSpy.set.calledWith({
          ...prevVal,
          ...jsonPayload,
        }),
        'setter called with merged payload'
      )
    })
  })

  describe('> DELETE /pluginPermissions/:pluginId', () => {
    const prevVal = {
      'foo': 'bar',
      'buzz': 'lightyear'
    }
    beforeEach(() => {
      sessionObj.permittedCspVal = prevVal
    })

    it('> getter and setter gets called once and in correct order', async () => {

      await got.delete(`http://localhost:1234/pluginPermissions/foolish`)

      assert(
        permittedCspSpy.get.calledOnce,
        'getter called once'
      )

      assert(
        permittedCspSpy.set.calledOnce,
        'setter called once'
      )

      assert(
        permittedCspSpy.get.calledBefore(permittedCspSpy.set),
        'getter called before setter'
      )
    })

    it('> if attempts at delete non existent key, still returns ok', async () => {

      const { body } = await got.delete(`http://localhost:1234/pluginPermissions/foolish`)
      const json = JSON.parse(body)
      expect(json).to.deep.equal({ ok: true })

      assert(
        permittedCspSpy.set.calledWith(prevVal),
        'permittedCsp setter called with the prev value (nothing changed)'
      )
    })

    it('> if attempts at delete exisiting key, returns ok, and value is set', async () => {

      const { body } = await got.delete(`http://localhost:1234/pluginPermissions/foo`)
      const json = JSON.parse(body)
      expect(json).to.deep.equal({ ok: true })

      const { foo, ...rest } = prevVal
      assert(
        permittedCspSpy.set.calledWith(rest),
        'permittedCsp setter called with the prev value, less the deleted key'
      )
    })
  })
})