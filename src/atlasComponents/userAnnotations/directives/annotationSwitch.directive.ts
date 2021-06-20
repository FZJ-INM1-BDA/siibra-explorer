import { Directive, HostListener, Inject, OnDestroy, Optional } from "@angular/core";
import { viewerStateSetViewerMode } from "src/services/state/viewerState/actions";
import { ARIA_LABELS } from "common/constants";
import { Store } from "@ngrx/store";
import { TContextArg } from "src/viewerModule/viewer.interface";
import { TContextMenuReg } from "src/contextMenuModule";
import { CONTEXT_MENU_ITEM_INJECTOR, TContextMenu } from "src/util";

@Directive({
  selector: '[annotation-switch]'
})
export class AnnotationSwitch implements OnDestroy{
  
  private onDestroyCb: Function[] = []

  constructor(
    private store$: Store<any>,
    @Optional() @Inject(CONTEXT_MENU_ITEM_INJECTOR) ctxMenuInterceptor: TContextMenu<TContextMenuReg<TContextArg<'nehuba' | 'threeSurfer'>>>
  ) {
    
  }

  ngOnDestroy(){
    while(this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
  }

  @HostListener('click')
  onClick() {
    this.store$.dispatch(
      viewerStateSetViewerMode({
        payload: ARIA_LABELS.VIEWER_MODE_ANNOTATING
      })
    )
  }
}
