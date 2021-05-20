import { AfterViewInit, Directive, HostListener, Input, OnDestroy, TemplateRef, ViewContainerRef } from "@angular/core";
import { ContextMenuService } from "./service";
import {select, Store} from "@ngrx/store";
import {viewerStateViewerModeSelector} from "src/services/state/viewerState/selectors";
import {take} from "rxjs/operators";
import {ARIA_LABELS} from "common/constants";

@Directive({
  selector: '[ctx-menu-host]'
})

export class CtxMenuHost implements OnDestroy, AfterViewInit{

  @Input('ctx-menu-host-tmpl')
  tmplRef: TemplateRef<any>

  @HostListener('contextmenu', ['$event'])
  onClickListener(ev: MouseEvent){
    let viewerMode: string
    this.store$.pipe(select(viewerStateViewerModeSelector), take(1)).subscribe(vm => viewerMode = vm)
    if (viewerMode === ARIA_LABELS.VIEWER_MODE_ANNOTATING) return
    this.svc.showCtxMenu(ev, this.tmplRef)
  }

  constructor(
    private vcr: ViewContainerRef,
    private svc: ContextMenuService,
    private store$: Store<any>,
  ){
  }

  ngAfterViewInit(){
    this.svc.vcr = this.vcr
  }
  ngOnDestroy(){
    this.svc.vcr = null
  }
}
