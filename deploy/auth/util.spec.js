const mocha = require('mocha')
const chai = require('chai')
const assert = chai.assert
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const expect = chai.expect
const should = chai.should()

describe('mocha.js', () => {
  it('mocha works properly', () => {
    assert(true)
  })
})

describe('chai-as-promised.js', () => {
  it('resolving promise is resolved', () => {

    return Promise.resolve(2 + 2).should.eventually.equal(4)
    
  })
  it('rejecting promise is rejected', () => {
    return Promise.reject('no reason').should.be.rejected
  })
})

describe('util.js with env', () => {
  it('when client id and client secret and refresh token is set, util should not throw', function (done) {
    const util = require('./util')
    util()
      .then(({ getPublicAccessToken }) => getPublicAccessToken())
      .then(() => done())
      .catch(done)
  })
})