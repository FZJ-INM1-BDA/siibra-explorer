import { ComponentRef,Component,ComponentFactoryResolver,ViewContainerRef, ComponentFactory, ViewChild }from '@angular/core'

import { Config as NehubaViewerConfig,vec3 } from 'nehuba/exports'

import { MainController, InfoToUIService } from 'nehubaUI/nehubaUI.services'
import { NehubaViewerComponent } from 'nehubaUI/mainUI/viewer/nehubaUI.viewerUnit.component';


@Component({
  selector : 'NehubaViewer',
  template:`
    <ng-template #viewerHost>
    </ng-template>
  `,
  styles : [  ]
})

export class NehubaViewerInnerContainer {

  nehubaViewerComponent : NehubaViewerComponent
  componentRef : ComponentRef<any>
  private templateLoaded : boolean = false
  darktheme : boolean = false

  colorMap : Map<number,{}>

  private nehubaViewerFactory : ComponentFactory<NehubaViewerComponent>
  @ViewChild('viewerHost',{read:ViewContainerRef}) viewContainerRef : ViewContainerRef

  constructor(
    public mainController:MainController, 
    private componentFactoryResolver: ComponentFactoryResolver ,
    public infoToUI:InfoToUIService){

    this.nehubaViewerFactory = this.componentFactoryResolver.resolveComponentFactory( NehubaViewerComponent )

    this.mainController.selectedTemplateBSubject.subscribe((templateDescriptor)=>{
      if(!templateDescriptor) return
      this.loadTemplate(templateDescriptor.nehubaConfig)
    })

    /* todo fix hover */
    // infoToUI.getContentInfoPopoverObservable(this.nehubaViewerComponent.hoverRegionTemplate)
    // this.nehubaViewerComponent.viewerSegment
  }

  /**
   * Teleport to new location
   */
  public setNavigationLoc = (loc:number[],realSpace?:boolean)=>{
    this.nehubaViewerComponent.nehubaViewer.setPosition(vec3.fromValues(loc[0],loc[1],loc[2]),realSpace)
  }

  /**
   * teleport to a new orientation
   */
  public setNavigationOrientation = (_ori:number[])=>{
    /* waiting for proper api */
    console.log('setNavitation ori has not yet been implemented')
  }

  public moveToNavigationOri = (_ori:number[])=>{
    /* waiting for proper api */
    console.log('movetoNavigation ori has not yet been implemented')
  }
  /**
   * Animation moving to new location
   */
  public moveToNavigationLoc = (loc:number[],realSpace?:boolean)=>{
    this.nehubaViewerComponent.navigate(loc,300,realSpace?realSpace:false)
  }

  private loadTemplate(nehubaViewerConfig:NehubaViewerConfig){
    if(this.templateLoaded){
      (<NehubaViewerComponent>this.componentRef.instance).nehubaViewer.dispose()
      this.componentRef.destroy()
    }

    this.componentRef = this.viewContainerRef.createComponent( this.nehubaViewerFactory )
    
    this.nehubaViewerComponent = <NehubaViewerComponent>this.componentRef.instance
    this.nehubaViewerComponent.createNewNehubaViewerWithConfig(nehubaViewerConfig)
    
    this.templateLoaded = true
  }

  public showSegment(segID:any){
    this.nehubaViewerComponent.showSeg(segID)
  }

  public hideSegment(segID:any){
    this.nehubaViewerComponent.hideSeg(segID)
  }

  public showAllSegments(){
    this.nehubaViewerComponent.allSeg(true)
  }

  public hideAllSegments(){
    this.nehubaViewerComponent.allSeg(false)
  }

  public setLayerVisibility(layerObj:any,visible:boolean){
    return this.nehubaViewerComponent.setLayerVisibility(layerObj,visible)
  }

  public loadLayer(layerObj:any){
    return this.nehubaViewerComponent.loadLayer(layerObj)
  }

  public removeLayer(layerObj:any){
    return this.nehubaViewerComponent.removeLayer(layerObj)
  }
}

