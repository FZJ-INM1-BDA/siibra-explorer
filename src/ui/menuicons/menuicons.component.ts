import {
  Component,
  ComponentRef,
  Injector,
  ComponentFactory,
  ComponentFactoryResolver,
  ViewChild, OnInit, OnDestroy, ElementRef, HostListener
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
  ],
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
  selectedRegions: any[] = []

  regionMenuTrigger = false
  @ViewChild('selectedRegionsMenu', {read: ElementRef}) selectedRegionsMenu: ElementRef
  @ViewChild('selectedRegionsButton', {read: ElementRef}) selectedRegionsButton: ElementRef
  searchMenuTrigger = false
  @ViewChild('selectedSearchMenu', {read: ElementRef}) selectedSearchMenu: ElementRef
  @ViewChild('selectedSearchButton', {read: ElementRef}) selectedSearchButton: ElementRef
  pluginMenuTrigger = false
  @ViewChild('pluginMenu', {read: ElementRef}) pluginMenu: ElementRef
  @ViewChild('pluginButton', {read: ElementRef}) pluginButton: ElementRef

  get isMobile(){
    return this.constantService.mobile
  }

  public selectedTemplate$: Observable<any>

  constructor(
    private widgetServices:WidgetServices,
    private injector:Injector,
    private constantService:AtlasViewerConstantsServices,
    public dbService: DatabrowserService,
    cfr: ComponentFactoryResolver,
    public pluginServices:PluginServices,
    private store: Store<any>,
    private toastService: ToastService,
  ){

    this.dbService.createDatabrowser = this.clickSearch.bind(this)

    this.dbcf = cfr.resolveComponentFactory(DataBrowser)
    this.lbcf = cfr.resolveComponentFactory(LayerBrowser)
    this.pbcf = cfr.resolveComponentFactory(PluginBannerUI)

    this.selectedTemplate$ = store.pipe(
      select('viewerState'),
      select('templateSelected')
    )

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

  @HostListener('document:click', ['$event', '$event.target'])
  onClick(event: MouseEvent, targetElement: HTMLElement): void {
    if (!targetElement) {
      return;
    }
    if (this.regionMenuTrigger) {
      if (this.selectedRegionsMenu && !this.selectedRegionsMenu.nativeElement.contains(targetElement)) {
        this.regionMenuTrigger = false
      }
    } else {
      if (this.selectedRegionsButton && this.selectedRegionsButton.nativeElement.contains(targetElement)) {
        this.regionMenuTrigger = true
      }
    }
    if (this.searchMenuTrigger) {
      if (this.selectedSearchMenu && !this.selectedSearchMenu.nativeElement.contains(targetElement)) {
        this.searchMenuTrigger = false
      }
    } else {
      if (this.selectedSearchButton && this.selectedSearchButton.nativeElement.contains(targetElement)) {
        this.searchMenuTrigger = true
      }
    }
    if (this.pluginMenuTrigger) {
      if (this.pluginMenu && !this.pluginMenu.nativeElement.contains(targetElement)) {
        this.pluginMenuTrigger = false
      }
    } else {
      if (this.pluginButton && this.pluginButton.nativeElement.contains(targetElement)) {
        this.pluginMenuTrigger = true
      }
    }

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
      ? `${regions.length} regions`
      : `${regions[0].name}`
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

  openRegionMenu() {
    if (!this.regionMenuTrigger) {
      this.selectedRegionsMenu.nativeElement.style.display = ''
      this.selectedRegionsMenu.nativeElement.style.position = 'absolute'
      this.selectedRegionsMenu.nativeElement.style.transform = 'translate(150px, -30px)'
    } else {
      this.regionMenuTrigger = false;
    }
  }

  openSearchMenu() {
    if (!this.searchMenuTrigger) {
      this.selectedSearchMenu.nativeElement.style.display = ''
      this.selectedSearchMenu.nativeElement.style.position = 'absolute'
      this.selectedSearchMenu.nativeElement.style.transform = 'translate(150px, -30px)'
    } else {
      this.searchMenuTrigger = false;
    }
  }

  openPluginMenu() {
    if (!this.pluginMenuTrigger) {
      this.pluginMenu.nativeElement.style.display = ''
      this.pluginMenu.nativeElement.style.position = 'absolute'
      this.pluginMenu.nativeElement.style.transform = 'translate(150px, -30px)'
    } else {
      this.pluginMenuTrigger = false;
    }
  }

  removeRegionFromSelectedList(region) {
    if (this.selectedRegions && this.selectedRegions.length === 1) this.regionMenuTrigger = false
    this.store.dispatch({
      type: SELECT_REGIONS,
      selectRegions: this.selectedRegions.filter(r => r.name !== region.name)
    })
  }

  clearSelectedRegions() {
    this.store.dispatch({
      type: SELECT_REGIONS,
      selectRegions: []
    })
    this.regionMenuTrigger = false
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