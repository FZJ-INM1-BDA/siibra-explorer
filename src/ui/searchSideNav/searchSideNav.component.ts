import { Component, EventEmitter, OnDestroy, Output, TemplateRef, ViewChild } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Observable, Subscription } from "rxjs";
import { filter, map, mapTo, scan, startWith } from "rxjs/operators";
import { INgLayerInterface } from "src/atlasViewer/atlasViewer.component";

import { trackRegionBy } from '../viewerStateController/regionHierachy/regionHierarchy.component'
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { ARIA_LABELS } from 'common/constants.js'
import { viewerStateSetSelectedRegions } from "src/services/state/viewerState.store.helper";
import { uiStateCloseSidePanel, uiStateCollapseSidePanel, uiStateExpandSidePanel } from "src/services/state/uiState.store.helper";

const { TOGGLE_EXPLORE_PANEL } = ARIA_LABELS

@Component({
  selector: 'search-side-nav',
  templateUrl: './searchSideNav.template.html',
  styleUrls: [
    './searchSideNav.style.css',
  ],
})

export class SearchSideNav implements OnDestroy {
  public TOGGLE_EXPLORE_PANEL_ARIA_LABEL = TOGGLE_EXPLORE_PANEL
  public availableDatasets: number = 0

  private subscriptions: Subscription[] = []
  private layerBrowserDialogRef: MatDialogRef<any>

  @Output() public dismiss: EventEmitter<any> = new EventEmitter()

  @ViewChild('layerBrowserTmpl', {read: TemplateRef}) public layerBrowserTmpl: TemplateRef<any>

  public autoOpenSideNavDataset$: Observable<any>

  public sidePanelExploreCurrentViewIsOpen$: Observable<any>
  public sidePanelCurrentViewContent: Observable<any>

  public darktheme$: Observable<boolean>

  constructor(
    public dialog: MatDialog,
    private store$: Store<any>,
  ) {

    this.darktheme$ = this.store$.pipe(
      select(state => state?.viewerState?.templateSelected?.useTheme === 'dark')
    )
    
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
      select("sidePanelCurrentViewContent")
    )
  }

  public collapseSidePanelCurrentView() {
    this.store$.dispatch( uiStateCollapseSidePanel() )
  }

  public expandSidePanelCurrentView() {
    this.store$.dispatch( uiStateExpandSidePanel() )
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

    this.store$.dispatch(uiStateCloseSidePanel())

    const dialogToOpen = this.layerBrowserTmpl
    this.layerBrowserDialogRef = this.dialog.open(dialogToOpen, {
      hasBackdrop: false,
      autoFocus: false,
      ariaLabel: 'Additional volumes control',
      panelClass: [
        'layerBrowserContainer',
      ],
      position: {
        top: '0',
      },
      disableClose: true,
    })
  }

  public deselectAllRegions() {
    this.store$.dispatch( viewerStateSetSelectedRegions({ selectRegions: [] }) )
  }

  public trackByFn = trackRegionBy
}
