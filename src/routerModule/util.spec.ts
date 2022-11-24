import { encodeCustomState, verifyCustomState } from './util'

describe('> util.ts', () => {

  describe('> verifyCustomState', () => {
    it('> should return false on bad custom state', () => {
      expect(verifyCustomState('hello')).toBeFalse()
    })
    it('> should return true on valid custom state', () => {
      expect(verifyCustomState('x-test')).toBeTrue()
    })
  })

  describe('> encodeCustomState', () => {
    describe('> malformed values', () => {
      describe('> bad key', () => {
        it('> throws', () => {
          expect(() => {
            encodeCustomState('hello', 'world')
          }).toThrow()
        })
      })
      describe('> falsy value', () => {
        it('> returns falsy value', () => {
          expect(encodeCustomState('x-test', null)).toBeFalsy()
        })
      })
    })
    describe('> correct values', () => {
      it('> encodes correctly', () => {
        expect(encodeCustomState('x-test', 'foo-bar')).toEqual('x-test:foo-bar')
      })
      it("> encodes /", () => {
        expect(encodeCustomState("x-test", "http://local.dev/foo")).toEqual(`x-test:http:%2F%2Flocal.dev%2Ffoo`)
      })
    })
  })
})
