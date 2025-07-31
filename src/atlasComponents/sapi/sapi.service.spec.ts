import { SAPI } from "./sapi.service"

const atlas1 = 'foo'
const atlas2 = 'bar'
const endpt1 = 'http://foo-bar'
const endpt2 = 'http://buzz-bizz'

describe("> sapi.service.ts", () => {
  describe("> SAPI", () => {
    let originalTimeout: number
    beforeAll(() => {
      
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 7500 // timeout 5000ms, + other tasks, 7.5 sec should be enough
    })
    afterAll(() => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout
    })

    describe("> VerifyEndpoint", () => {

      let fetchSpy: jasmine.Spy
      beforeEach(() => {
        fetchSpy = spyOn(window, 'fetch')
        fetchSpy.and.callThrough()
      })
      afterEach(() => {
        fetchSpy.calls.reset()
        fetchSpy.and.callThrough()
      })
  
      const respOk = new Response(JSON.stringify([atlas1]), { headers: { 'content-type': 'application/json' }, status: 200 })
      const resp404 = new Response(JSON.stringify([atlas1]), { headers: { 'content-type': 'application/json' }, status: 404 })
  
      describe("> ill formed input", () => {
        describe("> nullish input", () => {
          it("throws", async () => {
            await expectAsync(SAPI.VerifyEndpoint(null)).toBeRejected()
          })
        })
      })
      
      describe("> success", () => {
        beforeEach(() => {
          fetchSpy.and.returnValue(respOk)
        })

        it("> returns the expected value", async () => {
          const val = await SAPI.VerifyEndpoint(endpt1)
          expect(val).toEqual(endpt1)
          expect(fetchSpy).toHaveBeenCalledOnceWith(`${endpt1}/atlases`)
        })
      })

      describe("> fails", () => {
        describe("> promise fails", () => {
          beforeEach(() => {
            fetchSpy.and.rejectWith(`foo`)
          })

          it("> expects function to reject", async () => {
            await expectAsync(SAPI.VerifyEndpoint(endpt1)).toBeRejected()
          })
        })
        describe("> http fails", () => {
          beforeEach(() => {
            fetchSpy.and.resolveTo(resp404)
          })
          it("> expects function to reject", async () => {
            await expectAsync(SAPI.VerifyEndpoint(endpt1)).toBeRejected()
          })
        })
      })
    })

    describe("> VerifyEndpoints", () => {
      let verifyEndpointSpy: jasmine.Spy
      beforeEach(() => {
        verifyEndpointSpy = spyOn(SAPI, "VerifyEndpoint")

      })
      describe("> ill formed inputs", () => {
        describe("> empty arr input", () => {
          it("> rejects", async () => {
            await expectAsync(SAPI.VerifyEndpoints([])).toBeRejected()
          })
        })
      })
      describe("> correct inputs", () => {
        const endpts = [endpt1, endpt2]
        
        describe("> both succeeds", () => {
          beforeEach(() => {
            verifyEndpointSpy.and.callFake(async url => {
              console.log("foo bar")
              return url
            })
          })
          it("> returns first, and second is not called", async () => {
            const result = await SAPI.VerifyEndpoints(endpts)
            // expect(result).toEqual(endpt1)
            // expect(fetchSpy).toHaveBeenCalledOnceWith(`${endpt1}/atlases`)
            // expect(fetchSpy).not.toHaveBeenCalledWith(`${endpt2}/atlases`)
          })
        })
        
        describe("> second fails", () => {
          beforeEach(() => {
            verifyEndpointSpy.and.callFake(async url => {
              if (url === endpt2) {
                throw new Error('foo -bar')
              }
              return url
            })
          })
          it("> returns first, and second is not called", async () => {
            const result = await SAPI.VerifyEndpoints(endpts)
            expect(result).toEqual(endpt1)
            expect(verifyEndpointSpy).toHaveBeenCalledOnceWith(endpt1)
            expect(verifyEndpointSpy).not.toHaveBeenCalledWith(endpt2)
          })
        })
        
        describe("> first fails", () => {
          beforeEach(() => {
            verifyEndpointSpy.and.callFake(async url => {
              
              if (url === endpt1) {
                throw new Error('foo -bar')
              }
              return url
            })
          })
          it("> returns first, and second is not called", async () => {
            const result = await SAPI.VerifyEndpoints(endpts)
            expect(result).toEqual(endpt2)
            expect(verifyEndpointSpy).toHaveBeenCalledWith(endpt1)
            expect(verifyEndpointSpy).toHaveBeenCalledWith(endpt2)
          })
        })

        describe("> both fails", () => {
          beforeEach(() => {
            verifyEndpointSpy.and.rejectWith('foo-bar')
          })
          it("> rejects", async () => {
            await expectAsync(SAPI.VerifyEndpoints(endpts)).toBeRejected()
            
            expect(verifyEndpointSpy).toHaveBeenCalledWith(endpt1)
            expect(verifyEndpointSpy).toHaveBeenCalledWith(endpt2)
          })
        })
      })
    })
  })
})
