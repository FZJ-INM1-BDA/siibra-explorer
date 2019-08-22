const mocha = require('mocha')
const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const assert = chai.assert
const expect = chai.expect

const router = require('./index')
const app = require('express')()

const { getAllTemplates, getTemplate } = require('../templates/query')

const PORT = process.env.MOCHA_TEST_PORT || process.env.TEST_PORT || process.env.PORT || 10035

describe('mocha.js', () => {
  it('works properly in dataset/index.js', () => assert(true))
})

describe('dataset/index.js', () => {
  let _server, templateJsons
  
  before(() => new Promise((resolve, reject) => {

    app.use(router)
    _server = app.listen(PORT, () => console.log('mocha server started'))
    getAllTemplates()
      .then(templates => Promise.all(templates.map(getTemplate)))
      .then(jsons => {
        templateJsons = jsons
        resolve()
      })
      .catch(reject)
  }))


  after(() => {
    _server.close(err => {
      if (err) console.warn('mocha server did not close correctly', err)
      else console.log('mocha server closed')
    }) 
  })
  
  /**
   * no tests currently
   */
})