import { Component } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { map, tap } from "rxjs/operators";
import { PluginServices } from "src/atlasViewer/pluginUnit";
import { selectorAllPluginsCspPermission } from "src/services/state/userConfigState.store";

@Component({
  selector: 'plugin-csp-controller',
  templateUrl: './pluginCsp.template.html',
  styleUrls: [
    './pluginCsp.style.css'
  ]
})

export class PluginCspCtrlCmp{

  public pluginCsp$ = this.store$.pipe(
    select(selectorAllPluginsCspPermission),
    map(pluginCsp => Object.keys(pluginCsp).map(key => ({ pluginKey: key, pluginCsp: pluginCsp[key] }))),
  )

  constructor(
    private store$: Store<any>,
    private pluginService: PluginServices,
  ){

  }

  revoke(pluginKey: string){
    this.pluginService.revokePluginPermission(pluginKey)
  }
}