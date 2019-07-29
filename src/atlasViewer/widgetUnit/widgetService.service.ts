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

  public minimisedWindow: Set<WidgetUnit> = new Set()

  constructor(
    private cfr:ComponentFactoryResolver,
    private constantServce:AtlasViewerConstantsServices,
    private injector : Injector,
    ){
    this.widgetUnitFactory = this.cfr.resolveComponentFactory(WidgetUnit)
  }

  moveFloatingToFront(widgetUnit) {
    const widget = [...this.widgetComponentRefs].find(widget=>widget.instance===widgetUnit)
    if(!widget)
      return
    const idx = this.floatingContainer.indexOf(widget.hostView)
    if(idx === this.floatingContainer.length - 1 )
      return
    this.floatingContainer.detach(idx)
    this.floatingContainer.insert(widget.hostView)
  }

  clearAllWidgets(){
    [...this.widgetComponentRefs].forEach((cr:ComponentRef<WidgetUnit>) => {
      if(!cr.instance.persistency) cr.destroy()
    })

    this.clickedListener.forEach(s=>s.unsubscribe())
  }

  minimise(wu:WidgetUnit){
    this.minimisedWindow.add(wu)
  }

  addNewWidget(guestComponentRef:ComponentRef<any>,options?:Partial<WidgetOptionsInterface>):ComponentRef<WidgetUnit>{
    const component = this.widgetUnitFactory.create(this.injector)
    const _option = getOption(options)

    if(this.constantServce.mobile){
      _option.state = 'docked'
    }

    _option.state === 'floating'
      ? this.floatingContainer.insert(component.hostView)
      : _option.state === 'docked'
        ? this.dockedContainer.insert(component.hostView)
        : this.floatingContainer.insert(component.hostView)

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
      _component.instance.persistency = _option.persistency
      _component.instance.titleHTML = _option.titleHTML

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
      _component.onDestroy(() => this.minimisedWindow.delete(_component.instance))

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
      const cr = this.addNewWidget(guestComopnent,options)

      widgetRef.destroy()
    }else{
      console.warn('widgetref not found')
    }
  }

  exitWidget(widgetUnit:WidgetUnit){
    const widgetRef = [...this.widgetComponentRefs].find(cr=>cr.instance === widgetUnit)
    if(widgetRef){
      widgetRef.destroy()
      this.widgetComponentRefs.delete(widgetRef)
    }else{
      console.warn('widgetref not found')
    }
  }

  dockAllWidgets(){
    /* nb cannot directly iterate the set, as the set will be updated and create and infinite loop */
    [...this.widgetComponentRefs].forEach(cr => cr.instance.dock())
  }

  floatAllWidgets(){
    [...this.widgetComponentRefs].forEach(cr => cr.instance.undock())
  }
}

function safeGetSingle(obj:any, arg:string){
  return typeof obj === 'object' && obj !== null && typeof arg === 'string'
    ? obj[arg]
    : null
}

function safeGet(obj:any, ...args:string[]){
  let _obj = Object.assign({}, obj)
  while(args.length > 0){
    const arg = args.shift()
    _obj = safeGetSingle(_obj, arg)
  }
  return _obj
}

function getOption(option?:Partial<WidgetOptionsInterface>):WidgetOptionsInterface{
  return{
    exitable : safeGet(option, 'exitable') !== null
      ? safeGet(option, 'exitable')
      : true,
    state : safeGet(option, 'state') || 'floating',
    title : safeGet(option, 'title') || 'Untitled',
    persistency : safeGet(option, 'persistency') || false,
    titleHTML: safeGet(option, 'titleHTML') || null
  }
}

export interface WidgetOptionsInterface{
  title? : string
  state? : 'docked' | 'floating'
  exitable? : boolean
  persistency? : boolean
  titleHTML? : string
}

