import { AfterViewInit, Directive, HostListener, Input, OnDestroy, TemplateRef, ViewContainerRef } from "@angular/core";
import { ContextMenuService } from "./service";
import { TContextArg } from "src/viewerModule/viewer.interface";

@Directive({
  selector: '[ctx-menu-host]'
})

export class CtxMenuHost implements OnDestroy, AfterViewInit{

  @Input('ctx-menu-host-tmpl')
  tmplRef: TemplateRef<any>

  @HostListener('contextmenu', ['$event'])
  onClickListener(ev: MouseEvent){
    this.svc.showCtxMenu(ev, this.tmplRef)
  }

  constructor(
    private vcr: ViewContainerRef,
    private svc: ContextMenuService<TContextArg<'nehuba' | 'threeSurfer'>>,
  ){
  }

  ngAfterViewInit(){
    this.svc.vcr = this.vcr
  }
  ngOnDestroy(){
    this.svc.vcr = null
  }
}
