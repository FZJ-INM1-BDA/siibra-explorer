import { Directive, HostListener, Inject, Input, Optional } from "@angular/core";
import { viewerStateSetViewerMode } from "src/services/state/viewerState/actions";
import { ARIA_LABELS } from "common/constants";
import { select, Store } from "@ngrx/store";
import { TContextArg } from "src/viewerModule/viewer.interface";
import { TContextMenuReg } from "src/contextMenuModule";
import { CONTEXT_MENU_ITEM_INJECTOR, TContextMenu } from "src/util";
import { ModularUserAnnotationToolService } from "../tools/service";
import { Subscription } from "rxjs";
import { viewerStateViewerModeSelector } from "src/services/state/viewerState/selectors";

@Directive({
  selector: '[annotation-switch]'
})
export class AnnotationSwitch {

  @Input('annotation-switch-mode')
  mode: 'toggle' | 'off' | 'on' = 'on'

  private currMode = null
  private subs: Subscription[] = []
  constructor(
    private store$: Store<any>,
    private svc: ModularUserAnnotationToolService,
    @Optional() @Inject(CONTEXT_MENU_ITEM_INJECTOR) ctxMenuInterceptor: TContextMenu<TContextMenuReg<TContextArg<'nehuba' | 'threeSurfer'>>>
  ) {
    this.subs.push(
      this.store$.pipe(
        select(viewerStateViewerModeSelector)
      ).subscribe(mode => {
        this.currMode = mode
      })
    )
  }

  @HostListener('click')
  onClick() {
    let payload = null
    if (this.mode === 'on') payload = ARIA_LABELS.VIEWER_MODE_ANNOTATING
    if (this.mode === 'off') {
      if (this.currMode === ARIA_LABELS.VIEWER_MODE_ANNOTATING) payload = null
      else return
    }
    if (this.mode === 'toggle') {
      payload = this.currMode === ARIA_LABELS.VIEWER_MODE_ANNOTATING
        ? null
        : ARIA_LABELS.VIEWER_MODE_ANNOTATING
    }
    this.store$.dispatch(
      viewerStateSetViewerMode({ payload })
    )
  }
}
