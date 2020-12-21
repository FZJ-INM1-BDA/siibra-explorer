import { HttpClient } from '@angular/common/http'
import { ComponentFactory, ComponentFactoryResolver, Injectable, ViewContainerRef, Inject, SecurityContext } from "@angular/core";
import { PLUGINSTORE_ACTION_TYPES } from "src/services/state/pluginState.helper";
import { PluginUnit } from "./pluginUnit.component";
import { select, Store } from "@ngrx/store";
import { BehaviorSubject, from, merge, Observable, of } from "rxjs";
import { catchError, filter, map, mapTo, shareReplay, switchMap, switchMapTo, take, tap } from "rxjs/operators";
import { LoggingService } from 'src/logging';
import { PluginHandler } from 'src/util/pluginHandler';
import { WidgetUnit, WidgetServices } from "src/widget";
import { APPEND_SCRIPT_TOKEN, REMOVE_SCRIPT_TOKEN, BACKENDURL, getHttpHeader } from 'src/util/constants';
import { PluginFactoryDirective } from './pluginFactory.directive';
import { selectorPluginCspPermission } from 'src/services/state/userConfigState.helper';
import { DialogService } from 'src/services/dialogService.service';
import { DomSanitizer } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';

const requiresReloadMd = `\n\n***\n\n**warning**: interactive atlas viewer needs to be reloaded for the change to take effect.`

export const registerPluginFactoryDirectiveFactory = (pSer: PluginServices) => {
  return (pFactoryDirective: PluginFactoryDirective) => {
    pSer.loadExternalLibraries = pFactoryDirective.loadExternalLibraries.bind(pFactoryDirective)
    pSer.unloadExternalLibraries = pFactoryDirective.unloadExternalLibraries.bind(pFactoryDirective)
    pSer.pluginViewContainerRef = pFactoryDirective.viewContainerRef
  }
}

@Injectable({
  providedIn : 'root',
})

export class PluginServices {

  public pluginHandlersMap: Map<string, PluginHandler> = new Map()

  public loadExternalLibraries: (libraries: string[]) => Promise<any> = () => Promise.reject(`fail to overwritten`)
  public unloadExternalLibraries: (libraries: string[]) => void = () => { throw new Error(`failed to be overwritten`) }

  public fetchedPluginManifests: IPluginManifest[] = []
  public pluginViewContainerRef: ViewContainerRef

  private pluginUnitFactory: ComponentFactory<PluginUnit>
  public minimisedPlugins$: Observable<Set<string>>

  /**
   * TODO remove polyfil and convert all calls to this.fetch to http client
   */
  public fetch: (url: string, httpOption?: any) => Promise<any> = (url, httpOption = {}) => this.http.get(url, httpOption).toPromise()

  constructor(
    private widgetService: WidgetServices,
    private cfr: ComponentFactoryResolver,
    private store: Store<any>,
    private dialogService: DialogService,
    private snackbar: MatSnackBar,
    private http: HttpClient,
    private log: LoggingService,
    private sanitizer: DomSanitizer,
    @Inject(APPEND_SCRIPT_TOKEN) private appendSrc: (src: string) => Promise<HTMLScriptElement>,
    @Inject(REMOVE_SCRIPT_TOKEN) private removeSrc: (src: HTMLScriptElement) => void,
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

    const pluginManifestsUrl = `${BACKENDURL.replace(/\/$/,'/')}plugins/manifests`

    this.http.get<IPluginManifest[]>(pluginManifestsUrl, {
      responseType: 'json',
      headers: getHttpHeader(),
    }).subscribe(
      arr => this.fetchedPluginManifests = arr,
      this.log.error,
    )

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
    const isDefined = input => typeof input !== 'undefined' && input !== null
    if (!isDefined(plugin.scriptURL)) {
      return Promise.reject(`inline script has been deprecated. use scriptURL instead`)
    }
    if (isDefined(plugin.template)) {
      return Promise.resolve()
    }
    if (plugin.templateURL) {
      return this.fetch(plugin.templateURL, {responseType: 'text'})
        .then(template => {
          plugin.template = template
        })
    }
    return Promise.reject('both template and templateURL are not defined')
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

  public async revokePluginPermission(pluginKey: string) {
    const createRevokeMd = (pluginKey: string) => `You are about to revoke the permission given to ${pluginKey}.${requiresReloadMd}`

    try {
      await this.dialogService.getUserConfirm({
        markdown: createRevokeMd(pluginKey)
      })

      this.http.delete(
        `${BACKENDURL.replace(/\/+$/g, '/')}user/pluginPermissions/${encodeURIComponent(pluginKey)}`, 
        {
          headers: getHttpHeader()
        }
      ).subscribe(
        () => {
          window.location.reload()
        },
        err => {
          this.snackbar.open(`Error revoking plugin permission ${err.toString()}`, 'Dismiss')
        }
      )
    } catch (_e) {
      /**
       * user cancelled workflow
       */
    }
  }

  public async launchPlugin(plugin: IPluginManifest): Promise<PluginHandler> {
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

    const { csp, displayName, name = '', version = 'latest' } = plugin
    const pluginKey = `${name}::${version}`
    const createPermissionMd = ({ csp, name, version }) => {
      const sanitize = val =>  this.sanitizer.sanitize(SecurityContext.HTML, val)
      const getCspRow = ({ key }) => {
        return `| ${sanitize(key)} | ${csp[key].map(v => '`' + sanitize(v) + '`').join(',')} |`
      }
      return `**${sanitize(displayName || name)}** version **${sanitize(version)}** requires additional permission from you to run:\n\n| permission | detail |\n| --- | --- |\n${Object.keys(csp).map(key => getCspRow({ key })).join('\n')}${requiresReloadMd}`
    } 

    await new Promise((rs, rj) => {
      this.store.pipe(
        select(selectorPluginCspPermission, { key: pluginKey }),
        take(1),
        switchMap(userAgreed => {
          if (userAgreed.value) return of(true)

          /**
           * check if csp exists
           */
          if (!csp || Object.keys(csp).length === 0) {
            return of(true)
          }
          /**
           * TODO: check do not ask status
           */
          return from(
            this.dialogService.getUserConfirm({
              markdown: createPermissionMd({ csp, name, version })
            })
          ).pipe(
            mapTo(true),
            catchError(() => of(false)),
            filter(v => !!v),
            switchMapTo(
              this.http.post(`${BACKENDURL.replace(/\/+$/g, '/')}user/pluginPermissions`, 
                { [pluginKey]: csp },
                {
                  responseType: 'json',
                  headers: getHttpHeader()
                })
            ),
            tap(() => {
              window.location.reload()
            }),
            mapTo(false)
          )
        }),
        take(1),
      ).subscribe(
        val => val ? rs() : rj(),
        err => rj(err)
      )
    })

    await this.readyPlugin(plugin)

    /**
     * catch when pluginViewContainerRef as not been overwritten?
     */
    if (!this.pluginViewContainerRef) {
      throw new Error(`pluginViewContainerRef not populated`)
    }
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

    const scriptEl = await this.appendSrc(plugin.scriptURL)

    handler.onShutdown(() => this.removeSrc(scriptEl))

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
  }
}

export interface IPluginManifest {
  name?: string
  version?: string
  displayName?: string
  templateURL?: string
  template?: string
  scriptURL?: string
  script?: string
  initState?: any
  initStateUrl?: string
  persistency?: boolean

  description?: string
  desc?: string

  homepage?: string
  authors?: string

  csp?: {
    'connect-src'?: string[]
    'script-src'?: string[]
  }
}
