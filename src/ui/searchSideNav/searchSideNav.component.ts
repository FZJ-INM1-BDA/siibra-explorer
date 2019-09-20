import { Component, Output, EventEmitter, OnInit, OnDestroy } from "@angular/core";
import { MatDialogRef, MatDialog } from "@angular/material";
import { NgLayerInterface } from "src/atlasViewer/atlasViewer.component";
import { LayerBrowser } from "../layerbrowser/layerbrowser.component";
import { Observable, Subscription } from "rxjs";
import { Store, select } from "@ngrx/store";
import { map, startWith, scan, filter, mapTo } from "rxjs/operators";

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

  public autoOpenSideNav$: Observable<any>

  constructor(
    private dialog: MatDialog,
    store$: Store<any>
  ){
    this.autoOpenSideNav$ = store$.pipe(
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
    this.layerBrowserDialogRef = this.dialog.open(LayerBrowser, {
      hasBackdrop: false,
      autoFocus: false,
      position: {
        top: '1em'
      },
      disableClose: true
    })
  }
}