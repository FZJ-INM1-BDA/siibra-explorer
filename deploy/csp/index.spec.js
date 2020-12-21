const express = require('express')
const app = express()
const csp = require('./index')
const got = require('got')
const { expect, assert } = require('chai')

const checkBaseFn = async (rules = []) => {

  const resp = await got(`http://localhost:1234/`)
  const stringifiedHeader = JSON.stringify(resp.headers)

  /**
   * expect stats.humanbrainproject.eu and neuroglancer.humanbrainproject.eu to be present
   */
  assert(
    /stats\.humanbrainproject\.eu/.test(stringifiedHeader),
    'stats.humanbrainproject.eu present in header'
  )

  assert(
    /neuroglancer\.humanbrainproject\.eu/.test(stringifiedHeader),
    'neuroglancer.humanbrainproject.eu present in header'
  )

  assert(
    /content-security-policy/.test(stringifiedHeader),
    'content-security-policy present in header'
  )

  for (const rule of rules) {
    assert(
      rule.test(stringifiedHeader),
      `${rule.toString()} present in header`
    )
  }
}

describe('> csp/index.js', () => {
  let server, permittedCsp
  const middleware = (req, res, next) => {
    if (!!permittedCsp) {
      req.session = { permittedCsp }
    }
    next()
  }
  before(done => {
    app.use(middleware)
    csp(app)
    app.get('/', (req, res) => {
      res.status(200).send('OK')
    })
    server = app.listen(1234, () => console.log(`app listening`))
    setTimeout(() => {
      done()
    }, 1000);
  })

  it('> should work when session is unset', async () => {
    await checkBaseFn()
  })

  describe('> if session and permittedCsp are both set', () => {
    describe('> if permittedCsp is malformed', () => {
      describe('> if permittedCsp is set to string', () => {
        before(() => {
          permittedCsp = 'hello world'
        })
        it('> base csp should work', async () => {
          await checkBaseFn()
        })
      })

      describe('> if permittedCsp is number', () => {
        before(() => {
          permittedCsp = 420
        })
        it('> base csp should work', async () => {
          await checkBaseFn()
        })
      })
    })
  
    describe('> if premittedCsp defines', () => {

      before(() => {
        permittedCsp = {
          'foo-bar': {
            'connect-src': [
              'connect.int.dev'
            ],
            'script-src': [
              'script.int.dev'
            ]
          }
        }
      })
      
      it('> csp should include permittedCsp should work', async () => {
        await checkBaseFn([
          /connect\.int\.dev/,
          /script\.int\.dev/,
        ])
      })
    })
  })
  after(done => {
    server.close(done)
  })
})