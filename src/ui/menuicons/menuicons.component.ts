import { Component, ComponentRef, Injector, ComponentFactory, ComponentFactoryResolver } from "@angular/core";

import { WidgetServices } from "src/atlasViewer/widgetUnit/widgetService.service";
import { WidgetUnit } from "src/atlasViewer/widgetUnit/widgetUnit.component";
import { LayerBrowser } from "src/ui/layerbrowser/layerbrowser.component";
import { DataBrowser } from "src/ui/databrowserModule/databrowser/databrowser.component";
import { PluginBannerUI } from "../pluginBanner/pluginBanner.component";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { DatabrowserService } from "../databrowserModule/databrowser.service";
import { PluginServices, PluginManifest } from "src/atlasViewer/atlasViewer.pluginService.service";
import { Store, select } from "@ngrx/store";
import { Observable, BehaviorSubject, combineLatest } from "rxjs";
import { map, shareReplay } from "rxjs/operators";

@Component({
  selector: 'menu-icons',
  templateUrl: './menuicons.template.html',
  styleUrls: [
    './menuicons.style.css',
    '../btnShadow.style.css'
  ]
})

export class MenuIconsBar{

  /**
   * databrowser
   */
  dbcf: ComponentFactory<DataBrowser>
  dataBrowser: ComponentRef<DataBrowser> = null
  dbWidget: ComponentRef<WidgetUnit> = null

  /**
   * layerBrowser
   */
  lbcf: ComponentFactory<LayerBrowser>
  layerBrowser: ComponentRef<LayerBrowser> = null
  lbWidget: ComponentRef<WidgetUnit> = null

  /**
   * pluginBrowser
   */
  pbcf: ComponentFactory<PluginBannerUI>
  pluginBanner: ComponentRef<PluginBannerUI> = null
  pbWidget: ComponentRef<WidgetUnit> = null

  isMobile: boolean = false
  mobileRespBtnClass: string

  public darktheme$: Observable<boolean>

  public themedBtnClass$: Observable<string>

  public skeletonBtnClass$: Observable<string>
  
  private layerBrowserExists$: BehaviorSubject<boolean> = new BehaviorSubject(false)
  public layerBrowserBtnClass$: Observable<string> 

  public toolBtnClass$: Observable<string>
  public getKgSearchBtnCls$: Observable<[Set<WidgetUnit>, string]>
  
  get darktheme(){
    return this.constantService.darktheme
  }

  public selectedTemplate$: Observable<any>

  constructor(
    private widgetServices:WidgetServices,
    private injector:Injector,
    private constantService:AtlasViewerConstantsServices,
    public dbService: DatabrowserService,
    cfr: ComponentFactoryResolver,
    public pluginServices:PluginServices,
    store: Store<any>
  ){

    this.isMobile = this.constantService.mobile
    this.mobileRespBtnClass = this.constantService.mobile ? 'btn-lg' : 'btn-sm'

    this.dbService.createDatabrowser = this.clickSearch.bind(this)

    this.dbcf = cfr.resolveComponentFactory(DataBrowser)
    this.lbcf = cfr.resolveComponentFactory(LayerBrowser)
    this.pbcf = cfr.resolveComponentFactory(PluginBannerUI)

    this.selectedTemplate$ = store.pipe(
      select('viewerState'),
      select('templateSelected')
    )

    this.themedBtnClass$ = this.constantService.darktheme$.pipe(
      map(flag => flag ? 'btn-dark' : 'btn-light' ),
      shareReplay(1)
    )

    this.skeletonBtnClass$ = this.constantService.darktheme$.pipe(
      map(flag => `${this.mobileRespBtnClass} ${flag ? 'text-light' : 'text-dark'}`),
      shareReplay(1)
    )

    this.layerBrowserBtnClass$ = combineLatest(
      this.layerBrowserExists$,
      this.themedBtnClass$
    ).pipe(
      map(([flag,themedBtnClass]) => `${this.mobileRespBtnClass} ${flag ? 'btn-primary' : themedBtnClass}`)
    )

    this.launchedPlugins$ = this.pluginServices.launchedPlugins$.pipe(
      map(set => Array.from(set))
    )

    this.getPluginBtnClass$ = combineLatest(
      this.pluginServices.launchedPlugins$,
      this.pluginServices.minimisedPlugins$,
      this.themedBtnClass$
    )

    this.darktheme$ = this.constantService.darktheme$

    this.getKgSearchBtnCls$ = combineLatest(
      this.widgetServices.minimisedWindow$,
      this.themedBtnClass$
    )
  }

  /**
   * TODO
   * temporary measure
   * migrate to  nehubaOverlay
   */
  public clickSearch({ regions, template, parcellation }){
    const dataBrowser = this.dbcf.create(this.injector)
    dataBrowser.instance.regions = regions
    dataBrowser.instance.template = template
    dataBrowser.instance.parcellation = parcellation
    const title = regions.length > 1
      ? `Search: ${regions.length} regions`
      : `Search: ${regions[0].name}`
    const widgetUnit = this.widgetServices.addNewWidget(dataBrowser, {
      exitable: true,
      persistency: true,
      state: 'floating',
      title,
      titleHTML: `<i class="fas fa-search"></i> ${title}`
    })
    return {
      dataBrowser,
      widgetUnit
    }
  }

  public catchError(e) {
    this.constantService.catchError(e)
  }

  public clickLayer(event: MouseEvent){

    if (this.lbWidget) {
      this.lbWidget.destroy()
      this.lbWidget = null
      return
    }
    this.layerBrowser = this.lbcf.create(this.injector)
    this.lbWidget = this.widgetServices.addNewWidget(this.layerBrowser, {
      exitable: true,
      persistency: true,
      state: 'floating',
      title: 'Layer Browser',
      titleHTML: '<i class="fas fa-layer-group"></i> Layer Browser'
    })

    this.layerBrowserExists$.next(true)

    this.lbWidget.onDestroy(() => {
      this.layerBrowserExists$.next(false)
      this.layerBrowser = null
      this.lbWidget = null
    })

    const el = event.currentTarget as HTMLElement
    const top = el.offsetTop
    const left = el.offsetLeft + 50
    this.lbWidget.instance.position = [left, top]
  }

  public clickPlugins(event: MouseEvent){
    if(this.pbWidget) {
      this.pbWidget.destroy()
      this.pbWidget = null
      return
    }
    this.pluginBanner = this.pbcf.create(this.injector)
    this.pbWidget = this.widgetServices.addNewWidget(this.pluginBanner, {
      exitable: true,
      persistency: true,
      state: 'floating',
      title: 'Plugin Browser',
      titleHTML: '<i class="fas fa-tools"></i> Plugin Browser'
    })

    this.pbWidget.onDestroy(() => {
      this.pbWidget = null
      this.pluginBanner = null
    })

    const el = event.currentTarget as HTMLElement
    const top = el.offsetTop
    const left = el.offsetLeft + 50
    this.pbWidget.instance.position = [left, top]
  }

  public clickPluginIcon(manifest: PluginManifest){
    this.pluginServices.launchPlugin(manifest)
      .catch(this.constantService.catchError)
  }

  public searchIconClickHandler(wu: WidgetUnit){
    if (this.widgetServices.isMinimised(wu)) {
      this.widgetServices.unminimise(wu)
    } else {
      this.widgetServices.minimise(wu)
    }
  }

  public getPluginBtnClass$: Observable<[Set<string>, Set<string>, string]>
  public launchedPlugins$: Observable<string[]>
}