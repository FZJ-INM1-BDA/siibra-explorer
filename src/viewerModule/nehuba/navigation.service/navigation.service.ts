import { Inject, Injectable, OnDestroy, Optional } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Observable, ReplaySubject, Subscription } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { NehubaViewerUnit } from "../nehubaViewer/nehubaViewer.component";
import { NEHUBA_INSTANCE_INJTKN } from "../util";
import { INavObj, navObjEqual } from './navigation.util'
import { actions } from "src/state/atlasSelection";
import { atlasSelection, userPreference } from "src/state";

@Injectable()
export class NehubaNavigationService implements OnDestroy{

  private subscriptions: Subscription[] = []
  private viewerInstanceSubscriptions: Subscription[] = []

  private nehubaViewerInstance: NehubaViewerUnit
  public storeNav: INavObj
  public viewerNav: INavObj
  public viewerNav$ = new ReplaySubject<INavObj>(1)

  // if set, ignores store attempt to update nav
  private viewerNavLock: boolean = false

  private globalAnimationFlag = true
  private rafRef: number

  constructor(
    private store$: Store<any>,
    @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) nehubaInst$: Observable<NehubaViewerUnit>,
  ){
    this.subscriptions.push(
      this.store$.pipe(
        select(userPreference.selectors.useAnimation)
      ).subscribe(flag => this.globalAnimationFlag = flag)
    )

    if (nehubaInst$) {
      this.subscriptions.push(
        nehubaInst$.subscribe(val => {
          this.clearViewerSub()
          this.nehubaViewerInstance = val
          if (this.nehubaViewerInstance) {
            this.setupViewerSub()
          }
        })
      )
    }

    this.subscriptions.push(
      // realtime state nav state
      this.store$.pipe(
        select(atlasSelection.selectors.navigation)
      ).subscribe(v => {
        this.storeNav = v
        // if stored nav differs from viewerNav
        if (!this.viewerNavLock && this.nehubaViewerInstance) {
          const navEql = navObjEqual(this.storeNav, this.viewerNav)
          if (!navEql) {
            this.navigateViewer(this.storeNav)
          }
        }
      })
    )
  }

  navigateViewer(navigation: INavObj): void {
    if (!navigation) return
    // TODO
    // readd consider how to do animation
    this.nehubaViewerInstance.setNavigationState(navigation)
  }

  setupViewerSub(): void {
    this.viewerInstanceSubscriptions.push(
      // realtime viewer nav state
      this.nehubaViewerInstance.viewerPositionChange.subscribe(
        (val: INavObj) => {
          this.viewerNav = val
          this.viewerNav$.next(val)
          this.viewerNavLock = true
        }
      ),
      // debounced viewer nav state
      this.nehubaViewerInstance.viewerPositionChange.pipe(
        debounceTime(160)
      ).subscribe((val: INavObj) => {
        this.viewerNavLock = false

        const { zoom, perspectiveZoom, position } = val
        const roundedZoom = Math.round(zoom)
        const roundedPz = Math.round(perspectiveZoom)
        const roundedPosition = position.map(v => Math.round(v)) as [number, number, number]
        const roundedNav = {
          ...val,
          zoom: roundedZoom,
          perspectiveZoom: roundedPz,
          position: roundedPosition,
        }
        const navEql = navObjEqual(roundedNav, this.storeNav)
        
        if (!navEql) {
          this.store$.dispatch(
            actions.setNavigation({
              navigation: roundedNav
            })
          )
        }
      })
    )
  }

  clearViewerSub(): void {
    while (this.viewerInstanceSubscriptions.length > 0) this.viewerInstanceSubscriptions.pop().unsubscribe()
  }

  ngOnDestroy(): void {
    this.clearViewerSub()
    while (this.subscriptions.length > 0) this.subscriptions.pop().unsubscribe()
  }
}
