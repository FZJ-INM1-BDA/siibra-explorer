import {Directive, HostListener} from "@angular/core";
import {viewerStateSetViewerMode} from "src/services/state/viewerState/actions";
import {ARIA_LABELS} from "common/constants";
import {Store} from "@ngrx/store";
import {IavRootStoreInterface} from "src/services/stateStore.service";

@Directive({
  selector: '[annotation-switch]'
})
export class AnnotationSwitch {


  constructor(private store$: Store<IavRootStoreInterface>) {

  }

  @HostListener('click')
  onClick() {
    this.setAnnotatingMode()
  }

  setAnnotatingMode() {
    this.store$.dispatch(viewerStateSetViewerMode({payload: ARIA_LABELS.VIEWER_MODE_ANNOTATING}))
  }
}
