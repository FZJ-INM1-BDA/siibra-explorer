import { getIdFromFullId, strToRgb, verifyPositionArg, arrayOrderedEql } from './util'

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

  describe('verifyPositionArg', () => {
    describe('malformed input', () => {
      let input
      it('> if props.components[0] is string', () => {
        input= 'hello world'
        expect(verifyPositionArg(input)).toBeFalsy()
      })
      it('> if position property is object', () => {
        input={
          x: 0,
          y: 0,
          z: 0
        }
        expect(verifyPositionArg(input)).toBeFalsy()
      })

      it('> if position property is array of incorrect length', () => {
        input=[]
        expect(verifyPositionArg(input)).toBeFalsy()
      })

      it('> if position property is array contain non number elements', () => {
        input = [1, 2, 'hello world']
        expect(verifyPositionArg(input)).toBeFalsy()
      })

      it('> if position property is array contain NaN', () => {
        input=[1,2,NaN]
        expect(verifyPositionArg(input)).toBeFalsy()
      })

    })

    describe('correct input', () => {
      let input
      it('> return true', () => {
        expect(verifyPositionArg([1,2,3])).toBeTruthy()
      })
    })
  })

  describe('> arrayOrderedEql', () => {
    describe('> if array eql', () => {
      it('> returns true', () => {
        expect(
          arrayOrderedEql(['foo', 3], ['foo', 3])
        ).toBeTrue()
      })
    })
    describe('> if array not eql', () => {
      describe('> not ordered eql', () => {
        it('> returns false', () => {
          expect(
            arrayOrderedEql(['foo', 'bar'], ['bar', 'foo'])
          ).toBeFalse()
        })
      })
      describe('> item not eql', () => {
        it('> returns false', () => {
          expect(
            arrayOrderedEql(['foo', null], ['foo', undefined])
          ).toBeFalse()
        })
      })
      describe('> size not eql', () => {
        it('> returns false', () => {
          expect(
            arrayOrderedEql([], [1])
          ).toBeFalse()
        })
      })
    })
  })
})
