import { getIdFromFullId, strToRgb } from './util'

describe('common/util.js', () => {
  describe('getIdFromFullId', () => {
    it('should return correct kgId for regions fetched from kg', () => {
      const id = 'https://nexus.humanbrainproject.org/v0/data/minds/core/parcellationregion/v1.0.0/675a6ce9-ef26-4e68-9852-54afeb24923c'
      expect(getIdFromFullId(id)).toBe('minds/core/parcellationregion/v1.0.0/675a6ce9-ef26-4e68-9852-54afeb24923c')
    })
  
    it('should return correct id for regions in hierarchy', () => {
      const fullId = {
        "kg": {
          "kgSchema": "minds/core/parcellationregion/v1.0.0",
          "kgId": "a844d80f-1d94-41a0-901a-14ae257519db"
        }
      }
      expect(getIdFromFullId(fullId)).toBe(`minds/core/parcellationregion/v1.0.0/a844d80f-1d94-41a0-901a-14ae257519db`)
    })
  })

  describe('strToRgb', () => {
    const str1 = 'hello world'
    const str2 = 'foo bar'
    const str3 = 'a'
    const str4 = 'b'
    const strArr = [
      str1,
      str2,
      str3,
      str4,
    ]
    it('should return rgb', () => {
      const outs = strArr.map(strToRgb)
      for (const out of outs) {
        expect(
          out instanceof Array
        ).toBeTruthy()

        expect(out.length).toEqual(3)

        for (const n of out) {
          expect(n).toBeGreaterThanOrEqual(0)
          expect(n).toBeLessThanOrEqual(255)
        }
      }
      
    })

    it('rgb returned should be disinct', () => {

      const outs = strArr.map(strToRgb)
      for (let i = 0; i < outs.length; i++) {
        const compareA = outs[i]
        for (let j = i + 1; j < outs.length; j++) {
          const compareB = outs[j]
          // compare all generated rgb, expect at least 1 of rgb to be of greater than 5 units out
          expect(
            compareA.some((n, idx) => Math.abs( n - compareB[idx] ) > 5)
          ).toBeTruthy()
        }
      }
    })

    it ('should throw if not providing stirng', () => {
      expect(() => {
        strToRgb(12)
      }).toThrow()
      
      expect(() => {
        strToRgb(['hello world'])
      }).toThrow()

      expect(() => {
        strToRgb({foo: 'baz'})
      }).toThrow()
    })
  
  })
})
