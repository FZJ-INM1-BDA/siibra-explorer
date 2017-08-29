import { OnDestroy,ComponentRef,Directive,Type,OnInit,Component,ComponentFactoryResolver,ViewChild,ViewContainerRef }from '@angular/core'
import { Subject } from 'rxjs/Rx'

import { Config as NehubaViewerConfig,NehubaViewer,createNehubaViewer,vec3,quat } from 'nehuba/exports'

import { EventCenter,Animation,EVENTCENTER_CONST } from './nehubaUI.services'
import { EventPacket } from './nehuba.model'
import { CM_THRESHOLD,CM_MATLAB_HOT,CM_DEFAULT_MAP } from './nehuba.config'

declare var window:{
      [key:string] : any
      prototype : Window;
      new() : Window;
}


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

      colorMap : Map<number,{}>

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
                              this.loadLayer(msg)
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

      loadNewTemplateHook : any[] = []

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

            this.nehubaViewerComponent.nehubaViewer.mouseOver.layer.subscribe((im:any)=>{
                  this.eventCenter.userViewerInteractRelay.next(new EventPacket(
                        'layerMouseOver',
                        Date.now().toString(),
                        100,
                        {layer:im}
                  ))
            })
            
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

      pMapFloatingWidget : Subject<EventPacket>
      loadLayer(msg:EventPacket){
            let curtainModalSubject = this.eventCenter.createNewRelay(new EventPacket('curtainModal','',100,{}))
            curtainModalSubject.next(new EventPacket('curtainModal','',100,{title:'Loading PMap',body:'fetching '+msg.body.url + ' This modal current is dismissed after 3 seconds. In the future, it should dismiss automatically when the PMap is loaded.'}))
            curtainModalSubject.subscribe((evPk:EventPacket)=>{
                  switch (evPk.code){
                        case 101:{
                              this.nehubaViewerComponent.loadLayer(msg.body.url)
                              setTimeout(()=>{
                                    curtainModalSubject.next(new EventPacket('curtainModal','',102,{}))
                             
                                    /* TODO: pMapFlatingWidget should either be with multilevel or floating widget, and not in viewer.component */
                                    this.pMapFloatingWidget = this.eventCenter.createNewRelay(new EventPacket('floatingWidgetRelay','',100,{}))
                                    this.pMapFloatingWidget.next(new EventPacket('loadCustomFloatingWidget','',100,{
                                          title : 'PMap for ' + msg.body.title,
                                          body : [
                                                {
                                                      "_activeCell" : true,
                                                      "_elementTagName" : "img",
                                                      "_class" : "col-md-12",
                                                      "_src" : "http://172.104.156.15:8080/colormaps/MATLAB_hot.png"
                                                },{
                                                      "Encoded Value":
                                                            {
                                                                  "_activeCell" : true,
                                                                  "_elementTagName" : "div",
                                                                  "_class" : "col-md-12",
                                                                  "_active" : "always",
                                                                  "_id" : "pmap_value",
                                                                  "_value" : '0'
                                                            }
                                                },
                                                "To return to normal browsing, close this Dialogue."
                                          ],
                                          eventListeners : [
                                                {
                                                      "event" : "layerMouseOver",
                                                      "filters": [{
                                                                  "layer":{
                                                                        "layer":{
                                                                              "name" : "PMap"
                                                                        }
                                                                  }
                                                            }],
                                                      "values":[{
                                                                  "layer":{
                                                                        "value":"pmap_value | number:'1.4-4'"
                                                                  }
                                                            }],
                                                      "scripts" : []
                                                }
                                          ]
                                    }))
                                    this.pMapFloatingWidget.subscribe((evPk:EventPacket)=>{
                                          switch (evPk.code){
                                                case 200:
                                                case 404:{
                                                      let json = this.nehubaViewerComponent.nehubaViewer.ngviewer.state.toJSON()
                                                      json.layers.PMap.visible = false
                                                      json.layers.atlas.visible = true
                                                      this.nehubaViewerComponent.nehubaViewer.ngviewer.state.restoreState(json)
                                                      this.pMapFloatingWidget.unsubscribe()
                                                      
                                                      /* TODO:temporary. need to load specific map for specific atlases */
                                                      this.nehubaViewerComponent.nehubaViewer.batchAddAndUpdateSegmentColors(CM_DEFAULT_MAP)
                                                      console.log(this.pMapFloatingWidget)
                                                }break;
                                          }
                                    })
                              },3000)
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
<div id = "container" [ngClass]="{darktheme : darktheme}"
      (mousedown)="mousehandler('mousedown',$event)" 
      (mouseup)="mousehandler('mouseup',$event)" 
      (click)="mousehandler('click',$event)" 
      (mousemove)="mousehandler('mousemove',$event)" >
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
export class NehubaViewerComponent implements OnDestroy{
      public nehubaViewer : NehubaViewer
      viewerConfig : NehubaViewerConfig
      darktheme : boolean
      viewerPos : number[] = [0,0,0]
      viewerOri : number[] = [0,0,1,0]

      onDestroyUnsubscribe : any[] = []
      mouseEventSubject : Subject<any>

      constructor(){
            this.mouseEventSubject = new Subject()
            window['mouseEvent'] = this.mouseEventSubject
      }

      public ngOnDestroy(){
            this.onDestroyUnsubscribe.forEach((subscription:any)=>{
                  subscription.unsubscribe()
            })
            window['nehubaViewer'] = null
            window['mouseEvent'] = null
      }

      public mousehandler(mode:string,ev:any){
            this.mouseEventSubject.next({
                  mode : mode,
                  ev : ev
            })
      }

      public loadTemplate(config:NehubaViewerConfig){
            this.nehubaViewer = createNehubaViewer(config,(err)=>{
                  /* TODO: error handling?*/
                  console.log('createnehubaviewer error handler',err)
            })
            this.nehubaViewer.applyInitialNgState()
            this.nehubaViewer.redraw()
            this.nehubaViewer.relayout()
            this.nehubaViewer.batchAddAndUpdateSegmentColors(CM_DEFAULT_MAP)

            /* set navigation callback */
            let navigationSubscription = this.nehubaViewer.addNavigationStateCallbackInRealSpaceCoordinates((pos)=>{
                  this.viewerPos[0] = pos[0]
                  this.viewerPos[1] = pos[1]
                  this.viewerPos[2] = pos[2]
            })

            this.onDestroyUnsubscribe.push( navigationSubscription )

            window['nehubaViewer'] = this.nehubaViewer
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

      //TODO: do this properly with proper api's
      public loadLayer(url:string){
            let json = this.nehubaViewer.ngviewer.state.toJSON()
            json.layers.PMap = {
                  type : "image",
                  source : "nifti://"+url,
                  shader : `void main(){float x=toNormalized(getDataValue());${CM_MATLAB_HOT}if(x>${CM_THRESHOLD}){emitRGB(vec3(r,g,b));}else{emitTransparent();}}`
            }
            json.layers.atlas.visible = false
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
