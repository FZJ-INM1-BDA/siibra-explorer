import {} from 'jasmine'
import { HumanReadableFileSizePipe } from './humanReadableFileSize.pipe'

describe('humanReadableFileSize.pipe.ts', () => {
  describe('HumanReadableFileSizePipe', () => {
    it('steps properly when nubmers ets large', () => {
      const pipe = new HumanReadableFileSizePipe()
      const num = 12

      expect(pipe.transform(num, 0)).toBe(`12 byte(s)`)
      expect(pipe.transform(num * 1e3, 0)).toBe(`12 KB`)
      expect(pipe.transform(num * 1e6, 0)).toBe(`12 MB`)
      expect(pipe.transform(num * 1e9, 0)).toBe(`12 GB`)
      expect(pipe.transform(num * 1e12, 0)).toBe(`12 TB`)

      expect(pipe.transform(num * 1e15, 0)).toBe(`12000 TB`)
    })

    it('pads the correct zeros', () => {
      const pipe = new HumanReadableFileSizePipe()
      const num = 3.14159

      expect(pipe.transform(num, 0)).toBe(`3 byte(s)`)
      expect(pipe.transform(num, 1)).toBe(`3.1 byte(s)`)
      expect(pipe.transform(num, 2)).toBe(`3.14 byte(s)`)
      expect(pipe.transform(num, 3)).toBe(`3.142 byte(s)`)
      expect(pipe.transform(num, 4)).toBe(`3.1416 byte(s)`)
      expect(pipe.transform(num, 5)).toBe(`3.14159 byte(s)`)
      expect(pipe.transform(num, 6)).toBe(`3.141590 byte(s)`)
      expect(pipe.transform(num, 7)).toBe(`3.1415900 byte(s)`)
    })

    it('parses string as well as number', () => {
      // TODO finish tests
    })

    it('throws when a non number is passed to either argument', () => {
      // TODO finish tests
    })

  })
})
