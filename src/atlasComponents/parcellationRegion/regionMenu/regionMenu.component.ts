import { Component, EventEmitter, OnDestroy, Output } from "@angular/core";
import { Store } from "@ngrx/store";
import { merge, Observable, Subject, Subscription } from "rxjs";
import { RegionBase } from '../region.base'
import { CONST, ARIA_LABELS } from 'common/constants'
import { ComponentStore } from "src/viewerModule/componentStore";
import { distinctUntilChanged, mapTo } from "rxjs/operators";
import { SapiRegionalFeatureModel } from "src/atlasComponents/sapi";

@Component({
  selector: 'region-menu',
  templateUrl: './regionMenu.template.html',
  styleUrls: ['./regionMenu.style.css'],
  providers: [ ComponentStore ]
})
export class RegionMenuComponent extends RegionBase implements OnDestroy {

  @Output('region-menu-feat-clicked')
  featureClicked = new EventEmitter<SapiRegionalFeatureModel>()

  public CONST = CONST
  public ARIA_LABELS = ARIA_LABELS
  private subscriptions: Subscription[] = []

  public activePanelTitles$: Observable<string[]>
  private activePanelTitles: string[] = []

  public intentToChgTmpl$ = new Subject()
  public lockOtherTmpl$ = merge(
    this.selectedTemplate$.pipe(
      mapTo(false)
    ),
    this.intentToChgTmpl$.pipe(
      mapTo(true)
    )
  ).pipe(
    distinctUntilChanged()
  )

  constructor(
    store$: Store<any>,
    private viewerCmpLocalUiStore: ComponentStore<{ activePanelsTitle: string[] }>,
  ) {
    super(store$)
    this.viewerCmpLocalUiStore.setState({
      activePanelsTitle: []
    })

    this.activePanelTitles$ = this.viewerCmpLocalUiStore.select(
      state => state.activePanelsTitle
    ) as Observable<string[]>

    this.subscriptions.push(
      this.activePanelTitles$.subscribe(
        (activePanelTitles: string[]) => this.activePanelTitles = activePanelTitles
      )
    )
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  handleExpansionPanelClosedEv(title: string){
    this.viewerCmpLocalUiStore.setState({
      activePanelsTitle: this.activePanelTitles.filter(n => n !== title)
    })
  }
  handleExpansionPanelAfterExpandEv(title: string){
    if (this.activePanelTitles.includes(title)) return
    this.viewerCmpLocalUiStore.setState({
      activePanelsTitle: [
        ...this.activePanelTitles,
        title
      ]
    })
  }

  public busyFlag = false
  private busyMap = new Map<string, boolean>()
  handleBusySignal(namespace: string, flag: boolean) {
    this.busyMap.set(namespace, flag)
    for (const [_key, val] of this.busyMap.entries()) {
      if (val) {
        this.busyFlag = true
        return
      }
    }
    this.busyFlag = false
  }

  handleRegionalFeatureClicked(feat: SapiRegionalFeatureModel){
    this.featureClicked.emit(feat)
  }
}
