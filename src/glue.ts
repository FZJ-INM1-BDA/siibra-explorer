import { uiActionSetPreviewingDatasetFiles, IDatasetPreviewData, uiStateShowBottomSheet, uiStatePreviewingDatasetFilesSelector } from "./services/state/uiState.store.helper"
import { OnDestroy, Injectable, Optional, Inject, InjectionToken } from "@angular/core"
import { PreviewComponentWrapper, DatasetPreview, determinePreviewFileType, EnumPreviewFileTypes, IKgDataEntry, getKgSchemaIdFromFullId, GET_KGDS_PREVIEW_INFO_FROM_ID_FILENAME } from "./ui/databrowserModule/pure"
import { Subscription, Observable, forkJoin, of, merge, combineLatest } from "rxjs"
import { select, Store, ActionReducer, createAction, props, createSelector, Action } from "@ngrx/store"
import { startWith, map, shareReplay, pairwise, debounceTime, distinctUntilChanged, tap, switchMap, withLatestFrom, mapTo, switchMapTo, filter, skip, catchError, bufferTime } from "rxjs/operators"
import { TypeActionToWidget, EnumActionToWidget, ACTION_TO_WIDGET_TOKEN } from "./widget"
import { getIdObj } from 'common/util'
import { MatDialogRef } from "@angular/material/dialog"
import { HttpClient } from "@angular/common/http"
import { DS_PREVIEW_URL, getShader, PMAP_DEFAULT_CONFIG } from 'src/util/constants'
import { ngViewerActionAddNgLayer, ngViewerActionRemoveNgLayer, INgLayerInterface } from "./services/state/ngViewerState.store.helper"
import { ARIA_LABELS } from 'common/constants'
import { NgLayersService } from "src/ui/layerbrowser/ngLayerService.service"
import { EnumColorMapName } from "./util/colorMaps"
import { Effect } from "@ngrx/effects"
import { viewerStateSelectedRegionsSelector, viewerStateSelectedTemplateSelector, viewerStateSelectedParcellationSelector } from "./services/state/viewerState/selectors"
import { ngViewerSelectorClearView } from "./services/state/ngViewerState/selectors"
import { ngViewerActionClearView } from './services/state/ngViewerState/actions'
import { generalActionError } from "./services/stateStore.helper"

const PREVIEW_FILE_TYPES_NO_UI = [
  EnumPreviewFileTypes.NIFTI,
  EnumPreviewFileTypes.VOLUMES
]

const DATASET_PREVIEW_ANNOTATION = `DATASET_PREVIEW_ANNOTATION`

const prvFilterNull = ({ prvToDismiss, prvToShow }) => ({
  prvToDismiss: prvToDismiss.filter(v => !!v),
  prvToShow: prvToShow.filter(v => !!v),
})

export const glueActionToggleDatasetPreview = createAction(
  '[glue] toggleDatasetPreview',
  props<{ datasetPreviewFile: IDatasetPreviewData }>()
)

export const glueActionAddDatasetPreview = createAction(
  '[glue] addDatasetPreview',
  props<{ datasetPreviewFile: IDatasetPreviewData }>()
)

export const glueActionRemoveDatasetPreview = createAction(
  '[glue] removeDatasetPreview',
  props<{ datasetPreviewFile: IDatasetPreviewData }>()
)

export const glueSelectorGetUiStatePreviewingFiles = createSelector(
  (state: any) => state.uiState,
  uiState => uiState.previewingDatasetFiles
)

export interface IDatasetPreviewGlue{
  datasetPreviewDisplayed(file: DatasetPreview, dataset: IKgDataEntry): Observable<boolean>
  displayDatasetPreview(previewFile: DatasetPreview, dataset: IKgDataEntry): void
}

@Injectable({
  providedIn: 'root'
})

export class GlueEffects {
  
