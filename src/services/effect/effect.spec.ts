import {} from 'jasmine'
import { getGetRegionFromLabelIndexId } from './effect'
const colinsJson = require('!json-loader!../../res/ext/colin.json')

const hoc1 = {
  name: "Area hOc1 (V1, 17, CalcS) - left hemisphere",
  rgb: [
    190,
    132,
    147,
  ],
  labelIndex: 8,
  ngId: "jubrain colin v18 left",
  children: [],
  status: "publicP",
  position: [
    -8533787,
    -84646549,
    1855106,
  ],
}

describe('effect.ts', () => {
  describe('getGetRegionFromLabelIndexId', () => {
    it('translateds hoc1 from labelIndex to region', () => {

      const getRegionFromlabelIndexId = getGetRegionFromLabelIndexId({
        parcellation: {
          ...colinsJson.parcellations[0],
          updated: true,
        },
      })
      const fetchedRegion = getRegionFromlabelIndexId({ labelIndexId: 'jubrain colin v18 left#8' })
      expect(fetchedRegion).toEqual(hoc1)
    })
  })
})
