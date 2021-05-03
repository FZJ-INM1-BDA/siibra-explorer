import { RegDereg } from "./regDereg.base"

describe('> regDereg.base.ts', () => {
  describe('> RegDereg', () => {
    let regDereg: RegDereg<string, boolean>
    beforeEach(() => {
      regDereg = new RegDereg()
    })

    describe('> #register', () => {
      it('> adds interceptor fn', () => {
        let nextReturnVal = false
        const fn = (ev: any) => nextReturnVal
        regDereg.register(fn)
        expect(regDereg['callbacks'].indexOf(fn)).toBeGreaterThanOrEqual(0)
      })
      it('> when config not supplied, or first not present, will add fn to the last of the queue', () => {
        let dummyReturn = false
        const dummy = (ev: any) => dummyReturn
        regDereg.register(dummy)
        
        let fnReturn = false
        const fn = (ev: any) => fnReturn
        regDereg.register(fn)
        expect(regDereg['callbacks'].indexOf(fn)).toEqual(1)

        let fn2Return = false
        const fn2 = (ev: any) => fn2Return
        regDereg.register(fn2, {})
        expect(regDereg['callbacks'].indexOf(fn)).toEqual(1)
        expect(regDereg['callbacks'].indexOf(fn2)).toEqual(2)
      })
      it('> when first is supplied as a config param, will add the fn at the front', () => {

        let dummyReturn = false
        const dummy = (ev: any) => dummyReturn
        regDereg.register(dummy)

        let fnReturn = false
        const fn = (ev: any) => fnReturn
        regDereg.register(fn, {
          first: true
        })
        expect(regDereg['callbacks'].indexOf(fn)).toEqual(0)

      })
    })

    describe('> deregister', () => {
      it('> if the fn exist in the register, it will be removed', () => {

        let fnReturn = false
        let fn2Return = false
        const fn = (ev: any) => fnReturn
        const fn2 = (ev: any) => fn2Return
        regDereg.register(fn)
        expect(regDereg['callbacks'].indexOf(fn)).toBeGreaterThanOrEqual(0)
        expect(regDereg['callbacks'].length).toEqual(1)

        regDereg.deregister(fn)
        expect(regDereg['callbacks'].indexOf(fn)).toBeLessThan(0)
        expect(regDereg['callbacks'].length).toEqual(0)
      })

      it('> if fn does not exist in register, it will not be removed', () => {
        
        let fnReturn = false
        let fn2Return = false
        const fn = (ev: any) => fnReturn
        const fn2 = (ev: any) => fn2Return
        regDereg.register(fn)
        expect(regDereg['callbacks'].indexOf(fn)).toBeGreaterThanOrEqual(0)
        expect(regDereg['callbacks'].length).toEqual(1)

        regDereg.deregister(fn2)
        expect(regDereg['callbacks'].indexOf(fn)).toBeGreaterThanOrEqual(0)
        expect(regDereg['callbacks'].length).toEqual(1)
      })
    })
  })
})
