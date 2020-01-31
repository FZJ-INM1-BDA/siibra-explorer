import { Component, EventEmitter, OnDestroy, Output, TemplateRef, ViewChild } from "@angular/core";
import { MatDialog, MatDialogRef, MatSnackBar } from "@angular/material";
import { select, Store } from "@ngrx/store";
import {Observable, Subscription} from "rxjs";
import { filter, map, mapTo, scan, startWith } from "rxjs/operators";
import { INgLayerInterface } from "src/atlasViewer/atlasViewer.component";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import {
  CLOSE_SIDE_PANEL,
  COLLAPSE_SIDE_PANEL_CURRENT_VIEW,
  EXPAND_SIDE_PANEL_CURRENT_VIEW,
} from "src/services/state/uiState.store";
import { IavRootStoreInterface, SELECT_REGIONS } from "src/services/stateStore.service";
import { LayerBrowser } from "../layerbrowser/layerbrowser.component";
import { trackRegionBy } from '../viewerStateController/regionHierachy/regionHierarchy.component'
import { determinePreviewFileType, PREVIEW_FILE_TYPES } from "../databrowserModule/preview/previewFileIcon.pipe";
import { DS_PREVIEW_URL } from 'src/util/constants'

@Component({
  selector: 'search-side-nav',
  templateUrl: './searchSideNav.template.html',
  styleUrls: [
    './searchSideNav.style.css',
  ],
})

export class SearchSideNav implements OnDestroy {
  public availableDatasets: number = 0

  private subscriptions: Subscription[] = []
  private layerBrowserDialogRef: MatDialogRef<any>

  @Output() public dismiss: EventEmitter<any> = new EventEmitter()

  @ViewChild('layerBrowserTmpl', {read: TemplateRef}) public layerBrowserTmpl: TemplateRef<any>
  @ViewChild('kgDatasetPreviewer', {read: TemplateRef}) private kgDatasetPreview: TemplateRef<any>

  public autoOpenSideNavDataset$: Observable<any>

  public sidePanelExploreCurrentViewIsOpen$: Observable<any>
  public sidePanelCurrentViewContent: Observable<any>

  public darktheme$: Observable<boolean>

  public DS_PREVIEW_URL = DS_PREVIEW_URL

  constructor(
    public dialog: MatDialog,
    private store$: Store<IavRootStoreInterface>,
    private snackBar: MatSnackBar,
    private constantService: AtlasViewerConstantsServices,
  ) {

    this.darktheme$ = this.constantService.darktheme$
    
    this.autoOpenSideNavDataset$ = this.store$.pipe(
      select('viewerState'),
      select('regionsSelected'),
      map(arr => arr.length),
      startWith(0),
      scan((acc, curr) => [curr, ...acc], []),
      filter(([curr, prev]) => prev === 0 && curr > 0),
      mapTo(true),
    )

    this.sidePanelExploreCurrentViewIsOpen$ = this.store$.pipe(
      select('uiState'),
      select("sidePanelExploreCurrentViewIsOpen"),
    )

    this.sidePanelCurrentViewContent = this.store$.pipe(
      select('uiState'),
      select("sidePanelCurrentViewContent"),
    )

    this.subscriptions.push(
      this.store$.pipe(
        select('dataStore'),
        select('datasetPreviews'),
        filter(datasetPreviews => datasetPreviews.length > 0),
        map((datasetPreviews) => datasetPreviews[datasetPreviews.length - 1]),
        filter(({ file }) => determinePreviewFileType(file) !== PREVIEW_FILE_TYPES.NIFTI)
      ).subscribe(({ dataset, file }) => {
        
        const { fullId } = dataset
        const { filename } = file
        
        // TODO replace with common/util/getIdFromFullId
        this.previewKgId = /\/([a-f0-9-]{1,})$/.exec(fullId)[1]
        this.previewFilename = filename
        this.dialog.open(this.kgDatasetPreview, {
          minWidth: '50vw',
          minHeight: '50vh'
        })
      })
    )
  }

  public previewKgId: string 
  public previewFilename: string

  public collapseSidePanelCurrentView() {
    this.store$.dispatch({
      type: COLLAPSE_SIDE_PANEL_CURRENT_VIEW,
    })
  }

  public expandSidePanelCurrentView() {
    this.store$.dispatch({
      type: EXPAND_SIDE_PANEL_CURRENT_VIEW,
    })
  }

  public ngOnDestroy() {
    while (this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }

  public handleNonbaseLayerEvent(layers: INgLayerInterface[]) {
    if (layers.length  === 0) {
      this.layerBrowserDialogRef && this.layerBrowserDialogRef.close()
      this.layerBrowserDialogRef = null
      return
    }
    if (this.layerBrowserDialogRef) { return }

    this.store$.dispatch({
      type: CLOSE_SIDE_PANEL,
    })

    const dialogToOpen = this.layerBrowserTmpl || LayerBrowser
    this.layerBrowserDialogRef = this.dialog.open(dialogToOpen, {
      hasBackdrop: false,
      autoFocus: false,
      panelClass: [
        'layerBrowserContainer',
      ],
      position: {
        top: '0',
      },
      disableClose: true,
    })

    this.layerBrowserDialogRef.afterClosed().subscribe(val => {
      if (val === 'user action') { this.snackBar.open(this.constantService.dissmissUserLayerSnackbarMessage, 'Dismiss', {
        duration: 5000,
      })
      }
    })
  }

  public deselectAllRegions() {
    this.store$.dispatch({
      type: SELECT_REGIONS,
      selectRegions: [],
    })
  }

  public trackByFn = trackRegionBy
}
