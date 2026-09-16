import { HttpClient } from "@angular/common/http";
import { Injectable, Injector, NgZone } from "@angular/core";
import { setPluginSrc, SET_PLUGIN_NAME } from "./const";
import { PluginPortal } from "./pluginPortal/pluginPortal.component";
import { environment } from "src/environments/environment"
import { catchError, startWith } from "rxjs/operators";
import { of } from "rxjs";
import { ToolbarWidgetSvc } from "src/atlasComponents/toolbarWidget/toolbarWidget.service";
import { ToolbarWidget } from "src/atlasComponents/toolbarWidget/toolbarWidget.component";
import { SxplrSnackBarSvc } from "src/components";
import { RM_TOOLBAR_WIDGET, TOOLBAR_PORTAL_TOKEN } from "src/atlasComponents/toolbarWidget/consts";
import { PluginManifest } from "./types";

@Injectable({
  providedIn: 'root'
})
export class PluginService {
  #srcWidgetMap = new Map<string, ToolbarWidget<PluginPortal>>()
  #widgetSrcMap = new Map<ToolbarWidget<PluginPortal>, string>()
  
  constructor(
    private wSvc: ToolbarWidgetSvc,
    private injector: Injector,
    private zone: NgZone,
    private http: HttpClient,
    private snackbar: SxplrSnackBarSvc,
  ){}

  pluginManifests$ = this.http.get<PluginManifest[]>(`${environment.BACKEND_URL || ''}plugins/manifests`).pipe(
    startWith([]),
    catchError(() =>  of([]))
  )

  async launchPlugin(htmlSrc: string){
    if (this.#srcWidgetMap.has(htmlSrc)) {
      this.snackbar.open({
        message: `Plugin already launched!`
      })
      return
    }
    const injector = Injector.create({
      providers: [{
        provide: TOOLBAR_PORTAL_TOKEN,
        useValue: setPluginSrc(htmlSrc, {})
      }, {
        provide: SET_PLUGIN_NAME,
        useValue: (inst: PluginPortal, pluginName: string) => this.setPluginName(inst, pluginName)
      },
      {
        provide: RM_TOOLBAR_WIDGET,
        useValue: (cmp: ToolbarWidget<PluginPortal>) => this.rmPlugin(cmp)
      }
    ],
      parent: this.injector
    })
    const wdg = this.wSvc.addNewWidget(PluginPortal, injector)
    this.#widgetSrcMap.set(wdg, htmlSrc)
    this.#srcWidgetMap.set(htmlSrc, wdg)
    
  }

  setPluginName(plg: PluginPortal, name: string) {
    if (!this.#srcWidgetMap.has(plg.src)) {
      console.warn(`cannot find plg.src ${plg.src}`)
      return
    }
    const wdg = this.#srcWidgetMap.get(plg.src)
    this.zone.run(() => {
      if (wdg) {
        wdg.name = name
      }
    })
  }

  rmPlugin(wdgt: ToolbarWidget<PluginPortal>){
    this.wSvc.rmWidget(wdgt)
    const htmlSrc = this.#widgetSrcMap.get(wdgt)
    this.#widgetSrcMap.delete(wdgt)
    if (!htmlSrc){
      return
    }
    this.#srcWidgetMap.delete(htmlSrc)

  }
}
