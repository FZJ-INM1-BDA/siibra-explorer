import { TestBed, tick, fakeAsync, discardPeriodicTasks } from "@angular/core/testing"
import { DatasetPreviewGlue, glueSelectorGetUiStatePreviewingFiles, glueActionRemoveDatasetPreview, datasetPreviewMetaReducer, glueActionAddDatasetPreview, GlueEffects, ClickInterceptorService } from "./glue"
import { ACTION_TO_WIDGET_TOKEN, EnumActionToWidget } from "./widget"
import { provideMockStore, MockStore } from "@ngrx/store/testing"
import { getRandomHex } from 'common/util'
import { EnumWidgetTypes, TypeOpenedWidget, uiActionSetPreviewingDatasetFiles, uiStatePreviewingDatasetFilesSelector } from "./services/state/uiState.store.helper"
import { hot } from "jasmine-marbles"
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing"
import { glueActionToggleDatasetPreview } from './glue'
import { getIdObj } from 'common/util'
import { DS_PREVIEW_URL } from 'src/util/constants'
import { NgLayersService } from "./ui/layerbrowser/ngLayerService.service"
import { EnumColorMapName } from "./util/colorMaps"
import { GET_KGDS_PREVIEW_INFO_FROM_ID_FILENAME } from "./atlasComponents/databrowserModule/pure"
import { viewerStateSelectedTemplateSelector } from "./services/state/viewerState/selectors"
import { generalActionError } from "./services/stateStore.helper"

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

const region0 = {
  name: 'region0',
  originDatasets: [{
    kgId: getRandomHex(),
    kgSchema: 'minds/core/dataset/v1.0.0',
    filename: getRandomHex()
  }]
}

