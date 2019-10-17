import { Directive, Input, ElementRef, OnDestroy, OnInit } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { Observable, Subscription } from "rxjs";
import { distinctUntilChanged, tap } from "rxjs/operators";
import { removeTouchSideClasses, addTouchSideClasses } from "./util";

@Directive({
  selector: '[touch-side-class]',
  exportAs: 'touchSideClass'
})

export class TouchSideClass implements OnDestroy, OnInit{
  @Input('touch-side-class')
  public panelNativeIndex: number

  public panelMode: string
  private panelMode$: Observable<string>

  private subscriptions: Subscription[] = []

  constructor(
    private store$: Store<any>,
    private el: ElementRef
  ){

    this.panelMode$ = this.store$.pipe(
      select('ngViewerState'),
      select('panelMode'),
      distinctUntilChanged(),
      tap(mode => this.panelMode = mode)
    )
  }

  ngOnInit(){
    this.subscriptions.push(

      this.panelMode$.subscribe(panelMode => {
        removeTouchSideClasses(this.el.nativeElement)
        addTouchSideClasses(this.el.nativeElement, this.panelNativeIndex, panelMode)
      })
    )
  }

  ngOnDestroy(){
    while(this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }
}