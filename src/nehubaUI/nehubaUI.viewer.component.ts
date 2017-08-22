import { ComponentRef,Directive,Type,OnInit,Component,ComponentFactoryResolver,ViewChild,ViewContainerRef }from '@angular/core'
import { EventCenter,Animation,EVENTCENTER_CONST } from './nehubaUI.services'
import { EventPacket } from './nehuba.model'

import { Config as NehubaViewerConfig,NehubaViewer,createNehubaViewer,vec3,quat } from 'nehuba/exports'


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
      nehubaViewerComponent : NehubaViewerComponent
      componentRef : ComponentRef<any>
      viewContainerRef : ViewContainerRef
      templateLoaded : boolean = false
      darktheme : boolean = false

      constructor(
            private componentFactoryResolver: ComponentFactoryResolver,
            private eventCenter : EventCenter
      ){
            this.eventCenter.nehubaViewerRelay.subscribe((msg:EventPacket)=>{
                  switch(msg.target){
                        case EVENTCENTER_CONST.NEHUBAVIEWER.TARGET.LOAD_TEMPALTE:{
                              this.loadNewTemplate(msg.body.nehubaConfig)
                        }break;
                        case EVENTCENTER_CONST.NEHUBAVIEWER.TARGET.NAVIGATE:{
                              this.navigate(msg.body.pos,msg.body.rot)
                        }break;
                        case EVENTCENTER_CONST.NEHUBAVIEWER.TARGET.SHOW_SEGMENT:{
                              if(msg.body.segID == 0){
                                    this.hideAllSegments()
                              }else{
                                    this.showSegment(msg.body.segID)
                              }
                        }break;
                        case EVENTCENTER_CONST.NEHUBAVIEWER.TARGET.HIDE_SEGMENT:{
                              if(msg.body.segID == 0){
                                    this.showAllSegments()
                              }else{
                                    this.hideSegment(msg.body.segID)
                              }
                        }break;
                        case EVENTCENTER_CONST.NEHUBAVIEWER.TARGET.LOAD_LAYER:{
                              this.loadLayer(msg.body.url)
                        }
                  }
            })
            this.eventCenter.globalLayoutRelay.subscribe((msg:EventPacket)=>{
                  switch(msg.target){
                        case EVENTCENTER_CONST.GLOBALLAYOUT.TARGET.THEME:{
                              this.darktheme = msg.body.theme == 'dark' 
                        }break;
                  }
            })
      }

      ngOnInit(){
            this.viewContainerRef = this.host.viewContainerRef
      }

      loadNewTemplate(nehubaViewerConfig:NehubaViewerConfig){
            if ( this.templateLoaded ){
                  /* I'm not too sure what does the dispose method do (?) */
                  /* TODO: use something other than a flag? */
                  (<NehubaViewerComponent>this.componentRef.instance).nehubaViewer.dispose()
                  this.componentRef.destroy()
            } 
            
            let newNehubaViewerUnit = new NehubaViewerUnit(NehubaViewerComponent,nehubaViewerConfig,this.darktheme)
            let nehubaViewerFactory = this.componentFactoryResolver.resolveComponentFactory( newNehubaViewerUnit.component )
            this.componentRef = this.viewContainerRef.createComponent( nehubaViewerFactory );
            
            this.nehubaViewerComponent = <NehubaViewerComponent>this.componentRef.instance
            this.nehubaViewerComponent.loadTemplate(nehubaViewerConfig)
            this.nehubaViewerComponent.darktheme = this.darktheme
            
            this.templateLoaded = true
      }

      navigate(pos:vec3,rot:quat){
            this.nehubaViewerComponent.navigate(pos,rot)
      }

      showSegment(segID:any){
            this.nehubaViewerComponent.showSeg(segID)
      }

      hideSegment(segID:any){
            this.nehubaViewerComponent.hideSeg(segID)
      }

      showAllSegments(){
            this.nehubaViewerComponent.allSeg(true)
      }

      hideAllSegments(){
            this.nehubaViewerComponent.allSeg(false)
      }

      loadLayer(url:string){
            let id = Date.now().toString()
            let curtainModalSubject = this.eventCenter.createNewRelay(new EventPacket('curtainModal',id,100,{}))
            curtainModalSubject.next(new EventPacket('curtainModal',id,100,{title:'Loading PMap',body:'fetching '+url + ' This modal current is dismissed after 1.5 seconds. In the future, it should dismiss automatically when the PMap is loaded.'}))
            curtainModalSubject.subscribe((evPk:EventPacket)=>{
                  switch (evPk.code){
                        case 101:{
                              this.nehubaViewerComponent.loadLayer(url)
                              setTimeout(()=>{
                                    curtainModalSubject.next(new EventPacket('curtainModal','',102,{}))
                              },1500)
                        }break;
                        case 200:
                        case 404:{
                              curtainModalSubject.unsubscribe()
                        }break;
                  }
            })
      }
}

