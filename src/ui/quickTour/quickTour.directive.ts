import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import {ComponentRef, Directive, HostListener} from "@angular/core";
import { take } from "rxjs/operators";
import {QuickTourComponent} from "src/ui/quickTour/quickToutCmp/quickTour.component";

@Directive({
  selector: '[quick-tour]'
})

export class QuickTourDirective {
    public touring = false

    private overlayRef: OverlayRef
    private cmpRef: ComponentRef<QuickTourComponent>

    @HostListener('window:keydown', ['$event'])
    keyListener(ev: KeyboardEvent){
      if (ev.key === 'Escape') {
        if (this.overlayRef) this.dispose()
      }
    }

    @HostListener('click')
    onClick(){

      this.overlayRef = this.overlay.create({

        height: '0px',
        width: '0px',

        hasBackdrop: false,
        positionStrategy: this.overlay.position().global(),
        // panelClass: ['w-100', 'h-100'],
      })

      this.cmpRef = this.overlayRef.attach(
        new ComponentPortal(QuickTourComponent)
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
      this.touring = true
    }

    clear(){
      this.touring = false
    }

    constructor(private overlay: Overlay){}

}