  public regionTemplateParcChange$ = merge(
    this.store$.pipe(
      select(viewerStateSelectedRegionsSelector),
      map(rs => (rs || []).map(r => r['name']).sort().join(',')),
      distinctUntilChanged(),
      skip(1),
    ),
    this.store$.pipe(
      select(viewerStateSelectedTemplateSelector),
      map(tmpl => tmpl
        ? tmpl['@id'] || tmpl['name']
        : null),
      distinctUntilChanged(),
      skip(1)
    ),
    this.store$.pipe(
      select(viewerStateSelectedParcellationSelector),
      map(parc => parc
        ? parc['@id'] || parc['name']
        : null),
      distinctUntilChanged(),
      skip(1)
    )
  ).pipe(
    mapTo(true)
  )

  @Effect()
  resetDatasetPreview$: Observable<any> = this.store$.pipe(
    select(uiStatePreviewingDatasetFilesSelector),
    distinctUntilChanged(),
    filter(previews => previews?.length > 0),
    switchMapTo(this.regionTemplateParcChange$)
  ).pipe(
    mapTo(uiActionSetPreviewingDatasetFiles({
      previewingDatasetFiles: []
    }))
  )

  unsuitablePreviews$: Observable<any> = merge(
    /**
     * filter out the dataset previews, whose details cannot be fetchd from getdatasetPreviewFromId method
     */

    this.store$.pipe(
      select(uiStatePreviewingDatasetFilesSelector),
      switchMap(previews => 
        forkJoin(
          previews.map(prev => this.getDatasetPreviewFromId(prev).pipe(
            // filter out the null's 
            filter(val => !val),
            mapTo(prev)
          ))
        ).pipe(
          filter(previewFiles => previewFiles.length > 0)
        )
      )
    ),
    /**
     * filter out the dataset previews, whose details can be fetched from getDatasetPreviewFromId method
     */
    combineLatest([
      this.store$.pipe(
        select(viewerStateSelectedTemplateSelector)
      ),
      this.store$.pipe(
        select(uiStatePreviewingDatasetFilesSelector),
        switchMap(previews => 
          forkJoin(
            previews.map(prev => this.getDatasetPreviewFromId(prev).pipe(
              filter(val => !!val)
            ))
          ).pipe(
            // filter out the null's 
            filter(previewFiles => previewFiles.length > 0)
          )
        ),
      )
    ]).pipe(
      map(([ templateSelected, previewFiles ]) => 
        previewFiles.filter(({ referenceSpaces }) => 
          // if referenceSpaces of the dataset preview is undefined, assume it is suitable for all reference spaces
          (!referenceSpaces)
            ? false
            : !referenceSpaces.some(({ fullId }) => fullId === '*' || fullId === templateSelected.fullId)
        )
      ),
    ) 
  ).pipe(
    filter(arr => arr.length > 0),
    shareReplay(1),
  )

  @Effect()
  uiRemoveUnsuitablePreviews$: Observable<any> = this.unsuitablePreviews$.pipe(
    map(previews => generalActionError({
      message: `Dataset previews ${previews.map(v => v.name)} cannot be displayed.`
    }))
  )

  @Effect()
  filterDatasetPreviewByTemplateSelected$: Observable<any> = this.unsuitablePreviews$.pipe(
    withLatestFrom(
      this.store$.pipe(
        select(uiStatePreviewingDatasetFilesSelector),
      )
    ),
    map(([ unsuitablePreviews, previewFiles ]) => uiActionSetPreviewingDatasetFiles({
      previewingDatasetFiles: previewFiles.filter(
        ({ datasetId: dsId, filename: fName }) => !unsuitablePreviews.some(
          ({ datasetId, filename }) => datasetId === dsId && fName === filename
        )
      )
    }))
  )

  @Effect()
  resetConnectivityMode: Observable<any> = this.store$.pipe(
    select(viewerStateSelectedRegionsSelector),
    pairwise(),
    filter(([o, n]) => o.length > 0 && n.length === 0),
    mapTo(
      ngViewerActionClearView({
        payload: {
          'Connectivity': false
        }
      })
    )
  )

  constructor(
    private store$: Store<any>,
    @Inject(GET_KGDS_PREVIEW_INFO_FROM_ID_FILENAME) private getDatasetPreviewFromId: (arg) => Observable<any|null>
  ){
  }
}

@Injectable({
  providedIn: 'root'
})

export class DatasetPreviewGlue implements IDatasetPreviewGlue, OnDestroy{
  
