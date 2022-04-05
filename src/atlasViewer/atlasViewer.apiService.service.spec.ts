import { AtlasViewerAPIServices } from "src/atlasViewer/atlasViewer.apiService.service";
import { async, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { provideMockStore } from "@ngrx/store/testing";
import { AngularMaterialModule } from "src/sharedModules";
import { WidgetModule } from 'src/widget';
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { PluginServices } from "src/plugin";
import { CANCELLABLE_DIALOG } from "src/util/interfaces";

describe('atlasViewer.apiService.service.ts', () => {
  /**
   * TODO
   * plugin api to be redesigned
   */
  // describe('AtlasViewerAPIServices', () => {

  //   const cancelTokenSpy = jasmine.createSpy('cancelToken')
  //   const cancellableDialogSpy = jasmine.createSpy('openCallableDialog').and.returnValue(cancelTokenSpy)

  //   afterEach(() => {
  //     cancelTokenSpy.calls.reset()
  //     cancellableDialogSpy.calls.reset()

  //     const ctrl = TestBed.inject(HttpTestingController)
  //     ctrl.verify()
  //   })

  //   beforeEach(async(() => {
  //     TestBed.configureTestingModule({
  //       imports: [
  //         AngularMaterialModule,
  //         HttpClientTestingModule,
  //         WidgetModule,
  //       ],
  //       providers: [
  //         AtlasViewerAPIServices,
  //         provideMockStore(),
  //         {
  //           provide: CANCELLABLE_DIALOG,
  //           useValue: cancellableDialogSpy
  //         },
  //         {
  //           provide: PluginServices,
  //           useValue: {}
  //         }
  //       ]
  //     }).compileComponents()
  //   }))  

  //   it('service exists', () => {
  //     const service = TestBed.inject(AtlasViewerAPIServices)
  //     expect(service).not.toBeNull()
  //   })

  //   describe('uiHandle', () => {

  //     describe('getUserToSelectARegion', () => {

  //       it('on init, expect getUserToSelectRegion to be length 0', () => {
  //         const service = TestBed.inject(AtlasViewerAPIServices)
  //         expect(service.getUserToSelectRegion.length).toEqual(0)
  //       })
  //       it('calling getUserToSelectARegion() populates getUserToSelectRegion', () => {
  //         const service = TestBed.inject(AtlasViewerAPIServices)

  //         const pr = service.interactiveViewer.uiHandle.getUserToSelectARegion('hello world')
          
  //         expect(service.getUserToSelectRegion.length).toEqual(1)
  //         const { promise, message, rs, rj } = service.getUserToSelectRegion[0]
  //         expect(promise).toEqual(pr)
  //         expect(message).toEqual('hello world')
          
  //         expect(rs).not.toBeUndefined()
  //         expect(rs).not.toBeNull()

  //         expect(rj).not.toBeUndefined()
  //         expect(rj).not.toBeNull()
  //       })
  //     })

  //     describe('> getUserToSelectRoi', () => {
  //       it('> calling getUserToSelectRoi without spec throws error', () => {
  //         const service = TestBed.inject(AtlasViewerAPIServices)
  //         expect(() => {
  //           service.interactiveViewer.uiHandle.getUserToSelectRoi('hello world')
  //         }).toThrow()
  //       })

  //       it('> calling getUserToSelectRoi without spec.type throws', () => {
  //         const service = TestBed.inject(AtlasViewerAPIServices)
  //         expect(() => {
  //           service.interactiveViewer.uiHandle.getUserToSelectRoi('hello world', { foo: 'bar' } as any)
  //         }).toThrow()
  //       })

  //       it('> calling getUserToSelectRoi populates getUserToSelectRegion with malformed spec.type is fine', () => {
  //         const service = TestBed.inject(AtlasViewerAPIServices)
  //         expect(() => {
  //           service.interactiveViewer.uiHandle.getUserToSelectRoi('hello world', { type: 'foobar' })
  //         }).not.toThrow()
  //       })
  //       it('> calling getUserToSelectRoi populates getUserToSelectRegion', () => {

  //         const service = TestBed.inject(AtlasViewerAPIServices)

  //         const pr = service.interactiveViewer.uiHandle.getUserToSelectRoi('hello world', { type: 'POINT' })
          
  //         expect(service.getUserToSelectRegion.length).toEqual(1)
  //         const { promise, message, spec, rs, rj } = service.getUserToSelectRegion[0]
  //         expect(promise).toEqual(pr)
  //         expect(message).toEqual('hello world')
  //         expect(spec).toEqual({ type: 'POINT' })
          
  //         expect(rs).not.toBeFalsy()
  //         expect(rj).not.toBeFalsy()
  //       })
  //     })

  //     describe('cancelPromise', () => {
  //       it('calling cancelPromise removes pr from getUsertoSelectRegion', done => {

  //         const service = TestBed.inject(AtlasViewerAPIServices)
  //         const pr = service.interactiveViewer.uiHandle.getUserToSelectARegion('test')
  //         pr.catch(e => {
  //           expect(e.userInitiated).toEqual(false)
  //           expect(service.getUserToSelectRegion.length).toEqual(0)
  //           done()
  //         })
  //         service.interactiveViewer.uiHandle.cancelPromise(pr)
  //       })

  //       it('alling cancelPromise on non existing promise, throws ', () => {

  //         const service = TestBed.inject(AtlasViewerAPIServices)
  //         const pr = service.interactiveViewer.uiHandle.getUserToSelectARegion('test')
  //         service.interactiveViewer.uiHandle.cancelPromise(pr)
  //         expect(() => {
  //           service.interactiveViewer.uiHandle.cancelPromise(pr)
  //         }).toThrow()
  //       })
  //     })

  //     describe('getUserToSelectARegion, cancelPromise and userCancel', () => {
  //       it('if token is provided, on getUserToSelectRegionUI$ next should follow by call to injected function', () => {
  //         const service = TestBed.inject(AtlasViewerAPIServices)
          
  //         const rsSpy = jasmine.createSpy('rs') 
  //         const rjSpy = jasmine.createSpy('rj')
  //         const mockObj = {
  //           message: 'test',
  //           promise: new Promise((rs, rj) => {}),
  //           rs: rsSpy,
  //           rj: rjSpy,
  //         }
  //         service.getUserToSelectRegionUI$.next([ mockObj ])
          

  //         expect(cancellableDialogSpy).toHaveBeenCalled()
          
  //         const arg = cancellableDialogSpy.calls.mostRecent().args
  //         expect(arg[0]).toEqual('test')
  //         expect(arg[1].userCancelCallback).toBeTruthy()
  //       })

  //       it('if multiple regionUIs are provided, only the last one is used', () => {
  //         const service = TestBed.inject(AtlasViewerAPIServices)
          
  //         const rsSpy = jasmine.createSpy('rs') 
  //         const rjSpy = jasmine.createSpy('rj')
  //         const mockObj1 = {
  //           message: 'test1',
  //           promise: new Promise((rs, rj) => {}),
  //           rs: rsSpy,
  //           rj: rjSpy,
  //         }
  //         const mockObj2 = {
  //           message: 'test2',
  //           promise: new Promise((rs, rj) => {}),
  //           rs: rsSpy,
  //           rj: rjSpy,
  //         }
  //         service.getUserToSelectRegionUI$.next([ mockObj1, mockObj2 ])
          
  //         expect(cancellableDialogSpy).toHaveBeenCalled()
          
  //         const arg = cancellableDialogSpy.calls.mostRecent().args
  //         expect(arg[0]).toEqual('test2')
  //         expect(arg[1].userCancelCallback).toBeTruthy()
  //       })

  //       describe('calling userCacellationCb', () => {

  //         it('correct usage => in removeBasedOnPr called, rj with userini as true', fakeAsync(() => {
  //           const service = TestBed.inject(AtlasViewerAPIServices)
            
  //           const rsSpy = jasmine.createSpy('rs') 
  //           const rjSpy = jasmine.createSpy('rj')
  //           const promise = new Promise((rs, rj) => {})
  //           const mockObj = {
  //             message: 'test',
  //             promise,
  //             rs: rsSpy,
  //             rj: rjSpy,
  //           }

  //           const removeBaseOnPr = spyOn(service, 'removeBasedOnPr').and.returnValue(null)

  //           service.getUserToSelectRegionUI$.next([ mockObj ])
  //           const arg = cancellableDialogSpy.calls.mostRecent().args
  //           const cb = arg[1].userCancelCallback
  //           cb()
  //           tick(100)
  //           expect(rjSpy).toHaveBeenCalledWith({ userInitiated: true })
  //           expect(removeBaseOnPr).toHaveBeenCalledWith(promise, { userInitiated: true })
            
  //         }))

  //         it('incorrect usage (resolve) => removebasedonpr, rj not called', fakeAsync(() => {

  //           const service = TestBed.inject(AtlasViewerAPIServices)
            
  //           const dummyObj = {
  //             hello:'world'
  //           }

  //           const rsSpy = jasmine.createSpy('rs') 
  //           const rjSpy = jasmine.createSpy('rj')
  //           const promise = Promise.resolve(dummyObj)
  //           const mockObj = {
  //             message: 'test',
  //             promise,
  //             rs: rsSpy,
  //             rj: rjSpy,
  //           }

  //           const removeBaseOnPr = spyOn(service, 'removeBasedOnPr').and.returnValue(null)

  //           service.getUserToSelectRegionUI$.next([ mockObj ])
  //           const arg = cancellableDialogSpy.calls.mostRecent().args
  //           const cb = arg[1].userCancelCallback
  //           cb()
  //           tick(100)
  //           expect(rjSpy).not.toHaveBeenCalled()
  //           expect(removeBaseOnPr).not.toHaveBeenCalled()
            
  //         }))

  //         it('incorrect usage (reject) => removebasedonpr, rj not called', fakeAsync(() => {

  //           const service = TestBed.inject(AtlasViewerAPIServices)
            
  //           const dummyObj = {
  //             hello:'world'
  //           }

  //           const rsSpy = jasmine.createSpy('rs') 
  //           const rjSpy = jasmine.createSpy('rj')
  //           const promise = Promise.reject(dummyObj)
  //           const mockObj = {
  //             message: 'test',
  //             promise,
  //             rs: rsSpy,
  //             rj: rjSpy,
  //           }

  //           const removeBaseOnPr = spyOn(service, 'removeBasedOnPr').and.returnValue(null)

  //           service.getUserToSelectRegionUI$.next([ mockObj ])
  //           const arg = cancellableDialogSpy.calls.mostRecent().args
  //           const cb = arg[1].userCancelCallback
  //           cb()
  //           tick(100)
  //           expect(rjSpy).not.toHaveBeenCalled()
  //           expect(removeBaseOnPr).not.toHaveBeenCalled()
            
  //         }))
  //       })
  //     })
  //   })
  // })
})