@Component({
      template : `
<div id = "container" [ngClass]="{darktheme : darktheme}">
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
      viewerPos : number[] = [0,0,0]
      viewerOri : number[] = [0,0,1,0]

      public loadTemplate(config:NehubaViewerConfig){
            this.nehubaViewer = createNehubaViewer(config,(err)=>{
                  /* TODO: error handling?*/
                  console.log('createnehubaviewer error handler',err)
            })
            this.nehubaViewer.applyInitialNgState()
            this.nehubaViewer.redraw()
            this.nehubaViewer.relayout()

            /* set navigation callback */
            this.nehubaViewer.setNavigationStateCallbackInRealSpaceCoordinates((pos,ori)=>{
                  this.viewerPos[0] = pos[0]
                  this.viewerPos[1] = pos[1]
                  this.viewerPos[2] = pos[2]

                  if( ori ){
                        this.viewerOri[0] = ori[0]
                        this.viewerOri[1] = ori[1]
                        this.viewerOri[2] = ori[2]
                        this.viewerOri[3] = ori[3]
                  }
            })
      }

      public navigate(pos:vec3,_rot:quat){
            /* TODO: implement rotation somehow oO */
            

            /* slice is required to make clones of the values */
            /* or else the values (startPos/deltaPos) will change mid-animation */
            let deltaPos = ([
                  pos[0]-this.viewerPos[0],
                  pos[1]-this.viewerPos[1],
                  pos[2]-this.viewerPos[2]
            ]).slice()
            let startPos = (this.viewerPos).slice()

            let iterator = (new Animation(300,'linear')).generate()
            let newAnimationFrame = () =>{
                  let iteratedValue = iterator.next()
                  this.nehubaViewer.setPosition(vec3.fromValues(
                        startPos[0]+deltaPos[0]*iteratedValue.value,
                        startPos[1]+deltaPos[1]*iteratedValue.value,
                        startPos[2]+deltaPos[2]*iteratedValue.value
                  ),true)
                  if(!iteratedValue.done){
                        requestAnimationFrame(newAnimationFrame)
                  }
            }
            requestAnimationFrame(newAnimationFrame)
      }

      public showSeg(id:number){
            this.nehubaViewer.showSegment(id)
      }

      public hideSeg(id:number){
            this.nehubaViewer.hideSegment(id)
      }

      public allSeg(show:boolean){
            this.nehubaViewer.getShownSegments().forEach(segID => {
                  this.nehubaViewer.hideSegment(segID)
            })
            if( !show ) {
                  this.nehubaViewer.showSegment(0)
            }
      }

      public loadLayer(_url:string){
            let json = this.nehubaViewer.ngviewer.state.toJSON()
            json.layers.PMap = {
                  type : "image",
                  source : "nifti://http://172.104.156.15/hOc1.nii",
                  shader : 'void main() {\n emitRGB(vec3(toNormalized(getDataValue()),0.,0.));\n}\n'
            }
            this.nehubaViewer.ngviewer.state.restoreState(json)
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
