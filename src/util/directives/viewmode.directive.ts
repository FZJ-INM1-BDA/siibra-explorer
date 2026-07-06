import { Directive, HostListener, Input, inject } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { atlasSelection } from "src/state";
import { map, shareReplay, switchMap, takeUntil } from "rxjs/operators";
import { ViewerMode } from "src/state/atlasSelection/const";
import { Subject } from "rxjs";

@Directive({
  selector: '[sxplr-view-mode]',
  hostDirectives: [DestroyDirective],
  exportAs: "sxplrViewMode",
  standalone: true,
})

export class ViewerModeDirective{

    
  @Input('sxplr-view-mode')
  mode: 'toggle' | 'off' | 'on' | '' = 'on'

  @Input('sxplr-view-mode-target')
  target: ViewerMode|null = null

  #onDestroy$ = inject(DestroyDirective).destroyed$
  #click$ = new Subject()

  @HostListener('click')
  onClick(){
    this.#click$.next()
  }

  viewerMode$ = this.store.pipe(
    select(atlasSelection.selectors.viewerMode),
    shareReplay(1),
  )

  constructor(private store: Store){
    this.viewerMode$.pipe(
      switchMap(vm => this.#click$.pipe(
        map(() => vm)
      )),
      takeUntil(this.#onDestroy$),
    ).subscribe(currVm => {
      if (this.mode === "on") {
        if (!this.target) {
          return
        }
        this.store.dispatch(
          atlasSelection.actions.setViewerMode({
            viewerMode: this.target
          })
        )
        return
      }
      if (this.mode === "off") {
        this.store.dispatch(
          atlasSelection.actions.setViewerMode({
            viewerMode: null
          })
        )
        return
      }
      if (this.mode === "toggle") {
        const newVM = currVm === this.target ? null : this.target
        this.store.dispatch(
          atlasSelection.actions.setViewerMode({
            viewerMode: newVM
          })
        )
        return
      }
    })
  }
}
