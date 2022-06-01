import { ComponentPortal } from "@angular/cdk/portal";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from "@angular/core";
import { WidgetService } from "../service";

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
    private wSvc: WidgetService,
    private cdr: ChangeDetectorRef,
  ){
    
  }
  exit(){
    this.wSvc.rmWidget(this)
  }
}
