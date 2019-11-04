import { Injectable, TemplateRef, OnDestroy } from "@angular/core";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service"
import { Store, select } from "@ngrx/store";
import { SHOW_BOTTOM_SHEET } from "src/services/state/uiState.store";
import { ViewerPreviewFile, DataEntry } from "src/services/state/dataStore.store";
import { determinePreviewFileType, PREVIEW_FILE_TYPES } from "./preview/previewFileIcon.pipe";
import { MatDialog, MatSnackBar } from "@angular/material";
import { FileViewer } from "./fileviewer/fileviewer.component";
import { ADD_NG_LAYER, REMOVE_NG_LAYER, CHANGE_NAVIGATION } from "src/services/stateStore.service";
import { Subscription, Subject } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { GetKgSchemaIdFromFullIdPipe } from "./util/getKgSchemaIdFromFullId.pipe";

@Injectable({ providedIn: 'root' })
export class KgSingleDatasetService implements OnDestroy{

  public previewingFile$: Subject<{file:ViewerPreviewFile, dataset: DataEntry}> = new Subject()

  private subscriptions: Subscription[] = []
  public ngLayers : Set<string> = new Set()

  private getKgSchemaIdFromFullIdPipe: GetKgSchemaIdFromFullIdPipe = new GetKgSchemaIdFromFullIdPipe()

  constructor(
    private constantService: AtlasViewerConstantsServices,
    private store$: Store<any>,
    private dialog: MatDialog,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {

    this.subscriptions.push(
      this.store$.pipe(
        select('ngViewerState')
      ).subscribe(layersInterface => {
        this.ngLayers = new Set(layersInterface.layers.map(l => l.source.replace(/^nifti\:\/\//, '')))
      })
    )
  }

  ngOnDestroy(){
    while (this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }

  public datasetHasPreview({ name } : { name: string } = { name: null }){
    if (!name) throw new Error('kgSingleDatasetService#datasetHashPreview name must be defined')
    const _url = new URL(`datasets/hasPreview`, this.constantService.backendUrl )
    const searchParam = _url.searchParams
    searchParam.set('datasetName', name)
    return this.http.get(_url.toString())
  }

  public getInfoFromKg({ kgId, kgSchema = 'minds/core/dataset/v1.0.0' }: Partial<KgQueryInterface>) {
    const _url = new URL(`datasets/kgInfo`, this.constantService.backendUrl )
    const searchParam = _url.searchParams
    searchParam.set('kgSchema', kgSchema)
    searchParam.set('kgId', kgId)
    return fetch(_url.toString())
      .then(res => {
        if (res.status >= 400) throw new Error(res.status.toString())
        return res.json()
      })
  }

  public getDownloadZipFromKgHref({ kgSchema = 'minds/core/dataset/v1.0.0', kgId }){
    const _url = new URL(`datasets/downloadKgFiles`, this.constantService.backendUrl)
    const searchParam = _url.searchParams
    searchParam.set('kgSchema', kgSchema)
    searchParam.set('kgId', kgId)
    return _url.toString()
  }

  public showPreviewList(template: TemplateRef<any>){
    this.store$.dispatch({
      type: SHOW_BOTTOM_SHEET,
      bottomSheetTemplate: template
    })
  }

  public previewFile(file:ViewerPreviewFile, dataset: DataEntry) {
    this.previewingFile$.next({
      file,
      dataset
    })

    const { position, name } = file
    if (position) {
      this.snackBar.open(`Postion of interest found.`, 'Go there', {
        duration: 5000
      })
        .afterDismissed()
        .subscribe(({ dismissedByAction }) => {
          if (dismissedByAction) {
            this.store$.dispatch({
              type: CHANGE_NAVIGATION,
              navigation: {
                position,
                animation: {}
              }
            })
          }
        })
    }

    const type = determinePreviewFileType(file)
    if (type === PREVIEW_FILE_TYPES.NIFTI) {
      this.store$.dispatch({
        type: SHOW_BOTTOM_SHEET,
        bottomSheetTemplate: null
      })
      const { url } = file
      this.showNewNgLayer({ url })
      return
    }


    this.dialog.open(FileViewer, {
      data: {
        previewFile: file
      },
      autoFocus: false
    })
  }

  public showNewNgLayer({ url }):void{

    const layer = {
      name : url,
      source : `nifti://${url}`,
      mixability : 'nonmixable',
      shader : this.constantService.getActiveColorMapFragmentMain()
    }
    this.store$.dispatch({
      type: ADD_NG_LAYER,
      layer
    })
  }

  removeNgLayer({ url }) {
    this.store$.dispatch({
      type : REMOVE_NG_LAYER,
      layer : {
        name : url
      }
    })
  }

  getKgSchemaKgIdFromFullId(fullId: string){
    const match = this.getKgSchemaIdFromFullIdPipe.transform(fullId)
    return match && {
      kgSchema: match[0],
      kgId: match[1]
    }
  }
}

interface KgQueryInterface{
  kgSchema: string
  kgId: string
}
