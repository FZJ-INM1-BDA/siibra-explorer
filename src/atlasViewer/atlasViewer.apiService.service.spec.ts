import { AtlasViewerAPIServices, overrideNehubaClickFactory, CANCELLABLE_DIALOG } from "src/atlasViewer/atlasViewer.apiService.service";
import { async, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { provideMockStore } from "@ngrx/store/testing";
import { defaultRootState } from "src/services/stateStore.service";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { HttpClientModule } from '@angular/common/http';
import { WidgetModule } from 'src/widget';
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { PluginServices } from "./pluginUnit";

describe('atlasViewer.apiService.service.ts', () => {

  describe('AtlasViewerAPIServices', () => {

    const cancelTokenSpy = jasmine.createSpy('cancelToken')
    const cancellableDialogSpy = jasmine.createSpy('openCallableDialog').and.returnValue(cancelTokenSpy)

    afterEach(() => {
      cancelTokenSpy.calls.reset()
      cancellableDialogSpy.calls.reset()

      const ctrl = TestBed.inject(HttpTestingController)
      ctrl.verify()
    })

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [
          AngularMaterialModule,
          HttpClientTestingModule,
          WidgetModule,
        ],
        providers: [
          AtlasViewerAPIServices,
          provideMockStore({ initialState: defaultRootState }),
          {
            provide: CANCELLABLE_DIALOG,
            useValue: cancellableDialogSpy
          },
          {
            provide: PluginServices,
            useValue: {}
          }
        ]
      }).compileComponents()
    }))  

    it('service exists', () => {
      const service = TestBed.inject(AtlasViewerAPIServices)
      expect(service).not.toBeNull()
    })

    describe('uiHandle', () => {

      describe('getUserToSelectARegion', () => {

        it('on init, expect getUserToSelectRegion to be length 0', () => {
          const service = TestBed.inject(AtlasViewerAPIServices)
          expect(service.getUserToSelectRegion.length).toEqual(0)
        })
        it('calling getUserToSelectARegion() populates getUserToSelectRegion', () => {
          const service = TestBed.inject(AtlasViewerAPIServices)

          const pr = service.interactiveViewer.uiHandle.getUserToSelectARegion('hello world')
          
          expect(service.getUserToSelectRegion.length).toEqual(1)
          const { promise, message, rs, rj } = service.getUserToSelectRegion[0]
          expect(promise).toEqual(pr)
          expect(message).toEqual('hello world')
          
          expect(rs).not.toBeUndefined()
          expect(rs).not.toBeNull()

          expect(rj).not.toBeUndefined()
          expect(rj).not.toBeNull()
        })
      })

      describe('cancelPromise', () => {
        it('calling cancelPromise removes pr from getUsertoSelectRegion', done => {

          const service = TestBed.inject(AtlasViewerAPIServices)
          const pr = service.interactiveViewer.uiHandle.getUserToSelectARegion('test')
          pr.catch(e => {
            expect(e.userInitiated).toEqual(false)
            expect(service.getUserToSelectRegion.length).toEqual(0)
            done()
          })
          service.interactiveViewer.uiHandle.cancelPromise(pr)
        })

        it('alling cancelPromise on non existing promise, throws ', () => {

          const service = TestBed.inject(AtlasViewerAPIServices)
          const pr = service.interactiveViewer.uiHandle.getUserToSelectARegion('test')
          service.interactiveViewer.uiHandle.cancelPromise(pr)
          expect(() => {
            service.interactiveViewer.uiHandle.cancelPromise(pr)
          }).toThrow()
        })
      })

      describe('getUserToSelectARegion, cancelPromise and userCancel', () => {
        it('if token is provided, on getUserToSelectRegionUI$ next should follow by call to injected function', () => {
          const service = TestBed.inject(AtlasViewerAPIServices)
          
          const rsSpy = jasmine.createSpy('rs') 
          const rjSpy = jasmine.createSpy('rj')
          const mockObj = {
            message: 'test',
            promise: new Promise((rs, rj) => {}),
            rs: rsSpy,
            rj: rjSpy,
          }
          service.getUserToSelectRegionUI$.next([ mockObj ])
          

          expect(cancellableDialogSpy).toHaveBeenCalled()
          
          const arg = cancellableDialogSpy.calls.mostRecent().args
          expect(arg[0]).toEqual('test')
          expect(arg[1].userCancelCallback).toBeTruthy()
        })

        it('if multiple regionUIs are provided, only the last one is used', () => {
          const service = TestBed.inject(AtlasViewerAPIServices)
          
          const rsSpy = jasmine.createSpy('rs') 
          const rjSpy = jasmine.createSpy('rj')
          const mockObj1 = {
            message: 'test1',
            promise: new Promise((rs, rj) => {}),
            rs: rsSpy,
            rj: rjSpy,
          }
          const mockObj2 = {
            message: 'test2',
            promise: new Promise((rs, rj) => {}),
            rs: rsSpy,
            rj: rjSpy,
          }
          service.getUserToSelectRegionUI$.next([ mockObj1, mockObj2 ])
          
          expect(cancellableDialogSpy).toHaveBeenCalled()
          
          const arg = cancellableDialogSpy.calls.mostRecent().args
          expect(arg[0]).toEqual('test2')
          expect(arg[1].userCancelCallback).toBeTruthy()
        })

        describe('calling userCacellationCb', () => {

          it('correct usage => in removeBasedOnPr called, rj with userini as true', fakeAsync(() => {
            const service = TestBed.inject(AtlasViewerAPIServices)
            
            const rsSpy = jasmine.createSpy('rs') 
            const rjSpy = jasmine.createSpy('rj')
            const promise = new Promise((rs, rj) => {})
            const mockObj = {
              message: 'test',
              promise,
              rs: rsSpy,
              rj: rjSpy,
            }

            const removeBaseOnPr = spyOn(service, 'removeBasedOnPr').and.returnValue(null)

            service.getUserToSelectRegionUI$.next([ mockObj ])
            const arg = cancellableDialogSpy.calls.mostRecent().args
            const cb = arg[1].userCancelCallback
            cb()
            tick(100)
            expect(rjSpy).toHaveBeenCalledWith({ userInitiated: true })
            expect(removeBaseOnPr).toHaveBeenCalledWith(promise, { userInitiated: true })
            
          }))

          it('incorrect usage (resolve) => removebasedonpr, rj not called', fakeAsync(() => {

            const service = TestBed.inject(AtlasViewerAPIServices)
            
            const dummyObj = {
              hello:'world'
            }

            const rsSpy = jasmine.createSpy('rs') 
            const rjSpy = jasmine.createSpy('rj')
            const promise = Promise.resolve(dummyObj)
            const mockObj = {
              message: 'test',
              promise,
              rs: rsSpy,
              rj: rjSpy,
            }

            const removeBaseOnPr = spyOn(service, 'removeBasedOnPr').and.returnValue(null)

            service.getUserToSelectRegionUI$.next([ mockObj ])
            const arg = cancellableDialogSpy.calls.mostRecent().args
            const cb = arg[1].userCancelCallback
            cb()
            tick(100)
            expect(rjSpy).not.toHaveBeenCalled()
            expect(removeBaseOnPr).not.toHaveBeenCalled()
            
          }))

          it('incorrect usage (reject) => removebasedonpr, rj not called', fakeAsync(() => {

            const service = TestBed.inject(AtlasViewerAPIServices)
            
            const dummyObj = {
              hello:'world'
            }

            const rsSpy = jasmine.createSpy('rs') 
            const rjSpy = jasmine.createSpy('rj')
            const promise = Promise.reject(dummyObj)
            const mockObj = {
              message: 'test',
              promise,
              rs: rsSpy,
              rj: rjSpy,
            }

            const removeBaseOnPr = spyOn(service, 'removeBasedOnPr').and.returnValue(null)

            service.getUserToSelectRegionUI$.next([ mockObj ])
            const arg = cancellableDialogSpy.calls.mostRecent().args
            const cb = arg[1].userCancelCallback
            cb()
            tick(100)
            expect(rjSpy).not.toHaveBeenCalled()
            expect(removeBaseOnPr).not.toHaveBeenCalled()
            
          }))
        })
      })
    })
  })


  describe('overrideNehubaClickFactory', () => {

    const OVERRIDE_NEHUBA_TOKEN = 'OVERRIDE_NEHUBA_TOKEN'
    const MOCK_GET_MOUSEOVER_SEGMENTS_TOKEN = 'MOCK_GET_MOUSEOVER_SEGMENTS_TOKEN'

    let mockGetMouseOverSegments = []
    
    afterEach(() => {
      mockGetMouseOverSegments = []
    })

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [
          AngularMaterialModule,
          HttpClientModule,
          WidgetModule,
        ],
        providers: [
          {
            provide: OVERRIDE_NEHUBA_TOKEN,
            useFactory: overrideNehubaClickFactory,
            deps: [
              AtlasViewerAPIServices,
              MOCK_GET_MOUSEOVER_SEGMENTS_TOKEN,
            ]
          },
          {
            provide: MOCK_GET_MOUSEOVER_SEGMENTS_TOKEN,
            useValue: () => {
              return mockGetMouseOverSegments
            }
          },
          {
            provide: PluginServices,
            useValue: {}
          },
          AtlasViewerAPIServices,
          provideMockStore({ initialState: defaultRootState }),
        ]
      }).compileComponents()
    }))

    it('can obtain override fn', () => {
      const fn = TestBed.inject(OVERRIDE_NEHUBA_TOKEN as any)
      expect(fn).not.toBeNull()
    })

    it('by default, next fn will be called', () => {
      const fn = TestBed.inject(OVERRIDE_NEHUBA_TOKEN as any) as (next: () => void) => void
      const nextSpy = jasmine.createSpy('next')
      fn(nextSpy)
      expect(nextSpy).toHaveBeenCalled()
    })

    it('if both apiService.getUserToSelectRegion.length > 0 and mouseoverSegment.length >0, then next will not be called, but rs will be', () => {
      const fn = TestBed.inject(OVERRIDE_NEHUBA_TOKEN as any) as (next: () => void) => void
      const apiService = TestBed.inject(AtlasViewerAPIServices)

      const rsSpy = jasmine.createSpy('rs') 
      const rjSpy = jasmine.createSpy('rj')
      apiService.getUserToSelectRegion = [
        {
          message: 'test',
          promise: null,
          rs: rsSpy,
          rj: rjSpy,
        }
      ]

      const mockSegment = {
        layer: {
          name: 'apple'
        },
        segment: {
          name: 'bananas'
        }
      }
      mockGetMouseOverSegments = [ mockSegment ]
      
      const nextSpy = jasmine.createSpy('next')
      fn(nextSpy)

      expect(nextSpy).not.toHaveBeenCalled()
      expect(rsSpy).toHaveBeenCalledWith(mockSegment)
    })
  
    it('if apiService.getUserToSelectRegion.length === 0, and mouseoversegment.length > 0 calls next', () => {
      const fn = TestBed.inject(OVERRIDE_NEHUBA_TOKEN as any) as (next: () => void) => void

      const mockSegment = {
        layer: {
          name: 'apple'
        },
        segment: {
          name: 'bananas'
        }
      }
      mockGetMouseOverSegments = [ mockSegment ]
      
      const nextSpy = jasmine.createSpy('next')
      fn(nextSpy)

      expect(nextSpy).toHaveBeenCalled()
    })

    it('if apiService.getUserToSelectRegion.length > 0, but mouseoversegment.length ===0, will not call next, will not rs, will not call rj', () => {
      const fn = TestBed.inject(OVERRIDE_NEHUBA_TOKEN as any) as (next: () => void) => void
      const apiService = TestBed.inject(AtlasViewerAPIServices)

      const rsSpy = jasmine.createSpy('rs') 
      const rjSpy = jasmine.createSpy('rj')
      apiService.getUserToSelectRegion = [
        {
          message: 'test',
          promise: null,
          rs: rsSpy,
          rj: rjSpy,
        }
      ]
      
      const nextSpy = jasmine.createSpy('next')
      fn(nextSpy)

      expect(rsSpy).not.toHaveBeenCalled()
      expect(nextSpy).toHaveBeenCalled()
      expect(rjSpy).not.toHaveBeenCalled()
    })
    it('if muliple getUserToSelectRegion handler exists, it resolves in a FIFO manner', () => {
      const fn = TestBed.inject(OVERRIDE_NEHUBA_TOKEN as any) as (next: () => void) => void
      const apiService = TestBed.inject(AtlasViewerAPIServices)

      const rsSpy1 = jasmine.createSpy('rs1') 
      const rjSpy1 = jasmine.createSpy('rj1')

      const rsSpy2 = jasmine.createSpy('rs2') 
      const rjSpy2 = jasmine.createSpy('rj2')
      apiService.getUserToSelectRegion = [
        {
          message: 'test1',
          promise: null,
          rs: rsSpy1,
          rj: rjSpy1,
        },
        {
          message: 'test2',
          promise: null,
          rs: rsSpy2,
          rj: rjSpy2,
        }
      ]
      
      const mockSegment = {
        layer: {
          name: 'apple'
        },
        segment: {
          name: 'bananas'
        }
      }

      mockGetMouseOverSegments = [ mockSegment ]

      const nextSpy1 = jasmine.createSpy('next1')
      fn(nextSpy1)

      expect(rsSpy2).toHaveBeenCalledWith(mockSegment)
      expect(rjSpy2).not.toHaveBeenCalled()

      expect(nextSpy1).not.toHaveBeenCalled()
      expect(rsSpy1).not.toHaveBeenCalled()
      expect(rjSpy1).not.toHaveBeenCalled()

      const nextSpy2 = jasmine.createSpy('next2')
      fn(nextSpy2)

      expect(nextSpy2).not.toHaveBeenCalled()
      expect(rsSpy1).toHaveBeenCalledWith(mockSegment)
      expect(rjSpy1).not.toHaveBeenCalled()

      const nextSpy3 = jasmine.createSpy('next3')
      fn(nextSpy3)

      expect(nextSpy3).toHaveBeenCalled()
    })
  })
})
