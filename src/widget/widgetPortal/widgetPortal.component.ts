import { ComponentPortal } from "@angular/cdk/portal";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Optional } from "@angular/core";
import { RM_WIDGET } from "../constants";

@Component({
  selector: 'sxplr-widget-portal',
  templateUrl: './widgetPortal.template.html',
  styleUrls: [
    './widgetPortal.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class WidgetPortal<T>{

  portal: ComponentPortal<T>
  
  private _name: string
  get name() {
    return this._name
  }
  set name(val) {
    this._name = val
    this.cdr.markForCheck()
  }

  defaultPosition = {
    x: 200,
    y: 200,
  }

  constructor(
    private cdr: ChangeDetectorRef,
    @Optional() @Inject(RM_WIDGET) private rmWidget: (inst: unknown) => void
  ){
    
  }
  exit(){
    if (this.rmWidget) this.rmWidget(this)
  }
}
