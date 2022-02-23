import { Injectable, OnDestroy } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { IMessagingActionTmpl, IWindowMessaging } from "./messaging/types";
import { ngViewerActionAddNgLayer, ngViewerActionRemoveNgLayer } from "./services/state/ngViewerState/actions";
import { generalActionError } from "./services/stateStore.helper";
import { atlasSelection } from "src/state"
import { SAPI } from "./atlasComponents/sapi";

@Injectable()
export class MessagingGlue implements IWindowMessaging, OnDestroy {

  private onDestroyCb: (() => void)[] = []
  private tmplSpIdToAtlasId = new Map<string, string>()
  private mapIdUnload = new Map<string, () => void>()

  ngOnDestroy(){
    while(this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
  }

  constructor(
    private store: Store<any>,
    sapi: SAPI,
  ){

    const sub = sapi.atlases$.subscribe(atlases => {
      for (const atlas of atlases) {
        const { ['@id']: atlasId, spaces } = atlas
        for (const tmpl of spaces) {
          const { ['@id']: tmplId } = tmpl
          this.tmplSpIdToAtlasId.set(tmplId, atlasId)
        }
      }
    })

    this.onDestroyCb.push(() => sub.unsubscribe())
  }

  /**
   * it is important to not use select temlate by id. always go from the highest hierarchy,
   * and enforce single direction flow when possible
   */
  loadTempladById( payload: IMessagingActionTmpl['loadTemplate'] ){
    const atlasId = this.tmplSpIdToAtlasId.get(payload['@id'])
    if (!atlasId) {
      return this.store.dispatch(
        generalActionError({
          message: `atlas id with the corresponding templateId ${payload['@id']} not found.`
        })
      )
    }
    this.store.dispatch(
      atlasSelection.actions.selectATPById({
        atlasId,
        templateId: payload["@id"]
      })
    )
  }

  loadResource(payload: IMessagingActionTmpl['loadResource']){
    const {
      unload,
      url,
      ["@type"]: type,
      ["@id"]: swcLayerUuid,
      resourceParam
    } = payload

    if (type === 'swc') {
      const { transform } = resourceParam
      const layer = {
        name: swcLayerUuid,
        id: swcLayerUuid,
        source: `swc://${url}`,
        mixability: 'mixable',
        type: "segmentation",
        "segments": [
          "1"
        ],
        transform,
      }

      this.store.dispatch(
        ngViewerActionAddNgLayer({
          layer
        })
      )

      this.mapIdUnload.set(swcLayerUuid, () => {
        this.store.dispatch(
          ngViewerActionRemoveNgLayer({
            layer: {
              name: swcLayerUuid
            }
          })
        )
        unload()
      })
    }
  }
  unloadResource(payload: IMessagingActionTmpl['unloadResource']) {
    const { ["@id"]: id } = payload
    const cb = this.mapIdUnload.get(id)
    if (!cb) {
      throw new Error(`Unload resource id ${id} does not exist.`)
    }
    cb()
    this.mapIdUnload.delete(id)
  }
}
