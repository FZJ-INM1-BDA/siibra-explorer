const ibc = require('./importIBS')
const { expect } = require('chai')
const expectedIBCData = require('./testData/ibcDataExpected')

describe('datasets/data/importIBC.js', () => {
  describe('Get Dataset object from markdown', () => {
    it('dataset name valid', () => {
      const ibcData = ibc.getIbcDatasetByFileName('left_AIPS_IP1.md')
      expect(expectedIBCData.name).to.be.equal(ibcData.name)
    })
    it('dataset description valid', () => {
      const ibcData = ibc.getIbcDatasetByFileName('left_AIPS_IP1.md')
      expect(expectedIBCData.description).to.be.equal(ibcData.description)
    })
    it('dataset reference valid', () => {
      const ibcData = ibc.getIbcDatasetByFileName('left_AIPS_IP1.md')
      expect(expectedIBCData.kgReference[0]).to.be.equal(ibcData.kgReference[0])
    })
    it('dataset fullId valid', () => {
      const ibcData = ibc.getIbcDatasetByFileName('left_AIPS_IP1.md')
      expect(expectedIBCData.fullId).to.be.equal(ibcData.fullId)
    })
    it('dataset region valid', () => {
      const ibcData = ibc.getIbcDatasetByFileName('left_AIPS_IP1.md')
      expect(expectedIBCData.parcellationRegion[0]).to.be.eql(ibcData.parcellationRegion[0])
    })
    it('dataset valid', () => {
      const ibcData = ibc.getIbcDatasetByFileName('left_AIPS_IP1.md')
      expect(expectedIBCData).to.be.eql(ibcData)
    })
  })
})
