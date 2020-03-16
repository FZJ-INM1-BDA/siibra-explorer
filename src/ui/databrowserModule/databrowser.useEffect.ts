import { Injectable, OnDestroy } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { from, merge, Observable, of, Subscription, forkJoin, combineLatest } from "rxjs";
import { filter, map, scan, switchMap, withLatestFrom, mapTo, shareReplay, startWith, distinctUntilChanged } from "rxjs/operators";
import { LoggingService } from "src/services/logging.service";
import { DATASETS_ACTIONS_TYPES, IDataEntry, ViewerPreviewFile } from "src/services/state/dataStore.store";
import { IavRootStoreInterface, ADD_NG_LAYER, CHANGE_NAVIGATION } from "src/services/stateStore.service";
import { LOCAL_STORAGE_CONST, DS_PREVIEW_URL } from "src/util/constants";
import { KgSingleDatasetService } from "./kgSingleDatasetService.service";
import { determinePreviewFileType, PREVIEW_FILE_TYPES, PREVIEW_FILE_TYPES_NO_UI } from "./preview/previewFileIcon.pipe";
import { GLSL_COLORMAP_JET } from "src/atlasViewer/atlasViewer.constantService.service";
import { SHOW_BOTTOM_SHEET } from "src/services/state/uiState.store";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog } from "@angular/material/dialog";
import { PreviewComponentWrapper } from "./preview/previewComponentWrapper/previewCW.component";
import { getKgSchemaIdFromFullId } from "./util/getKgSchemaIdFromFullId.pipe";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root',
})

export class DataBrowserUseEffect implements OnDestroy {

  private subscriptions: Subscription[] = []

  // ng layer (currently only nifti file) needs to be previewed
  // to be deprecated in favour of preview register volumes
  @Effect()
  previewNgLayer$: Observable<any>

  // registerd layers (to be further developed)
  @Effect()
  previewRegisteredVolumes$: Observable<any>

  // when bottom sheet should be hidden (currently only when ng layer is visualised)
  @Effect()
  hideBottomSheet$: Observable<any>

  // when the preview effect has a ROI defined
  @Effect()
  navigateToPreviewPosition$: Observable<any>

  public previewDatasetFile$: Observable<ViewerPreviewFile>
  private storePreviewDatasetFile$: Observable<{dataset: IDataEntry,file: ViewerPreviewFile}[]>

