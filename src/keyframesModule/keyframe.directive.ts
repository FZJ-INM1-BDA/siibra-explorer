import { Directive, HostListener, Input } from "@angular/core";
import { KeyFrameService } from "./service";

@Directive({
  selector: '[key-frame-play-now]'
})

export class KeyFrameDirective{
  @HostListener('click')
  onClick(){
    if (this._mode === 'on') {
      this.svc.startKeyFrameSession()
      return
    }
    if (this._mode === 'off') {
      this.svc.endKeyFrameSession()
      return
    }
    if (this.svc.inSession) {
      this.svc.endKeyFrameSession()
    } else {
      this.svc.startKeyFrameSession()
    }
  }

  private _mode: 'toggle' | 'off' | 'on' = 'on'
  @Input('key-frame-play-now')
  set mode(val: string){
    if (val === 'off') {
      this._mode = val
      return
    }
    if (val === 'toggle') {
      this._mode = val
      return
    }
    this._mode = 'on'
  }

  constructor(private svc: KeyFrameService){
  }
}
