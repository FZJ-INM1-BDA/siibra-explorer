import { Directive, HostListener } from "@angular/core";
import { viewerStateSetViewerMode } from "src/services/state/viewerState/actions";
import { ARIA_LABELS } from "common/constants";
import { Store } from "@ngrx/store";

@Directive({
  selector: '[annotation-switch]'
})
export class AnnotationSwitch {
  constructor(private store$: Store<any>) {}

  @HostListener('click')
  onClick() {
    this.store$.dispatch(
      viewerStateSetViewerMode({
        payload: ARIA_LABELS.VIEWER_MODE_ANNOTATING
      })
    )
  }
}
