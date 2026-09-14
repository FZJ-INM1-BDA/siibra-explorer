import { ComponentRef, Injectable, Injector, ViewContainerRef } from "@angular/core";
import { ComponentPortal } from "@angular/cdk/portal";
import { ToolbarWidget } from "./toolbarWidget.component";
import { RM_TOOLBAR_WIDGET } from "./consts";

@Injectable({
  providedIn: 'root'
})
export class ToolbarWidgetSvc {
  #viewRefMap = new Map<ToolbarWidget<any>, ComponentRef<ToolbarWidget<any>>>()
  vcr: ViewContainerRef | undefined
  addNewWidget<T>(Component: new (...arg: any) => T, injector: Injector) {
    if (!this.vcr) {
      throw new Error(`vcr not populated`)
    }
    
    const rmToken = injector.get(RM_TOOLBAR_WIDGET, null)
    
    const fallbackProviders = rmToken
      ? []
      : [{
          provide: RM_TOOLBAR_WIDGET,
          useValue: (cmp: ToolbarWidget<T>) => this.rmWidget(cmp)
        }]
    const inj = Injector.create({
      providers: [...fallbackProviders],
      parent: injector
    })

    const toolbarWidgetPortal = this.vcr.createComponent(
      ToolbarWidget,
      {
        index: 0,
        injector: inj,
      }
    ) as ComponentRef<ToolbarWidget<T>>
    const cmpPortal = new ComponentPortal<T>(Component, this.vcr, inj)

    toolbarWidgetPortal.instance.portal = cmpPortal
    this.#viewRefMap.set(toolbarWidgetPortal.instance, toolbarWidgetPortal)
    return toolbarWidgetPortal.instance
  }

  rmWidget<T>(cmp: ToolbarWidget<T>) {
    if (!this.vcr) {
      console.warn(`vcr not defined!`)
      return
    }
    
    const inst = this.#viewRefMap.get(cmp)
    if (!inst) {
      console.warn(`cmp ${cmp} not in map`)
      return
    }
    const idx = this.vcr.indexOf(inst.hostView)
    if (idx < 0) {
      console.warn(`index < 0, cannot remove`)
      return
    }
    this.vcr.remove(idx)
    this.#viewRefMap.delete(cmp)
  }
}