import { Directive, ElementRef, Input, OnDestroy, OnInit } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Observable, Subscription } from "rxjs";
import { distinctUntilChanged, tap } from "rxjs/operators";
import { ngViewerSelectorPanelMode } from "src/services/state/ngViewerState/selectors";
import { IavRootStoreInterface } from "src/services/stateStore.service";
import { addTouchSideClasses, removeTouchSideClasses } from "src/viewerModule/nehuba/util";


@Directive({
  selector: '[touch-side-class]',
  exportAs: 'touchSideClass',
})

export class TouchSideClass implements OnDestroy, OnInit {
  @Input('touch-side-class')
  public panelNativeIndex: number

  public panelMode: string
  private panelMode$: Observable<string>

  private subscriptions: Subscription[] = []

  constructor(
    private store$: Store<IavRootStoreInterface>,
    private el: ElementRef,
  ) {

    this.panelMode$ = this.store$.pipe(
      select(ngViewerSelectorPanelMode),
      distinctUntilChanged(),
      tap(mode => this.panelMode = mode),
    )
  }

  public ngOnInit() {
    this.subscriptions.push(

      this.panelMode$.subscribe(panelMode => {
        removeTouchSideClasses(this.el.nativeElement)
        addTouchSideClasses(this.el.nativeElement, this.panelNativeIndex, panelMode)
      }),
    )
  }

  public ngOnDestroy() {
    while (this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }
}
