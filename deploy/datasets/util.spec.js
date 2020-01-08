const { retry, datasetBelongsInTemplate, filterDatasets, datasetRegionExistsInParcellationRegion, _getParcellations } = require('./util')
const { fake } = require('sinon')
const { assert, expect } = require('chai')
const waxholmv2 = require('./testData/waxholmv2')
const allen2015 = require('./testData/allen2015')
const bigbrain = require('./testData/bigbrain')
const humanReceptor = require('./testData/humanReceptor')
const mni152 = require('./testData/mni152')
const colin27 = require('./testData/colin27')

describe('datasets/util.js', () => {

  describe('retry', () => {

    let val = 0
  
    const failCall = fake()
    const succeedCall = fake()
  
    const prFn = () => {
      val++
      return val >=3
        ? (succeedCall(), Promise.resolve())
        : (failCall(), Promise.reject())
    }
  
    beforeEach(() => {
      val = 0
      succeedCall.resetHistory()
      failCall.resetHistory()
    })
  
    it('retry until succeed', async () => {
      await retry(prFn)
      assert(succeedCall.called)
      assert(failCall.calledTwice)
    })
  
    it('retry with shorter timeouts', async () => {
      await retry(prFn, { timeout: 100 })
      assert(succeedCall.called)
      assert(failCall.calledTwice)
    })
  
    it('when retries excceeded, retry fn throws', async () => {
      try {
        await retry(prFn, { timeout: 100, retries: 2 })
        assert(false, 'retry fn should throw if retries exceed')
      } catch (e) {
        assert(true)
      }
    })
  })

  describe('datasetBelongsInTemplate', () => {
    it('should filter datasets with template defined', () => {
      for (const ds of bigbrain) {

        const belong = datasetBelongsInTemplate({ templateName: 'Big Brain (Histology)' })(ds)
        expect(belong).to.be.true
        
      }
      for (const ds of mni152) {

        const belong = datasetBelongsInTemplate({ templateName: 'MNI 152 ICBM 2009c Nonlinear Asymmetric' })(ds)
        expect(belong).to.be.true
      }
      for (const ds of colin27) {

        const belong = datasetBelongsInTemplate({ templateName: 'MNI Colin 27' })(ds)
        expect(belong).to.be.true
      }
    })

    it('should include datasets without any reference space defined', () => {
      for (const ds of humanReceptor) {

        const belong = datasetBelongsInTemplate({ templateName: 'Big Brain (Histology)' })(ds)
        expect(belong).to.be.true
      }
    })

    it('should filter out referenceSpaces not in list', () => {
      for (const ds of bigbrain) {

        const belong = datasetBelongsInTemplate({ templateName: 'MNI 152 ICBM 2009c Nonlinear Asymmetric' })(ds)
        expect(belong).to.be.false
      }
      for (const ds of mni152) {

        const belong = datasetBelongsInTemplate({ templateName: 'Big Brain (Histology)' })(ds)
        expect(belong).to.be.false
      }
    })
  })
  
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
    it('should filter waxholm v1 properly', async () => {
      const filteredResult = await filterDatasets(waxholmv2, { parcellationName: 'Waxholm Space rat brain atlas v1' })
      expect(filteredResult).to.have.length(0)
    })

    it('should filter waxholm v2 properly', async () => {
      const filteredResult = await filterDatasets(waxholmv2, { parcellationName: 'Waxholm Space rat brain atlas v2' })
      expect(filteredResult).to.have.length(2)
    })

    it('should filter allen 2015 properly', async () => {

      const filteredResult = await filterDatasets(allen2015, { parcellationName: 'Allen Mouse Common Coordinate Framework v3 2015' })
      expect(filteredResult).to.have.length(2)
    })
  })
  
})