const region1 = {
  name: 'name',
  originDatasets: [{
    kgId: getRandomHex(),
    kgSchema: 'minds/core/dataset/v1.0.0',
    filename: getRandomHex()
  }]
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

    const initialState = {
      uiState: {
        previewingDatasetFiles: []
      },
      viewerState: {
        regionsSelected: []
      }
    }
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
            initialState
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

        discardPeriodicTasks()
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

        const req = ctrl.expectOne(`${DS_PREVIEW_URL}/${encodeURIComponent('minds/core/dataset/v1.0.0')}/${datasetId}/${encodeURIComponent(filename)}`)
        req.flush(nifti)
        discardPeriodicTasks()
      }))

      it('> if returns 404, should be handled gracefully', fakeAsync(() => {

        const ctrl = TestBed.inject(HttpTestingController)
        const glue = TestBed.inject(DatasetPreviewGlue)

        const { datasetId, filename } = file3

        const obs$ = glue.getDatasetPreviewFromId({ datasetId, filename })
        let expectedVal = 'defined'
        obs$.subscribe(val => expectedVal = val)
        tick(200)

        const req = ctrl.expectOne(`${DS_PREVIEW_URL}/${encodeURIComponent('minds/core/dataset/v1.0.0')}/${encodeURIComponent(datasetId)}/${encodeURIComponent(filename)}`)
        req.flush(null, { status: 404, statusText: 'Not found' })

        expect(expectedVal).toBeNull()
        discardPeriodicTasks()
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
        discardPeriodicTasks()
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
        discardPeriodicTasks()
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
        discardPeriodicTasks()
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
        discardPeriodicTasks()
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
        discardPeriodicTasks()
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

    /**
     * related to previews
     */
    const mockTemplate = {
      fullId: 'bar'
    }
    const mockPreviewFileIds = {
      datasetId: 'foo',
      filename: 'bar'
    }
    const mockPreviewFileIds2 = {
      datasetId: 'foo2',
      filename: 'bar2'
    }
    const mockPreviewFileIds3 = {
      datasetId: 'foo3',
      filename: 'bar3'
    }
    const mockPreviewFileIds4 = {
      datasetId: 'foo4',
      filename: 'bar4'
    }
    const previewFileNoRefSpace = {
      name: 'bla bla 4',
      datasetId: 'foo4',
      filename: 'bar4'
    }
    const fittingMockPreviewFile = {
      name: 'bla bla2',
      datasetId: 'foo2',
      filename: 'bar2',
      referenceSpaces: [{
        fullId: 'bar'
      }]
    }
    const mockPreviewFile = {
      name: 'bla bla',
      datasetId: 'foo',
      filename: 'bar',
      referenceSpaces: [{
        fullId: 'hello world'
      }]
    }

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

    const mockGetDatasetPreviewFromId = jasmine.createSpy('getDatasetPreviewFromId')

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          GlueEffects,
          provideMockStore({
            initialState: defaultState
          }),
          {
            provide: GET_KGDS_PREVIEW_INFO_FROM_ID_FILENAME,
            useValue: mockGetDatasetPreviewFromId
          }
        ]
      })
      mockGetDatasetPreviewFromId.withArgs(mockPreviewFileIds2).and.returnValue(
        hot('(a|)', {
          a: fittingMockPreviewFile
        })
      )
      mockGetDatasetPreviewFromId.withArgs({ datasetId: 'foo', filename: 'bar' }).and.returnValue(
        hot('(a|)', {
          a: mockPreviewFile
        })
      )
      mockGetDatasetPreviewFromId.withArgs(mockPreviewFileIds3).and.returnValue(
        hot('(a|)', {
          a: null
        })
      )
      mockGetDatasetPreviewFromId.withArgs(mockPreviewFileIds4).and.returnValue(
        hot('(a|)', {
          a: previewFileNoRefSpace
        })
      )
    })

    afterEach(() => {
      mockGetDatasetPreviewFromId.calls.reset()
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
    
  
    describe('> unsuitablePreviews$', () => {

      it('> calls injected getDatasetPreviewFromId', () => {
        const mockStore = TestBed.inject(MockStore)
        mockStore.overrideSelector(viewerStateSelectedTemplateSelector, mockTemplate)
        mockStore.overrideSelector(uiStatePreviewingDatasetFilesSelector, [mockPreviewFileIds2])

        const glueEffects = TestBed.inject(GlueEffects)
        expect(glueEffects.unsuitablePreviews$).toBeObservable(
          hot('')
        )
        /**
         * calling twice, once to check if the dataset preview can be retrieved, the other to check the referenceSpace
         */
        expect(mockGetDatasetPreviewFromId).toHaveBeenCalledTimes(2)
        expect(mockGetDatasetPreviewFromId).toHaveBeenCalledWith(mockPreviewFileIds2)
      })

      it('> if getDatasetPreviewFromId throws in event stream, handles gracefully', () => {
        const mockStore = TestBed.inject(MockStore)
        mockStore.overrideSelector(viewerStateSelectedTemplateSelector, mockTemplate)
        mockStore.overrideSelector(uiStatePreviewingDatasetFilesSelector, [mockPreviewFileIds3])

        const glueEffects = TestBed.inject(GlueEffects)
        
        expect(glueEffects.unsuitablePreviews$).toBeObservable(
          hot('a', {
            a: [ mockPreviewFileIds3 ]
          })
        )
      })

      describe('> filtering out dataset previews that do not satisfy reference space requirements', () => {
        it('> if reference spaces does not match the selected reference template, will emit', () => {
          const mockStore = TestBed.inject(MockStore)

          mockStore.overrideSelector(viewerStateSelectedTemplateSelector, mockTemplate)
          mockStore.overrideSelector(uiStatePreviewingDatasetFilesSelector, [mockPreviewFileIds])
          const glueEffects = TestBed.inject(GlueEffects)
          expect(glueEffects.unsuitablePreviews$).toBeObservable(
            hot('a', {
              a: [ mockPreviewFile ]
            })
          )
        })
      })

      describe('> keeping dataset previews that satisfy reference space criteria', () => {
        it('> if ref space is undefined, keep preview', () => {

          const mockStore = TestBed.inject(MockStore)
          mockStore.overrideSelector(viewerStateSelectedTemplateSelector, mockTemplate)
          mockStore.overrideSelector(uiStatePreviewingDatasetFilesSelector, [mockPreviewFileIds4])
          const glueEffects = TestBed.inject(GlueEffects)
          expect(glueEffects.unsuitablePreviews$).toBeObservable(
            hot('')
          )
        })

        it('> if ref space is defined, and matches, keep preview', () => {

          const mockStore = TestBed.inject(MockStore)
          mockStore.overrideSelector(viewerStateSelectedTemplateSelector, mockTemplate)
          mockStore.overrideSelector(uiStatePreviewingDatasetFilesSelector, [mockPreviewFileIds2])
          const glueEffects = TestBed.inject(GlueEffects)
          expect(glueEffects.unsuitablePreviews$).toBeObservable(
            hot('')
          )
        })
      })  
    
    })

    describe('> uiRemoveUnsuitablePreviews$', () => {
      it('> emits whenever unsuitablePreviews$ emits', () => {
        const mockStore = TestBed.inject(MockStore)
        mockStore.overrideSelector(viewerStateSelectedTemplateSelector, mockTemplate)
        mockStore.overrideSelector(uiStatePreviewingDatasetFilesSelector, [mockPreviewFileIds])
        const glueEffects = TestBed.inject(GlueEffects)
        expect(glueEffects.uiRemoveUnsuitablePreviews$).toBeObservable(
          hot('a', {
            a: generalActionError({
              message: `Dataset previews ${mockPreviewFile.name} cannot be displayed.`
            })
          })
        )
      })
    })
    
    describe('> filterDatasetPreviewByTemplateSelected$', () => {

      it('> remove 1 preview datasetfile depending on unsuitablepreview$', () => {
        const mockStore = TestBed.inject(MockStore)

        mockStore.overrideSelector(viewerStateSelectedTemplateSelector, mockTemplate)
        mockStore.overrideSelector(uiStatePreviewingDatasetFilesSelector, [mockPreviewFileIds])
        const glueEffects = TestBed.inject(GlueEffects)
        expect(glueEffects.filterDatasetPreviewByTemplateSelected$).toBeObservable(
          hot('a', {
            a: uiActionSetPreviewingDatasetFiles({
              previewingDatasetFiles: [  ]
            })
          })
        )

      })
      it('> remove 1 preview datasetfile (get preview info fail) depending on unsuitablepreview$', () => {
        const mockStore = TestBed.inject(MockStore)

        mockStore.overrideSelector(viewerStateSelectedTemplateSelector, mockTemplate)
        mockStore.overrideSelector(uiStatePreviewingDatasetFilesSelector, [mockPreviewFileIds3])
        const glueEffects = TestBed.inject(GlueEffects)
        expect(glueEffects.filterDatasetPreviewByTemplateSelected$).toBeObservable(
          hot('a', {
            a: uiActionSetPreviewingDatasetFiles({
              previewingDatasetFiles: [  ]
            })
          })
        )

      })
      it('> remove 2 preview datasetfile depending on unsuitablepreview$', () => {
        const mockStore = TestBed.inject(MockStore)

        mockStore.overrideSelector(viewerStateSelectedTemplateSelector, mockTemplate)
        mockStore.overrideSelector(uiStatePreviewingDatasetFilesSelector, [mockPreviewFileIds, mockPreviewFileIds2, mockPreviewFileIds4])
        const glueEffects = TestBed.inject(GlueEffects)
        expect(glueEffects.filterDatasetPreviewByTemplateSelected$).toBeObservable(
          hot('a', {
            a: uiActionSetPreviewingDatasetFiles({
              previewingDatasetFiles: [ mockPreviewFileIds2, mockPreviewFileIds4 ]
            })
          })
        )

      })
      
    })

  })

  describe('> ClickInterceptorService', () => {
    /**
     * TODO finish writing the test for ClickInterceptorService
     */
    let interceptorService: ClickInterceptorService

    beforeEach(() => {
      interceptorService = new ClickInterceptorService()
    })

    describe('> #addInterceptor', () => {
      it('> adds interceptor fn', () => {
        const fn = (ev: any, next: Function) => {}
        interceptorService.addInterceptor(fn)
        expect(interceptorService['clickInterceptorStack'].indexOf(fn)).toBeGreaterThanOrEqual(0)
      })
      it('> when config not supplied, or last not present, will add fn to the first of the queue', () => {

        const dummy = (ev: any, next: Function) => {}
        interceptorService.addInterceptor(dummy)
        
        const fn = (ev: any, next: Function) => {}
        interceptorService.addInterceptor(fn)
        expect(interceptorService['clickInterceptorStack'].indexOf(fn)).toEqual(0)

        const fn2 = (ev: any, next: Function) => {}
        interceptorService.addInterceptor(fn2, {})
        expect(interceptorService['clickInterceptorStack'].indexOf(fn)).toEqual(1)
        expect(interceptorService['clickInterceptorStack'].indexOf(fn2)).toEqual(0)
      })
      it('> when last is supplied as a config param, will add the fn at the end', () => {

        const dummy = (ev: any, next: Function) => {}
        interceptorService.addInterceptor(dummy)

        const fn = (ev: any, next: Function) => {}
        interceptorService.addInterceptor(fn, { last: true })
        expect(interceptorService['clickInterceptorStack'].indexOf(fn)).toEqual(1)

      })
    })

    describe('> deregister', () => {
      it('> if the fn exist in the register, it will be removed', () => {

        const fn = (ev: any, next: Function) => {}
        const fn2 = (ev: any, next: Function) => {}
        interceptorService.addInterceptor(fn)
        expect(interceptorService['clickInterceptorStack'].indexOf(fn)).toBeGreaterThanOrEqual(0)
        expect(interceptorService['clickInterceptorStack'].length).toEqual(1)

        interceptorService.removeInterceptor(fn)
        expect(interceptorService['clickInterceptorStack'].indexOf(fn)).toBeLessThan(0)
        expect(interceptorService['clickInterceptorStack'].length).toEqual(0)
      })

      it('> if fn does not exist in register, it will not be removed', () => {
        
        const fn = (ev: any, next: Function) => {}
        const fn2 = (ev: any, next: Function) => {}
        interceptorService.addInterceptor(fn)
        expect(interceptorService['clickInterceptorStack'].indexOf(fn)).toBeGreaterThanOrEqual(0)
        expect(interceptorService['clickInterceptorStack'].length).toEqual(1)

        interceptorService.removeInterceptor(fn2)
        expect(interceptorService['clickInterceptorStack'].indexOf(fn)).toBeGreaterThanOrEqual(0)
        expect(interceptorService['clickInterceptorStack'].length).toEqual(1)
      })
    })

    describe('> # run', () => {
      it('> will run fns from first idx to last idx', () => {
        const callNext = (ev: any, next: Function) => next()
        const fn = jasmine.createSpy().and.callFake(callNext)
        const fn2 = jasmine.createSpy().and.callFake(callNext)

        interceptorService.addInterceptor(fn)
        interceptorService.addInterceptor(fn2)
        interceptorService.run({})

        expect(fn2).toHaveBeenCalledBefore(fn)
      })
      it('> will stop at when next is not called', () => {

        const callNext = (ev: any, next: Function) => next()
        const halt = (ev: any, next: Function) => {}
        const fn = jasmine.createSpy().and.callFake(callNext)
        const fn2 = jasmine.createSpy().and.callFake(halt)
        const fn3 = jasmine.createSpy().and.callFake(callNext)

        interceptorService.addInterceptor(fn)
        interceptorService.addInterceptor(fn2)
        interceptorService.addInterceptor(fn3)
        interceptorService.run({})

        expect(fn3).toHaveBeenCalled()
        expect(fn2).toHaveBeenCalled()
        expect(fn).not.toHaveBeenCalled()
      })
    })
  })
})
