import { Injectable, OnDestroy, ComponentFactoryResolver, Injector, ComponentRef, ApplicationRef, EmbeddedViewRef, TemplateRef, ComponentFactory } from '@angular/core';
import './sl-style.css'
import { SpotlightBackdropComponent } from './spotlight-backdrop/spotlight-backdrop.component';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SlServiceService implements OnDestroy{

  private backdropRef: ComponentRef<SpotlightBackdropComponent>
  private dom: HTMLElement
  private cf: ComponentFactory<SpotlightBackdropComponent>
  onClick: Subject<MouseEvent> = new Subject()
  
  constructor(
    cfr: ComponentFactoryResolver,
    private injector: Injector,
    private appRef: ApplicationRef
  ) {
    this.cf = cfr.resolveComponentFactory(SpotlightBackdropComponent)
  }

  /**
   * TODO use angular cdk overlay
   */
  public showBackdrop(tmp?: TemplateRef<any>){
    this.hideBackdrop()

    this.backdropRef = this.cf.create(this.injector)
    this.backdropRef.instance.slService = this
    this.backdropRef.instance.insert = tmp

    this.appRef.attachView(this.backdropRef.hostView)
    this.dom = (this.backdropRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement
    document.body.appendChild(this.dom)
  }

  public hideBackdrop(){
    this.backdropRef && this.appRef.detachView(this.backdropRef.hostView)
    this.backdropRef && this.backdropRef.destroy()
  }

  ngOnDestroy(){
    this.hideBackdrop()
  }
}
