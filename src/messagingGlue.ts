import { Injectable, OnDestroy } from "@angular/core";
import { Store } from "@ngrx/store";
import { IMessagingActionTmpl, IWindowMessaging } from "./messaging/types";
import { atlasAppearance, atlasSelection, generalActions } from "src/state"
import { SAPI } from "./atlasComponents/sapi";
import { translateV3Entities } from "./atlasComponents/sapi/translateV3"

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
        const sapiAtlas = translateV3Entities.retrieveAtlas(atlas)
        const { ['@id']: atlasId, spaces } = sapiAtlas
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
    const {
      parcellation: {
        id: parcellationId
      },
      template: {
        id: templateId
      },
      atlas: {
        id: atlasId
      }
    } = payload
    
    if (!atlasId) {
      return this.store.dispatch(
        generalActions.generalActionError({
          message: `atlas id with the corresponding templateId ${payload['@id']} not found.`
        })
      )
    }
    this.store.dispatch(
      atlasSelection.actions.selectATPById({
        atlasId,
        templateId,
        parcellationId
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
      const layer: atlasAppearance.const.CustomLayer = {
        legacySpecFlag: "old",
        id: swcLayerUuid,
        source: `swc://${url}`,
        segments: [
          "1"
        ],
        transform: transform,
        clType: 'customlayer/nglayer' as const,
        type: 'segmentation',
      }

      this.store.dispatch(
        atlasAppearance.actions.addCustomLayer({
          customLayer: layer
        })
      )

      this.mapIdUnload.set(swcLayerUuid, () => {
        this.store.dispatch(
          atlasAppearance.actions.removeCustomLayer({
            id: swcLayerUuid
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
