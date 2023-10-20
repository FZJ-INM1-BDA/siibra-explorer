import { Component, Inject, OnDestroy, Optional } from "@angular/core";
import { ModularUserAnnotationToolService } from "../tools/service";
import { ARIA_LABELS } from 'common/constants'
import { ClickInterceptor, CLICK_INTERCEPTOR_INJECTOR, CONTEXT_MENU_ITEM_INJECTOR, TContextMenu } from "src/util";
import { TContextArg } from "src/viewerModule/viewer.interface";
import { TContextMenuReg } from "src/contextMenuModule";
import { MatSnackBar } from 'src/sharedModules/angularMaterial.exports'

@Component({
  selector: 'annotating-tools-panel',
  templateUrl: './annotationMode.template.html',
  styleUrls: ['./annotationMode.style.css'],
  exportAs: 'annoToolsPanel'
})
export class AnnotationMode implements OnDestroy{

  public annBadges$ = this.modularToolSvc.badges$

  public ARIA_LABELS = ARIA_LABELS

  public moduleAnnotationTypes = this.modularToolSvc.moduleAnnotationTypes

  private onDestroyCb: (() => void)[] = []

  constructor(
    private modularToolSvc: ModularUserAnnotationToolService,
    snackbar: MatSnackBar,
    @Optional() @Inject(CLICK_INTERCEPTOR_INJECTOR) clickInterceptor: ClickInterceptor,
    @Optional() @Inject(CONTEXT_MENU_ITEM_INJECTOR) ctxMenuInterceptor: TContextMenu<TContextMenuReg<TContextArg<'nehuba' | 'threeSurfer'>>>
  ) {
    const stopClickProp = () => false
    if (clickInterceptor) {
      const { register, deregister } = clickInterceptor
      register(stopClickProp)
      this.onDestroyCb.push(() => deregister(stopClickProp))
    }

    if (ctxMenuInterceptor) {
      const { deregister, register } = ctxMenuInterceptor
      register(stopClickProp)
      this.onDestroyCb.push(() => deregister(stopClickProp))
    }

    this.modularToolSvc.loadStoredAnnotations()
      .catch(e => {
        snackbar.open(`Loading annotations from storage failed: ${e.toString()}`, 'Dismiss', {
          duration: 3000
        })
      })
  }

  deselectTools(){
    this.modularToolSvc.deselectTools()
  }

  ngOnDestroy(){
    while (this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
  }
}
