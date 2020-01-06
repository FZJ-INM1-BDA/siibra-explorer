const { retry, filterDatasets, datasetRegionExistsInParcellationRegion, _getParcellations } = require('./util')
const { fake } = require('sinon')
const { assert, expect } = require('chai')
const waxholmv2 = require('./testData/waxholmv2')

describe('datasets/util.js', () => {

  // describe('retry', () => {

  //   let val = 0
  
  //   const failCall = fake()
  //   const succeedCall = fake()
  
  //   const prFn = () => {
  //     val++
  //     return val >=3
  //       ? (succeedCall(), Promise.resolve())
  //       : (failCall(), Promise.reject())
  //   }
  
  //   beforeEach(() => {
  //     val = 0
  //     succeedCall.resetHistory()
  //     failCall.resetHistory()
  //   })
  
  //   it('retry until succeed', async () => {
  //     await retry(prFn)
  //     assert(succeedCall.called)
  //     assert(failCall.calledTwice)
  //   })
  
  //   it('retry with shorter timeouts', async () => {
  //     await retry(prFn, { timeout: 100 })
  //     assert(succeedCall.called)
  //     assert(failCall.calledTwice)
  //   })
  
  //   it('when retries excceeded, retry fn throws', async () => {
  //     try {
  //       await retry(prFn, { timeout: 100, retries: 2 })
  //       assert(false, 'retry fn should throw if retries exceed')
  //     } catch (e) {
  //       assert(true)
  //     }
  //   })
  // })
  
  describe('datasetRegionExistsInParcellationRegion', () => {
    it('should filter waxholm v2 properly', async () => {

      const waxholmv2Pr = waxholmv2.map(dataset => {
        return dataset.parcellationRegion
      })

      const { waxholm2Set } = await _getParcellations()
      for (const pr of waxholmv2Pr){

      const flag = await datasetRegionExistsInParcellationRegion(pr, waxholm2Set)
        expect(flag).to.be.true
      }
    })
  })
  
  describe('filterDatasets', () => {
    it('should filter waxholm v2 properly', async () => {
      const filteredResult = await filterDatasets(waxholmv2, { parcellationName: 'Waxholm Space rat brain atlas v2' })
      expect(filteredResult).to.have.length(1)
    })
  })
  
})