  static readonly DEFAULT_DIALOG_OPTION = {
    ariaLabel: ARIA_LABELS.DATASET_FILE_PREVIEW,
    hasBackdrop: false,
    disableClose: true,
    autoFocus: false,
    panelClass: 'mat-card-sm',
    height: '50vh',
    width: '350px',
    position: {
      left: '5px'
    },
  }

  static GetDatasetPreviewId(data: IDatasetPreviewData ){
    const { datasetSchema = 'minds/core/dataset/v1.0.0', datasetId, filename } = data
    return `${datasetSchema}/${datasetId}:${filename}`
  }

  static GetDatasetPreviewFromId(id: string): IDatasetPreviewData{
    const re = /([a-f0-9-]+):(.+)$/.exec(id)
    if (!re) throw new Error(`id cannot be decoded: ${id}`)
    return { datasetId: re[1], filename: re[2] }
  }

  static PreviewFileIsInCorrectSpace(previewFile, templateSelected): boolean{

    const re = getKgSchemaIdFromFullId(
      (templateSelected && templateSelected.fullId) || ''
    )
    const templateId = re && re[0] && `${re[0]}/${re[1]}`
    const { referenceSpaces } = previewFile
    return referenceSpaces.findIndex(({ fullId }) => fullId === '*' || fullId === templateId) >= 0
  }

  private subscriptions: Subscription[] = []
  private openedPreviewMap = new Map<string, {id: string, matDialogRef: MatDialogRef<any>}>()

  private previewingDatasetFiles$: Observable<IDatasetPreviewData[]> = this.store$.pipe(
    select(glueSelectorGetUiStatePreviewingFiles),
    startWith([]),
    shareReplay(1),
  )

  private diffPreviewingDatasetFiles$= this.previewingDatasetFiles$.pipe(
    debounceTime(100),
    startWith([] as IDatasetPreviewData[]),
    pairwise(),
    map(([ oldPreviewWidgets, newPreviewWidgets ]) => {
      const oldPrvWgtIdSet = new Set(oldPreviewWidgets.map(DatasetPreviewGlue.GetDatasetPreviewId))
      const newPrvWgtIdSet = new Set(newPreviewWidgets.map(DatasetPreviewGlue.GetDatasetPreviewId))
      
      const prvToShow = newPreviewWidgets.filter(obj => !oldPrvWgtIdSet.has(DatasetPreviewGlue.GetDatasetPreviewId(obj)))
      const prvToDismiss = oldPreviewWidgets.filter(obj => !newPrvWgtIdSet.has(DatasetPreviewGlue.GetDatasetPreviewId(obj)))

      return { prvToShow, prvToDismiss }
    }),
  )

  ngOnDestroy(){
    while(this.subscriptions.length > 0){
      this.subscriptions.pop().unsubscribe()
    }
  }

  private sharedDiffObs$ = this.diffPreviewingDatasetFiles$.pipe(
    switchMap(({ prvToShow, prvToDismiss }) => {
      return forkJoin({
        prvToShow: prvToShow.length > 0 
          ? forkJoin(prvToShow.map(val => this.getDatasetPreviewFromId(val)))
          : of([]),
        prvToDismiss: prvToDismiss.length > 0 
          ? forkJoin(prvToDismiss.map(val => this.getDatasetPreviewFromId(val)))
          : of([])
      })
    }),
    map(prvFilterNull),
    shareReplay(1)
  )

  private getDiffDatasetFilesPreviews(filterFn: (prv: any) => boolean = () => true): Observable<{prvToShow: any[], prvToDismiss: any[]}>{
    return this.sharedDiffObs$.pipe(
      map(({ prvToDismiss, prvToShow }) => {
        return {
          prvToShow: prvToShow.filter(filterFn),
          prvToDismiss: prvToDismiss.filter(filterFn),
        }
      })
    )
  }

  public selectedRegionPreview$ = this.store$.pipe(
    select(state => state?.viewerState?.regionsSelected),
    filter(regions => !!regions),
    map(regions => /** effectively flatMap */ regions.reduce((acc, curr) => acc.concat(
      curr.originDatasets && Array.isArray(curr.originDatasets) && curr.originDatasets.length > 0
        ? curr.originDatasets
        : []
    ), [])),
  )

