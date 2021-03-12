import { TestBed } from "@angular/core/testing"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service"
import { viewerStateFetchedAtlasesSelector } from "src/services/state/viewerState/selectors"
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module"
import { getUuid } from "src/util/fn"
import { IAV_POSTMESSAGE_NAMESPACE, MessagingService } from "./service"
import { IWindowMessaging, WINDOW_MESSAGING_HANDLER_TOKEN } from "./types"

describe('> service.ts', () => {
  describe('> MessagingService', () => {
    const windowMessagehandler = {
      loadResource: jasmine.createSpy(),
      loadTempladById: jasmine.createSpy(),
      unloadResource: jasmine.createSpy()
    }
    afterEach(() => {
      windowMessagehandler.loadResource.calls.reset()
      windowMessagehandler.unloadResource.calls.reset()
      windowMessagehandler.loadTempladById.calls.reset()
    })
    beforeEach(() => {

      TestBed.configureTestingModule({
        imports: [
          AngularMaterialModule,
        ],
        providers: [
          provideMockStore(),
          AtlasWorkerService,
          {
            provide: WINDOW_MESSAGING_HANDLER_TOKEN,
            useValue: windowMessagehandler
          }
        ]
      })

      const mockStore = TestBed.inject(MockStore)
      mockStore.overrideSelector(viewerStateFetchedAtlasesSelector, [])
    })

    it('> can be inst', () => {
      const s = TestBed.inject(MessagingService)
      expect(s).toBeTruthy()
    })

    describe('> on construct', () => {
      describe('> if window.opener', () => {
        describe('> is defined', () => {
          let openerProxy = {
            postMessage: jasmine.createSpy()
          }
          const randomWindowName = getUuid()
          beforeEach(() => {
            spyOnProperty(window, 'opener').and.returnValue(openerProxy)
            spyOnProperty(window, 'name').and.returnValue(randomWindowName)
            TestBed.inject(MessagingService)
          })
          afterEach(() => {
            openerProxy.postMessage.calls.reset()
          })
          it('> postMessage is called on window.opener', () => {
            expect(openerProxy.postMessage).toHaveBeenCalledTimes(1)
          })
          describe('> args are as expected', () => {
            let args: any[]
            beforeEach(() => {
              args = openerProxy.postMessage.calls.allArgs()[0]
            })
            it('> method === {namespace}onload', () => {
              expect(args[0]['method']).toEqual(`${IAV_POSTMESSAGE_NAMESPACE}onload`)
            })
            it('> param[window.name] is windowname', () => {
              expect(args[0]['param']['window.name']).toEqual(randomWindowName)
            })
          })

          describe('> beforeunload', () => {
            beforeEach(() => {
              // onload messages are called before unload
              openerProxy.postMessage.calls.reset()

              // https://github.com/karma-runner/karma/issues/1062#issuecomment-42421624
              window.onbeforeunload = null
              window.dispatchEvent(new Event('beforeunload'))
            })
            it('> sends beforeunload event', () => {
              expect(openerProxy.postMessage).toHaveBeenCalled()
            })
            it('> method is {namespace}beforeunload', () => {
              const args = openerProxy.postMessage.calls.allArgs()[0]
              expect(args[0]['method']).toEqual(`${IAV_POSTMESSAGE_NAMESPACE}beforeunload`)
            })
          })
        })
      })
    
      describe('> listen to message', () => {
        beforeEach(() => {

        })
        describe('> ping', () => {
          it('> pong')
        })

        describe('> check permission', () => {
          it('> if succeeds')
          it('> if fails')
        })

        it('> if throws')
      })
    
      describe('> #processMessage', () => {
        describe('> method === _tmp:plotly ', () => {

        })
        describe('> managedMethods', () => {

        })
      })

      describe('> #processJsonld', () => {
        
      })
    })
  })
})
