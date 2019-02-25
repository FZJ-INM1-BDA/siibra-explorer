import { Injectable, ViewContainerRef, ComponentFactoryResolver, ComponentFactory } from "@angular/core";
import { AtlasViewerDataService } from "./atlasViewer.dataService.service";
import { PluginInitManifestInterface, ACTION_TYPES } from "src/services/state/pluginState.store";
import { isDefined } from 'src/services/stateStore.service'
import { AtlasViewerAPIServices } from "./atlasViewer.apiService.service";
import { PluginUnit } from "./pluginUnit/pluginUnit.component";
import { WidgetServices } from "./widgetUnit/widgetService.service";

import '../res/css/plugin_styles.css'
import { interval } from "rxjs";
import { take, takeUntil } from "rxjs/operators";
import { Store } from "@ngrx/store";

@Injectable({
  providedIn : 'root'
})

export class PluginServices{

  public fetchedPluginManifests : PluginManifest[] = []
  public pluginViewContainerRef : ViewContainerRef 
  public appendSrc : (script:HTMLElement)=>void
  private pluginUnitFactory : ComponentFactory<PluginUnit>

  constructor(
    private apiService : AtlasViewerAPIServices,
    private atlasDataService : AtlasViewerDataService,
    private widgetService : WidgetServices,
    private cfr : ComponentFactoryResolver,
    private store : Store<PluginInitManifestInterface>
  ){

    this.pluginUnitFactory = this.cfr.resolveComponentFactory( PluginUnit )

    this.atlasDataService.promiseFetchedPluginManifests
      .then(arr=>
        this.fetchedPluginManifests = arr)
      .catch(console.error)
  }

  readyPlugin(plugin:PluginManifest):Promise<any>{
    return Promise.all([
        isDefined(plugin.template) ?
          Promise.resolve('template already provided') :
          isDefined(plugin.templateURL) ?
            fetch(plugin.templateURL)
              .then(res=>res.text())
              .then(template=>plugin.template = template) :
            Promise.reject('both template and templateURL are not defined') ,
        isDefined(plugin.script) ?
          Promise.resolve('script already provided') :
          isDefined(plugin.scriptURL) ?
            fetch(plugin.scriptURL)
              .then(res=>res.text())
              .then(script=>plugin.script = script) :
            Promise.reject('both template and templateURL are not defined') 
      ])
  }

  launchPlugin(plugin:PluginManifest){
    if(this.apiService.interactiveViewer.pluginControl[plugin.name])
    {
      console.warn('plugin already launched. blinking for 10s.')
      this.apiService.interactiveViewer.pluginControl[plugin.name].blink(10)
      return
    }
    this.readyPlugin(plugin)
      .then(()=>{
        const pluginUnit = this.pluginViewContainerRef.createComponent( this.pluginUnitFactory )
        /* TODO in v0.2, I used:
        
        const template = document.createElement('div')
        template.insertAdjacentHTML('afterbegin',template)

        // reason was:
        // changed from innerHTML to insertadjacenthtml to accomodate angular elements ... not too sure about the actual ramification

        */

        /* initialising the plugin handler first, and in the future, perhaps populate the initState object/initStateUrl object */
        const handler = new PluginHandler()
        handler.initState = plugin.initState
          ? plugin.initState
          : null

        handler.initStateUrl = plugin.initStateUrl
          ? plugin.initStateUrl
          : null

        handler.setInitManifestUrl = (url) => this.store.dispatch({
          type : ACTION_TYPES.SET_INIT_PLUGIN,
          manifest : {
            name : plugin.name,
            initManifestUrl : url
          }
        })

        this.apiService.interactiveViewer.pluginControl[plugin.name] = handler

        const script = document.createElement('script')
        script.innerHTML = plugin.script
        this.appendSrc(script)

        const template = document.createElement('div')
        template.insertAdjacentHTML('afterbegin',plugin.template)
        pluginUnit.instance.elementRef.nativeElement.append( template )

        const widgetCompRef = this.widgetService.addNewWidget(pluginUnit,{
          state : 'floating',
          exitable : true,
          title : plugin.displayName || plugin.name
        })

        const unsubscribeOnPluginDestroy = []
        const shutdownCB = []

        handler.onShutdown = (cb)=>{
          if(typeof cb !== 'function'){
            console.warn('onShutdown requires the argument to be a function') 
            return
          }
          shutdownCB.push(cb)
        }

        handler.blink = (sec?:number)=>{
          if(typeof sec !== 'number')
            console.warn(`sec is not a number, default blink interval used`)
          widgetCompRef.instance.containerClass = ''
          interval(typeof sec === 'number' ? sec * 1000 : 500).pipe(
            take(11),
            takeUntil(widgetCompRef.instance.clickedEmitter)
          ).subscribe(()=>
            widgetCompRef.instance.containerClass = widgetCompRef.instance.containerClass === 'panel-success' ? 
              '' : 
              'panel-success')
        }

        unsubscribeOnPluginDestroy.push(
          widgetCompRef.instance.clickedEmitter.subscribe(()=>
            widgetCompRef.instance.containerClass = '')
          )

        handler.shutdown = ()=>{
          widgetCompRef.instance.exit()
        }

        handler.onShutdown(()=>{
          unsubscribeOnPluginDestroy.forEach(s=>s.unsubscribe())
          delete this.apiService.interactiveViewer.pluginControl[plugin.name]
        })
        
        pluginUnit.onDestroy(()=>{
          while(shutdownCB.length > 0){
            shutdownCB.pop()()
          }
        })
      })
      .catch(console.error)
  }
}

export class PluginHandler{
  onShutdown : (callback:()=>void)=>void
  blink : (sec?:number)=>void
  shutdown : ()=>void

  initState? : any
  initStateUrl? : string

  setInitManifestUrl : (url:string|null)=>void
}

export interface PluginManifest{
  name? : string
  displayName? : string
  templateURL? : string
  template? : string
  scriptURL? : string
  script? : string 
  initState? : any
  initStateUrl? : string
}