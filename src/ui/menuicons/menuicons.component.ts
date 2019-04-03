import { Component, ViewChild, TemplateRef, ComponentRef, Injector, ComponentFactory, ComponentFactoryResolver } from "@angular/core";

import { WidgetServices } from "src/atlasViewer/widgetUnit/widgetService.service";
import { WidgetUnit } from "src/atlasViewer/widgetUnit/widgetUnit.component";
import { LayerBrowser } from "src/ui/layerbrowser/layerbrowser.component";
import { DataBrowser } from "src/ui/databrowserModule/databrowser/databrowser.component";
import { PluginBannerUI } from "../pluginBanner/pluginBanner.component";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";

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

  get isMobile(){
    return this.constantService.mobile
  }

  constructor(
    private widgetServices:WidgetServices,
    private injector:Injector,
    private constantService:AtlasViewerConstantsServices,
    cfr: ComponentFactoryResolver
  ){
    this.dbcf = cfr.resolveComponentFactory(DataBrowser)
    this.lbcf = cfr.resolveComponentFactory(LayerBrowser)
    this.pbcf = cfr.resolveComponentFactory(PluginBannerUI)
  }
  public clickSearch(event: MouseEvent){
    if (this.dbWidget) {
      this.dbWidget.destroy()
      this.dbWidget = null
      return
    }
    this.dataBrowser = this.dbcf.create(this.injector)
    this.dbWidget = this.widgetServices.addNewWidget(this.dataBrowser, {
      exitable: true,
      persistency: true,
      state: 'floating',
      title: this.dataBrowserTitle,
      titleHTML: `<i class="fas fa-search"></i> ${this.dataBrowserTitle}`
    })

    this.dbWidget.onDestroy(() => {
      // sub.unsubscribe()
      this.dataBrowser = null
      this.dbWidget = null
    })

    const el = event.currentTarget as HTMLElement
    const top = el.offsetTop
    const left = el.offsetLeft + 50
    this.dbWidget.instance.position = [left, top]
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
}