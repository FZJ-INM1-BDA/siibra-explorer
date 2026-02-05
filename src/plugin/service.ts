import { HttpClient } from "@angular/common/http";
import { Injectable, Injector, NgZone } from "@angular/core";
import { WIDGET_PORTAL_TOKEN } from "src/widget/constants";
import { WidgetService } from "src/widget/service";
import { WidgetPortal } from "src/widget/widgetPortal/widgetPortal.component";
import { setPluginSrc, SET_PLUGIN_NAME } from "./const";
import { PluginPortal } from "./pluginPortal/pluginPortal.component";
import { environment } from "src/environments/environment"
import { catchError, startWith } from "rxjs/operators";
import { of } from "rxjs";
import { PluginManifest } from "./types";

@Injectable({
  providedIn: 'root'
})
export class PluginService {
  loadedPlugins: string[] = []
  srcWidgetMap = new Map<string, WidgetPortal<PluginPortal>>()
  
  constructor(
    private wSvc: WidgetService,
    private injector: Injector,
    private zone: NgZone,
    private http: HttpClient
  ){}

  pluginManifests$ = this.http.get<PluginManifest[]>(`${environment.BACKEND_URL || ''}plugins/manifests`).pipe(
    startWith([]),
    catchError(() =>  of([]))
  )

  async launchPlugin(htmlSrc: string){
    if (this.loadedPlugins.includes(htmlSrc)) return
    const injector = Injector.create({
      providers: [{
        provide: WIDGET_PORTAL_TOKEN,
        useValue: setPluginSrc(htmlSrc, {})
      }, {
        provide: SET_PLUGIN_NAME,
        useValue: (inst: PluginPortal, pluginName: string) => this.setPluginName(inst, pluginName)
      }],
      parent: this.injector
    })
    const wdg = this.wSvc.addNewWidget(PluginPortal, injector)
    this.srcWidgetMap.set(htmlSrc, wdg)
  }

  setPluginName(plg: PluginPortal, name: string) {
    
    if (!this.srcWidgetMap.has(plg.src)) {
      console.warn(`cannot find plg.src ${plg.src}`)
      return
    }
    const wdg = this.srcWidgetMap.get(plg.src)
    this.zone.run(() => wdg.name = name)
  }

  rmPlugin(plg: PluginPortal){
    this.loadedPlugins = this.loadedPlugins.filter(plgSrc => plgSrc !== plg.src)

    if (!this.srcWidgetMap.has(plg.src)) {
      console.warn(`cannot find plg.src ${plg.src}`)
      return
    }
    const wdg = this.srcWidgetMap.get(plg.src)
    this.srcWidgetMap.delete(plg.src)

    this.wSvc.rmWidget(wdg)
  }
}
