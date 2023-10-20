import { Injectable, OnDestroy } from "@angular/core"
import { MatDialog, MatDialogRef } from "@angular/material/dialog"
import { select, Store } from "@ngrx/store"
import { forkJoin, from, Subscription } from "rxjs"
import { distinctUntilChanged, filter } from "rxjs/operators"
import {
  linearTransform,
  TVALID_LINEAR_XFORM_DST,
  TVALID_LINEAR_XFORM_SRC,
} from "src/atlasComponents/sapi/core/space/interspaceLinearXform"
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service"
import { RouterService } from "src/routerModule/router.service"
import * as atlasAppearance from "src/state/atlasAppearance"
import { EnumColorMapName } from "src/util/colorMaps"
import { getShader, getShaderFromMeta } from "src/util/fn"
import { getExportNehuba, getUuid } from "src/util/fn"
import { UserLayerInfoCmp } from "./userlayerInfo/userlayerInfo.component"
import { translateV3Entities } from "src/atlasComponents/sapi/translateV3"
import { MetaV1Schema } from "src/atlasComponents/sapi/typeV3"
import { AnnotationLayer } from "src/atlasComponents/annotations"
import { rgbToHex } from 'common/util'

type OmitKeys = "clType" | "id" | "source"
type LayerOption = Omit<atlasAppearance.const.NgLayerCustomLayer, OmitKeys>
type Meta = {
  message?: string
  filename: string
}

const OVERLAY_LAYER_KEY = "x-overlay-layer"
const OVERLAY_LAYER_PROTOCOL = `${OVERLAY_LAYER_KEY}://`
const SUPPORTED_PREFIX = ["nifti://", "precomputed://", "swc://", "deepzoom://"] as const

type ValidProtocol = typeof SUPPORTED_PREFIX[number]
type ValidInputTypes = File|string

type ProcessorOutput = {option?: LayerOption, url?: string, protocol?: ValidProtocol, meta: Meta, cleanup: () => void}
type ProcessResource = {
  matcher: (input: ValidInputTypes) => Promise<boolean>
  processor: (input: ValidInputTypes) => Promise<ProcessorOutput>
}

const SOURCE_PROCESSOR: ProcessResource[] = []
function RegisterSource(matcher: ProcessResource['matcher']) {
  return (target: Record<string, any>, propertyKey: string, _descriptor: PropertyDescriptor) => {
    SOURCE_PROCESSOR.push({
      matcher,
      processor: target[propertyKey],
    })
  }
}


@Injectable()
export class UserLayerService implements OnDestroy {
  #idToCleanup = new Map<string, () => void>()
  #dialogRef: MatDialogRef<unknown>

  static VerifyUrl(source: string) {
    for (const prefix of SUPPORTED_PREFIX) {
      if (source.includes(prefix)) return
    }
    throw new Error(
      `source: ${source} does not start with supported prefixes ${SUPPORTED_PREFIX}`
    )
  }

  @RegisterSource(
    async input => input instanceof File && input.name.endsWith(".swc")
  )
  async processSwc(file: File): ReturnType<ProcessResource['processor']> {
    let message = `The swc rendering is experimental. Please contact us on any feedbacks. `
    const swcText = await file.text()
    let src: TVALID_LINEAR_XFORM_SRC
    const dst: TVALID_LINEAR_XFORM_DST = "NEHUBA"
    if (/ccf/i.test(swcText)) {
      src = "CCF_V2_5"
      message += `CCF detected, applying known transformation.`
    }
    if (!src) {
      message += `no known space detected. Applying default transformation.`
    }

    const xform = await linearTransform(src, dst)
    const url = URL.createObjectURL(file)

    return {
      option: {
        type: 'segmentation',
        transform: xform,
        segments: ["1"]
      },
      url,
      protocol: "swc://",
      meta: {
        filename: file.name
      },
      cleanup: () => URL.revokeObjectURL(url)
    }
  }

