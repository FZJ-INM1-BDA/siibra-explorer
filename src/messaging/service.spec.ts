import { TestBed } from "@angular/core/testing"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service"
import { viewerStateFetchedAtlasesSelector } from "src/services/state/viewerState/selectors"
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module"
import { getUuid } from "src/util/fn"
import { IAV_POSTMESSAGE_NAMESPACE, MessagingService } from "./service"
import { IMessagingActions, IMessagingActionTmpl, WINDOW_MESSAGING_HANDLER_TOKEN } from "./types"
import { MANAGED_METHODS } from './service'
import { of, Subject } from "rxjs"
import { ConfirmDialogComponent } from "src/components/confirmDialog/confirmDialog.component"
import { TYPE as NATIVE_TYPE } from './native'

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
    
    })

    describe('> #handleMessage', () => {
      let mService: MessagingService
      let checkOriginSpy: jasmine.Spy
      let processMessageSpy: jasmine.Spy

      beforeEach(() => {
        mService = TestBed.inject(MessagingService)
      })

      afterEach(() => {
        checkOriginSpy && checkOriginSpy.calls.reset()
        processMessageSpy && processMessageSpy.calls.reset()
      })
      describe('> ping', () => {
        beforeEach(() => {
          checkOriginSpy = spyOn(mService, 'checkOrigin').and.callFake(() => Promise.reject('baz'))
        })
        it('> pong', async () => {
          const result = await mService.handleMessage({
            data: {
              method: `${IAV_POSTMESSAGE_NAMESPACE}ping`
            },
            origin: 'foobar'
          })
          expect(result).toEqual('pong')
          expect(checkOriginSpy).not.toHaveBeenCalled()
        })
      })

      describe('> misc method', () => {
        let result: any
        const expectedResult = 'helloworld'
        const origin = 'foobar'
        const method = `${IAV_POSTMESSAGE_NAMESPACE}${MANAGED_METHODS[0]}`
        const param = {
          'foo': 'bar'
        }
        describe('> if checkOrigin succeeds', () => {
          beforeEach(async () => {
            checkOriginSpy = spyOn(mService, 'checkOrigin').and.callFake(() => Promise.resolve(true))
            processMessageSpy = spyOn(mService, 'processMessage').and.callFake(() => Promise.resolve(expectedResult))

            result = await mService.handleMessage({
              data: { method, param },
              origin
            })
          })
          it('> should call checkOrigin', () => {
            expect(checkOriginSpy).toHaveBeenCalledWith({
              origin
            })
          })

          it('> should call processMessageSpy', () => {
            expect(processMessageSpy).toHaveBeenCalledWith({
              method: MANAGED_METHODS[0],
              param
            })
          })

          it('> should return result', () => {
            expect(result).toEqual(expectedResult)
          })
        })

        describe('> if checkOrigin fails', () => {

          beforeEach(() => {
            checkOriginSpy = spyOn(mService, 'checkOrigin').and.callFake(() => Promise.resolve(false))
            processMessageSpy = spyOn(mService, 'processMessage').and.callFake(() => Promise.resolve(expectedResult))

          })

          it('> function should throw', async () => {
            try {
              await mService.handleMessage({
                data: { method, param },
                origin
              })
              expect(true).toEqual(false)
            } catch (e) {
              expect(true).toEqual(true)
            }
          })

          it('> processMessage should not be called', async () => {
            try {
              await mService.handleMessage({
                data: { method, param },
                origin
              })
            } catch (e) {

            }
            expect(processMessageSpy).not.toHaveBeenCalled()
          })
        })

      })

      it('> if throws')
    })

    describe('> #checkOrigin', () => {
      let ms: MessagingService
      let dialogOpenSpy: jasmine.Spy
      let r1: any
      const origin = 'foobar'
      beforeEach(() => {
        ms = TestBed.inject(MessagingService)
      })
      
      describe('> if dialog returns true', () => {
        beforeEach(async () => {
          dialogOpenSpy = spyOn(ms['dialog'], 'open').and.returnValue({
            afterClosed: () => of(true)
          } as any)
          r1 = await ms.checkOrigin({ origin })
        })
        afterEach(() => {
          dialogOpenSpy.calls.reset()
        })
        it('> should return true', () => {
          expect(r1).toEqual(true)
        })
        it('> should call dialogOpen', () => {
          expect(dialogOpenSpy).toHaveBeenCalledWith(
            ConfirmDialogComponent,
            {
              data: {
                title: 'Cross tab messaging',
                message: `${origin} would like to send data to interactive atlas viewer`,
                okBtnText: `Allow`,
              }
            }
          )
        })
        it('> should not call dialogOpen multiple times', async () => {
          dialogOpenSpy.calls.reset()
          const r2 = await ms.checkOrigin({ origin })
          expect(r2).toEqual(true)
          expect(dialogOpenSpy).not.toHaveBeenCalled()
        })
      })
    })
  
    describe('> #processMessage', () => {
      // to be deprecated
    })

    describe('> #processJsonld', () => {
      let ms: MessagingService
      let sub: Subject<IMessagingActions<keyof IMessagingActionTmpl>>
      const jsonLd = { '@type': 'foobar' }
      beforeEach(() => {
        ms = TestBed.inject(MessagingService)
        sub = new Subject()
        spyOn(ms['typeRegister'], 'get').and.returnValue(() => sub)
      })

      it('> resolves if sub completes', done => {
        ms.processJsonld(jsonLd)
          .then(() => {
            done()
          })
          .catch(() => {
            expect(true).toEqual(false)
            done()
          })

        sub.complete()
      })
    
      it('> rejects if sub throws', done => {

        ms.processJsonld(jsonLd)
          .then(() => {
            expect(true).toEqual(false)
            done()
          })
          .catch(() => {
            done()
          })

        sub.error(`foobazz`)
      })
    
      describe('> functions', () => {
        let pr: Promise<any>
        beforeEach(() => {
          pr = ms.processJsonld(jsonLd)
        })

        describe('> loadTemplate', () => {
          beforeEach(() => {
            sub.next({
              type: "loadTemplate",
              payload: {
                ['@id']: 'foobar'
              }
            })
          })
          it('> calls windowsMessagehandler.loadTemplateById', () => {
            expect(windowMessagehandler.loadTempladById).toHaveBeenCalledWith({
              ['@id']: 'foobar'
            })
          })
        })
      
        describe('> loadResources', () => {
          const payload = {
            ['@id']: 'rez',
            ['@type']: 'hello world'
          }
          beforeEach(() => {
            sub.next({
              type: 'loadResource',
              payload
            })
          })
          it('> calls windowsMessagehandler.loadResource', () => {
            expect(windowMessagehandler.loadResource).toHaveBeenCalledWith(payload)
          })
          it('> expects processJsonLd to resolve to id/type', done => {
            pr.then(val => {
              expect(val).toEqual({
                ['@id']: payload['@id'],
                ['@type']: NATIVE_TYPE
              })
              done()
            })
            sub.complete()
          })
        })

        describe('> unloadResource', () => {
          const payload = {
            ['@id']: 'greenday'
          }
          beforeEach(() => {

            sub.next({
              type: 'unloadResource',
              payload
            })
          })
          it('> calls windowsMessagehandler.unloadResource', () => {
            expect(windowMessagehandler.unloadResource).toHaveBeenCalledWith(payload)
          })
        })
      })
    })
  })
})
