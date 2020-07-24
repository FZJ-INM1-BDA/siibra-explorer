import { TestBed, tick, fakeAsync } from "@angular/core/testing"
import { DatasetPreviewGlue, glueSelectorGetUiStatePreviewingFiles, glueActionRemoveDatasetPreview, datasetPreviewMetaReducer, glueActionAddDatasetPreview, GlueEffects } from "./glue"
import { ACTION_TO_WIDGET_TOKEN, EnumActionToWidget } from "./widget"
import { provideMockStore, MockStore } from "@ngrx/store/testing"
import { getRandomHex } from 'common/util'
import { EnumWidgetTypes, TypeOpenedWidget, uiActionSetPreviewingDatasetFiles } from "./services/state/uiState.store.helper"
import { hot } from "jasmine-marbles"
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing"
import { glueActionToggleDatasetPreview } from './glue'
import { getIdObj } from 'common/util'
import { DS_PREVIEW_URL } from 'src/util/constants'
import { NgLayersService } from "./ui/layerbrowser/ngLayerService.service"
import { EnumColorMapName } from "./util/colorMaps"

const mockActionOnSpyReturnVal0 = { 
  id: getRandomHex(),
  matDialogRef: {
    componentInstance: {
      untouchedIndex: 0
    }
  }
}
const mockActionOnSpyReturnVal1 = { 
  id: getRandomHex(),
  matDialogRef: {
    componentInstance: {
      untouchedIndex: 0
    }
  }
}
let actionOnWidgetSpy

const nifti = {
  mimetype: "application/nifti",
  url: "http://abc.xyz",
  referenceSpaces: [],
  volumeMetadata: {
    min: 0.1,
    max: 0.45,
    colormap: 'viridis'
  },
  name: 'helloworld',
  filename: 'foobar'
}

const chart = {
  mimetype: "application/json",
  data: {
    "chart.js": {
      type: "radar"
    }
  },
  referenceSpaces: []
}

const file1 = {
  datasetId: getRandomHex(),
  filename: getRandomHex()
}

const file2 = {
  datasetId: getRandomHex(),
  filename: getRandomHex()
}

const file3 = {
  datasetId: getRandomHex(),
  filename: getRandomHex()
}

const dataset1 = {
  fullId: 'minds/core/dataset/v1.0.0/aaa-bbb-ccc-000'
}

