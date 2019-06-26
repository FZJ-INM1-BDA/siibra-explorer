import {
  Component,
  ComponentRef,
  Injector,
  ComponentFactory,
  ComponentFactoryResolver,
  ElementRef, ViewChild, OnInit, OnDestroy
} from "@angular/core";

import { WidgetServices } from "src/atlasViewer/widgetUnit/widgetService.service";
import { WidgetUnit } from "src/atlasViewer/widgetUnit/widgetUnit.component";
import { LayerBrowser } from "src/ui/layerbrowser/layerbrowser.component";
import { DataBrowser } from "src/ui/databrowserModule/databrowser/databrowser.component";
import { PluginBannerUI } from "../pluginBanner/pluginBanner.component";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { DatabrowserService } from "../databrowserModule/databrowser.service";
import { PluginServices } from "src/atlasViewer/atlasViewer.pluginService.service";
import {MatMenuTrigger} from "@angular/material";
import {Observable, Subscription} from "rxjs";
import {select, Store} from "@ngrx/store";
import {distinctUntilChanged, filter, map} from "rxjs/operators";
import {CHANGE_NAVIGATION, isDefined, SELECT_REGIONS, ViewerStateInterface} from "src/services/stateStore.service";
import {regionFlattener} from "src/util/regionFlattener";
import {ToastService} from "src/services/toastService.service";

@Component({
  selector: 'menu-icons',
  templateUrl: './menuicons.template.html',
  styleUrls: [
    './menuicons.style.css',
    '../btnShadow.style.css'
  ]
})

export class MenuIconsBar implements OnInit, OnDestroy {

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


  private subscriptions: Subscription[] = []
  public selectedRegions$: Observable<any[]>
  private selectedRegions: any[] = []
  @ViewChild('selectedRegionsMenuOpener', {read: MatMenuTrigger}) protected regionMenuTrigger : MatMenuTrigger;
  @ViewChild ('selectedRegionsButton', { read: ElementRef }) multiSearchButton: ElementRef;

  get isMobile(){
    return this.constantService.mobile
  }

  constructor(
    private widgetServices:WidgetServices,
    private injector:Injector,
    private constantService:AtlasViewerConstantsServices,
    public dbService: DatabrowserService,
    cfr: ComponentFactoryResolver,
    public pluginServices:PluginServices,
    private store: Store<ViewerStateInterface>,
    private toastService: ToastService,
  ){

    this.dbService.createDatabrowser = this.clickSearch.bind(this)

    this.dbcf = cfr.resolveComponentFactory(DataBrowser)
    this.lbcf = cfr.resolveComponentFactory(LayerBrowser)
    this.pbcf = cfr.resolveComponentFactory(PluginBannerUI)

    this.selectedRegions$ = this.store.pipe(
        select('viewerState'),
        filter(state=>isDefined(state)&&isDefined(state.regionsSelected)),
        map(state=>state.regionsSelected),
        distinctUntilChanged()
    )
  }

  ngOnInit(): void {
    this.subscriptions.push(
        this.selectedRegions$.subscribe(regions => {
          this.selectedRegions = regions
        })
    )
  }

  ngOnDestroy(){
    this.subscriptions.forEach(s => s.unsubscribe())
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

    this.lbWidget.onDestroy(() => {
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

  opensearchMenu() {
    let menu = document.getElementById('selectedRegionsMenuOpener');
    menu.style.display = '';
    menu.style.position = 'absolute';
    menu.style.transform = 'translate(40px, 0)'
    this.regionMenuTrigger.openMenu();
  }

  removeRegionFromSelectedList(region) {
    const flattenedRegion = regionFlattener(region).filter(r => isDefined(r.labelIndex))
    const flattenedRegionNames = new Set(flattenedRegion.map(r => r.name))
    this.store.dispatch({
      type: SELECT_REGIONS,
      selectRegions: this.selectedRegions.filter(r => !flattenedRegionNames.has(r.name))
    })
  }

  clearSelectedRegions() {
    this.store.dispatch({
      type: SELECT_REGIONS,
      selectRegions: []
    })
  }

  regionClicked(region) {
    if (region.position) {
      this.store.dispatch({
        type: CHANGE_NAVIGATION,
        navigation: {
          position: region.position
        }
      })
    } else {
      this.toastService.showToast(`${region.name} does not have a position defined`, {
        timeout: 5000,
        dismissable: true
      })
    }
  }

  get databrowserIsShowing() {
    return this.dataBrowser !== null
  }

  get layerbrowserIsShowing() {
    return this.layerBrowser !== null
  }

  get pluginbrowserIsShowing() {
    return this.pluginBanner !== null
  }

  get dataBrowserTitle() {
    return `Browse`
  }
}