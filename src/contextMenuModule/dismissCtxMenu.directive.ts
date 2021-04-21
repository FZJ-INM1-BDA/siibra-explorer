import { Directive, HostListener } from "@angular/core";
import { ContextMenuService } from "./service";

@Directive({
  selector: '[ctx-menu-dismiss]'
})

export class DismissCtxMenuDirective{
  @HostListener('click', ['$event'])
  onClickListener(ev: MouseEvent) {
    this.svc.dismissCtxMenu()
  }

  constructor(
    private svc: ContextMenuService
  ){

  }
}
