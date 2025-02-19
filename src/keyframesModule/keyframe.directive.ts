import { Directive, HostListener, Input, inject } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { atlasSelection } from "src/state";
import { takeUntil } from "rxjs/operators";
import { ViewerMode } from "src/state/atlasSelection/const";

@Directive({
  selector: '[key-frame-play-now]',
  hostDirectives: [DestroyDirective]
})

export class KeyFrameDirective{

  #viewerMode: ViewerMode
  #onDestroy$ = inject(DestroyDirective).destroyed$

  @HostListener('click')
  onClick(){
    if (this.mode === 'on') {
      if (this.#viewerMode !== "key frame") {
        this.store.dispatch(
          atlasSelection.actions.setViewerMode({
            viewerMode: "key frame"
          })
        )
      }
      return
    }
    if (this.mode === 'off') {
      if (this.#viewerMode === "key frame") {
        this.store.dispatch(
          atlasSelection.actions.setViewerMode({
            viewerMode: null
          })
        )
      }
      return
    }

    this.store.dispatch(
      atlasSelection.actions.setViewerMode({
        viewerMode: this.#viewerMode === "key frame"
        ? null
        : "key frame"
      })
    )
  }

  @Input('key-frame-play-now')
  mode: 'toggle' | 'off' | 'on' | '' = 'on'

  constructor(private store: Store){
    this.store.pipe(
      select(atlasSelection.selectors.viewerMode),
      takeUntil(this.#onDestroy$),
    ).subscribe(viewerMode => {
      this.#viewerMode = viewerMode
    })
  }
}
