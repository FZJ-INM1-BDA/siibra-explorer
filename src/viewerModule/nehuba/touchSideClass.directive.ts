import { Directive, ElementRef, Input, OnDestroy, OnInit } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Observable, Subscription } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { addTouchSideClasses, removeTouchSideClasses } from "src/viewerModule/nehuba/util";
import { userInterface } from "src/state"

@Directive({
  selector: '[touch-side-class]',
  exportAs: 'touchSideClass',
})

export class TouchSideClass implements OnDestroy, OnInit {
  @Input('touch-side-class')
  public panelNativeIndex: number

  public panelMode: userInterface.PanelMode
  private panelMode$: Observable<userInterface.PanelMode> = this.store$.pipe(
    select(userInterface.selectors.panelMode),
    distinctUntilChanged(),
  )

  private subscriptions: Subscription[] = []

  constructor(
    private store$: Store<any>,
    private el: ElementRef,
  ) {
  }

  public ngOnInit() {
    this.subscriptions.push(
      this.panelMode$.subscribe(panelMode => this.panelMode = panelMode),

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
