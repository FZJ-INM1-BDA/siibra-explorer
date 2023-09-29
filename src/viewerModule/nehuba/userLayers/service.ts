import { Injectable, OnDestroy } from "@angular/core"
import { MatDialog } from "@angular/material/dialog"
import { select, Store } from "@ngrx/store"
import { concat, from, of, Subscription } from "rxjs"
import { catchError, map, pairwise, switchMap } from "rxjs/operators"
import {
  linearTransform,
  TVALID_LINEAR_XFORM_DST,
  TVALID_LINEAR_XFORM_SRC,
} from "src/atlasComponents/sapi/core/space/interspaceLinearXform"
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service"
import { RouterService } from "src/routerModule/router.service"
import * as atlasAppearance from "src/state/atlasAppearance"
import { EnumColorMapName } from "src/util/colorMaps"
import { getShader } from "src/util/constants"
import { getExportNehuba, getUuid } from "src/util/fn"
import { UserLayerInfoCmp } from "./userlayerInfo/userlayerInfo.component"

type OmitKeys = "clType" | "id" | "source"
type Meta = {
  min?: number
  max?: number
  message?: string
  filename: string
}

const OVERLAY_LAYER_KEY = "x-overlay-layer"

@Injectable()
export class UserLayerService implements OnDestroy {
  private userLayerUrlToIdMap = new Map<string, string>()
  private createdUrlRes = new Set<string>()

  private supportedPrefix = ["nifti://", "precomputed://", "swc://"]

  private verifyUrl(url: string) {
    for (const prefix of this.supportedPrefix) {
      if (url.includes(prefix)) return
    }
    throw new Error(
      `url: ${url} does not start with supported prefixes ${this.supportedPrefix}`
    )
  }

  async getCvtFileToUrl(file: File): Promise<{
    url: string
    meta: Meta
    options?: Omit<atlasAppearance.const.NgLayerCustomLayer, OmitKeys>
  }> {
    /**
     * if extension is .swc, process as if swc
     */
    if (/\.swc$/i.test(file.name)) {
      let message = `The swc rendering is experimental. Please contact us on any feedbacks. `
      const swcText = await file.text()
      let src: TVALID_LINEAR_XFORM_SRC
      const dst: TVALID_LINEAR_XFORM_DST = "NEHUBA"
      if (/ccf/i.test(swcText)) {
        src = "CCF"
        message += `CCF detected, applying known transformation.`
      }
      if (!src) {
        message += `no known space detected. Applying default transformation.`
      }

      const xform = await linearTransform(src, dst)

      const url = URL.createObjectURL(file)
      this.createdUrlRes.add(url)

      return {
        url: `swc://${url}`,
        meta: {
          filename: file.name,
          message,
        },
        options: {
          segments: ["1"],
          transform: xform,
          type: "segmentation"
        },
      }
    }

    /**
     * process as if nifti
     */

    // Get file, try to inflate, if files, use original array buffer
    const buf = await file.arrayBuffer()
    let outbuf
    try {
      const { pako } = await getExportNehuba()
      outbuf = pako.inflate(buf).buffer
    } catch (e) {
      console.log("unpack error", e)
      outbuf = buf
    }

    const { result } = await this.worker.sendMessage({
      method: "PROCESS_NIFTI",
      param: {
        nifti: outbuf,
      },
      transfers: [outbuf],
    })

    const { meta, buffer } = result

    const url = URL.createObjectURL(new Blob([buffer]))
    return {
      url: `nifti://${url}`,
      meta: {
        filename: file.name,
        min: meta.min || 0,
        max: meta.max || 1,
        message: meta.message,
      },
      options: {
        shader: getShader({
          colormap: EnumColorMapName.MAGMA,
          lowThreshold: meta.min || 0,
          highThreshold: meta.max || 1,
        }),
        type: 'image'
      },
    }
  }

  addUserLayer(
    url: string,
    meta: Meta,
    options: Omit<atlasAppearance.const.NgLayerCustomLayer, OmitKeys> = {}
  ) {
    this.verifyUrl(url)
    if (this.userLayerUrlToIdMap.has(url)) {
      throw new Error(`url ${url} already added`)
    }
    const id = getUuid()
    const layer: atlasAppearance.const.NgLayerCustomLayer = {
      id,
      clType: "customlayer/nglayer",
      source: url,
      ...options,
    }
    this.store$.dispatch(
      atlasAppearance.actions.addCustomLayer({
        customLayer: layer,
      })
    )

    this.userLayerUrlToIdMap.set(url, id)

    this.dialog
      .open(UserLayerInfoCmp, {
        data: {
          layerName: id,
          filename: meta.filename,
          min: meta.min || 0,
          max: meta.max || 1,
          warning: [meta.message] || [],
        },
        hasBackdrop: false,
        disableClose: true,
        position: {
          top: "0em",
        },
        autoFocus: false,
        panelClass: ["no-padding-dialog", "w-100"],
      })
      .afterClosed()
      .subscribe(() => {
        this.routerSvc.setCustomRoute(OVERLAY_LAYER_KEY, null)
      })
  }

  removeUserLayer(url: string) {
    if (!this.userLayerUrlToIdMap.has(url)) {
      throw new Error(`${url} has not yet been added.`)
    }

    /**
     * if the url to be removed is a url resource, revoke the resource
     */
    const matched = /http.*$/.exec(url)
    if (matched && this.createdUrlRes.has(matched[0])) {
      URL.revokeObjectURL(matched[0])
      this.createdUrlRes.delete(matched[0])
    }

    const id = this.userLayerUrlToIdMap.get(url)
    this.store$.dispatch(atlasAppearance.actions.removeCustomLayer({ id }))
    this.userLayerUrlToIdMap.delete(url)
  }

  #subscription: Subscription[] = []
  constructor(
    private store$: Store,
    private dialog: MatDialog,
    private worker: AtlasWorkerService,
    private routerSvc: RouterService
  ) {
    this.#subscription.push(
      concat(
        of(null as string),
        this.routerSvc.customRoute$.pipe(
          select(v => v[OVERLAY_LAYER_KEY])
        )
      ).pipe(
        pairwise(),
        switchMap(([prev, curr]) => {
          /**
           * for precomputed sources, check if transform.json exists.
           * if so, try to fetch it, and set it as transform
           */
          if (!curr) {
            return of([prev, curr, null])
          }
          if (!curr.startsWith("precomputed://")) {
            return of([prev, curr, null])
          }
          return from(fetch(`${curr.replace('precomputed://', '')}/transform.json`).then(res => res.json())).pipe(
            catchError(() => of([prev, curr, null])),
            map(transform => [prev, curr, transform])
          )
        })
      ).subscribe(([prev, curr, transform]) => {
        if (prev) {
          this.removeUserLayer(prev)
        }
        if (curr) {
          this.addUserLayer(
            curr,
            {
              filename: curr,
              message: `Overlay layer populated in URL`,
            },
            {
              shader: getShader({
                colormap: EnumColorMapName.MAGMA,
              }),
              transform
            }
          )
        }
      })
    )
  }

  ngOnDestroy(): void {
    while (this.#subscription.length > 0) this.#subscription.pop().unsubscribe()
  }
}
