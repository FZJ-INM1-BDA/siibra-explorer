import { getMultiNgIdsRegionsLabelIndexMap } from './stateStore.service'

const getRandomDummyData = () => Math.round(Math.random() * 1000).toString(16)

const region1 = {
  name: 'region 1',
  labelIndex: 15,
  ngId: 'left',
  dummydata: getRandomDummyData()
}
const region2 = {
  name: 'region 2',
  labelIndex: 16,
  ngId: 'right',
  dummydata: getRandomDummyData()
}
const region3 = {
  name: 'region 3',
  labelIndex: 17,
  ngId: 'right',
  dummydata: getRandomDummyData()
}

const dummyParcellationWithNgId = {
  name: 'dummy parcellation name',
  regions: [
    region1,
    region2,
    region3
  ]
}

const dummyParcellationWithoutNgId = {
  name: 'dummy parcellation name',
  ngId: 'toplevel',
  regions: [
    region1,
    region2,
    region3
  ].map(({ ngId, ...rest }) => {
    return {
      ...rest,
      ...(ngId === 'left' ? { ngId } : {})
    }
  })
}

describe('stateStore.service.ts', () => {
  describe('getMultiNgIdsRegionsLabelIndexMap', () => {
    describe('should not mutate original regions', () => {
      
    })

    describe('should populate map properly', () => {
      const map = getMultiNgIdsRegionsLabelIndexMap(dummyParcellationWithNgId)
      it('populated map should have 2 top level', () => {
        expect(map.size).toBe(2)
      })

      it('should container left and right top level', () => {
        expect(map.get('left')).toBeTruthy()
        expect(map.get('right')).toBeTruthy()
      })

      it('left top level should have 1 member', () => {
        const leftMap = map.get('left')
        expect(leftMap.size).toBe(1)
      })

      it('left top level should map 15 => region1', () => {
        const leftMap = map.get('left')
        expect(leftMap.get(15)).toEqual(region1)
      })

      it('right top level should have 2 member', () => {
        const rightMap = map.get('right')
        expect(rightMap.size).toBe(2)
      })

      it('right top level should map 16 => region2, 17 => region3', () => {
        const rightMap = map.get('right')
        expect(rightMap.get(16)).toEqual(region2)
        expect(rightMap.get(17)).toEqual(region3)
      })
    })

    describe('should allow inheritance of ngId', () => {

      const map = getMultiNgIdsRegionsLabelIndexMap(dummyParcellationWithoutNgId)
      it('populated map should have 2 top level', () => {
        expect(map.size).toBe(2)
      })

      it('should container left and right top level', () => {
        expect(map.get('left')).toBeTruthy()
        expect(map.get('toplevel')).toBeTruthy()
      })

      it('left top level should have 1 member', () => {
        const leftMap = map.get('left')
        expect(leftMap.size).toBe(1)
      })

      it('left top level should map 15 => region1', () => {
        const leftMap = map.get('left')
        console.log(leftMap.get(15), region1)
        expect(leftMap.get(15)).toEqual(region1)
      })

      it('toplevel top level should have 2 member', () => {
        const toplevelMap = map.get('toplevel')
        expect(toplevelMap.size).toBe(2)
      })

      it('toplevel top level should map 16 => region2, 17 => region3', () => {
        const toplevelMap = map.get('toplevel')
        expect(toplevelMap.get(16).dummydata).toEqual(region2.dummydata)
        expect(toplevelMap.get(17).dummydata).toEqual(region3.dummydata)
      })
    })

    describe('should allow inheritance of attr when specified', () => {
      const attr = {
        dummyattr: 'default dummy attr'
      }
      const map = getMultiNgIdsRegionsLabelIndexMap({
        ...dummyParcellationWithNgId,
        dummyattr: 'p dummy attr'
      }, attr)
      it('every region should have dummyattr set properly', () => {
        let regions = []
        for (const [ _key1, mMap ] of Array.from(map)) {
          for (const [_key2, rs] of Array.from(mMap)) {
            regions = [...regions, rs]
          }
        }
        
        for (const r of regions) {
          console.log(r)
          expect(r.dummyattr).toEqual('p dummy attr')
        }
      })

    })
  })
})