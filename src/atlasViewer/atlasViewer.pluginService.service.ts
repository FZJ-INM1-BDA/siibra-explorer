import { Injectable, ViewContainerRef, ComponentFactoryResolver, ComponentFactory } from "@angular/core";
import { HttpClient } from '@angular/common/http'
import { PluginInitManifestInterface, ACTION_TYPES } from "src/services/state/pluginState.store";
import { isDefined } from 'src/services/stateStore.service'
import { AtlasViewerAPIServices } from "./atlasViewer.apiService.service";
import { PluginUnit } from "./pluginUnit/pluginUnit.component";
import { WidgetServices } from "./widgetUnit/widgetService.service";

import '../res/css/plugin_styles.css'
import { interval, BehaviorSubject, Observable, merge, of } from "rxjs";
import { take, takeUntil, map, shareReplay } from "rxjs/operators";
import { Store } from "@ngrx/store";
import { WidgetUnit } from "./widgetUnit/widgetUnit.component";
import { AtlasViewerConstantsServices } from "./atlasViewer.constantService.service";

@Injectable({
  providedIn : 'root'
})

export class PluginServices{

  public fetchedPluginManifests : PluginManifest[] = []
  public pluginViewContainerRef : ViewContainerRef 
  public appendSrc : (script:HTMLElement)=>void
  public removeSrc: (script:HTMLElement) => void
  private pluginUnitFactory : ComponentFactory<PluginUnit>
  public minimisedPlugins$ : Observable<Set<string>>

  /**
   * TODO remove polyfil and convert all calls to this.fetch to http client
   */
  public fetch: (url:string, httpOption?: any) => Promise<any> = (url, httpOption = {}) => this.http.get(url, httpOption).toPromise()

  constructor(
    private apiService : AtlasViewerAPIServices,
    private constantService : AtlasViewerConstantsServices,
    private widgetService : WidgetServices,
    private cfr : ComponentFactoryResolver,
    private store : Store<PluginInitManifestInterface>,
    private http: HttpClient
  ){

    this.pluginUnitFactory = this.cfr.resolveComponentFactory( PluginUnit )
    this.apiService.interactiveViewer.uiHandle.launchNewWidget = this.launchNewWidget.bind(this) 
    
    /**
     * TODO convert to rxjs streams, instead of Promise.all
     */
    const promiseFetchedPluginManifests : Promise<PluginManifest[]> = new Promise((resolve, reject) => {
      Promise.all([
        /**
         * PLUGINDEV should return an array of 
         */
        PLUGINDEV
          ? this.fetch(PLUGINDEV).then(res => res.json())
          : Promise.resolve([]),
        new Promise(resolve => {
          this.fetch(`${this.constantService.backendUrl}plugins`)
            .then(arr => Promise.all(
              arr.map(url => new Promise(rs => 
                /**
                 * instead of failing all promises when fetching manifests, only fail those that fails to fetch
                 */
                this.fetch(url).then(rs).catch(e => (this.constantService.catchError(`fetching manifest error: ${e.toString()}`), rs(null))))
              )
            ))
            .then(manifests => resolve(
              manifests.filter(m => !!m)
            ))
            .catch(e => {
              this.constantService.catchError(e)
              resolve([])
            })
        }),
        Promise.all(
          BUNDLEDPLUGINS
            .filter(v => typeof v === 'string')
            .map(v => this.fetch(`res/plugin_examples/${v}/manifest.json`).then(res => res.json()))
        )
          .then(arr => arr.reduce((acc,curr) => acc.concat(curr) ,[]))
      ])
        .then(arr => resolve( [].concat(arr[0]).concat(arr[1]) ))
        .catch(reject)
    })
    
    promiseFetchedPluginManifests
      .then(arr=>
        this.fetchedPluginManifests = arr)
      .catch(console.error)

    this.minimisedPlugins$ = merge(
      of(new Set()),
      this.widgetService.minimisedWindow$
    ).pipe(
      map(set => {
        const returnSet = new Set()
        for (let [pluginName, wu] of this.mapPluginNameToWidgetUnit) {
          if (set.has(wu)) {
            returnSet.add(pluginName)
          }
        }
        return returnSet
      }),
      shareReplay(1)
    )

    this.launchedPlugins$ = new BehaviorSubject(new Set())
  }

  launchNewWidget = (manifest) => this.launchPlugin(manifest)
    .then(handler => {
      this.orphanPlugins.add(manifest)
      handler.onShutdown(() => {
        this.orphanPlugins.delete(manifest)
      })
    })

  readyPlugin(plugin:PluginManifest):Promise<any>{
    return Promise.all([
        isDefined(plugin.template) ?
          Promise.resolve('template already provided') :
          isDefined(plugin.templateURL) ?
            this.fetch(plugin.templateURL, {responseType: 'text'})
              .then(template=>plugin.template = template) :
            Promise.reject('both template and templateURL are not defined') ,
        isDefined(plugin.script) ?
          Promise.resolve('script already provided') :
          isDefined(plugin.scriptURL) ?
            this.fetch(plugin.scriptURL, {responseType: 'text'})
              .then(script=>plugin.script = script) :
            Promise.reject('both script and scriptURL are not defined') 
      ])
  }

