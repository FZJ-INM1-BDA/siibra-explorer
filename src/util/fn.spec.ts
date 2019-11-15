import {} from 'jasmine'
import { isSame } from './fn'

describe(`util/fn.ts`, () => {
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
        name: 'hello'
      }
      const obj2 = {
        name: 'hello',
        world: 'world'
      }
      expect(isSame(obj, obj2)).toBe(true)
      expect(obj).not.toEqual(obj2)
    })
  })
})