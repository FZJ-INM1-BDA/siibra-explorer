import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { ComponentRef, Directive, HostListener } from "@angular/core";
import { take } from "rxjs/operators";
import { ScreenshotCmp } from "./screenshotCmp/screenshot.component";

@Directive({
  selector: '[screenshot-switch]'
})

export class ScreenshotSwitch{
  public takingScreenshot = false

  private overlayRef: OverlayRef
  private cmpRef: ComponentRef<ScreenshotCmp>

  @HostListener('window:keydown', ['$event'])
  keyListener(ev: KeyboardEvent){
    if (ev.key === 'Escape') {
      if (this.overlayRef) this.dispose()
    }
  }

  @HostListener('click')
  onClick(){
    /**
     * button should act as a toggle?
     */
    
    this.overlayRef = this.overlay.create({
      hasBackdrop: false,
      positionStrategy: this.overlay.position().global().centerVertically(),
      panelClass: ['w-100', 'h-100'],
    })

    this.cmpRef = this.overlayRef.attach(
      new ComponentPortal(ScreenshotCmp)
    )
    
    this.cmpRef.instance.destroy.pipe(
      take(1)
    ).subscribe(
      () => {
        this.dispose()
      }
    )
    
    
  }

  dispose(){
    this.cmpRef = null
    if (this.overlayRef) this.overlayRef.dispose()
    this.overlayRef = null
  }

  reset(){
    this.takingScreenshot = true
  }

  clear(){
    this.takingScreenshot = false
  }

  constructor(private overlay: Overlay){}

}