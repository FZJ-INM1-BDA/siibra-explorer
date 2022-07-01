import {} from 'jasmine'
import { ParseDoiPipe } from './parseDoi.pipe'

describe('doiPipe.pipe.ts', () => {
  const pipe = new ParseDoiPipe()
  describe('DoiParsePIpe' , () => {
    it('should parse string without prefix by appending doi prefix', () => {
      const result = pipe.transform('123.456')
      expect(result).toBe(`https://doi.org/123.456`)
    })

    it('should not append doi prefix if the first argument leads by http or https', () => {
      expect(pipe.transform('http://google.com')).toBe('http://google.com')
      expect(pipe.transform('https://google.com')).toBe('https://google.com')
    })
  })
})
