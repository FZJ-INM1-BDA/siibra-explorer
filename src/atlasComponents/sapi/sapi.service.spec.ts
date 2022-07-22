import * as env from "src/environments/environment"
import { SAPI } from "./sapi.service"

describe("> sapi.service.ts", () => {
  describe("> SAPI", () => {
    describe("#SetBsEndPoint", () => {
      let fetchSpy: jasmine.Spy
      let environmentSpy: jasmine.Spy

      const endpt1 = 'foo-bar'
      const endpt2 = 'buzz-bizz'

      const atlas1 = 'foo'
      const atlas2 = 'bar'
      

      beforeEach(() => {
        fetchSpy = spyOn(window, 'fetch')
        fetchSpy.and.rejectWith("foo-bar")

        environmentSpy = spyOnProperty(env, 'environment')
        environmentSpy.and.returnValue({
          SIIBRA_API_ENDPOINTS: `${endpt1},${endpt2}`
        })
      })

      afterEach(() => {
        fetchSpy.calls.reset()
        environmentSpy.calls.reset()
      })

      describe("> first passes", () => {
        beforeEach(() => {
          const resp = new Response(JSON.stringify([atlas1]), { headers: { 'content-type': 'application/json' }, status: 200 })
          fetchSpy.and.resolveTo(resp)
        })
        it("> should call fetch once", async () => {
          await SAPI.SetBsEndPoint()
          expect(fetchSpy).toHaveBeenCalledTimes(1)
          expect(fetchSpy).toHaveBeenCalledOnceWith(`${endpt1}/atlases`)
        })

        it("> endpoint should be set", async () => {
          await SAPI.SetBsEndPoint()
          expect(SAPI.bsEndpoint).toBe(endpt1)
        })
      })

      describe("> first fails", () => {
        beforeEach(() => {
          let counter = 0
          fetchSpy.and.callFake(async () => {
            if (counter === 0) {
              counter ++
              throw new Error(`bla`)
            }
            const resp = new Response(JSON.stringify([atlas1]), { headers: { 'content-type': 'application/json' }, status: 200 })
            return resp
          })
        })

        it("> should call twice", async () => {
          await SAPI.SetBsEndPoint()
          expect(fetchSpy).toHaveBeenCalledTimes(2)
          expect(fetchSpy.calls.allArgs()).toEqual([
            [`${endpt1}/atlases`],
            [`${endpt2}/atlases`],
          ])
        })

        it('> should set endpt2', async () => {
          await SAPI.SetBsEndPoint()
          expect(SAPI.bsEndpoint).toBe(endpt2)
        })
      })
    })
  })
})
