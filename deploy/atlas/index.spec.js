const { expect, assert } = require('chai')
const express = require('express')
const router = require('./index')
const { retry } = require('../../common/util')
const got = require('got')

let server, atlases, templates = []
const PORT = 12345
const baseUrl = `http://localhost:${PORT}`
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

    app.use(router)

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
      body.every(({ url }) => !/undefined/.test(url)),
      'url pathname should not contain undefined'
    )
    atlases = body
  })

  it('> route pathname works', async () => {
    routePathname = 'marshmellow'

    const { body } = await got(`${baseUrl}/`, { responseType: 'json' })
    expect(body.length).to.equal(3)
    assert(
      body.every(({ url }) => /^marshmellow/.test(url)),
      'url pathname should be as set'
    )
  })
  it('> every end point works', async () => {
    for (const { url } of atlases) {
      expect(!!url).to.be.true
      const { body } = await got(`${baseUrl}/${url}`, {responseType: 'json'})
      expect(body.templateSpaces.length).to.be.greaterThan(0)
      templates.push(
        body.templateSpaces
      )
    }
  })

  it('> templates resolves fine', async () => {
    for (const arrTmpl of templates) {
      for (const { url } of arrTmpl) {
        expect(!!url).to.equal(true)
        const { body } = await got(`${baseUrl}/${url}`, { responseType: 'json' })
        expect(body.parcellations.length).to.be.greaterThan(0)
      }
    }
  })
})