describe('> glue.ts', () => {
  describe('> DatasetPreviewGlue', () => {
    beforeEach(() => {
      actionOnWidgetSpy = jasmine.createSpy('actionOnWidget').and.returnValues(
        mockActionOnSpyReturnVal0,
        mockActionOnSpyReturnVal1
      )

      TestBed.configureTestingModule({
        imports: [
          HttpClientTestingModule,
        ],
        providers: [
          DatasetPreviewGlue,
          provideMockStore({
            initialState: {
              uiState: {
                previewingDatasetFiles: []
              }
            }
          }),
          {
            provide: ACTION_TO_WIDGET_TOKEN,
            useValue: actionOnWidgetSpy
          },
          NgLayersService
        ]
      })
    })

    afterEach(() => {
      actionOnWidgetSpy.calls.reset()
      const ctrl = TestBed.inject(HttpTestingController)
      ctrl.verify()
    })

    describe('> #datasetPreviewDisplayed', () => {

      it('> correctly emits true when store changes', () => {
        const glue = TestBed.inject(DatasetPreviewGlue)
        const store = TestBed.inject(MockStore)

        const obs = glue.datasetPreviewDisplayed(file1)

        store.setState({
          uiState: {
            previewingDatasetFiles: []
          }
        })
        const uiStateSelector = store.overrideSelector(
          glueSelectorGetUiStatePreviewingFiles,
          []
        )

        uiStateSelector.setResult([ file1 ] )
        store.refreshState()
        expect(obs).toBeObservable(
          hot('a', {
            a: true,
            b: false
          })
        )
      })


      it('> correctly emits false when store changes', () => {
        const store = TestBed.inject(MockStore)

        const glue = TestBed.inject(DatasetPreviewGlue)
        store.setState({
          uiState: {
            previewingDatasetFiles: [ file2 ]
          }
        })
        const obs = glue.datasetPreviewDisplayed(file1)
        store.refreshState()
        
        expect(obs).toBeObservable(
          hot('b', {
            a: true,
            b: false
          })
        )
      })
    })

    describe('> #displayDatasetPreview', () => {

      it('> calls dispatch', () => {

        const glue = TestBed.inject(DatasetPreviewGlue)
        const mockStore = TestBed.inject(MockStore)
        const dispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough()

        glue.displayDatasetPreview(file1, dataset1 as any)
        
        expect(dispatchSpy).toHaveBeenCalled()
      })

      it('> dispatches glueActionToggleDatasetPreview with the correct filename', () => {

        const glue = TestBed.inject(DatasetPreviewGlue)
        const mockStore = TestBed.inject(MockStore)
        const dispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough()

        glue.displayDatasetPreview(file1, dataset1 as any)
        
        const args = dispatchSpy.calls.allArgs()
        const [ action ] = args[0]

        expect(action.type).toEqual(glueActionToggleDatasetPreview.type)
        expect((action as any).datasetPreviewFile.filename).toEqual(file1.filename)
      })

      it('> uses datasetId of file if present', () => {
        
        const glue = TestBed.inject(DatasetPreviewGlue)
        const mockStore = TestBed.inject(MockStore)
        const dispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough()

        glue.displayDatasetPreview(file1, dataset1 as any)
        
        const args = dispatchSpy.calls.allArgs()
        const [ action ] = args[0]

        expect((action as any).datasetPreviewFile.datasetId).toEqual(file1.datasetId)
      })

      it('> falls back to dataset fullId if datasetId not present on file', () => {

        const glue = TestBed.inject(DatasetPreviewGlue)
        const mockStore = TestBed.inject(MockStore)
        const dispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough()

        const { datasetId, ...noDsIdFile1 } = file1
        glue.displayDatasetPreview(noDsIdFile1 as any, dataset1 as any)
        
        const { fullId } = dataset1
        const { kgId } = getIdObj(fullId)

        const args = dispatchSpy.calls.allArgs()
        const [ action ] = args[0]

        expect((action as any).datasetPreviewFile.datasetId).toEqual(kgId)
      })
    })

    describe('> http interceptor', () => {
      it('> on no state, does not call', fakeAsync(() => {
        
        const store = TestBed.inject(MockStore)
        const ctrl = TestBed.inject(HttpTestingController)
        const glue = TestBed.inject(DatasetPreviewGlue)

        store.setState({
          uiState: {
            previewingDatasetFiles: []
          }
        })

        const { datasetId, filename } = file1
        // debounce at 100ms
        tick(200)
        ctrl.expectNone({})
      }))
      it('> on set state, calls end point to fetch full data', fakeAsync(() => {

        const store = TestBed.inject(MockStore)
        const ctrl = TestBed.inject(HttpTestingController)
        const glue = TestBed.inject(DatasetPreviewGlue)

        store.setState({
          uiState: {
            previewingDatasetFiles: [ file1 ]
          }
        })

        const { datasetId, filename } = file1
        // debounce at 100ms
        tick(200)

        const req = ctrl.expectOne(`${DS_PREVIEW_URL}/${datasetId}/${encodeURIComponent(filename)}`)
        req.flush(nifti)
      }))

      it('> on previewing nifti, thresholds, colormap and remove bg flag set properly', fakeAsync(() => {
        const store = TestBed.inject(MockStore)
        const ctrl = TestBed.inject(HttpTestingController)

        const layerService = TestBed.inject(NgLayersService)

        const highThresholdMapSpy = spyOn(layerService.highThresholdMap, 'set').and.callThrough()
        const lowThresholdMapSpy = spyOn(layerService.lowThresholdMap, 'set').and.callThrough()
        const colorMapMapSpy = spyOn(layerService.colorMapMap, 'set').and.callThrough()
        const bgFlagSpy = spyOn(layerService.removeBgMap, 'set').and.callThrough()

        const glue = TestBed.inject(DatasetPreviewGlue)

        

        store.setState({
          uiState: {
            previewingDatasetFiles: [ file1 ]
          }
        })

        const { datasetId, filename } = file1
        // debounce at 100ms
        tick(200)

        const req = ctrl.expectOne(`${DS_PREVIEW_URL}/${datasetId}/${encodeURIComponent(filename)}`)
        req.flush(nifti)

        const { name, volumeMetadata } = nifti
        const { min, max } = volumeMetadata
        expect(highThresholdMapSpy).toHaveBeenCalledWith(name, max)
        expect(lowThresholdMapSpy).toHaveBeenCalledWith(name, min)
        expect(colorMapMapSpy).toHaveBeenCalledWith(name, EnumColorMapName.VIRIDIS)
        expect(bgFlagSpy).toHaveBeenCalledWith(name, true)
      }))
    })

    describe('> #actionOnWidget', () => {

      it('> on init, does not call either open/close', fakeAsync(() => {

        const store = TestBed.inject(MockStore)
        const ctrl = TestBed.inject(HttpTestingController)
        const glue = TestBed.inject(DatasetPreviewGlue)

        store.setState({
          uiState: {
            previewingDatasetFiles: []
          }
        })
        tick(200)
        expect(actionOnWidgetSpy).not.toHaveBeenCalled()
      }))

      it('> correctly calls actionOnWidgetSpy on create', fakeAsync(() => {
        
        const store = TestBed.inject(MockStore)
        const ctrl = TestBed.inject(HttpTestingController)
        const glue = TestBed.inject(DatasetPreviewGlue)

        store.setState({
          uiState: {
            previewingDatasetFiles: [ file1 ]
          }
        })

        // debounce at 100ms
        tick(200)
        const req = ctrl.expectOne({})
        req.flush(chart)

        expect(actionOnWidgetSpy).toHaveBeenCalled()
        const args = actionOnWidgetSpy.calls.allArgs()
        
        expect(args.length).toEqual(1)

        const [ type, cmp, option, ...rest ] = args[0]
        expect(type).toEqual(EnumActionToWidget.OPEN)

      }))
  
      it('> correctly calls actionOnWidgetSpy twice when needed', fakeAsync(() => {
        
        const store = TestBed.inject(MockStore)
        const ctrl = TestBed.inject(HttpTestingController)
        const glue = TestBed.inject(DatasetPreviewGlue)

        store.setState({
          uiState: {
            previewingDatasetFiles: [
              file1, file2
            ]
          }
        })

        // debounce at 100ms
        tick(200)

        const reqs = ctrl.match({})
        expect(reqs.length).toEqual(2)
        for (const req of reqs) {
          req.flush(chart)
        }

        expect(actionOnWidgetSpy).toHaveBeenCalled()
        const args = actionOnWidgetSpy.calls.allArgs()
        
        expect(args.length).toEqual(2)

        const [ type0, cmp0, option0, ...rest0 ] = args[0]
        expect(type0).toEqual(EnumActionToWidget.OPEN)
        const { data: data0 } = option0

        expect(data0.kgId).toEqual(file1.datasetId)
        expect(data0.filename).toEqual(file1.filename)

        const [ type1, cmp1, option1, ...rest1 ] = args[1]
        expect(type1).toEqual(EnumActionToWidget.OPEN)
        const { data: data1 } = option1
        expect(data1.kgId).toEqual(file2.datasetId)
        expect(data1.filename).toEqual(file2.filename)

        expect(cmp0).toBeTruthy()
        expect(cmp0).toBe(cmp1)
      }))

      it('> correctly calls actionOnWidgetSpy on change of state', fakeAsync(() => {

        const store = TestBed.inject(MockStore)
        const ctrl = TestBed.inject(HttpTestingController)
        const glue = TestBed.inject(DatasetPreviewGlue)

        store.setState({
          uiState: {
            previewingDatasetFiles: [
              file1, file2
            ]
          }
        })

        // debounce timer
        tick(200)

        const reqs = ctrl.match({})
        expect(reqs.length).toEqual(2)
        for (const req of reqs) {
          req.flush(chart)
        }

        actionOnWidgetSpy.calls.reset()

        store.setState({
          uiState: {
            previewingDatasetFiles: []
          }
        })
        
        // debounce at 100ms
        tick(200)
        expect(actionOnWidgetSpy).toHaveBeenCalled()
        const args = actionOnWidgetSpy.calls.allArgs()
        
        expect(args.length).toEqual(2)

        const [ type0, cmp0, option0, ...rest0 ] = args[0]
        expect(type0).toEqual(EnumActionToWidget.CLOSE)
        expect(cmp0).toBe(null)
        expect(option0.id).toEqual(mockActionOnSpyReturnVal0.id)

        const [ type1, cmp1, option1, ...rest1 ] = args[1]
        expect(type1).toEqual(EnumActionToWidget.CLOSE)
        expect(cmp1).toBe(null)
        expect(option1.id).toEqual(mockActionOnSpyReturnVal1.id)
      }))


      it('> if no UI preview file is added, does not call actionOnWidget', fakeAsync(() => {

        const store = TestBed.inject(MockStore)
        const ctrl = TestBed.inject(HttpTestingController)
        const glue = TestBed.inject(DatasetPreviewGlue)

        store.setState({
          uiState: {
            previewingDatasetFiles: [ file1 ]
          }
        })

        // debounce at 100ms
        tick(200)
        const req = ctrl.expectOne({})
        req.flush(nifti)

        expect(actionOnWidgetSpy).not.toHaveBeenCalled()
      }))
      
    })
  })


  describe('> datasetPreviewMetaReducer', () => {
    
    const obj1: TypeOpenedWidget = {
      type: EnumWidgetTypes.DATASET_PREVIEW,
      data: file1
    }

    const stateEmpty = {
      uiState: {
        previewingDatasetFiles: []
      }
    } as { uiState: { previewingDatasetFiles: {datasetId: string, filename: string}[] } }

    const stateObj1 = {
      uiState: {
        previewingDatasetFiles: [ file1 ]
      }
    } as { uiState: { previewingDatasetFiles: {datasetId: string, filename: string}[] } }

    const reducer = jasmine.createSpy('reducer')
    const metaReducer = datasetPreviewMetaReducer(reducer)

    afterEach(() => {
      reducer.calls.reset()
    })
    describe('> on glueActionAddDatasetPreview', () => {
      describe('> if preview does not yet exist in state', () => {
        beforeEach(() => {
          metaReducer(stateEmpty, glueActionAddDatasetPreview({ datasetPreviewFile: file1 }))
        })

        it('> expect reducer to be called once', () => {
          expect(reducer).toHaveBeenCalled()
          expect(reducer.calls.count()).toEqual(1)
        })

        it('> expect call sig of reducer call to be correct', () => {

          const [ args ] = reducer.calls.allArgs()
          expect(args[0]).toEqual(stateEmpty)
          expect(args[1].type).toEqual(uiActionSetPreviewingDatasetFiles.type)
          expect(args[1].previewingDatasetFiles).toEqual([ file1 ])
        })
      })
      
      describe('> if preview already exist in state', () => {
        beforeEach(() => {
          metaReducer(stateObj1, glueActionAddDatasetPreview({ datasetPreviewFile: file1 }))
        })
        it('> should still call reducer', () => {
          expect(reducer).toHaveBeenCalled()
          expect(reducer.calls.count()).toEqual(1)
        })

        it('> there should now be two previews in dispatched action', () => {
          
          const [ args ] = reducer.calls.allArgs()
          expect(args[0]).toEqual(stateObj1)
          expect(args[1].type).toEqual(uiActionSetPreviewingDatasetFiles.type)
          expect(args[1].previewingDatasetFiles).toEqual([ file1, file1 ])
        })
      })
    })
    describe('> on glueActionRemoveDatasetPreview', () => {
      it('> removes id as expected', () => {
        metaReducer(stateObj1, glueActionRemoveDatasetPreview({ datasetPreviewFile: file1 }))
        expect(reducer).toHaveBeenCalled()
        expect(reducer.calls.count()).toEqual(1)
        const [ args ] = reducer.calls.allArgs()
        expect(args[0]).toEqual(stateObj1)
        expect(args[1].type).toEqual(uiActionSetPreviewingDatasetFiles.type)
        expect(args[1].previewingDatasetFiles).toEqual([ ])
      })
    })
  })

  describe('> GlueEffects', () => {

    const defaultState = {
      viewerState: {
        templateSelected: null,
        parcellationSelected: null,
        regionsSelected: []
      },
      uiState: {
        previewingDatasetFiles: []
      }
    }
    beforeEach(() => {

      TestBed.configureTestingModule({
        providers: [
          GlueEffects,
          provideMockStore({
            initialState: defaultState
          })
        ]
      })
    })

    describe('> regionTemplateParcChange$', () => {

      const copiedState0 = JSON.parse(JSON.stringify(defaultState))
      copiedState0.viewerState.regionsSelected = [{ name: 'coffee' }]
      copiedState0.viewerState.parcellationSelected = { name: 'chicken' }
      copiedState0.viewerState.templateSelected = { name: 'spinach' }

      const generateTest = (m1, m2) => {

        const mockStore = TestBed.inject(MockStore)
        mockStore.setState(copiedState0)
        const glueEffects = TestBed.inject(GlueEffects)
        /**
         * couldn't get jasmine-marble to coopoerate
         * TODO test proper with jasmine marble (?)
         */
        let numOfEmit = 0
        const sub = glueEffects.regionTemplateParcChange$.subscribe(() => {
          numOfEmit += 1
        })

        const copiedState1 = JSON.parse(JSON.stringify(copiedState0))
        m1(copiedState1)
        mockStore.setState(copiedState1)
        expect(numOfEmit).toEqual(1)

        const copiedState2 = JSON.parse(JSON.stringify(copiedState0))
        m2(copiedState2)
        mockStore.setState(copiedState2)
        expect(numOfEmit).toEqual(2)

        sub.unsubscribe()
      }
      
      it('> on change of region, should emit', () => {
        generateTest(
          copiedState1 => copiedState1.viewerState.regionsSelected = [{ name: 'cake' }],
          copiedState2 => copiedState2.viewerState.regionsSelected = [{ name: 't bone' }]
        )
      })

      it('> on change of parcellation, should emit', () => {
        generateTest(
          copiedState1 => copiedState1.viewerState.parcellationSelected = { name: 'pizza' },
          copiedState2 => copiedState2.viewerState.parcellationSelected = { name: 'pizza on pineapple' }
        )
      })

      it('> on change of template, should emit', () => {
        generateTest(
          copiedState1 => copiedState1.viewerState.templateSelected = { name: 'calzone' },
          copiedState2 => copiedState2.viewerState.templateSelected = { name: 'calzone on pineapple' }
        )
      })
    })
  })
})
