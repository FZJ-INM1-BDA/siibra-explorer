import { uiActionSetPreviewingDatasetFiles, TypeOpenedWidget, EnumWidgetTypes, IDatasetPreviewData, uiStateShowBottomSheet } from "./services/state/uiState.store.helper"
import { OnDestroy, Injectable, Optional, Inject, InjectionToken } from "@angular/core"
import { PreviewComponentWrapper, DatasetPreview, determinePreviewFileType, EnumPreviewFileTypes, IKgDataEntry, getKgSchemaIdFromFullId } from "./ui/databrowserModule"
import { Subscription, Observable, forkJoin, of } from "rxjs"
import { select, Store, ActionReducer, createAction, props, createSelector, Action } from "@ngrx/store"
import { startWith, map, shareReplay, pairwise, debounceTime, distinctUntilChanged, tap, switchMap, withLatestFrom } from "rxjs/operators"
import { TypeActionToWidget, EnumActionToWidget, ACTION_TO_WIDGET_TOKEN } from "./widget"
import { getIdObj } from 'common/util'
import { MatDialogRef } from "@angular/material/dialog"
import { HttpClient } from "@angular/common/http"
import { DS_PREVIEW_URL, getShader, PMAP_DEFAULT_CONFIG } from 'src/util/constants'
import { ngViewerActionAddNgLayer, ngViewerActionRemoveNgLayer, INgLayerInterface } from "./services/state/ngViewerState.store.helper"
import { ARIA_LABELS } from 'common/constants'

const PREVIEW_FILE_TYPES_NO_UI = [
  EnumPreviewFileTypes.NIFTI,
  EnumPreviewFileTypes.VOLUMES
]

const DATASET_PREVIEW_ANNOTATION = `DATASET_PREVIEW_ANNOTATION`

export const glueActionPreviewDataset = createAction(
  '[glue] previewDataset',
  props<IDatasetPreviewData>()
)

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
    const { datasetId, filename } = data
    return `${datasetId}:${filename}`
  }

  static GetDatasetPreviewFromId(id: string): IDatasetPreviewData{
    const re = /^([a-f0-9-]+):(.+)$/.exec(id)
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
          ? forkJoin(...prvToShow.map(val => this.getDatasetPreviewFromId(val)))
          : of([]),
        prvToDismiss: prvToDismiss.length > 0 
          ? forkJoin(...prvToDismiss.map(val => this.getDatasetPreviewFromId(val)))
          : of([])
      })
    }),
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

  private fetchedDatasetPreviewCache: Map<string, any> = new Map()
  private getDatasetPreviewFromId({ datasetId, filename, datasetSchema = 'minds/core/dataset/v1.0.0' }: IDatasetPreviewData){
    const dsPrvId = DatasetPreviewGlue.GetDatasetPreviewId({ datasetId, filename })
    const cachedPrv = this.fetchedDatasetPreviewCache.get(`${datasetSchema}/${dsPrvId}`)
    const filteredDsId = /[a-f0-9-]+$/.exec(datasetId)
    if (cachedPrv) return of(cachedPrv)
    return this.http.get(`${DS_PREVIEW_URL}/${encodeURIComponent(datasetSchema)}/${filteredDsId}/${encodeURIComponent(filename)}`, { responseType: 'json' }).pipe(
      map(json => {
        return {
          ...json,
          filename,
          datasetId,
          datasetSchema
        }
      }),
      tap(val => this.fetchedDatasetPreviewCache.set(`${datasetSchema}/${dsPrvId}`, val))
    )
  }

  constructor(
    private store$: Store<any>,
    private http: HttpClient,
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
      this.getDiffDatasetFilesPreviews(
        dsPrv => determinePreviewFileType(dsPrv) === EnumPreviewFileTypes.NIFTI
      ).pipe(
        withLatestFrom(this.store$.pipe(
          select(state => state?.viewerState?.templateSelected || null),
          distinctUntilChanged(),
        ))
      ).subscribe(([ { prvToShow, prvToDismiss }, templateSelected ]) => {
        // TODO consider where to check validity of previewed nifti file
        for (const prv of prvToShow) {
          const { url, filename } = prv
          const previewFileId = DatasetPreviewGlue.GetDatasetPreviewId(prv)
          const layer = {
            name: filename,
            id: previewFileId,
            source : `nifti://${url}`,
            mixability : 'nonmixable',
            shader : getShader(PMAP_DEFAULT_CONFIG),
            annotation: `${DATASET_PREVIEW_ANNOTATION} ${filename}`
          }
          this.store$.dispatch(
            ngViewerActionAddNgLayer({ layer })
          )
        }

        for (const prv of prvToDismiss) {
          const { url, filename } = prv
          const previewFileId = DatasetPreviewGlue.GetDatasetPreviewId(prv)
          const layer = {
            name: filename,
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
    const { kgId } = getIdObj(fullId)

    const datasetPreviewFile = {
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


@Injectable({
  providedIn: 'root'
})

export class DatasetUserGlue {

}

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
