import {
  Component,
  ComponentRef,
  Injector,
  ComponentFactory,
  ComponentFactoryResolver,
  ViewChild, ElementRef, AfterViewInit
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

@Component({
  selector: 'menu-icons',
  templateUrl: './menuicons.template.html',
  styleUrls: [
    './menuicons.style.css',
    '../btnShadow.style.css'
  ]
})

export class MenuIconsBar {

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

  @ViewChild (MatMenuTrigger) private menuTrigger: MatMenuTrigger;
  @ViewChild ('multiSearchButton', { read: ElementRef }) multiSearchButton: ElementRef;
  @ViewChild ('searchMenuContent', { read: ElementRef }) searchMenuContent: ElementRef;

  get isMobile(){
    return this.constantService.mobile
  }

  constructor(
    private widgetServices:WidgetServices,
    private injector:Injector,
    private constantService:AtlasViewerConstantsServices,
    public dbService: DatabrowserService,
    cfr: ComponentFactoryResolver,
    public pluginServices:PluginServices
  ){

    this.dbService.createDatabrowser = this.clickSearch.bind(this)

    this.dbcf = cfr.resolveComponentFactory(DataBrowser)
    this.lbcf = cfr.resolveComponentFactory(LayerBrowser)
    this.pbcf = cfr.resolveComponentFactory(PluginBannerUI)
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



  opensearchMenu() {
    let menu = document.getElementById('searchMenuBtn');
    menu.style.display = '';
    menu.style.position = 'absolute';
    menu.style.left = this.multiSearchButton.nativeElement.getBoundingClientRect().left + 35 + 'px';
    menu.style.top = this.multiSearchButton.nativeElement.getBoundingClientRect().top + 'px';
    this.menuTrigger.openMenu();
  }

}