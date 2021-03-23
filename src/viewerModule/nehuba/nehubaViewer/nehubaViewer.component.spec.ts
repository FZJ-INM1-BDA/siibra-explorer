import { TestBed, async, fakeAsync, tick, ComponentFixture } from "@angular/core/testing"
import { CommonModule, DOCUMENT } from "@angular/common"
import { NehubaViewerUnit, IMPORT_NEHUBA_INJECT_TOKEN, scanFn } from "./nehubaViewer.component"
import { importNehubaFactory } from "../util"
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service"
import { LoggingModule, LoggingService } from "src/logging"
import { APPEND_SCRIPT_TOKEN, appendScriptFactory } from "src/util/constants"
import { IMeshesToLoad, SET_MESHES_TO_LOAD } from "../constants"
import { ReplaySubject, Subject } from "rxjs"
import { IColorMap, SET_COLORMAP_OBS, SET_LAYER_VISIBILITY } from "../layerCtrl.service"

describe('> nehubaViewer.component.ts', () => {
  describe('> #scanFn', () => {

    const curr = {
      layer: {
        name: 'foo-bar'
      },
      labelIndicies: [1,2,3]
    }

    describe('> insert OP', () => {
      describe('> if incoming is empty arr', () => {
        const acc = []
        it('> should insert', () => {
          expect(
            scanFn(acc, curr)
          ).toEqual([curr])
        })
      })

      describe('> if incoming has other key', () => {
        it('> should insert', () => {
          const acc = [{
            layer: {
              name: 'hello-world'
            },
            labelIndicies: [4,5,6]
          }]
          expect(
            scanFn(acc, curr)
          ).toEqual([
            ...acc,
            curr
          ])
        })
      })
    })

    describe('> update OP', () => {
      const acc = [{
        layer: {
          name: 'hello-world'
        },
        labelIndicies: [4,5,6]
      }, {
        layer: {
          name: 'foo-bar',
        },
        labelIndicies: [1]
      }]
      it('> should update with same key', () => {
        expect(
          scanFn(acc, curr)
        ).toEqual([{
          layer: {
            name: 'hello-world'
          },
          labelIndicies: [4,5,6]
        }, {
          layer: {
            name: 'foo-bar',
          },
          labelIndicies: [1,2,3]
        }])
      })
    })
  })

  describe('> NehubaViewerUnit', () => {
    let provideSetMeshToLoadCtrl = true
    let provideLayerVisibility = true
    let provideSetColorObs = true
    const setMeshToLoadCtl$ = new Subject<IMeshesToLoad>()
    let setLayerVisibility$: Subject<string[]>
    let setcolorMap$: Subject<IColorMap>
    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [
          CommonModule,
          LoggingModule
        ],
        declarations: [
          NehubaViewerUnit
        ],
        providers:[
          {
            provide: IMPORT_NEHUBA_INJECT_TOKEN,
            useFactory: importNehubaFactory,
            deps: [ APPEND_SCRIPT_TOKEN ]
          },
          {
            provide: APPEND_SCRIPT_TOKEN,
            useFactory: appendScriptFactory,
            deps: [ DOCUMENT ]
          },
          {
            provide: SET_MESHES_TO_LOAD,
            useFactory: () => provideSetMeshToLoadCtrl
              ? setMeshToLoadCtl$
              : null
          },
          {
            provide: SET_LAYER_VISIBILITY,
            useFactory: () => {
              setLayerVisibility$ = provideLayerVisibility
                ? new ReplaySubject(1)
                : null
              return setLayerVisibility$
            } 
          },
          {
            provide: SET_COLORMAP_OBS,
            useFactory: () => {
              setcolorMap$ = provideSetColorObs
                ? new ReplaySubject(1)
                : null
              return setcolorMap$
            }
          },
          AtlasWorkerService,
          LoggingService,
        ]
      }).compileComponents()
    }))

    it('> creates component', () => {
      const fixture = TestBed.createComponent(NehubaViewerUnit)
      expect(fixture.componentInstance).toBeTruthy()
    })

    describe('> on create', () => {
      it('> calls onInit lifecycle param properly', () => {
        const onInitSpy = jasmine.createSpy('onInit')
        const fixture = TestBed.createComponent(NehubaViewerUnit)
        fixture.componentInstance.lifecycle = {
          onInit: onInitSpy
        }

        fixture.detectChanges()

        expect(onInitSpy).toHaveBeenCalled()
      })
    })

    describe('> loading meshes', () => {
      describe('> native', () => {
        beforeAll(() => {
          provideSetMeshToLoadCtrl = false
        })
        it('> on loadMeshes$ emit, calls nehubaViewer.setMeshesToLoad', fakeAsync(() => {

          const fixture = TestBed.createComponent(NehubaViewerUnit)
          fixture.componentInstance.nehubaViewer = {
            setMeshesToLoad: jasmine.createSpy('setMeshesToLoad').and.returnValue(null),
            dispose: () => {}
          }
  
          fixture.detectChanges()
          fixture.componentInstance['loadMeshes$'].next({
            layer: {
              name: 'foo-bar'
            },
            labelIndicies: [1,2,3]
          })
          tick(1000)
          expect(fixture.componentInstance.nehubaViewer.setMeshesToLoad).toHaveBeenCalledWith([1,2,3], { name: 'foo-bar' })
        }))
      })

      describe('> injecting SET_MESHES_TO_LOAD', () => {
        beforeAll(() => {
          provideSetMeshToLoadCtrl = true
        })
        it('> navtive loadMeshes method will not trigger loadMesh call',fakeAsync(() => {

          const fixture = TestBed.createComponent(NehubaViewerUnit)
          fixture.componentInstance.nehubaViewer = {
            setMeshesToLoad: jasmine.createSpy('setMeshesToLoad').and.returnValue(null),
            dispose: () => {}
          }
  
          fixture.detectChanges()
          fixture.componentInstance['loadMeshes$'].next({
            layer: {
              name: 'foo-bar'
            },
            labelIndicies: [1,2,3]
          })
          tick(1000)
          expect(fixture.componentInstance.nehubaViewer.setMeshesToLoad).not.toHaveBeenCalledWith([1,2,3], { name: 'foo-bar' })
        }))

        it('> when injected obs emits, will trigger loadMesh call', fakeAsync(() => {

          const fixture = TestBed.createComponent(NehubaViewerUnit)
          fixture.componentInstance.nehubaViewer = {
            setMeshesToLoad: jasmine.createSpy('setMeshesToLoad').and.returnValue(null),
            dispose: () => {}
          }
  
          fixture.detectChanges()
          setMeshToLoadCtl$.next({
            labelIndicies: [1,2,3],
            layer: {
              name: 'foo-bar'
            }
          })
          tick(1000)
          expect(fixture.componentInstance.nehubaViewer.setMeshesToLoad).toHaveBeenCalledWith([1,2,3], { name: 'foo-bar' })
        }))
      })
    })

    describe('> layer visibility', () => {
      let nehubaViewerSpy: any
      let managedLayersSpy: jasmine.Spy
      let getLayerByNameSpy: jasmine.Spy
      let managedLayer = {
        setVisible: jasmine.createSpy()
      }
      let layerManager = {
        get managedLayers() {
          return []
        },
        getLayerByName(layerName: string){

        }
      }

      afterEach(() => {
        managedLayer.setVisible.calls.reset()
      })
      beforeEach(() => {
        managedLayersSpy = spyOnProperty(layerManager, 'managedLayers')
        managedLayersSpy.and.returnValue([ managedLayer ])
        getLayerByNameSpy = spyOn(layerManager, 'getLayerByName')
        getLayerByNameSpy.and.callThrough()
        
        nehubaViewerSpy = {
          ngviewer: {
            layerManager
          },
          dispose: () => {}
        }

        provideLayerVisibility = true
      })

      it('> if provided obs does not emit, does not call manage layers', fakeAsync(() => {
        const fixture = TestBed.createComponent(NehubaViewerUnit)
        fixture.componentInstance.nehubaViewer = nehubaViewerSpy
        fixture.detectChanges()
        tick(320)
        expect(managedLayersSpy).not.toHaveBeenCalled()
      }))

      describe('> if provided obs does emit', () => {

        const setup = (emit = []) => {
          const fixture = TestBed.createComponent(NehubaViewerUnit)
          setLayerVisibility$.next(emit)
          fixture.componentInstance.nehubaViewer = nehubaViewerSpy
          fixture.detectChanges()
          tick(640)
        }
        describe('> emits []', () => {
          it('> call manage layers', fakeAsync(() => {
            setup()
            expect(managedLayersSpy).toHaveBeenCalled()
          }))
          it('> layers have visibility set off', fakeAsync(() => {
            setup()
            expect(managedLayer.setVisible).toHaveBeenCalledWith(false)
          }))
        })

        describe('> emits ["something"]', () => {
          it('> calls getLayerByname',fakeAsync(() => {
            setup(['something'])
            expect(layerManager.getLayerByName).toHaveBeenCalledWith('something')
          }))

          it('> if returns layer, expects setVisible to be called', fakeAsync(() => {
            const layer = {
              setVisible: jasmine.createSpy()
            }
            getLayerByNameSpy.and.returnValue(layer)
            setup(['something'])
            expect(layer.setVisible).toHaveBeenCalledWith(true)
          }))
        })
      })
    })

    describe('> colorMap obs', () => {

      let prvSetCMSpy: jasmine.Spy
      const setup = () => {

        const fixture = TestBed.createComponent(NehubaViewerUnit)
        fixture.detectChanges()
        prvSetCMSpy = spyOn<any>(fixture.componentInstance, 'setColorMap').and.callFake(() => {})
      }

      beforeEach(() => {
        provideSetColorObs = true
      })
      it('> if obs does not emit, does not call setcolormap', fakeAsync(() => {
        setup()
        tick(320)
        expect(prvSetCMSpy).not.toHaveBeenCalled()
      }))

      describe('> if obs does emit', () => {
        it('> setcolormap gets called', fakeAsync(() => {
          setup()
          setcolorMap$.next({
            'foo-bar': {
              1: { red: 100, green: 100, blue: 100 },
              2: { red: 200, green: 200, blue: 200 },
            },
            'hello-world': {
              1: { red: 10, green: 10, blue: 10 },
              2: { red: 20, green: 20, blue: 20 },
            }
          })
          tick(320)
          expect(prvSetCMSpy).toHaveBeenCalled()
        }))

        it('> call arg is as expected', fakeAsync(() => {
          setup()
          setcolorMap$.next({
            'foo-bar': {
              1: { red: 100, green: 100, blue: 100 },
              2: { red: 200, green: 200, blue: 200 },
            },
            'hello-world': {
              1: { red: 10, green: 10, blue: 10 },
              2: { red: 20, green: 20, blue: 20 },
            }
          })
          tick(320)
          const map = new Map([
            ['foo-bar', new Map([
              ['1', { red: 100, green: 100, blue: 100 }],
              ['2', { red: 200, green: 200, blue: 200 }],
            ])],
            ['hello-world', new Map([
              ['1', { red: 10, green: 10, blue: 10 }],
              ['2', { red: 20, green: 20, blue: 20 }],
            ])]
          ])

          expect(prvSetCMSpy).toHaveBeenCalledWith(map)
        }))
      })
    })

    describe('> # setColorMap', () => {
      let nehubaViewerSpy: any
      beforeEach(() => {
        nehubaViewerSpy = {
          batchAddAndUpdateSegmentColors: jasmine.createSpy(),
          dispose(){

          }
        }
      })
      it('> calls nehubaViewer.batchAddAndUpdateSegmentColors', () => {
        const fixture = TestBed.createComponent(NehubaViewerUnit)
        fixture.componentInstance.nehubaViewer = nehubaViewerSpy
        fixture.detectChanges()

        const mainMap = new Map<string, Map<number, { red: number, green: number, blue: number }>>()
        const fooBarMap = new Map()
        fooBarMap.set(1, {red: 100, green: 100, blue: 100})
        fooBarMap.set(2, {red: 200, green: 200, blue: 200})
        mainMap.set('foo-bar', fooBarMap)

        const helloWorldMap = new Map()
        helloWorldMap.set(1, {red: 10, green: 10, blue: 10})
        helloWorldMap.set(2, {red: 20, green: 20, blue: 20})
        mainMap.set('hello-world', helloWorldMap)

        fixture.componentInstance['setColorMap'](mainMap)

        expect(
          nehubaViewerSpy.batchAddAndUpdateSegmentColors
        ).toHaveBeenCalledTimes(2)

        expect(nehubaViewerSpy.batchAddAndUpdateSegmentColors).toHaveBeenCalledWith(
          fooBarMap,
          { name: 'foo-bar' }
        )

        expect(nehubaViewerSpy.batchAddAndUpdateSegmentColors).toHaveBeenCalledWith(
          helloWorldMap,
          { name: 'hello-world' }
        )
      })
    })

  })
})
