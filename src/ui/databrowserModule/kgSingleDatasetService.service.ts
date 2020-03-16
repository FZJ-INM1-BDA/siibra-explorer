import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy, TemplateRef } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service"
import { IDataEntry, ViewerPreviewFile, DATASETS_ACTIONS_TYPES } from "src/services/state/dataStore.store";
import { SHOW_BOTTOM_SHEET } from "src/services/state/uiState.store";
import { IavRootStoreInterface, REMOVE_NG_LAYER } from "src/services/stateStore.service";
import { GetKgSchemaIdFromFullIdPipe } from "./util/getKgSchemaIdFromFullId.pipe";

@Injectable({ providedIn: 'root' })
export class KgSingleDatasetService implements OnDestroy {

  private subscriptions: Subscription[] = []
  public ngLayers: Set<string> = new Set()

  constructor(
    private constantService: AtlasViewerConstantsServices,
    private store$: Store<IavRootStoreInterface>,
    private http: HttpClient,
  ) {

    this.subscriptions.push(
      this.store$.pipe(
        select('ngViewerState'),
        filter(v => !!v),
      ).subscribe(layersInterface => {
        this.ngLayers = new Set(layersInterface.layers.map(l => l.source.replace(/^nifti:\/\//, '')))
      }),
    )
  }

  public ngOnDestroy() {
    while (this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }

  // TODO deprecate, in favour of web component
  public datasetHasPreview({ name }: { name: string } = { name: null }) {
    if (!name) { throw new Error('kgSingleDatasetService#datasetHashPreview name must be defined') }
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
        if (res.status >= 400) { throw new Error(res.status.toString()) }
        return res.json()
      })
  }

  public getDownloadZipFromKgHref({ kgSchema = 'minds/core/dataset/v1.0.0', kgId }) {
    const _url = new URL(`datasets/downloadKgFiles`, this.constantService.backendUrl)
    const searchParam = _url.searchParams
    searchParam.set('kgSchema', kgSchema)
    searchParam.set('kgId', kgId)
    return _url.toString()
  }

  public showPreviewList(template: TemplateRef<any>) {
    this.store$.dispatch({
      type: SHOW_BOTTOM_SHEET,
      bottomSheetTemplate: template,
    })
  }

  public previewFile(file: ViewerPreviewFile, dataset: IDataEntry) {
    this.store$.dispatch({
      type: DATASETS_ACTIONS_TYPES.PREVIEW_DATASET,
      payload: {
        file,
        dataset
      }
    })
  }

  public removeNgLayer({ url }) {
    this.store$.dispatch({
      type : REMOVE_NG_LAYER,
      layer : {
        name : url,
      },
    })
  }
}

interface KgQueryInterface {
  kgSchema: string
  kgId: string
}