  public onRegionSelectChangeShowPreview$ = this.selectedRegionPreview$.pipe(
    switchMap(arr => arr.length > 0
      ? forkJoin(arr.map(({ kgId, kgSchema, filename }) => this.getDatasetPreviewFromId({ datasetId: kgId, datasetSchema: kgSchema, filename })))
      : of([])
    ),
    map(arr => arr.filter(item => !!item)),
    shareReplay(1),
  )

  public onRegionDeselectRemovePreview$ = this.onRegionSelectChangeShowPreview$.pipe(
    pairwise(),
    map(([oArr, nArr]) => oArr.filter((item: any) => {
      return !nArr
        .map(DatasetPreviewGlue.GetDatasetPreviewId)
        .includes(
          DatasetPreviewGlue.GetDatasetPreviewId(item)
        )
    })),
  )

  public onClearviewRemovePreview$ = this.onRegionSelectChangeShowPreview$.pipe(
    filter(arr => arr.length > 0),
    switchMap(arr => this.store$.pipe(
      select(ngViewerSelectorClearView),
      distinctUntilChanged(),
      filter(val => val),
      mapTo(arr)
    )),
  )

  public onClearviewAddPreview$ = this.onRegionSelectChangeShowPreview$.pipe(
    filter(arr => arr.length > 0),
    switchMap(arr => this.store$.pipe(
      select(ngViewerSelectorClearView),
      distinctUntilChanged(),
      filter(val => !val),
      skip(1),
      mapTo(arr)
    ))
  )

  private fetchedDatasetPreviewCache: Map<string, Observable<any>> = new Map()
  public getDatasetPreviewFromId({ datasetSchema = 'minds/core/dataset/v1.0.0', datasetId, filename }: IDatasetPreviewData){
    const dsPrvId = DatasetPreviewGlue.GetDatasetPreviewId({ datasetSchema, datasetId, filename })
    const cachedPrv$ = this.fetchedDatasetPreviewCache.get(dsPrvId)
    const filteredDsId = /[a-f0-9-]+$/.exec(datasetId)
    if (cachedPrv$) return cachedPrv$
    const url = `${DS_PREVIEW_URL}/${encodeURIComponent(datasetSchema)}/${filteredDsId}/${encodeURIComponent(filename)}`
    const filedetail$ = this.http.get(url, { responseType: 'json' }).pipe(
      map(json => {
        return {
          ...json,
          filename,
          datasetId,
          datasetSchema
        }
      }),
      catchError((_err, _obs) => of(null))
    )
    this.fetchedDatasetPreviewCache.set(dsPrvId, filedetail$)
    return filedetail$.pipe(
      tap(val => this.fetchedDatasetPreviewCache.set(dsPrvId, of(val)))
    )
  }

