import { ComponentRef,Component,ComponentFactoryResolver,ViewContainerRef, ComponentFactory, ViewChild, TemplateRef }from '@angular/core'

import { Config as NehubaViewerConfig,vec3 } from 'nehuba/exports'

import { MainController, InfoToUIService } from 'nehubaUI/nehubaUI.services'
import { NehubaViewerComponent } from 'nehubaUI/mainUI/viewer/nehubaUI.viewerUnit.component';
import { RegionDescriptor } from 'nehubaUI/nehuba.model';
import { INTERACTIVE_VIEWER } from 'nehubaUI/exports';


@Component({
  selector : 'NehubaViewer',
  template:`
    <ng-template #viewerHost>
    </ng-template>

    <ng-template #hoverRegionTemplate>
      <small floatingPopoverContent>
        Hovering on: {{ hoveredRegion ? hoveredRegion.name : 'no segment selected' }}
      </small>
    </ng-template>
  `,
  styles : [ `
    [floatingPopoverContent]
    {
      padding: 0.5em 1em;
      white-space:nowrap;
    }
  ` ]
})

export class NehubaViewerInnerContainer {

  nehubaViewerComponent : NehubaViewerComponent
  componentRef : ComponentRef<any>
  private templateLoaded : boolean = false
  darktheme : boolean = false

  hoveredRegion : RegionDescriptor | null

  colorMap : Map<number,{}>

  private nehubaViewerFactory : ComponentFactory<NehubaViewerComponent>
  @ViewChild('viewerHost',{read:ViewContainerRef}) viewContainerRef : ViewContainerRef
  @ViewChild('hoverRegionTemplate',{read:TemplateRef}) hoverRegionTemplate : TemplateRef<any>

  constructor(
    public mainController:MainController, 
    private componentFactoryResolver: ComponentFactoryResolver ,
    public infoToUI:InfoToUIService){

    this.nehubaViewerFactory = this.componentFactoryResolver.resolveComponentFactory( NehubaViewerComponent )

    this.mainController.selectedTemplateBSubject.subscribe((templateDescriptor)=>{
      if(!templateDescriptor) return
      this.loadTemplate(templateDescriptor.nehubaConfig)
    })

    INTERACTIVE_VIEWER.viewerHandle.mouseOverNehuba.subscribe((ev)=>this.hoveredRegion=ev.foundRegion)
    this.infoToUI.getContentInfoPopoverObservable(
      INTERACTIVE_VIEWER.viewerHandle.mouseOverNehuba.map(ev=>ev.foundRegion ? this.hoverRegionTemplate : null)
    )
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

