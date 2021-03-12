import { OnDestroy } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { IMessagingActionTmpl, IWindowMessaging } from "./messaging/types";
import { ngViewerActionAddNgLayer, ngViewerActionRemoveNgLayer } from "./services/state/ngViewerState/actions";
import { viewerStateSelectAtlas } from "./services/state/viewerState/actions";
import { viewerStateFetchedAtlasesSelector } from "./services/state/viewerState/selectors";
import { generalActionError } from "./services/stateStore.helper";

export class MessagingGlue implements IWindowMessaging, OnDestroy {

  private onDestroyCb: (() => void)[] = []
  private tmplSpIdToAtlasId = new Map<string, string>()
  private mapIdUnload = new Map<string, () => void>()

  ngOnDestroy(){
    while(this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
  }

  constructor(private store: Store<any>){

    const sub = this.store.pipe(
      select(viewerStateFetchedAtlasesSelector)
    ).subscribe((atlases: any[]) => {
      for (const atlas of atlases) {
        const { ['@id']: atlasId, templateSpaces } = atlas
        for (const tmpl of templateSpaces) {
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
      viewerStateSelectAtlas({
        atlas: {
          ['@id']: atlasId,
          template: {
            ['@id']: payload['@id']
          }
        }
      })
    )
  }

  loadResource(payload: IMessagingActionTmpl['loadResource']){
    const {
      unload,
      url,
      ["@type"]: type,
      ["@id"]: swcLayerUuid
    } = payload

    if (type === 'swc') {

      const layer = {
        name: swcLayerUuid,
        id: swcLayerUuid,
        source: `swc://${url}`,
        mixability: 'mixable',
        type: "segmentation",
        "segments": [
          "1"
        ],
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