  constructor(
    private store$: Store<any>,
    private http: HttpClient,
    private layersService: NgLayersService,
    @Optional() @Inject(ACTION_TO_WIDGET_TOKEN) private actionOnWidget: TypeActionToWidget<any>
  ){
    if (!this.actionOnWidget) console.warn(`actionOnWidget not provided in DatasetPreviewGlue. Did you forget to provide it?`)
    
    // managing dataset files preview requiring an UI
    this.subscriptions.push(
      this.getDiffDatasetFilesPreviews(
        dsPrv => !PREVIEW_FILE_TYPES_NO_UI.includes(determinePreviewFileType(dsPrv))
      ).subscribe(({ prvToDismiss: prvWgtToDismiss, prvToShow: prvWgtToShow }) => {
        for (const obj of prvWgtToShow) {
          this.openDatasetPreviewWidget(obj)
        }
        for (const obj of prvWgtToDismiss) {
          this.closeDatasetPreviewWidget(obj)
        }
      })
    )


    // managing dataset previews without UI

    // managing registeredVolumes
    this.subscriptions.push(
      this.getDiffDatasetFilesPreviews(
        dsPrv => determinePreviewFileType(dsPrv) === EnumPreviewFileTypes.VOLUMES
      ).pipe(
        withLatestFrom(this.store$.pipe(
          select(state => state?.viewerState?.templateSelected || null),
          distinctUntilChanged(),
        ))
      ).subscribe(([ { prvToShow, prvToDismiss }, templateSelected ]) => {

        const filterdPrvs = prvToShow.filter(prv => DatasetPreviewGlue.PreviewFileIsInCorrectSpace(prv, templateSelected))
        for (const prv of filterdPrvs) {
          const { volumes } = prv['data']['iav-registered-volumes']
          this.store$.dispatch(ngViewerActionAddNgLayer({
            layer: volumes
          }))
        }

        for (const prv of prvToDismiss) {
          const { volumes } = prv['data']['iav-registered-volumes']
          this.store$.dispatch(ngViewerActionRemoveNgLayer({
            layer: volumes
          }))
        }
      })
    )

    // managing niftiVolumes
    // monitors previewDatasetFile obs to add/remove ng layer

    this.subscriptions.push(
      merge(
        this.getDiffDatasetFilesPreviews(
          dsPrv => determinePreviewFileType(dsPrv) === EnumPreviewFileTypes.NIFTI
        ),
        this.onRegionSelectChangeShowPreview$.pipe(
          map(prvToShow => ({ prvToShow, prvToDismiss: [] }))
        ),
        this.onRegionDeselectRemovePreview$.pipe(
          map(prvToDismiss => ({ prvToShow: [], prvToDismiss }))
        ),
        this.onClearviewRemovePreview$.pipe(
          map(prvToDismiss => ({ prvToDismiss, prvToShow: [] }))
        ),
        this.onClearviewAddPreview$.pipe(
          map(prvToShow => ({ prvToDismiss: [], prvToShow }))
        )
      ).pipe(
        map(prvFilterNull),
        bufferTime(15),
        map(arr => {
          const prvToDismiss = []
          const prvToShow = []

          const showPrvIds = new Set()
          const dismissPrvIds = new Set()

          for (const { prvToDismiss: dismisses, prvToShow: shows } of arr) {
            for (const dismiss of dismisses) {

              const id = DatasetPreviewGlue.GetDatasetPreviewId(dismiss)
              if (!dismissPrvIds.has(id)) {
                dismissPrvIds.add(id)
                prvToDismiss.push(dismiss)
              }
            }

            for (const show of shows) {
              const id = DatasetPreviewGlue.GetDatasetPreviewId(show)
              if (!dismissPrvIds.has(id) && !showPrvIds.has(id)) {
                showPrvIds.add(id)
                prvToShow.push(show)
              }
            }
          }

          return {
            prvToDismiss,
            prvToShow
          }
        }),
        withLatestFrom(this.store$.pipe(
          select(state => state?.viewerState?.templateSelected || null),
          distinctUntilChanged(),
        ))
      ).subscribe(([ { prvToShow, prvToDismiss }, templateSelected ]) => {
        // TODO consider where to check validity of previewed nifti file
        for (const prv of prvToShow) {

          const { url, filename, name, volumeMetadata = {} } = prv
          const { min, max, colormap = EnumColorMapName.VIRIDIS } = volumeMetadata || {}
          
          const previewFileId = DatasetPreviewGlue.GetDatasetPreviewId(prv)

          const shaderObj = {
            ...PMAP_DEFAULT_CONFIG,
            ...{ colormap },
            ...( typeof min !== 'undefined' ? { lowThreshold: min } : {} ),
            ...( max ? { highThreshold: max } : { highThreshold: 1 } )
          }

          const layer = {
            // name: filename,
            name: name || filename,
            id: previewFileId,
            source : `nifti://${url}`,
            mixability : 'nonmixable',
            shader : getShader(shaderObj),
            annotation: `${DATASET_PREVIEW_ANNOTATION} ${filename}`
          }

          const { name: layerName } = layer
          const { colormap: cmap, lowThreshold, highThreshold, removeBg } = shaderObj

          this.layersService.highThresholdMap.set(layerName, highThreshold)
          this.layersService.lowThresholdMap.set(layerName, lowThreshold)
          this.layersService.colorMapMap.set(layerName, cmap)
          this.layersService.removeBgMap.set(layerName, removeBg)

          this.store$.dispatch(
            ngViewerActionAddNgLayer({ layer })
          )
        }

        for (const prv of prvToDismiss) {
          const { url, filename, name } = prv
          const previewFileId = DatasetPreviewGlue.GetDatasetPreviewId(prv)
          const layer = {
            name: name || filename,
            id: previewFileId,
            source : `nifti://${url}`,
            mixability : 'nonmixable',
            shader : getShader(PMAP_DEFAULT_CONFIG),
            annotation: `${DATASET_PREVIEW_ANNOTATION} ${filename}`
          }
          this.store$.dispatch(
            ngViewerActionRemoveNgLayer({ layer })
          )
        }

        if (prvToShow.length > 0) this.store$.dispatch(uiStateShowBottomSheet({ bottomSheetTemplate: null }))
      })
    )

    // monitors ngViewerStateLayers, and if user removes, also remove dataset preview, if exists
    this.subscriptions.push(
      this.store$.pipe(
        select(state => state?.ngViewerState?.layers || []),
        distinctUntilChanged(),
        pairwise(),
        map(([o, n]: [INgLayerInterface[], INgLayerInterface[]]) => {
          const nNameSet = new Set(n.map(({ name }) => name))
          const oNameSet = new Set(o.map(({ name }) => name))
          return {
            add: n.filter(({ name: nName }) => !oNameSet.has(nName)),
            remove: o.filter(({ name: oName }) => !nNameSet.has(oName)),
          }
        }),
        map(({ remove }) => remove),
      ).subscribe(layers => {
        for (const layer of layers) {
          const { id } = layer
          if (!id) return console.warn(`monitoring ngViewerStateLayers id is undefined`)
          try {
            const { datasetId, filename } = DatasetPreviewGlue.GetDatasetPreviewFromId(layer.id)
            this.store$.dispatch(
              glueActionRemoveDatasetPreview({ datasetPreviewFile: { filename, datasetId } })
            )
          } catch (e) {
            console.warn(`monitoring ngViewerStateLayers parsing id or dispatching action failed`, e)
          }
        }
      })
    )
  }

