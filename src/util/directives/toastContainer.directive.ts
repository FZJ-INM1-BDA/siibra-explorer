import { Directive, ViewContainerRef,ComponentFactory, ComponentFactoryResolver, TemplateRef, ComponentRef } from '@angular/core'
import { ToastService, defaultToastConfig } from 'src/services/toastService.service';
import { ToastComponent } from 'src/components/toast/toast.component';
import { AtlasViewerAPIServices } from 'src/atlasViewer/atlasViewer.apiService.service';
import { ToastHandler } from '../pluginHandlerClasses/toastHandler';

@Directive({
  selector: '[toastDirective]'
})

export class ToastContainerDirective{

  private toastComponentFactory: ComponentFactory<ToastComponent>

  constructor(
    private viewContainerRef: ViewContainerRef,
    private toastService: ToastService,
    private cfr: ComponentFactoryResolver,
    private apiService: AtlasViewerAPIServices
  ){
    this.toastComponentFactory = this.cfr.resolveComponentFactory(ToastComponent)
    
    this.toastService.showToast = (message, config = {}) => {

      const _config = {
        ...defaultToastConfig,
        ...config
      } 
      const toastComponent = this.viewContainerRef.createComponent(this.toastComponentFactory)
      if(typeof message === 'string')
        toastComponent.instance.message = message
      if(message instanceof TemplateRef){
        toastComponent.instance.messageContainer.createEmbeddedView(message as TemplateRef<any>)
      }
         
      toastComponent.instance.dismissable = _config.dismissable
      toastComponent.instance.timeout = _config.timeout

      let subscription

      const dismissToast = () => {
        if(subscription) subscription.unsubscribe()
        toastComponent.destroy()
      }

      subscription = toastComponent.instance.dismissed.subscribe(dismissToast)
      return dismissToast
    }

    this.toastService.getToastHandler = () => {
      return this.getToastHandler()
    }

    this.apiService.interactiveViewer.uiHandle.getToastHandler = () => {
      return this.getToastHandler()
    }
  }

  public getToastHandler(){
    const handler = new ToastHandler()
    let toastComponent:ComponentRef<ToastComponent>
    handler.show = () => {
      toastComponent = this.viewContainerRef.createComponent(this.toastComponentFactory)

      toastComponent.instance.dismissable = handler.dismissable

      if (typeof handler.message === 'string') toastComponent.instance.message = handler.message
      if (handler.message instanceof TemplateRef) toastComponent.instance.messageContainer.createEmbeddedView(handler.message as TemplateRef<any>)
      toastComponent.instance.htmlMessage = handler.htmlMessage
      toastComponent.instance.timeout = handler.timeout

      const _subscription = toastComponent.instance.dismissed.subscribe(userInitiated => {
        _subscription.unsubscribe()
        handler.hide()
      })
    }

    handler.hide = () => {
      if(toastComponent){
        toastComponent.destroy()
        toastComponent = null
      }
    }

    return handler
  }
}
