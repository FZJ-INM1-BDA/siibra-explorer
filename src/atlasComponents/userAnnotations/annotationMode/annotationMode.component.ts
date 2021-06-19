import { Component, Inject, OnDestroy, Optional } from "@angular/core";
import { Store } from "@ngrx/store";
import { ModularUserAnnotationToolService } from "../tools/service";
import { viewerStateSetViewerMode } from "src/services/state/viewerState.store.helper";
import { ARIA_LABELS } from 'common/constants'
import { ClickInterceptor, CLICK_INTERCEPTOR_INJECTOR } from "src/util";

@Component({
  selector: 'annotating-tools-panel',
  templateUrl: './annotationMode.template.html',
  styleUrls: ['./annotationMode.style.css']
})
export class AnnotationMode implements OnDestroy{

  public ARIA_LABELS = ARIA_LABELS

  public moduleAnnotationTypes: {
    instance: {
      name: string
      iconClass: string
    }
    onClick: Function
  }[] = []

  private onDestroyCb: Function[] = []

  constructor(
    private store$: Store<any>,
    private modularToolSvc: ModularUserAnnotationToolService,
    @Optional() @Inject(CLICK_INTERCEPTOR_INJECTOR) clickInterceptor: ClickInterceptor,
  ) {
    this.moduleAnnotationTypes = this.modularToolSvc.moduleAnnotationTypes
    if (clickInterceptor) {
      const { register, deregister } = clickInterceptor
      const stopClickProp = () => false
      register(stopClickProp)
      this.onDestroyCb.push(() => deregister(stopClickProp))
    }
  }

  exitAnnotationMode(){
    this.store$.dispatch(
      viewerStateSetViewerMode({
        payload: null
      })
    )
  }
  deselectTools(){
    this.modularToolSvc.deselectTools()
  }

  ngOnDestroy(){
    while (this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
  }
}
