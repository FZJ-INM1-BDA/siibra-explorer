import { HttpClient } from '@angular/common/http'
import { ComponentFactory, ComponentFactoryResolver, Injectable, ViewContainerRef } from "@angular/core";
import { PLUGINSTORE_ACTION_TYPES } from "src/services/state/pluginState.store";
import { IavRootStoreInterface, isDefined } from 'src/services/stateStore.service'
import { PluginUnit } from "./pluginUnit/pluginUnit.component";
import { WidgetServices } from "./widgetUnit/widgetService.service";

import { select, Store } from "@ngrx/store";
import { BehaviorSubject, merge, Observable, of } from "rxjs";
import { filter, map, shareReplay } from "rxjs/operators";
import { LoggingService } from 'src/services/logging.service';
import { PluginHandler } from 'src/util/pluginHandler';
import '../res/css/plugin_styles.css'
import { AtlasViewerConstantsServices } from "./atlasViewer.constantService.service";
import { WidgetUnit } from "./widgetUnit/widgetUnit.component";

@Injectable({
  providedIn : 'root',
})

export class PluginServices {

  public pluginHandlersMap: Map<string, PluginHandler> = new Map()

  public loadExternalLibraries: (libraries: string[]) => Promise<any> = () => Promise.reject(`fail to overwritten`)
  public unloadExternalLibraries: (libraries: string[]) => void = () => { throw new Error(`failed to be overwritten`) }

  public fetchedPluginManifests: IPluginManifest[] = []
  public pluginViewContainerRef: ViewContainerRef
  public appendSrc: (script: HTMLElement) => void
  public removeSrc: (script: HTMLElement) => void
  private pluginUnitFactory: ComponentFactory<PluginUnit>
  public minimisedPlugins$: Observable<Set<string>>

  /**
   * TODO remove polyfil and convert all calls to this.fetch to http client
   */
  public fetch: (url: string, httpOption?: any) => Promise<any> = (url, httpOption = {}) => this.http.get(url, httpOption).toPromise()

  constructor(
    private constantService: AtlasViewerConstantsServices,
    private widgetService: WidgetServices,
    private cfr: ComponentFactoryResolver,
    private store: Store<IavRootStoreInterface>,
    private http: HttpClient,
    private log: LoggingService,
  ) {

    // TODO implement
    this.store.pipe(
      select('pluginState'),
      select('initManifests'),
      filter(v => !!v),
    )

    this.pluginUnitFactory = this.cfr.resolveComponentFactory( PluginUnit )

    /**
     * TODO convert to rxjs streams, instead of Promise.all
     */
    const promiseFetchedPluginManifests: Promise<IPluginManifest[]> = new Promise((resolve, reject) => {
      Promise.all([
        // TODO convert to use this.fetch
        PLUGINDEV
          ? fetch(PLUGINDEV, this.constantService.getFetchOption()).then(res => res.json())
          : Promise.resolve([]),
        new Promise(rs => {
          fetch(`${this.constantService.backendUrl}plugins`, this.constantService.getFetchOption())
            .then(res => res.json())
            .then(arr => Promise.all(
              arr.map(url => new Promise(rs2 =>
                /**
                 * instead of failing all promises when fetching manifests, only fail those that fails to fetch
                 */
                fetch(url, this.constantService.getFetchOption()).then(res => res.json()).then(rs2).catch(e => (this.log.log('fetching manifest error', e), rs2(null)))),
              ),
            ))
            .then(manifests => rs(
              manifests.filter(m => !!m),
            ))
            .catch(e => {
              this.constantService.catchError(e)
              rs([])
            })
        }),
        Promise.all(
          BUNDLEDPLUGINS
            .filter(v => typeof v === 'string')
            .map(v => fetch(`res/plugin_examples/${v}/manifest.json`, this.constantService.getFetchOption()).then(res => res.json())),
        )
          .then(arr => arr.reduce((acc, curr) => acc.concat(curr) , [])),
      ])
        .then(arr => resolve( [].concat(arr[0]).concat(arr[1]) ))
        .catch(reject)
    })

    promiseFetchedPluginManifests
      .then(arr =>
        this.fetchedPluginManifests = arr)
      .catch(this.log.error)

    this.minimisedPlugins$ = merge(
      of(new Set()),
      this.widgetService.minimisedWindow$,
    ).pipe(
      map(set => {
        const returnSet = new Set<string>()
        for (const [pluginName, wu] of this.mapPluginNameToWidgetUnit) {
          if (set.has(wu)) {
            returnSet.add(pluginName)
          }
        }
        return returnSet
      }),
      shareReplay(1),
    )

    this.launchedPlugins$ = new BehaviorSubject(new Set())
  }

