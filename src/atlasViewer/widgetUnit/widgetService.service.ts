import { ComponentRef, ComponentFactory, Injectable, ViewContainerRef, ComponentFactoryResolver, Injector } from "@angular/core";

import { WidgetUnit } from "./widgetUnit.component";
import { AtlasViewerConstantsServices } from "../atlasViewer.constantService.service";
import { Subscription } from "rxjs";


@Injectable({
  providedIn : 'root'
})

export class WidgetServices{

  public floatingContainer : ViewContainerRef
  public dockedContainer : ViewContainerRef
  public factoryContainer : ViewContainerRef

  private widgetUnitFactory : ComponentFactory<WidgetUnit>
  private widgetComponentRefs : Set<ComponentRef<WidgetUnit>> = new Set()

  private clickedListener : Subscription[] = []

  constructor(
    private cfr:ComponentFactoryResolver,
    private constantServce:AtlasViewerConstantsServices
    ){
    this.widgetUnitFactory = this.cfr.resolveComponentFactory(WidgetUnit)
  }

  clearAllWidgets(){
    this.floatingContainer.clear()
    this.dockedContainer.clear()
    this.clickedListener.forEach(s=>s.unsubscribe())
  }

  addNewWidget(guestComponentRef:ComponentRef<any>,options?:any):ComponentRef<WidgetUnit>{
    const _option = getOption(options)
    const component = _option.state === 'floating' ? 
      this.floatingContainer.createComponent(this.widgetUnitFactory) :
      _option.state === 'docked' ? 
        this.dockedContainer.createComponent(this.widgetUnitFactory) :
        Error('option.state has to be either floating or docked')

    if(component.constructor === Error){
      throw component
    }else{
      const _component = (component as ComponentRef<WidgetUnit>);
      _component.instance.container.insert( guestComponentRef.hostView )
      
      /* programmatic DI */
      _component.instance.widgetServices = this

      /* common properties */
      _component.instance.state = _option.state
      _component.instance.exitable = _option.exitable
      _component.instance.title = _option.title

      /* internal properties, used for changing state */
      _component.instance.guestComponentRef = guestComponentRef

      if(_option.state === 'floating'){
        let position = this.constantServce.floatingWidgetStartingPos
        while([...this.widgetComponentRefs].some(widget=>
          widget.instance.state === 'floating' && 
          widget.instance.position.every((v,idx)=>v===position[idx]))){
          position = position.map(v=>v+10) as [number,number]
        }
        _component.instance.position = position
      }

      /* set width and height. or else floating components will obstruct viewers */
      _component.instance.setWidthHeight()

      this.widgetComponentRefs.add( _component )

      this.clickedListener.push(
        _component.instance.clickedEmitter.subscribe((widgetUnit:WidgetUnit)=>{
          if(widgetUnit.state !== 'floating')
            return
          const widget = [...this.widgetComponentRefs].find(widget=>widget.instance===widgetUnit)
          if(!widget)
            return
          const idx = this.floatingContainer.indexOf(widget.hostView)
          if(idx === this.floatingContainer.length - 1 )
            return
          this.floatingContainer.detach(idx)
          this.floatingContainer.insert(widget.hostView)
          
        })
      )

      return _component
    }
  }

  changeState(widgetUnit:WidgetUnit, options : WidgetOptionsInterface){
    const widgetRef = [...this.widgetComponentRefs].find(cr=>cr.instance === widgetUnit)
    if(widgetRef){
      this.widgetComponentRefs.delete(widgetRef)
      widgetRef.instance.container.detach( 0 )
      const guestComopnent = widgetRef.instance.guestComponentRef
      this.addNewWidget(guestComopnent,options)
      widgetRef.destroy()
    }else{
      console.warn('widgetref not found')
    }
  }

  exitWidget(widgetUnit:WidgetUnit){
    const widgetRef = [...this.widgetComponentRefs].find(cr=>cr.instance === widgetUnit)
    if(widgetRef){
      widgetRef.destroy()
    }else{
      console.warn('widgetref not found')
    }
  }
}

function getOption(option?:WidgetOptionsInterface):WidgetOptionsInterface{
  return{
    exitable : option ? 
      option.exitable ?
        option.exitable :
        false :
      false,
    state : option ? 
      option.state ?
        option.state :
        'floating' :
      'floating',
    title : option ?
      option.title ? 
        option.title :
        'Untitled' :
      'Untitled'
  }
}

export interface WidgetOptionsInterface{
  title? : string
  state? : 'docked' | 'floating'
  exitable? : boolean
}

