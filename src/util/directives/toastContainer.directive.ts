import { Directive, ViewContainerRef, ComponentFactoryResolver, TemplateRef, ComponentRef } from '@angular/core'
import { ToastService, defaultToastConfig } from 'src/services/toastService.service';
import { ToastComponent } from 'src/components/toast/toast.component';
import { AtlasViewerAPIServices } from 'src/atlasViewer/atlasViewer.apiService.service';
import { ToastHandler } from '../pluginHandlerClasses/toastHandler';

@Directive({
  selector: '[toastDirective]'
})

export class ToastContainerDirective{
  constructor(
    private viewContainerRef: ViewContainerRef,
    private toastService: ToastService,
    private cfr: ComponentFactoryResolver,
    private apiService: AtlasViewerAPIServices
  ){
    const toastComponentFactory = this.cfr.resolveComponentFactory(ToastComponent)
    
    this.toastService.showToast = (message, config = {}) => {

      const _config = {
        ...defaultToastConfig,
        ...config
      } 
      const toastComponent = this.viewContainerRef.createComponent(toastComponentFactory)
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

    this.apiService.interactiveViewer.uiHandle.getToastHandler = () => {
      const handler = new ToastHandler()
      let toastComponent:ComponentRef<ToastComponent>
      handler.show = () => {
        toastComponent = this.viewContainerRef.createComponent(toastComponentFactory)

        toastComponent.instance.dismissable = handler.dismissable
        toastComponent.instance.message = handler.message
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
}