import {
  Component,
  ComponentRef,
  Injector,
  ComponentFactory,
  ComponentFactoryResolver,
} from "@angular/core";

import { WidgetServices } from "src/atlasViewer/widgetUnit/widgetService.service";
import { WidgetUnit } from "src/atlasViewer/widgetUnit/widgetUnit.component";
import { DataBrowser } from "src/ui/databrowserModule/databrowser/databrowser.component";
import { PluginBannerUI } from "../pluginBanner/pluginBanner.component";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { DatabrowserService } from "../databrowserModule/databrowser.service";
import { PluginServices, PluginManifest } from "src/atlasViewer/atlasViewer.pluginService.service";
import { Store, select } from "@ngrx/store";
import { Observable, combineLatest } from "rxjs";
import { map, shareReplay, startWith } from "rxjs/operators";
import { ToastService } from "src/services/toastService.service";
@Component({
  selector: 'menu-icons',
  templateUrl: './menuicons.template.html',
  styleUrls: [
    './menuicons.style.css',
    '../btnShadow.style.css'
  ]
})

export class MenuIconsBar{

  public badgetPosition: string = 'above before'

  /**
   * databrowser
   */
  dbcf: ComponentFactory<DataBrowser>
  dataBrowser: ComponentRef<DataBrowser> = null
  dbWidget: ComponentRef<WidgetUnit> = null

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

  public toolBtnClass$: Observable<string>
  public getKgSearchBtnCls$: Observable<[Set<WidgetUnit>, string]>

  get darktheme(){
    return this.constantService.darktheme
  }

  public selectedTemplate$: Observable<any>
  public selectedParcellation$: Observable<any>
  public selectedRegions$: Observable<any>

  searchCollapsed = 0
  searchedItemsNumber = 0
  searchLoading = false
  searchMenuFrozen = false
  filePreviewModalClosed = false
  showSearchMenu = false
  mouseHoversSearch = false

  constructor(
    private widgetServices:WidgetServices,
    private injector:Injector,
    private constantService:AtlasViewerConstantsServices,
    public dbService: DatabrowserService,
    cfr: ComponentFactoryResolver,
    public pluginServices:PluginServices,
    private store: Store<any>,
    private toastService: ToastService
  ){

    this.isMobile = this.constantService.mobile
    this.mobileRespBtnClass = this.constantService.mobile ? 'btn-lg' : 'btn-sm'

    this.dbService.createDatabrowser = this.clickSearch.bind(this)

    this.dbcf = cfr.resolveComponentFactory(DataBrowser)
    this.pbcf = cfr.resolveComponentFactory(PluginBannerUI)

    this.selectedTemplate$ = store.pipe(
      select('viewerState'),
      select('templateSelected')
    )

      this.selectedParcellation$ = store.pipe(
          select('viewerState'),
          select('parcellationSelected'),
      )

    this.selectedRegions$ = store.pipe(
      select('viewerState'),
      select('regionsSelected'),
      startWith([]),
      shareReplay(1)
    )

    this.themedBtnClass$ = this.constantService.darktheme$.pipe(
      map(flag => flag ? 'btn-dark' : 'btn-light' ),
      shareReplay(1)
    )

    this.skeletonBtnClass$ = this.constantService.darktheme$.pipe(
      map(flag => `${this.mobileRespBtnClass} ${flag ? 'text-light' : 'text-dark'}`),
      shareReplay(1)
    )

    this.launchedPlugins$ = this.pluginServices.launchedPlugins$.pipe(
      map(set => Array.from(set)),
      shareReplay(1)
    )

    /**
     * TODO remove dependency on themedBtnClass$
     */
    this.getPluginBtnClass$ = combineLatest(
      this.pluginServices.launchedPlugins$,
      this.pluginServices.minimisedPlugins$,
      this.themedBtnClass$
    )

    this.darktheme$ = this.constantService.darktheme$

    /**
     * TODO remove dependency on themedBtnClass$
     */
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
      .catch(err => this.constantService.catchError(err))
  }

  public searchIconClickHandler(wu: WidgetUnit) {
      if (this.widgetServices.isMinimised(wu)) {
          this.widgetServices.unminimise(wu)
      } else {
          this.widgetServices.minimise(wu)
      }
  }
  collapseSearchBar() {
    if (this.searchCollapsed === 2) {
      this.searchCollapsed = 1
      setTimeout(() => {this.searchCollapsed = 0}, 500)
    } else {
      this.searchCollapsed = 2
    }
  }

  closeFrozenMenu() {
    this.searchMenuFrozen = false
    this.filePreviewModalClosed = false
  }

  hideSearchMenu() {
    if (this.showSearchMenu) {
      setTimeout(() => {
        if (!this.mouseHoversSearch && !this.searchMenuFrozen)
          this.showSearchMenu = false
      }, 600)
    }
  }

  get databrowserIsShowing() {
    return this.dataBrowser !== null
  }

  public closeWidget(event: MouseEvent, wu:WidgetUnit){
    event.stopPropagation()
    this.widgetServices.exitWidget(wu)
  }

  public renameKgSearchWidget(event:MouseEvent, wu: WidgetUnit) {
    event.stopPropagation()
  }

  public favKgSearch(event: MouseEvent, wu: WidgetUnit) {
    event.stopPropagation()
  }

  public getPluginBtnClass$: Observable<[Set<string>, Set<string>, string]>
  public launchedPlugins$: Observable<string[]>
}
