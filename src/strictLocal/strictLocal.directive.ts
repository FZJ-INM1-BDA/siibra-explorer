import { ComponentFactoryResolver, Directive, HostBinding, ViewContainerRef } from "@angular/core";
import { environment } from "src/environments/environment"
import { StrictLocalInfo } from "./strictLocalCmp/strictLocalCmp.component";

@Directive({
  selector: '[sxplr-hide-when-local]',
  exportAs: 'hideWhenLocal'
})

export class HideWhenLocal {
  @HostBinding('style.display')
  hideWhenLocal = environment.STRICT_LOCAL ? 'none!important' : null
  constructor(
    private vc: ViewContainerRef,
    private cfr: ComponentFactoryResolver,
  ){
    if (environment.STRICT_LOCAL) {
      const cf = this.cfr.resolveComponentFactory(StrictLocalInfo)
      this.vc.createComponent(cf)
    }
  }
}
