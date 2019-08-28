const mocha = require('mocha')
const chai = require('chai')
const expect = chai.expect

const { detEncoding, GZIP, BROTLI } = require('./index')

const gzip = 'gzip'
const gzipDeflate = 'gzip, deflate'
const gzipDeflateBr = 'gzip, deflate, br'

describe('compression/index.js', () => {
  let nodeEnv
  
  before(() => {
    nodeEnv = process.env.NODE_ENV
  })

  after(() => {
    process.env.NODE_ENV = nodeEnv
  })
  
  describe('#detEncoding', () => {
    it('When NODE_ENV is set to production, returns appropriate encoding', () => {
      process.env.NODE_ENV = 'production'
      expect(detEncoding(null)).to.equal(null)
      expect(detEncoding(gzip)).to.equal(GZIP)
      expect(detEncoding(gzipDeflate)).to.equal(GZIP)
      expect(detEncoding(gzipDeflateBr)).to.equal(BROTLI)
    })

    it('When NODE_ENV is set to non production, returns null always', () => {
      process.env.NODE_ENV = 'development'
      expect(detEncoding(null)).to.equal(null)
      expect(detEncoding(gzip)).to.equal(null)
      expect(detEncoding(gzipDeflate)).to.equal(null)
      expect(detEncoding(gzipDeflateBr)).to.equal(null)
    })
  })
})