  public launchNewWidget = (manifest) => this.launchPlugin(manifest)
    .then(handler => {
      this.orphanPlugins.add(manifest)
      handler.onShutdown(() => {
        this.orphanPlugins.delete(manifest)
      })
    })

  public readyPlugin(plugin: IPluginManifest): Promise<any> {
    return Promise.all([
      isDefined(plugin.template)
        ? Promise.resolve()
        : isDefined(plugin.templateURL)
          ? this.fetch(plugin.templateURL, {responseType: 'text'}).then(template => plugin.template = template)
          : Promise.reject('both template and templateURL are not defined') ,
      isDefined(plugin.scriptURL) ? Promise.resolve() : Promise.reject(`inline script has been deprecated. use scriptURL instead`),
    ])
  }

  private launchedPlugins: Set<string> = new Set()
  public launchedPlugins$: BehaviorSubject<Set<string>>
  public pluginHasLaunched(pluginName: string) {
    return this.launchedPlugins.has(pluginName)
  }
  public addPluginToLaunchedSet(pluginName: string) {
    this.launchedPlugins.add(pluginName)
    this.launchedPlugins$.next(this.launchedPlugins)
  }
  public removePluginFromLaunchedSet(pluginName: string) {
    this.launchedPlugins.delete(pluginName)
    this.launchedPlugins$.next(this.launchedPlugins)
  }

  public pluginIsLaunching(pluginName: string) {
    return this.launchingPlugins.has(pluginName)
  }
  public addPluginToIsLaunchingSet(pluginName: string) {
    this.launchingPlugins.add(pluginName)
  }
  public removePluginFromIsLaunchingSet(pluginName: string) {
    this.launchingPlugins.delete(pluginName)
  }

  private mapPluginNameToWidgetUnit: Map<string, WidgetUnit> = new Map()

  public pluginIsMinimised(pluginName: string) {
    return this.widgetService.isMinimised( this.mapPluginNameToWidgetUnit.get(pluginName) )
  }

  private launchingPlugins: Set<string> = new Set()
  public orphanPlugins: Set<IPluginManifest> = new Set()
  public launchPlugin(plugin: IPluginManifest) {
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
      .then(() => {
        const pluginUnit = this.pluginViewContainerRef.createComponent( this.pluginUnitFactory )
        /* TODO in v0.2, I used:

        const template = document.createElement('div')
        template.insertAdjacentHTML('afterbegin',template)

        // reason was:
        // changed from innerHTML to insertadjacenthtml to accomodate angular elements ... not too sure about the actual ramification

        */

        const handler = new PluginHandler()
        this.pluginHandlersMap.set(plugin.name, handler)

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
          type : PLUGINSTORE_ACTION_TYPES.SET_INIT_PLUGIN,
          manifest : {
            name : plugin.name,
            initManifestUrl : url,
          },
        })

        const shutdownCB = [
          () => {
            this.removePluginFromLaunchedSet(plugin.name)
          },
        ]

        handler.onShutdown = (cb) => {
          if (typeof cb !== 'function') {
            this.log.warn('onShutdown requires the argument to be a function')
            return
          }
          shutdownCB.push(cb)
        }

        const script = document.createElement('script')
        script.src = plugin.scriptURL

        this.appendSrc(script)
        handler.onShutdown(() => this.removeSrc(script))

        const template = document.createElement('div')
        template.insertAdjacentHTML('afterbegin', plugin.template)
        pluginUnit.instance.elementRef.nativeElement.append( template )

        const widgetCompRef = this.widgetService.addNewWidget(pluginUnit, {
          state : 'floating',
          exitable : true,
          persistency: plugin.persistency,
          title : plugin.displayName || plugin.name,
        })

        this.addPluginToLaunchedSet(plugin.name)
        this.removePluginFromIsLaunchingSet(plugin.name)

        this.mapPluginNameToWidgetUnit.set(plugin.name, widgetCompRef.instance)

        const unsubscribeOnPluginDestroy = []

        // TODO deprecate sec
        handler.blink = (_sec?: number) => {
          widgetCompRef.instance.blinkOn = true
        }

        handler.setProgressIndicator = (val) => widgetCompRef.instance.progressIndicator = val

        handler.shutdown = () => {
          widgetCompRef.instance.exit()
        }

        handler.onShutdown(() => {
          unsubscribeOnPluginDestroy.forEach(s => s.unsubscribe())
          this.pluginHandlersMap.delete(plugin.name)
          this.mapPluginNameToWidgetUnit.delete(plugin.name)
        })

        pluginUnit.onDestroy(() => {
          while (shutdownCB.length > 0) {
            shutdownCB.pop()()
          }
        })

        return handler
      })
  }
}

export interface IPluginManifest {
  name?: string
  displayName?: string
  templateURL?: string
  template?: string
  scriptURL?: string
  script?: string
  initState?: any
  initStateUrl?: string
  persistency?: boolean
}