  private closeDatasetPreviewWidget(data: IDatasetPreviewData){
    const previewId = DatasetPreviewGlue.GetDatasetPreviewId(data)
    const { id:widgetId } = this.openedPreviewMap.get(previewId)
    if (!widgetId) return
    try {
      this.actionOnWidget(
        EnumActionToWidget.CLOSE,
        null,
        { id: widgetId }
      )
    } catch (e) {
      // It is possible that widget is already closed by the time that the state is reflected
      // This happens when user closes the dialog
    }
    this.openedPreviewMap.delete(previewId)
  }

  private openDatasetPreviewWidget(data: IDatasetPreviewData) {
    console.log({ data })
    const { datasetId: kgId, filename } = data

    if (!!this.actionOnWidget) {
      const previewId = DatasetPreviewGlue.GetDatasetPreviewId(data)

      const onClose = () => {
        this.store$.dispatch(
          glueActionRemoveDatasetPreview({ datasetPreviewFile: data })
        )
      }

      const allPreviewCWs = Array.from(this.openedPreviewMap).map(([key, { matDialogRef }]) => matDialogRef.componentInstance as PreviewComponentWrapper)
      let newUntouchedIndex = 0
      while(allPreviewCWs.findIndex(({ touched, untouchedIndex }) => !touched && untouchedIndex === newUntouchedIndex) >= 0){
        newUntouchedIndex += 1
      }

      const { id:widgetId, matDialogRef } = this.actionOnWidget(
        EnumActionToWidget.OPEN,
        PreviewComponentWrapper,
        {
          data: { filename, kgId },
          onClose,
          overrideMatDialogConfig: {
            ...DatasetPreviewGlue.DEFAULT_DIALOG_OPTION,
            position: {
              left: `${5 + (30 * newUntouchedIndex)}px`
            }
          }
        }
      )

      const previewWrapper = (matDialogRef.componentInstance as PreviewComponentWrapper)
      previewWrapper.untouchedIndex = newUntouchedIndex

      this.openedPreviewMap.set(previewId, {id: widgetId, matDialogRef})
    }
  }
  
