import { Component, Output, EventEmitter, OnInit, OnDestroy, ViewChild, TemplateRef } from "@angular/core";
import { MatDialogRef, MatDialog, MatSnackBar } from "@angular/material";
import { NgLayerInterface } from "src/atlasViewer/atlasViewer.component";
import { LayerBrowser } from "../layerbrowser/layerbrowser.component";
import { Observable, Subscription } from "rxjs";
import { Store, select } from "@ngrx/store";
import { map, startWith, scan, filter, mapTo } from "rxjs/operators";
import { trackRegionBy } from '../viewerStateController/regionHierachy/regionHierarchy.component'
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { SELECT_REGIONS } from "src/services/stateStore.service";

@Component({
  selector: 'search-side-nav',
  templateUrl: './searchSideNav.template.html',
  styleUrls:[
    './searchSideNav.style.css'
  ]
})

export class SearchSideNav implements OnInit, OnDestroy {
  public showDataset: boolean = false
  public availableDatasets: number = 0

  private subscriptions: Subscription[] = []
  private layerBrowserDialogRef: MatDialogRef<any>

  @Output() dismiss: EventEmitter<any> = new EventEmitter()
  @Output() open: EventEmitter<any> = new EventEmitter()

  @ViewChild('layerBrowserTmpl', {read: TemplateRef}) layerBrowserTmpl: TemplateRef<any>

  public autoOpenSideNav$: Observable<any>

  constructor(
    public dialog: MatDialog,
    private store$: Store<any>,
    private snackBar: MatSnackBar,
    private constantService: AtlasViewerConstantsServices
  ){
    this.autoOpenSideNav$ = this.store$.pipe(
      select('viewerState'),
      select('regionsSelected'),
      map(arr => arr.length),
      startWith(0),
      scan((acc, curr) => [curr, ...acc], []),
      filter(([curr, prev]) => prev === 0 && curr > 0),
      mapTo(true)
    )
  }

  ngOnInit(){
    this.subscriptions.push(
      this.autoOpenSideNav$.subscribe(() => {
        this.open.emit(true)
        this.showDataset = true
      })
    )
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
    
    this.dismiss.emit(true)
    
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

  public deselectAllRegions(){
    this.store$.dispatch({
      type: SELECT_REGIONS,
      selectRegions: []
    })
  }

  trackByFn = trackRegionBy
}