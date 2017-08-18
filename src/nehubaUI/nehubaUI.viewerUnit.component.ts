import { ComponentRef,Directive,Type,OnInit,Component,ComponentFactoryResolver,ViewChild,ViewContainerRef }from '@angular/core'
import { EventCenter } from './nehubaUI.services'
import { EventPacket } from './nehuba.model'
// import { Subject } from 'rxjs/Subject'

import { Config as NehubaViewerConfig,NehubaViewer,createNehubaViewer } from 'nehuba/exports'


@Directive({
      selector : '[nehuba-viewer-host]'
})

export class NehubaViewerDirective{
      constructor(public viewContainerRef:ViewContainerRef){}
}

@Component({
      selector : 'NehubaViewer',
      template:`
<ng-template nehuba-viewer-host>
</ng-template>
      `
})

export class NehubaViewerInnerContainer implements OnInit{

      @ViewChild(NehubaViewerDirective) host : NehubaViewerDirective
      nehubaViewer : NehubaViewer
      componentRef : ComponentRef<any>
      viewContainerRef : ViewContainerRef
      templateLoaded : boolean = false

      constructor(
            private componentFactoryResolver: ComponentFactoryResolver,
            private eventCenter : EventCenter
      ){
            this.eventCenter.templateSelectionRelay.subscribe((msg:EventPacket)=>{
                  this.loadNewTemplate(msg.body.nehubaConfig,true)
            })

            this.eventCenter.navigationRelay.subscribe((msg:EventPacket)=>{
                  console.log('nehubaviewer.component',msg)
            })

            /* I have a feeling that this is where .next() needs to be called */
            this.eventCenter.navigationUpdateRelay.subscribe((msg:EventPacket)=>{
                  console.log('nehubaviewer.component update',msg)
            })
      }

      ngOnInit(){
            this.viewContainerRef = this.host.viewContainerRef
      }

      loadNewTemplate(nehubaViewerConfig:NehubaViewerConfig,darktheme:boolean){
            if ( this.templateLoaded ){
                  (<NehubaViewerComponent>this.componentRef.instance).nehubaViewer.dispose()
                  this.componentRef.destroy()
            } else {
                  let newNehubaViewerUnit = new NehubaViewerUnit(NehubaViewerComponent,nehubaViewerConfig,darktheme)
                  let nehubaViewerFactory = this.componentFactoryResolver.resolveComponentFactory( newNehubaViewerUnit.component )
                  this.componentRef = this.viewContainerRef.createComponent( nehubaViewerFactory );
                  (<NehubaViewerComponent>this.componentRef.instance).loadTemplate(nehubaViewerConfig,darktheme)
            }
            this.templateLoaded = !this.templateLoaded
      }
}

@Component({
      template : `
<div id = "container">
</div>
      `,
      styles : [
            `
div#container{
      width:100%;
      height:100%;
}
            `
      ]
})
export class NehubaViewerComponent{
      public nehubaViewer : NehubaViewer
      viewerConfig : NehubaViewerConfig
      darktheme : boolean

      public loadTemplate(config:NehubaViewerConfig,darktheme:boolean){
            darktheme
            this.nehubaViewer = createNehubaViewer(config,(err)=>{
                  console.log('createnehubaviewer error handler',err)
            })
            this.nehubaViewer.applyInitialNgState()
            this.nehubaViewer.redraw()
            this.nehubaViewer.relayout()
      }

}

export class NehubaViewerUnit{
      viewerConfig : NehubaViewerConfig
      darktheme : boolean

      constructor(public component:Type<any>,viewerConfig:NehubaViewerConfig,darktheme:boolean){  
            this.darktheme = darktheme
            this.viewerConfig = viewerConfig
      }
}
