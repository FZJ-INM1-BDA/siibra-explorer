import { ComponentPortal } from "@angular/cdk/portal";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, Inject, Optional } from "@angular/core";
import { RM_WIDGET, EnumWidgetState } from "../constants";

type TWidgetCss = {
  transform: string
  width: string
}

const widgetStateToTransform: Record<EnumWidgetState, TWidgetCss> = {
  [EnumWidgetState.MINIMIZED]: {
    transform: `translate(100vw, 5vh)`,
    width: '24rem'
  },
  [EnumWidgetState.NORMAL]: {
    transform: `translate(calc(100vw - 24rem), 5vh)`,
    width: '24rem'
  },
  [EnumWidgetState.MAXIMIZED]: {
    transform: `translate(5vw, 5vh)`,
    width: '90vw'
  },
}

@Component({
  selector: 'sxplr-widget-portal',
  templateUrl: './widgetPortal.template.html',
  styleUrls: [
    './widgetPortal.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class WidgetPortal<T>{

  EnumWidgetState = EnumWidgetState

  portal: ComponentPortal<T>
  
  private _name: string
  get name() {
    return this._name
  }
  set name(val) {
    this._name = val
    this.cdr.markForCheck()
  }

  minimizeReturnState: EnumWidgetState.NORMAL | EnumWidgetState.MAXIMIZED

  private _state: EnumWidgetState = EnumWidgetState.NORMAL
  get state() {
    return this._state
  }
  set state(val: EnumWidgetState) {
    if (val === EnumWidgetState.MINIMIZED) {
      this.minimizeReturnState = this._state !== EnumWidgetState.MINIMIZED
        ? this._state
        : EnumWidgetState.NORMAL
    }
    this._state = val
    this.transform = widgetStateToTransform[this._state]?.transform || widgetStateToTransform[EnumWidgetState.NORMAL].transform
    this.width = widgetStateToTransform[this._state]?.width || widgetStateToTransform[EnumWidgetState.NORMAL].width

    this.cdr.markForCheck()
  }

  @HostBinding('style.transform')
  transform = widgetStateToTransform[ EnumWidgetState.NORMAL ].transform

  @HostBinding('style.width')
  width = widgetStateToTransform[ EnumWidgetState.NORMAL ].width

  constructor(
    private cdr: ChangeDetectorRef,
    @Optional() @Inject(RM_WIDGET) private rmWidget: (inst: unknown) => void
  ){
    
  }
  exit(){
    if (this.rmWidget) this.rmWidget(this)
  }
}
