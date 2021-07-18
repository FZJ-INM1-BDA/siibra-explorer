import { ObjectToArrayPipe } from "./objToArray.pipe"

describe('> objToArray.pipe.ts', () => {
  describe('> ObjectToArrayPipe', () => {
    const pipe = new ObjectToArrayPipe()
    it('> transforms obj to array', () => {
      const result = pipe.transform({'a': '1', 'b': '2'})
      expect(result).toEqual([{
        key: 'a',
        value: '1'
      }, {
        key: 'b',
        value: '2'
      }])
    })
  })
})