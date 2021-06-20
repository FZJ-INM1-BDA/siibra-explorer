import { Directive, HostListener } from "@angular/core";
import { TContextArg } from "src/viewerModule/viewer.interface";
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
    private svc: ContextMenuService<TContextArg<'threeSurfer' | 'nehuba'>>
  ){

  }
}
