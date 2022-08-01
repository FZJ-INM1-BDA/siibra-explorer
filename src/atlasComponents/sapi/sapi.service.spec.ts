import { finalize } from "rxjs/operators"
import * as env from "src/environments/environment"
import { SAPI } from "./sapi.service"

describe("> sapi.service.ts", () => {
  describe("> SAPI", () => {
    describe("#BsEndpoint$", () => {
      let fetchSpy: jasmine.Spy
      let environmentSpy: jasmine.Spy

      const endpt1 = 'http://foo-bar'
      const endpt2 = 'http://buzz-bizz'

      const atlas1 = 'foo'
      const atlas2 = 'bar'

      let subscribedVal: string

      beforeEach(() => {
        SAPI.ClearBsEndPoint()
        fetchSpy = spyOn(window, 'fetch')
        fetchSpy.and.callThrough()

        environmentSpy = spyOnProperty(env, 'environment')
        environmentSpy.and.returnValue({
          SIIBRA_API_ENDPOINTS: `${endpt1},${endpt2}`
        })
      })


      afterEach(() => {
        SAPI.ClearBsEndPoint()
        fetchSpy.calls.reset()
        environmentSpy.calls.reset()
        subscribedVal = null
      })

      describe("> first passes", () => {
        beforeEach(done => {
          const resp = new Response(JSON.stringify([atlas1]), { headers: { 'content-type': 'application/json' }, status: 200 })
          fetchSpy.and.callFake(async url => {
            if (url === `${endpt1}/atlases`) {
              return resp
            }
            throw new Error("controlled throw")
          })
          SAPI.BsEndpoint$.pipe(
            finalize(() => done())
          ).subscribe(val => {
            subscribedVal = val
          })
        })
        it("> should call fetch twice", async () => {
          expect(fetchSpy).toHaveBeenCalledTimes(2)
          
          const allArgs = fetchSpy.calls.allArgs()
          expect(allArgs.length).toEqual(2)
          expect(allArgs[0]).toEqual([`${endpt1}/atlases`])
          expect(allArgs[1]).toEqual([`${endpt2}/atlases`])
        })

        it("> endpoint should be set", async () => {
          expect(subscribedVal).toBe(endpt1)
        })

        it("> additional calls should return cached observable", () => {

          expect(fetchSpy).toHaveBeenCalledTimes(2)
          SAPI.BsEndpoint$.subscribe()
          SAPI.BsEndpoint$.subscribe()

          expect(fetchSpy).toHaveBeenCalledTimes(2)
        })
      })

      describe("> first fails", () => {
        beforeEach(done => {
          fetchSpy.and.callFake(async url => {
            if (url === `${endpt1}/atlases`) {
              throw new Error(`bla`)
            }
            const resp = new Response(JSON.stringify([atlas1]), { headers: { 'content-type': 'application/json' }, status: 200 })
            return resp
          })

          SAPI.BsEndpoint$.pipe(
            finalize(() => done())
          ).subscribe(val => {
            subscribedVal = val
          })
        })

        it("> should call twice", async () => {
          expect(fetchSpy).toHaveBeenCalledTimes(2)
          expect(fetchSpy.calls.allArgs()).toEqual([
            [`${endpt1}/atlases`],
            [`${endpt2}/atlases`],
          ])
        })

        it('> should set endpt2', async () => {
          expect(subscribedVal).toBe(endpt2)
        })
      })
    })
  })
})