  constructor(
    private store$: Store<IavRootStoreInterface>,
    private actions$: Actions<any>,
    private kgSingleDatasetService: KgSingleDatasetService,
    private log: LoggingService,
    private snackbar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient
  ) {

    this.subscriptions.push(
      this.store$.pipe(
        select('dataStore'),
        select('datasetPreviews'),
        filter(datasetPreviews => datasetPreviews.length > 0),
        map((datasetPreviews) => datasetPreviews[datasetPreviews.length - 1]),
        switchMap(({ datasetId, filename }) =>{
          const re = getKgSchemaIdFromFullId(datasetId)
          return this.http.get(`${DATASET_PREVIEW_URL}/${re[1]}/${filename}`).pipe(
            filter((file: any) => PREVIEW_FILE_TYPES_NO_UI.indexOf( determinePreviewFileType(file) ) < 0),
            mapTo({
              datasetId,
              filename
            })
          )
        }),
      ).subscribe(({ datasetId, filename }) => {
        
        // TODO replace with common/util/getIdFromFullId
        
        const re = getKgSchemaIdFromFullId(datasetId)
        this.dialog.open(
          PreviewComponentWrapper,
          {
            hasBackdrop: false,
            disableClose: true,
            autoFocus: false,
            panelClass: 'mat-card-sm',
            height: '50vh',
            width: '350px',
            position: {
              left: '5px'
            },
            data: {
              filename,
              kgId: re && re[1],
              backendUrl: DS_PREVIEW_URL
            }
          }
        )
      })
    )

    this.storePreviewDatasetFile$ = store$.pipe(
      select('dataStore'),
      select('datasetPreviews'),
      startWith([]),
      switchMap((arr: any[]) => {
        return merge(
          ... (arr.map(({ datasetId, filename }) => {
            const re = getKgSchemaIdFromFullId(datasetId)
            if (!re) throw new Error(`datasetId ${datasetId} does not follow organisation/domain/schema/version/uuid rule`)
  
            return forkJoin(
              from(this.kgSingleDatasetService.getInfoFromKg({ kgSchema: re[0], kgId: re[1] })),
              this.http.get(`${DS_PREVIEW_URL}/${re[1]}/${filename}`)
            ).pipe(
              map(([ dataset, file ]) => {
                return {
                  dataset,
                  file
                } as { dataset: IDataEntry, file: ViewerPreviewFile }
              })
            )
          }))
        ).pipe(
          scan((acc, curr) => acc.concat(curr), [])
        )
      })
    )

    this.previewDatasetFile$ = actions$.pipe(
      ofType(DATASETS_ACTIONS_TYPES.PREVIEW_DATASET),
      map(actionBody => {
        const { payload = {} } = actionBody as any
        const { file = null } = payload as { file: ViewerPreviewFile, dataset: IDataEntry }
        return file
      }),
      shareReplay(1)
    )

    this.navigateToPreviewPosition$ = this.previewDatasetFile$.pipe(
      filter(({ position }) => !!position),
      switchMap(({ position }) => 
        this.snackbar.open(`Postion of interest found.`, 'Go there', {
          duration: 5000,
        }).afterDismissed().pipe(
          filter(({ dismissedByAction }) => dismissedByAction),
          mapTo({
            type: CHANGE_NAVIGATION,
            navigation: {
              position,
              animation: {}
            }
          })
        )
      )
    )
    
    this.previewRegisteredVolumes$ = combineLatest(
      this.store$.pipe(
        select('viewerState'),
        select('templateSelected'),
        distinctUntilChanged(),
        startWith(null)
      ),
      this.storePreviewDatasetFile$.pipe(
        distinctUntilChanged()
      )
    ).pipe(
      map(([templateSelected, arr]) => {
        const re = getKgSchemaIdFromFullId(
          (templateSelected && templateSelected.fullId) || ''
        )
        const templateId = re && re[1]
        return arr.filter(({ file }) => {
          return determinePreviewFileType(file) === PREVIEW_FILE_TYPES.VOLUMES
            && file.referenceSpaces.findIndex(({ fullId }) => {
              if (fullId === '*') return true
              const regex = getKgSchemaIdFromFullId(fullId)
              const fileReferenceTemplateId = regex && regex[1]
              if (!fileReferenceTemplateId) return false
              return fileReferenceTemplateId === templateId
            }) >= 0
        })
      }),
      filter(arr => arr.length > 0),
      map(arr => arr[arr.length - 1]),
      map(({ file }) => {
        const { volumes } = file['data']['iav-registered-volumes']
        return {
          type: ADD_NG_LAYER,
          layer: volumes
        }
      })
    )

    this.previewNgLayer$ = this.previewDatasetFile$.pipe(
      filter(file => 
        determinePreviewFileType(file) === PREVIEW_FILE_TYPES.NIFTI
      ),
      map(({ url }) => {
        const layer = {
          name: url,
          source : `nifti://${url}`,
          mixability : 'nonmixable',
          shader : GLSL_COLORMAP_JET,
        }
        return {
          type: ADD_NG_LAYER,
          layer
        }
      })
    )

    this.hideBottomSheet$ = this.previewNgLayer$.pipe(
      mapTo({
        type: SHOW_BOTTOM_SHEET,
        bottomSheetTemplate: null
      })
    )
    this.favDataEntries$ = this.store$.pipe(
      select('dataStore'),
      select('favDataEntries'),
    )

    this.toggleDataset$ = this.actions$.pipe(
      ofType(DATASETS_ACTIONS_TYPES.TOGGLE_FAV_DATASET),
      withLatestFrom(this.favDataEntries$),
      map(([action, prevFavDataEntries]) => {
        const { payload = {} } = action as any
        const { fullId } = payload

        const re1 = getKgSchemaIdFromFullId(fullId)

        if (!re1) {
          return {
            type: DATASETS_ACTIONS_TYPES.UPDATE_FAV_DATASETS,
            favDataEntries: DATASETS_ACTIONS_TYPES.UPDATE_FAV_DATASETS,
          }
        }
        const favIdx = prevFavDataEntries.findIndex(ds => {
          const re2 = getKgSchemaIdFromFullId(ds.fullId)
          if (!re2) return false
          return re2[1] === re1[1]
        })
        return {
          type: DATASETS_ACTIONS_TYPES.UPDATE_FAV_DATASETS,
          favDataEntries: favIdx >= 0
            ? prevFavDataEntries.filter((_, idx) => idx !== favIdx)
            : prevFavDataEntries.concat(payload),
        }
      }),
    )

    this.unfavDataset$ = this.actions$.pipe(
      ofType(DATASETS_ACTIONS_TYPES.UNFAV_DATASET),
      withLatestFrom(this.favDataEntries$),
      map(([action, prevFavDataEntries]) => {

        const { payload = {} } = action as any
        const { fullId } = payload

        const re1 = getKgSchemaIdFromFullId(fullId)

        return {
          type: DATASETS_ACTIONS_TYPES.UPDATE_FAV_DATASETS,
          favDataEntries: prevFavDataEntries.filter(ds => {
            const re2 = getKgSchemaIdFromFullId(ds.fullId)
            if (!re2) return false
            if (!re1) return true
            return re2[1] !== re1[1]
          }),
        }
      }),
    )

    this.favDataset$ = this.actions$.pipe(
      ofType(DATASETS_ACTIONS_TYPES.FAV_DATASET),
      withLatestFrom(this.favDataEntries$),
      map(([ action, prevFavDataEntries ]) => {
        const { payload } = action as any

        /**
         * check duplicate
         */
        const { fullId } = payload
        const re1 = getKgSchemaIdFromFullId(fullId)
        if (!re1) {
          return {
            type: DATASETS_ACTIONS_TYPES.UPDATE_FAV_DATASETS,
            favDataEntries: prevFavDataEntries,
          }
        }

        const isDuplicate = prevFavDataEntries.some(favDe => {
          const re2 = getKgSchemaIdFromFullId(favDe.fullId)
          if (!re2) return false
          return re1[1] === re2[1]
        })
        const favDataEntries = isDuplicate
          ? prevFavDataEntries
          : prevFavDataEntries.concat(payload)

        return {
          type: DATASETS_ACTIONS_TYPES.UPDATE_FAV_DATASETS,
          favDataEntries,
        }
      }),
    )

    this.subscriptions.push(
      this.favDataEntries$.pipe(
        filter(v => !!v),
      ).subscribe(favDataEntries => {
        /**
         * only store the minimal data in localstorage/db, hydrate when needed
         * for now, only save id
         *
         * do not save anything else on localstorage. This could potentially be leaking sensitive information
         */
        const serialisedFavDataentries = favDataEntries.map(({ fullId }) => {
          return { fullId }
        })
        window.localStorage.setItem(LOCAL_STORAGE_CONST.FAV_DATASET, JSON.stringify(serialisedFavDataentries))
      }),
    )
  }

  public ngOnDestroy() {
    while (this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }

  private savedFav$: Observable<Array<{id: string, name: string}> | null>

  private favDataEntries$: Observable<IDataEntry[]>

  @Effect()
  public favDataset$: Observable<any>

  @Effect()
  public unfavDataset$: Observable<any>

  @Effect()
  public toggleDataset$: Observable<any>
}
