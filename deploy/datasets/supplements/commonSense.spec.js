const { 
  getCommonSenseDsFilter,
  dsIsHuman,
  dsIsRat,
  dsIsMouse
} = require('./commonSense')

const { expect } = require('chai')

const bigbrain = require('../testData/bigbrain')
const waxholmv2 = require('../testData/waxholmv2')
const allen2015 = require('../testData/allen2015')

describe('commonSense.js', () => {
  describe('dsIsRat', () => {

    it('filters bigbrain datasets properly', () => {
      for (const ds of bigbrain){
        const isHuman = dsIsRat({ ds })
        expect(isHuman).to.be.false
      }
    })
  })

  describe('dsIsMouse', () => {

    it('filters bigbrain datasets properly', () => {
      for (const ds of bigbrain){
        const isHuman = dsIsMouse({ ds })
        expect(isHuman).to.be.false
      }
    })
  })

  describe('dsIsHuman', () => {
    it('filters bigbrain datasets properly', () => {

      for (const ds of bigbrain){
        const isHuman = dsIsHuman({ ds })
        expect(isHuman).to.be.true
      }
    })

    it('filters waxholm v2 data properly', () => {
      
      for (const ds of waxholmv2){
        const isHuman = dsIsHuman({ ds })
        expect(isHuman).to.be.false
      }
    })

    it('filters allen data properly', () => {

      for (const ds of allen2015){
        const isHuman = dsIsHuman({ ds })
        expect(isHuman).to.be.false
      }
      
    })
  })

  describe('getCommonSenseDsFilter', () => {
    // TODO
  })
  
})