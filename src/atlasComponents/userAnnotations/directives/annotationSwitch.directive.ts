import { Directive, HostListener, Input } from "@angular/core";
import { ModularUserAnnotationToolService } from "../tools/service";

@Directive({
  selector: '[annotation-switch]'
})
export class AnnotationSwitch {

  @Input('annotation-switch-mode')
  mode: 'toggle' | 'off' | 'on' = 'on'

  constructor(
    private svc: ModularUserAnnotationToolService,
  ) {
  }

  @HostListener('click')
  onClick() {
    this.svc.switchAnnotationMode(this.mode)
  }
}
