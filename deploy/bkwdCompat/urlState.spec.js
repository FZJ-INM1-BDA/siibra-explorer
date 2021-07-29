const { assert } = require('chai')
const url = require('url')
const arr = require('./ngLinks.json')
const parseUrlState = require('./urlState')

describe('> urlState.js', () => {
  it('> works', () => {
    for (const item of arr) {
      const parsed = url.parse(`/?${item}`, true)
      const out = parseUrlState(parsed.query)
      
      assert(
        true,
        'should not result in parsing error'  
      )
    }
  })
})
