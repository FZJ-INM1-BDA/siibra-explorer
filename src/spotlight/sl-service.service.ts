import { Injectable, Injector, OnDestroy, TemplateRef } from '@angular/core';
import { Subject } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { SpotlightBackdropComponent } from './spotlight-backdrop/spotlight-backdrop.component';
import { TMPL_INJ_TOKEN } from './const';

@Injectable({
  providedIn: 'root'
})
export class SlServiceService implements OnDestroy{

  onClick: Subject<MouseEvent> = new Subject()
  private overlayRef: OverlayRef

  constructor(
    private overlay: Overlay,
    private injector: Injector,
  ) {
  }

  public showBackdrop(tmp: TemplateRef<any>){
    this.hideBackdrop()

    const positionStrategy = this.overlay.position()
      .global()
      .centerHorizontally()
      .centerVertically()
    
    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
    })

    const injector = Injector.create({
      parent: this.injector,
      providers: [{
        provide: SlServiceService,
        useValue: this
      }, {
        provide: TMPL_INJ_TOKEN,
        useValue: tmp
      }]
    })
    const portal = new ComponentPortal(SpotlightBackdropComponent, null, injector)
    this.overlayRef.attach(portal)
    
  }

  public hideBackdrop(){
    if (this.overlayRef) {
      this.overlayRef.dispose()
      this.overlayRef = null
    }
  }

  ngOnDestroy(){
    this.hideBackdrop()
  }
}
