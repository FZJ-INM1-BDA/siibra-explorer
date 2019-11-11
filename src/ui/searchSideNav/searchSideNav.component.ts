import { Component, Output, EventEmitter, OnInit, OnDestroy, ViewChild, TemplateRef } from "@angular/core";
import { MatDialogRef, MatDialog, MatSnackBar } from "@angular/material";
import { NgLayerInterface } from "src/atlasViewer/atlasViewer.component";
import { LayerBrowser } from "../layerbrowser/layerbrowser.component";
import {Observable, Subject, Subscription} from "rxjs";
import { Store, select } from "@ngrx/store";
import { map, startWith, scan, filter, mapTo } from "rxjs/operators";
import { VIEWERSTATE_CONTROLLER_ACTION_TYPES } from "../viewerStateController/viewerState.base";
import { trackRegionBy } from '../viewerStateController/regionHierachy/regionHierarchy.component'
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import {
  CLOSE_SIDE_PANEL,
  COLLAPSE_SIDE_PANEL_CURRENT_VIEW,
  EXPAND_SIDE_PANEL_CURRENT_VIEW,
  OPEN_SIDE_PANEL
} from "src/services/state/uiState.store";
import {ConnectivityBrowserComponent} from "src/ui/connectivityBrowser/connectivityBrowser.component";
import {ConnectivityBrowserService} from "src/ui/connectivityBrowser/connectivityBrowser.service";

@Component({
  selector: 'search-side-nav',
  templateUrl: './searchSideNav.template.html',
  styleUrls:[
    './searchSideNav.style.css'
  ]
})

export class SearchSideNav implements OnInit, OnDestroy {
  public availableDatasets: number = 0

  public connectivityActive = new Subject<string>()
  public connectivityRegion = ''

  private subscriptions: Subscription[] = []
  private layerBrowserDialogRef: MatDialogRef<any>

  @Output() dismiss: EventEmitter<any> = new EventEmitter()

  @ViewChild('layerBrowserTmpl', {read: TemplateRef}) layerBrowserTmpl: TemplateRef<any>
  @ViewChild('connectivityBrowser') connectivityBrowser: ConnectivityBrowserComponent


  public autoOpenSideNavDataset$: Observable<any>

  sidebarMenuState$: Observable<any>

  constructor(
    public dialog: MatDialog,
    private store$: Store<any>,
    private snackBar: MatSnackBar,
    private constantService: AtlasViewerConstantsServices,
    private connectivityService: ConnectivityBrowserService
  ){
    this.autoOpenSideNavDataset$ = this.store$.pipe(
      select('viewerState'),
      select('regionsSelected'),
      map(arr => arr.length),
      startWith(0),
      scan((acc, curr) => [curr, ...acc], []),
      filter(([curr, prev]) => prev === 0 && curr > 0),
      mapTo(true)
    )

    this.sidebarMenuState$ = this.store$.pipe(
        select('uiState'),
        map(state => {
          return {
            sidePanelOpen: state.sidePanelOpen,
            sidePanelCurrentViewOpened: state.sidePanelCurrentViewOpened,
            sidePanelManualCollapsibleView: state.sidePanelManualCollapsibleView
          }
        })
    )
  }

  ngOnInit(){
    this.subscriptions.push(
        this.connectivityActive.asObservable().subscribe(r => {
          this.connectivityService.getConnectivityByRegion(r)
          this.connectivityRegion = r
        }),

      this.autoOpenSideNavDataset$.subscribe(() => {
        this.store$.dispatch({
          type: OPEN_SIDE_PANEL,
        })
        this.expandSidePanelCurrentView()
      })
    )
  }

  collapseSidePanelCurrentView() {
    this.store$.dispatch({
      type: COLLAPSE_SIDE_PANEL_CURRENT_VIEW,
    })
  }

  expandSidePanelCurrentView() {
    this.store$.dispatch({
      type: EXPAND_SIDE_PANEL_CURRENT_VIEW,
    })
  }



  ngOnDestroy(){
    while(this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }

  handleNonbaseLayerEvent(layers: NgLayerInterface[]){
    if (layers.length  === 0) {
      this.layerBrowserDialogRef && this.layerBrowserDialogRef.close()
      this.layerBrowserDialogRef = null
      return  
    }
    if (this.layerBrowserDialogRef) return

    this.store$.dispatch({
      type: CLOSE_SIDE_PANEL,
    })

    const dialogToOpen = this.layerBrowserTmpl || LayerBrowser
    this.layerBrowserDialogRef = this.dialog.open(dialogToOpen, {
      hasBackdrop: false,
      autoFocus: false,
      panelClass: [
        'layerBrowserContainer'
      ],
      position: {
        top: '0'
      },
      disableClose: true
    })

    this.layerBrowserDialogRef.afterClosed().subscribe(val => {
      if (val === 'user action') this.snackBar.open(this.constantService.dissmissUserLayerSnackbarMessage, 'Dismiss', {
        duration: 5000
      })
    })
  }

  removeRegion(region: any){
    this.store$.dispatch({
      type: VIEWERSTATE_CONTROLLER_ACTION_TYPES.SINGLE_CLICK_ON_REGIONHIERARCHY,
      payload: { region }
    })
  }

  trackByFn = trackRegionBy
}