import { Directive, HostListener } from "@angular/core";
import { TViewerEvtCtxData } from "src/viewerModule/viewer.interface";
import { ContextMenuService } from "./service";

@Directive({
  selector: '[ctx-menu-dismiss]'
})

export class DismissCtxMenuDirective{
  @HostListener('click')
  onClickListener() {
    this.svc.dismissCtxMenu()
  }

  constructor(
    private svc: ContextMenuService<TViewerEvtCtxData<'threeSurfer' | 'nehuba'>>
  ){

  }
}