  private launchedPlugins: Set<string> = new Set()
  public launchedPlugins$: BehaviorSubject<Set<string>>
  pluginHasLaunched(pluginName:string) {
    return this.launchedPlugins.has(pluginName)
  }
  addPluginToLaunchedSet(pluginName:string){
    this.launchedPlugins.add(pluginName)
    this.launchedPlugins$.next(this.launchedPlugins)
  }
  removePluginFromLaunchedSet(pluginName:string){
    this.launchedPlugins.delete(pluginName)
    this.launchedPlugins$.next(this.launchedPlugins)
  }

  
  pluginIsLaunching(pluginName:string){
    return this.launchingPlugins.has(pluginName)
  }
  addPluginToIsLaunchingSet(pluginName:string) {
    this.launchingPlugins.add(pluginName)
  }
  removePluginFromIsLaunchingSet(pluginName:string){
    this.launchedPlugins.delete(pluginName)
  }

  private mapPluginNameToWidgetUnit: Map<string, WidgetUnit> = new Map()

  pluginIsMinimised(pluginName:string) {
    return this.widgetService.isMinimised( this.mapPluginNameToWidgetUnit.get(pluginName) )
  }

  private launchingPlugins: Set<string> = new Set()
  public orphanPlugins: Set<PluginManifest> = new Set()
  launchPlugin(plugin:PluginManifest){
    if (this.pluginIsLaunching(plugin.name)) {
      // plugin launching please be patient
      // TODO add visual feedback
      return
    }
    if ( this.pluginHasLaunched(plugin.name)) {
      // plugin launched
      // TODO add visual feedback

      // if widget window is minimized, maximize it
      
      const wu = this.mapPluginNameToWidgetUnit.get(plugin.name)
      if (this.widgetService.isMinimised(wu)) {
        this.widgetService.unminimise(wu)
      } else {
        this.widgetService.minimise(wu)
      }
      return
    }

    this.addPluginToIsLaunchingSet(plugin.name)
    
    return this.readyPlugin(plugin)
      .then(()=>{
        const pluginUnit = this.pluginViewContainerRef.createComponent( this.pluginUnitFactory )
        /* TODO in v0.2, I used:
        
        const template = document.createElement('div')
        template.insertAdjacentHTML('afterbegin',template)

        // reason was:
        // changed from innerHTML to insertadjacenthtml to accomodate angular elements ... not too sure about the actual ramification

        */

        const handler = new PluginHandler()
        this.apiService.interactiveViewer.pluginControl[plugin.name] = handler

        /**
         * define the handler properties prior to appending plugin script
         * so that plugin script can access properties w/o timeout
         */
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

        const shutdownCB = [
          () => {
            this.removePluginFromLaunchedSet(plugin.name)
          }
        ]

        handler.onShutdown = (cb) => {
          if(typeof cb !== 'function'){
            console.warn('onShutdown requires the argument to be a function') 
            return
          }
          shutdownCB.push(cb)
        }

        const script = document.createElement('script')
        script.innerHTML = plugin.script
        this.appendSrc(script)
        handler.onShutdown(() => this.removeSrc(script))

        const template = document.createElement('div')
        template.insertAdjacentHTML('afterbegin',plugin.template)
        pluginUnit.instance.elementRef.nativeElement.append( template )

        const widgetCompRef = this.widgetService.addNewWidget(pluginUnit,{
          state : 'floating',
          exitable : true,
          persistency: plugin.persistency,
          title : plugin.displayName || plugin.name
        })

        this.addPluginToLaunchedSet(plugin.name)
        this.removePluginFromIsLaunchingSet(plugin.name)

        this.mapPluginNameToWidgetUnit.set(plugin.name, widgetCompRef.instance)

        const unsubscribeOnPluginDestroy = []

        handler.blink = (sec?:number)=>{
          widgetCompRef.instance.blinkOn = true
        }

        handler.setProgressIndicator = (val) => widgetCompRef.instance.progressIndicator = val

        handler.shutdown = ()=>{
          widgetCompRef.instance.exit()
        }

        handler.onShutdown(()=>{
          unsubscribeOnPluginDestroy.forEach(s=>s.unsubscribe())
          delete this.apiService.interactiveViewer.pluginControl[plugin.name]
          this.mapPluginNameToWidgetUnit.delete(plugin.name)
        })
        
        pluginUnit.onDestroy(()=>{
          while(shutdownCB.length > 0){
            shutdownCB.pop()()
          }
        })

        return handler
      })
  }
}

export class PluginHandler{
  onShutdown : (callback:()=>void)=>void = (_) => {}
  blink : (sec?:number)=>void = (_) => {}
  shutdown : ()=>void = () => {}

  initState? : any
  initStateUrl? : string

  setInitManifestUrl : (url:string|null)=>void

  setProgressIndicator: (progress:number) => void
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
  persistency? : boolean
}