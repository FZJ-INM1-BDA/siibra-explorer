import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal, Portal } from "@angular/cdk/portal";
import { Injectable, InjectionToken, Injector } from "@angular/core";
import { SxplrOverlay } from "./overlay.component";

export type SxplrOverlayCfg = {
  message: string
  useMarkdown?: boolean
}

export const OVELAY_DATA = new InjectionToken<SxplrOverlayCfg>("OVELAY_DATA", {
  factory: () => {
    return {
      message: "No Message"
    }
  }
})

@Injectable()
export class SxplrOverlaySvc{
  overlayRef: OverlayRef
  cmpRef: ComponentPortal<unknown>

  constructor(private overlay: Overlay){}
  close(){
    this.cmpRef = null
    if (this.overlayRef) this.overlayRef.dispose()
    this.overlayRef = null
  }
  open(cfg: SxplrOverlayCfg){
    const injector = Injector.create({
      providers: [
        {
          provide: OVELAY_DATA,
          useValue: cfg
        }
      ]
    })
    this.cmpRef = new ComponentPortal(SxplrOverlay, null, injector)
    this.openPortal(this.cmpRef)
  }

  openPortal(portal: Portal<unknown>){
    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      positionStrategy: this.overlay.position().global().centerVertically(),
      panelClass: ['center-a-div'],
    })
    this.overlayRef.attach(portal)
  }
}
