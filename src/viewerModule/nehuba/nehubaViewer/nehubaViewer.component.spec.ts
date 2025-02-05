import { TestBed, fakeAsync, tick, ComponentFixture } from "@angular/core/testing"
import { CommonModule } from "@angular/common"
import { NehubaViewerUnit, scanFn } from "./nehubaViewer.component"
import { LoggingModule, LoggingService } from "src/logging"
import { IMeshesToLoad, SET_MESHES_TO_LOAD } from "../constants"
import { Subject } from "rxjs"
import { IColorMap, SET_COLORMAP_OBS, SET_LAYER_VISIBILITY } from "../layerCtrl.service"
import { rgbToHex } from 'common/util'

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
    const setMeshToLoadCtl$ = new Subject<IMeshesToLoad>()
    let setLayerVisibility$: Subject<string[]> = new Subject()
    let setcolorMap$: Subject<IColorMap> = new Subject()
    let fixture: ComponentFixture<NehubaViewerUnit>
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [
          CommonModule,
          LoggingModule
        ],
        declarations: [
          NehubaViewerUnit
        ],
        providers:[
          {
            provide: SET_MESHES_TO_LOAD,
            useFactory: () => setMeshToLoadCtl$
          },
          {
            provide: SET_LAYER_VISIBILITY,
            useValue: setLayerVisibility$
          },
          {
            provide: SET_COLORMAP_OBS,
            useValue: setcolorMap$
          },
          LoggingService,
        ]
      }).compileComponents()
    })

    it('> creates component', () => {
      fixture = TestBed.createComponent(NehubaViewerUnit)
      expect(fixture.componentInstance).toBeTruthy()
    })

    describe('> loading meshes', () => {
      beforeEach(() => {
        fixture = TestBed.createComponent(NehubaViewerUnit)
        fixture.componentInstance.nehubaViewer = {
          setMeshesToLoad: jasmine.createSpy('setMeshesToLoad').and.returnValue(null),
          dispose: () => {}
        }
        fixture.componentInstance['_nehubaReady'] = true
      })

      describe('> injecting SET_MESHES_TO_LOAD', () => {

        it('> when injected obs emits, will trigger loadMesh call', fakeAsync(() => {

          fixture.detectChanges()
          setMeshToLoadCtl$.next({
            labelIndicies: [1,2,3],
            layer: {
              name: 'foo-bar'
            }
          })
          tick(400)
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

        fixture = TestBed.createComponent(NehubaViewerUnit)
        fixture.componentInstance.nehubaViewer = nehubaViewerSpy
        fixture.componentInstance['_nehubaReady'] = true
      })

      it('> if provided obs does not emit, does not call manage layers', fakeAsync(() => {
        fixture.detectChanges()
        tick(320)
        expect(managedLayersSpy).not.toHaveBeenCalled()
      }))

      describe('> if provided obs does emit', () => {

        const setup = (emit = []) => {
          setLayerVisibility$.next(emit)
          fixture.detectChanges()
          tick(640)
        }
        describe('> emits []', () => {
          beforeEach(fakeAsync(() => {
            setup()
          }))
          it('> call manage layers', () => {
            expect(managedLayersSpy).toHaveBeenCalled() 
          })
          it('> layers have visibility set off', fakeAsync(() => {
            expect(managedLayer.setVisible).toHaveBeenCalledWith(false)
          }))
        })

        describe('> emits ["something"]', () => {
          let layerSetVisibleSpy: jasmine.Spy
          beforeEach(fakeAsync(() => {
            layerSetVisibleSpy = jasmine.createSpy()
            const layer = {
              setVisible: layerSetVisibleSpy
            }
            getLayerByNameSpy.and.returnValue(layer)
            setup(['something'])
          }))
          it('> calls getLayerByname', () => {
            expect(layerManager.getLayerByName).toHaveBeenCalledWith('something')
          })

          it('> getLayerByNameSpy called', () => {
            expect(getLayerByNameSpy).toHaveBeenCalled()
          })
          it('> if returns layer, expects setVisible to be called', () => {
            expect(layerSetVisibleSpy).toHaveBeenCalledWith(true)
          })
        })
      })
    })

    describe('> colorMap obs', () => {

      let prvSetCMSpy: jasmine.Spy
      const setup = () => {

        fixture = TestBed.createComponent(NehubaViewerUnit)
        fixture.componentInstance['_nehubaReady'] = true

        /**
         * set nehubaViewer, since some methods check viewer is loaded
         */
        fixture.componentInstance.nehubaViewer = {
           ngviewer: {},
           dispose: () => {}
         }
        fixture.detectChanges()
        prvSetCMSpy = spyOn<any>(fixture.componentInstance, 'setColorMap').and.callFake(() => {})
      }

      describe('> obs does not emit', () => {
        beforeEach(() => {
          setup()
        })
        it('> does not call set colormap', () => {
          expect(prvSetCMSpy).not.toHaveBeenCalled()
        } )
      })

      describe('> if obs does emit', () => {
        beforeEach(() => {
          setup()
        })
        it('> setcolormap gets called', fakeAsync(() => {
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
      let ngViewerStatechildrenGetSpy = jasmine.createSpy('get')
      let layersMngerToJsonSpy = jasmine.createSpy('layersMngerToJsonSpy')
      let posToJsonSpy = jasmine.createSpy('posToJsonSpy')
      
      let getLayerByNameSpy = jasmine.createSpy('getLayerByNameSpy')
      let removeManagedLayerSpy = jasmine.createSpy('removeManagedLayerSpy')
      let addManagedLayerSpy = jasmine.createSpy('addManagedLayerSpy')
      let getLayerSpy = jasmine.createSpy('getLayerSpy')
      let fakeLayer = {}
      let fakeNewLayer = {}
      let posRestoreStateSpy = jasmine.createSpy("posRestoreStateSpy")

      const ngId1 = 'foo-bar'
      const ngId2 = 'hello-world'
      beforeEach(() => {
        getLayerSpy.and.returnValue(fakeNewLayer)
        nehubaViewerSpy = {
          dispose(){

          },
          ngviewer: {
            state: {
              children: {
                get: ngViewerStatechildrenGetSpy
              }
            },
            layerManager: {
              removeManagedLayer: removeManagedLayerSpy,
              addManagedLayer: addManagedLayerSpy,
            },
            layerSpecification: {
              getLayer: getLayerSpy
            }
          }
        }

        ngViewerStatechildrenGetSpy.and.callFake(prop => {
          if (prop === "position") {
            return {
              toJSON: posToJsonSpy,
              restoreState: posRestoreStateSpy
            }
          }
          if (prop === "layers") {
            getLayerByNameSpy.and.returnValue(fakeLayer)
            return {
              toJSON: layersMngerToJsonSpy,
              layerManager: {
                getLayerByName: getLayerByNameSpy,
                removeManagedLayer: removeManagedLayerSpy,
                addManagedLayer: addManagedLayerSpy,
              },
            }
          }
          throw new Error(`prop ${prop} is not anticipated`)
        })
        posToJsonSpy.and.returnValue([1.1, 2.2, 3.3])
        layersMngerToJsonSpy.and.returnValue([{
          name: ngId1
        }, {
          name: ngId2
        }])
      })
      afterEach(() => {
        ngViewerStatechildrenGetSpy.calls.reset()
        layersMngerToJsonSpy.calls.reset()
        removeManagedLayerSpy.calls.reset()
        addManagedLayerSpy.calls.reset()
        getLayerByNameSpy.calls.reset()
        getLayerSpy.calls.reset()
      })
      it('> calls nehubaViewer.restoreState', () => {
        const fixture = TestBed.createComponent(NehubaViewerUnit)
        fixture.componentInstance.nehubaViewer = nehubaViewerSpy
        fixture.detectChanges()

        const mainMap = new Map<string, Map<number, { red: number, green: number, blue: number }>>()
        const fooBarMap = new Map()
        fooBarMap.set(1, {red: 100, green: 100, blue: 100})
        fooBarMap.set(2, {red: 200, green: 200, blue: 200})
        mainMap.set(ngId1, fooBarMap)

        const helloWorldMap = new Map()
        helloWorldMap.set(1, {red: 10, green: 10, blue: 10})
        helloWorldMap.set(2, {red: 20, green: 20, blue: 20})
        mainMap.set(ngId2, helloWorldMap)

        fixture.componentInstance['setColorMap'](mainMap)

        expect(getLayerByNameSpy).toHaveBeenCalledWith(ngId1)
        expect(removeManagedLayerSpy).toHaveBeenCalledWith(fakeLayer)
        expect(getLayerSpy).toHaveBeenCalledWith(ngId1, {
          name: ngId1,
          segmentColors: {
            1: rgbToHex([100, 100, 100]),
            2: rgbToHex([200, 200, 200]),
          }
        })
        expect(addManagedLayerSpy).toHaveBeenCalledWith(fakeNewLayer)

        expect(getLayerByNameSpy).toHaveBeenCalledWith(ngId2)
        expect(removeManagedLayerSpy).toHaveBeenCalledWith(fakeLayer)
        expect(getLayerSpy).toHaveBeenCalledWith(ngId2, {
          name: ngId2,
          segmentColors: {
            1: rgbToHex([10, 10, 10]),
            2: rgbToHex([20, 20, 20]),
          }
        })
        expect(addManagedLayerSpy).toHaveBeenCalledWith(fakeNewLayer)

        expect(posRestoreStateSpy).toHaveBeenCalledOnceWith(
          [ 1.1, 2.2, 3.3 ]
        )
      })
    })

  })
})
