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

describe('util.js without env', (done) => {

  const util = require('./util')
  it('even when no env is set, it should fulfill', () => {
    const getUtil = util()
    return getUtil.should.be.fulfilled
  })

  it('if env is not set, getPublicToken method should fail', async () => {
    const utilObj = await util()
    const { getPublicAccessToken } = utilObj
    return getPublicAccessToken().should.be.rejected
  })
})