  public datasetPreviewDisplayed(file: DatasetPreview, dataset?: IKgDataEntry){
    return this.previewingDatasetFiles$.pipe(
      map(datasetPreviews => {
        const { filename, datasetId } = file
        const { fullId } = dataset || {}
        const { kgId } = getIdObj(fullId) || {}

        return datasetPreviews.findIndex(({ datasetId: dsId, filename: fName }) => {
          return (datasetId || kgId) === dsId && fName === filename
        }) >= 0
      })
    )
  }

  public displayDatasetPreview(previewFile: DatasetPreview, dataset: IKgDataEntry){
    const { filename, datasetId } = previewFile
    const { fullId } = dataset
    const { kgId, kgSchema } = getIdObj(fullId)

    const datasetPreviewFile = {
      datasetSchema: kgSchema,
      datasetId: datasetId || kgId,
      filename
    }

    this.store$.dispatch(glueActionToggleDatasetPreview({ datasetPreviewFile }))
  }
}

export function datasetPreviewMetaReducer(reducer: ActionReducer<any>): ActionReducer<any>{
  return function (state, action) {
    switch(action.type) {
    case glueActionToggleDatasetPreview.type: {

      const previewingDatasetFiles = (state?.uiState?.previewingDatasetFiles || []) as IDatasetPreviewData[]
      const ids = new Set(previewingDatasetFiles.map(DatasetPreviewGlue.GetDatasetPreviewId))
      const { datasetPreviewFile } = action as Action & { datasetPreviewFile: IDatasetPreviewData }
      const newId = DatasetPreviewGlue.GetDatasetPreviewId(datasetPreviewFile)
      if (ids.has(newId)) {
        const removeId = DatasetPreviewGlue.GetDatasetPreviewId(datasetPreviewFile)
        const filteredOpenedWidgets = previewingDatasetFiles.filter(obj => {
          const id = DatasetPreviewGlue.GetDatasetPreviewId(obj)
          return id !== removeId
        })
        return reducer(state, uiActionSetPreviewingDatasetFiles({ previewingDatasetFiles: filteredOpenedWidgets }))
      } else {
        return reducer(state, uiActionSetPreviewingDatasetFiles({ previewingDatasetFiles: [ ...previewingDatasetFiles, datasetPreviewFile ] }))
      }
    }
    case glueActionAddDatasetPreview.type: {
      const previewingDatasetFiles = (state?.uiState?.previewingDatasetFiles || []) as IDatasetPreviewData[]
      const { datasetPreviewFile } = action as Action & { datasetPreviewFile: IDatasetPreviewData }
      return reducer(state, uiActionSetPreviewingDatasetFiles({ previewingDatasetFiles: [ ...previewingDatasetFiles, datasetPreviewFile] }))
    }
    case glueActionRemoveDatasetPreview.type: {
      const previewingDatasetFiles = (state?.uiState?.previewingDatasetFiles || []) as IDatasetPreviewData[]
      const { datasetPreviewFile } = action as any

      const removeId = DatasetPreviewGlue.GetDatasetPreviewId(datasetPreviewFile)
      const filteredOpenedWidgets = previewingDatasetFiles.filter(obj => {
        const id = DatasetPreviewGlue.GetDatasetPreviewId(obj)
        return id !== removeId
      })
      return reducer(state, uiActionSetPreviewingDatasetFiles({ previewingDatasetFiles: filteredOpenedWidgets }))
    }
    default: return reducer(state, action)
    }
  }
}

export const SAVE_USER_DATA = new InjectionToken<TypeSaveUserData>('SAVE_USER_DATA')

type TypeSaveUserData = (key: string, value: string) => void

export const gluActionFavDataset = createAction(
  '[glue] favDataset',
  props<{dataentry: Partial<IKgDataEntry>}>()
)
export const gluActionUnfavDataset = createAction(
  '[glue] favDataset',
  props<{dataentry: Partial<IKgDataEntry>}>()
)
export const gluActionToggleDataset = createAction(
  '[glue] favDataset',
  props<{dataentry: Partial<IKgDataEntry>}>()
)
export const gluActionSetFavDataset = createAction(
  '[glue] favDataset',
  props<{dataentries: Partial<IKgDataEntry>[]}>()
)
