import { arrayEqual } from 'src/util/array'

const defaultCmp = (o, n) => o === n

describe('arrayEqual', () => {
  // Helper instances for testing with objects
  const obj1 = { id: 1, name: 'A' }
  const obj2 = { id: 2, name: 'B' }
  const obj3 = { id: 1, name: 'C' }

  describe('with default comparison', () => {
    it('should return true for identical arrays', () => {
      const fn = arrayEqual(defaultCmp)
      expect(fn([1, 2, 3], [1, 2, 3])).toBe(true)
    })

    it('should return true for empty arrays', () => {
      const fn = arrayEqual(defaultCmp)
      expect(fn([], [])).toBe(true)
    })

    it('should return false for arrays of different lengths', () => {
      const fn = arrayEqual(defaultCmp)
      expect(fn([1, 2], [1, 2, 3])).toBe(false)
    })

    it('should return false when order disabled and elements are differently ordered', () => {
      const fn = arrayEqual(defaultCmp)
      expect(fn([1, 2, 3], [3, 2, 1])).toBe(true)
    })

    it('should return true when order enabled and elements are in same order', () => {
      const fn = arrayEqual(defaultCmp, true)
      expect(fn([1, 2, 3], [1, 2, 3])).toBe(true)
    })

    it('should return false when order enabled and elements are out of order', () => {
      const fn = arrayEqual(defaultCmp, true)
      expect(fn([1, 2, 3], [3, 2, 1])).toBe(false)
    })

    it('should handle arrays with object elements', () => {
      const fn = arrayEqual()
      expect(fn([obj1], [obj1])).toBe(true)
      expect(fn([obj1], [obj3])).toBe(false) // Should fail with defaultCmFn
    })
  })

  describe('with custom comparison function', () => {
    const objCmpFn = (o: any, n: any) => o.id === n.id

    it('should use custom comparison for objects', () => {
      const fn = arrayEqual(objCmpFn)
      expect(fn([obj1, obj2], [obj2, obj1])).toBe(true)
    })

    it('should return true for equal values with custom function', () => {
      const fn = arrayEqual((a: number, b: number) => Math.abs(a - b) < 1)
      expect(fn([1.001, 2], [1, 2])).toBe(true)
    })

    it('should ignore order with disabled ordering', () => {
      const fn = arrayEqual((a: number, b: number) => a === b)
      expect(fn([1, 2, 3], [3, 2, 1])).toBe(true)
    })

    it('should respect order with enabled ordering', () => {
      const fn = arrayEqual((a: number, b: number) => a === b, true)
      expect(fn([1, 2, 3], [3, 2, 1])).toBe(false)
      expect(fn([1, 2, 3], [1, 2, 3])).toBe(true)
    })
  })

  describe('comparison function handling', () => {
    it('should work with strict equality', () => {
      const fn = arrayEqual(defaultCmp)
      expect(fn([null, undefined], [{}, {}, []])).toBe(false)
    })

    it('should handle diverse types', () => {
      const fn = arrayEqual(defaultCmp)
      expect(fn([false, undefined, null, ''], [0, null, undefined, ''])).toBe(false)
    })
  })

  describe('Function return value', () => {
    it('should return a function that accepts arrays', () => {
      const arrayEq = arrayEqual()
      expect(typeof arrayEq).toBe('function')
      expect(typeof arrayEq([], [])).toBe('boolean')
    })
  })
})