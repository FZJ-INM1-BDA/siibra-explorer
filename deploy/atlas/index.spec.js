const { expect, assert } = require('chai')
const express = require('express')
const { retry } = require('../../common/util')
const got = require('got')

let server, atlases, templates = []
const PORT = 12345
const baseUrl = `http://localhost:${PORT}`
process.env.HOSTNAME = baseUrl
let routePathname
describe('atlas/index.js', () => {
  before(async () => {
    const app = express()

    app.use((req, res, next) => {
      if (routePathname) {
        res.locals.routePathname = routePathname
      }
      next()
    })

    app.use(require('./index'))

    server = app.listen(PORT)

    await retry(async () => {
      console.log('retrying')
      await got(`${baseUrl}/ready`)
    }, { timeout: 500 })
  })

  beforeEach(() => {
    routePathname = null
  })

  after(() => {
    server.close()
  })
  it('> GET / works', async () => {
    const { body } = await got(`${baseUrl}/`, { responseType: 'json' })
    expect(body.length).to.equal(3)
    assert(
      body.every(({ url }) => !/undefined/.test(url) ),
      'url pathname should not contain undefined'
    )
    atlases = body
  })

  it('> route pathname works', async () => {
    routePathname = 'marshmellow'

    const { body } = await got(`${baseUrl}/`, { responseType: 'json' })
    expect(body.length).to.equal(3)
    assert(
      body.every(({ url }) => /marshmellow/.test(url)),
      'url pathname should be as set'
    )
  })
  it('> every end point works', async () => {
    for (const { url } of atlases) {
      expect(!!url).to.be.true
      const { body } = await got(
        /^http/.test(url) ? url : `${baseUrl}/${url}`,
        {responseType: 'json'}
      )
      expect(body.templateSpaces.length).to.be.greaterThan(0)
    }
  })
})