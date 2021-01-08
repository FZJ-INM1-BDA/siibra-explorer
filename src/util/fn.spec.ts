import {} from 'jasmine'
import { isSame, getGetRegionFromLabelIndexId } from './fn'

describe(`util/fn.ts`, () => {

  describe('getGetRegionFromLabelIndexId', () => {
    const colinsJson = require('!json-loader!../res/ext/colin.json')
    
    const COLIN_JULICHBRAIN_LAYER_NAME = `COLIN_V25_LEFT_NG_SPLIT_HEMISPHERE`
    const COLIN_V25_ID = 'minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-25'
    
    it('translateds hoc1 from labelIndex to region', () => {

      const getRegionFromlabelIndexId = getGetRegionFromLabelIndexId({
        parcellation: {
          ...colinsJson.parcellations.find(p => p['@id'] === COLIN_V25_ID),
          updated: true,
        },
      })
      const fetchedRegion = getRegionFromlabelIndexId({ labelIndexId: `${COLIN_JULICHBRAIN_LAYER_NAME}#116` })
      expect(fetchedRegion).toBeTruthy()
      expect(fetchedRegion.fullId.kg.kgId).toEqual('c9753e82-80ca-4074-a704-9dd2c4c0d58b')
      
    })
  })
  describe(`#isSame`, () => {
    it('should return true with null, null', () => {
      expect(isSame(null, null)).toBe(true)
    })

    it('should return true with string', () => {
      expect(isSame('test', 'test')).toBe(true)
    })

    it(`should return true with numbers`, () => {
      expect(isSame(12, 12)).toBe(true)
    })

    it('should return true with obj with name attribute', () => {

      const obj = {
        name: 'hello',
      }
      const obj2 = {
        name: 'hello',
        world: 'world',
      }
      expect(isSame(obj, obj2)).toBe(true)
      expect(obj).not.toEqual(obj2)
    })
  })
})