  async #processUnpackedNiiBuf(buf: ArrayBuffer): ReturnType<ProcessResource['processor']> {
    const { result } = await this.worker.sendMessage({
      method: "PROCESS_NIFTI",
      param: {
        nifti: buf,
      },
      transfers: [buf],
    })
    const { buffer, meta } = result
    const url = URL.createObjectURL(new Blob([buffer]))
    return {
      protocol: 'nifti://',
      url,
      option: {
        type: 'image',
        shader: getShader({
          colormap: EnumColorMapName.MAGMA,
          lowThreshold: meta.min || 0,
          highThreshold: meta.max || 1,
        })
      },
      meta,
      cleanup: () => URL.revokeObjectURL(url)
    }
  }

  @RegisterSource(
    async input => input instanceof File && input.name.endsWith(".nii")
  )
  async processNifti(file: File){
    const buf = await file.arrayBuffer()
    return await this.#processUnpackedNiiBuf(buf)
  }

  @RegisterSource(
    async input => input instanceof File && input.name.endsWith(".nii.gz")
  )
  async processNiiGz(file: File) {
    const buf = await file.arrayBuffer()
    try {
      const { pako } = await getExportNehuba()
      const outbuf = pako.inflate(buf).buffer
      return await this.#processUnpackedNiiBuf(outbuf)
    } catch (e) {
      console.log("unpack error", e)
      throw e
    }
  }

  @RegisterSource(
    async input => typeof input === "string" && input.startsWith(OVERLAY_LAYER_PROTOCOL)
  )
  async processOverlayPath(source: string) {
    const strippedSrc = source.replace(OVERLAY_LAYER_PROTOCOL, "")
    const { cleanup, ...rest } = await this.#processInput(strippedSrc)
    return {
      ...rest,
      cleanup: () => {
        this.routerSvc.setCustomRoute(OVERLAY_LAYER_KEY, null)
        cleanup()
      }
    }
  }

  @RegisterSource(
    async input => typeof input === "string" && input.startsWith("precomputed://")
  )
  async processPrecomputed(source: string): Promise<ProcessorOutput>{
    const url = source.replace("precomputed://", "")
    const { transform, meta } = await forkJoin({
      transform: fetch(`${url}/transform.json`)
        .then(res => res.json() as Promise<MetaV1Schema["transform"]>)
        .catch(_e => null as MetaV1Schema["transform"]),
      meta: from(
        translateV3Entities.fetchMeta(url)
        .catch(_e => null as MetaV1Schema)  
      )
    }).toPromise()
    
    return {
      cleanup: () => {},
      meta: {
        filename: url
      },
      option: {
        transform: meta?.transform || transform,
        shader: getShaderFromMeta(meta),
      },
      protocol: "precomputed://",
      url
    }
  }

  @RegisterSource(
    async input => typeof input === "string" && input.startsWith("deepzoom://")
  )
  async processDzi(source: string): Promise<ProcessorOutput> {
    const url = source.replace("deepzoom://", "")
    const scaleFactor = 1e2
    return {
      cleanup: () => {},
      meta: {
        filename: `deepzoom://${url}`
      },
      option: {
        transform: [
          [ scaleFactor, 0, 0, 0 ],
          [ 0, scaleFactor, 0, 0 ],
          [ 0, 0, 1, 0 ],
          [ 0, 0, 0, 1 ],
        ],
        shader: `void main(){emitRGB(vec3(toNormalized(getDataValue(0)),toNormalized(getDataValue(1)),toNormalized(getDataValue(2))));}`,
      },
      protocol: "deepzoom://",
      url
    }
  }

  @RegisterSource(async input => {
    if (input instanceof File && input.name.endsWith(".json")) {
      const JSON_KEYS = [
        // "b",
        // "count",
        // "g",
        // "idx",
        // "name",
        // "r",
        "triplets"
      ]
      const text = await input.text()
      const arr = JSON.parse(text)

      // must be array
      if (!Array.isArray(arr)) {
        return false
      }
      // can only deal with length 1 for now
      if (arr.length !== 1) {
        return false
      }
      const item = arr[0]
      for (const key of JSON_KEYS) {
        if (!item[key]) {
          console.log(`Parsing PCJson failed. ${key} does not exist`)
          return false
        }
      }
      return true
    }
    return false
  })
  async processPCJson(file: File): Promise<ProcessorOutput>{
    const arr = JSON.parse(await file.text())
    const item = arr[0]
    const { r, g, b } = item
    
    const rgbString = [r, g, b].every(v => Number.isInteger(v))
    ? rgbToHex([r, g, b])
    : "#ff0000"

    const id = getUuid()
    const src = "QUICKNII"
    const dst = "NEHUBA"
    const xform = await linearTransform(src, dst)
    const layer = new AnnotationLayer(id, rgbString, xform)

    const triplets: number[][] = [item.triplets.slice(0, 3)]
    for (const num of item.triplets as number[]) {
      if (triplets.at(-1).length === 3) {
        triplets.push([num])
        continue
      }
      triplets.at(-1).push(num)
    }
    
    layer.addAnnotation(triplets.map((triplet, idx) => ({
      id: `${id}-${idx}`,
      type: 'point',
      point: triplet.map(v => v) as [number, number, number]
    })))
    return {
      cleanup: () => layer.dispose(),
      meta: {
        filename: file.name,
      }
    }
  }

  async #processInput(input: ValidInputTypes): Promise<ProcessorOutput> {
    for (const { matcher, processor } of SOURCE_PROCESSOR) {
      if (await matcher(input)) {
        return await processor.apply(this, [input])
      }
    }
    const inputStr = input instanceof File
      ? input.name
      : input
    throw new Error(`Could not find a processor for ${inputStr}`)
  }

  async handleUserInput(input: ValidInputTypes){
    const id = getUuid()
    const { option, protocol, url, meta, cleanup } = await this.#processInput(input)
    if (this.#idToCleanup.has(id)) {
      throw new Error(`${url} was already registered`)
    }
    this.#idToCleanup.set(id, cleanup)
    this.addUserLayer(
      id,
      protocol && url &&`${protocol}${url}`,
      meta,
      option,
    )
    return
  }

  addUserLayer(
    id: string,
    source: string|null|undefined,
    meta: Meta,
    options: LayerOption = {}
  ) {
    if (source) {
      UserLayerService.VerifyUrl(source)
      const layer = {
        id,
        clType: "customlayer/nglayer" as const,
        source,
        ...options,
      }
      this.store$.dispatch(
        atlasAppearance.actions.addCustomLayer({
          customLayer: layer,
        })
      )
    }

    if (this.#dialogRef) {
      this.#dialogRef.close()
      this.#dialogRef = null
    }
    this.#dialogRef = this.dialog.open(UserLayerInfoCmp, {
      data: {
        layerName: id,
        filename: meta.filename,
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
  
    this.#dialogRef.afterClosed().subscribe(() => {
      const cleanup = this.#idToCleanup.get(id)
      cleanup && cleanup()
      if (source) {
        this.store$.dispatch(
          atlasAppearance.actions.removeCustomLayer({ id })
        )
      }
      this.#idToCleanup.delete(id)
    })
  }

  #subscription: Subscription[] = []
  constructor(
    private store$: Store,
    private dialog: MatDialog,
    private worker: AtlasWorkerService,
    private routerSvc: RouterService
  ) {
    this.#subscription.push(
      this.routerSvc.customRoute$.pipe(
        select(v => v[OVERLAY_LAYER_KEY])
      ).pipe(
        distinctUntilChanged(),
        filter(url => !!url)
      ).subscribe(url => this.handleUserInput(url))
    )
  }

  ngOnDestroy(): void {
    while (this.#subscription.length > 0) this.#subscription.pop().unsubscribe()
  }
}
