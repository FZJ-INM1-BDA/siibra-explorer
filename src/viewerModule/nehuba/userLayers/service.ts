import { Injectable, OnDestroy } from "@angular/core"
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
import { getOpacityFromMeta, getShader, getShaderFromMeta, noop, QuickHash } from "src/util/fn"
import { getExportNehuba, getUuid } from "src/util/fn"
import { UserLayerInfoCmp } from "./userlayerInfo/userlayerInfo.component"
import { translateV3Entities } from "src/atlasComponents/sapi/translateV3"
import { MetaV1Schema } from "src/atlasComponents/sapi/typeV3"
import { AnnotationLayer } from "src/atlasComponents/annotations"
import { rgbToHex } from 'common/util'
import { MatDialogRef, MatDialog, MatSnackBar } from "src/sharedModules/angularMaterial.exports"
import { atlasSelection } from "src/state"
import { Action } from "src/util/types"
import { getPositionOrientation } from "../util"
import { VOXEL_SIZE_MAP } from "../constants"

type LayerOption = Omit<atlasAppearance.const.OldNgLayerCustomLayer, "clType" | "id" | "source"> | Omit<atlasAppearance.const.NewNgLayerOption, "id" | "clType">

type Meta = {
  messages?: string[]
  filename: string
  min?: number
  max?: number
}

const OVERLAY_LAYER_KEY = "x-overlay-layer"
const OVERLAY_LAYER_PROTOCOL = `${OVERLAY_LAYER_KEY}://`
const SUPPORTED_PREFIX = ["nifti://", "precomputed://", "zarr://", "n5://", "swc://", "deepzoom://"] as const

type ValidProtocol = typeof SUPPORTED_PREFIX[number]
type ValidInputTypes = File|string

type Message = {
  severity: 'info' | 'warning' | 'error'
  message: string
}


type ProcessorOutput = {
  option?: LayerOption
  url?: string
  protocol?: ValidProtocol
  meta: Meta
  messages?: Message[]
  actions?: Action[]
  cleanup: () => void
}
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


@Injectable({
  providedIn: 'root'
})
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
        legacySpecFlag: "old",
        type: 'segmentation',
        transform: xform,
        segments: ["1"],
      },
      url,
      protocol: "swc://",
      meta: {
        filename: file.name,
        messages: [message],
      },
      cleanup: () => URL.revokeObjectURL(url)
    }
  }

  async #processUnpackedNiiBuf(buf: ArrayBuffer, file: File): ReturnType<ProcessResource['processor']> {
    const { result } = await this.worker.sendMessage({
      method: "PROCESS_NIFTI",
      param: {
        nifti: buf,
      },
      transfers: [buf],
    })
    const { buffer, meta } = result
    const url = URL.createObjectURL(new Blob([buffer]))
    const type = file.name.includes(".label.nii")
    ? 'segmentation'
    : 'image'
    return {
      protocol: 'nifti://',
      url,
      option: {
        legacySpecFlag: "old",
        type,
        shader: getShader({
          colormap: "magma",
          lowThreshold: meta.min || 0,
          highThreshold: meta.max || 1,
          removeBg: true
        })
      },
      meta: {
        filename: file.name,
        messages: meta.warning,
        ...meta
      },
      cleanup: () => URL.revokeObjectURL(url)
    }
  }

  @RegisterSource(
    async input => input instanceof File && input.name.endsWith(".nii")
  )
  async processNifti(file: File){
    const buf = await file.arrayBuffer()
    return await this.#processUnpackedNiiBuf(buf, file)
  }

  @RegisterSource(
    async input => input instanceof File && input.name.endsWith(".nii.gz")
  )
  async processNiiGz(file: File) {
    const buf = await file.arrayBuffer()
    try {
      const { pako } = await getExportNehuba()
      const outbuf = pako.inflate(buf).buffer
      return await this.#processUnpackedNiiBuf(outbuf, file)
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
    async input => typeof input === "string"
      && SUPPORTED_PREFIX.some(prefix => input.startsWith(prefix))
      // deepzoom has its own processor, which deals with the 2D nature of the volume
      // as well as fetching the affine
      && !input.startsWith("deepzoom://")
  )
  async processPrecomputed(source: string): Promise<ProcessorOutput>{
    let protocol: ValidProtocol
    let url: string
    for (const proto of SUPPORTED_PREFIX){
      if (source.startsWith(proto)) {
        protocol = proto
        url = source.replace(proto, "")
        break
      }
    }

    if (!protocol) {
      throw new Error(`Cannot parse source ${source}`)
    }
    
    const { transform, meta } = await forkJoin({
      transform: translateV3Entities.cFetch(`${url}/transform.json`)
        .then(res => res.json() as Promise<MetaV1Schema["transform"]>)
        .catch(_e => null as MetaV1Schema["transform"]),
      meta: from(
        translateV3Entities.fetchMeta(url)
        .catch(_e => null as MetaV1Schema)  
      )
    }).toPromise()
    
    return {
      cleanup: noop,
      meta: {
        filename: url
      },
      option: {
        legacySpecFlag: "old",
        transform: meta?.transform || transform,
        shader: getShaderFromMeta(meta),
        opacity: getOpacityFromMeta(meta),
      },
      protocol,
      url
    }
  }

  @RegisterSource(
    async input => typeof input === "string" && input.startsWith("deepzoom://")
  )
  async processDzi(source: string): Promise<ProcessorOutput> {
    const url = source.replace("deepzoom://", "")

    let matrix = [
      [1, 0, 0, 0, 0],
      [0, 1, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 1, 0],
    ]

    const messages: Message[] = []
    const actions: Action[] = []

    try {

      const [_imgname, dziname] = url.split("/").slice(-2)
      const root = url.split("/").slice(0, -2).join("/")
      const rootname = dziname.replace(/\.dzi$/, '')
      const jsonname = dziname.replace(/_s\d{3}\.dzi$/, '') + ".json"
      const jsonpath = `${root}/${jsonname}`
  
      const [ dzimetadata, jsonResp ] = await Promise.all([
        (async () => {
          const dziresp = await fetch(url)
          const dzimetadata = await dziresp.text()
          return dzimetadata
        })(),
        (async () => {
          const resp = await fetch(jsonpath)
          return await resp.json()
        })()
      ])
  
      const foundSlice = ((jsonResp.slices || []) as Record<string, unknown>[]).find(
        slice => (slice.filename as string).includes(rootname)
      )
      const anchoring = foundSlice?.anchoring as number[]
  
      const parser = new DOMParser()
      const xml = parser.parseFromString(dzimetadata, "application/xml")
      const size = xml.querySelector("Size")
      const width = Number(size.getAttribute("Width"))
      const height = Number(size.getAttribute("Height"))
      if (width === 0 || isNaN(width)) {
        throw new Error(`dzi xml file error: Width attribute is not a number!`)
      }
      if (height === 0 || isNaN(height)) {
        throw new Error(`dzi xml file error: Height attribute is not a number!`)
      }
      
      // TODO fetch voxel transform based on .target attribute
      if (!(jsonResp.target in VOXEL_SIZE_MAP)) {
        throw new Error(`${jsonResp.target} cannot be rendered`)
      }
      const { voxelSizes, voxelTransform } = VOXEL_SIZE_MAP[jsonResp.target]

      const thickness = 10
  
      const [
        m03,
        m13,
        m23,
  
        m00,
        m10,
        m20,
  
        m01,
        m11,
        m21,
      ] = anchoring
  
      const { mat4, vec3, quat } = await getExportNehuba()
  
      const o = vec3.fromValues(m03, m13, m23)
      const u = vec3.fromValues(m00, m10, m20)
      const v = vec3.fromValues(m01, m11, m21)
      const uxv = vec3.normalize(
        vec3.create(),
        vec3.cross(vec3.create(), u, v)
      )
  
      const m0 = vec3.scale(vec3.create(), u, 1 / width)
      const m1 = vec3.scale(vec3.create(), v, 1 / height)
      const m2 = vec3.scale(vec3.create(), uxv, thickness)
      const m3 = vec3.sub(vec3.create(), o, voxelTransform)
  
      vec3.multiply(m3, m3, voxelSizes)
  
      const _m = [
        [...Array.from(m0), 0],
        [...Array.from(m1), 0],
        [...Array.from(m2), 0],
        [...Array.from(m3), 0],
      ] as number[][]
      const m = mat4.fromValues(..._m.flatMap(v => v))
      const voxelDimension = Array.from(vec3.multiply(vec3.create(), [width, height, 1], voxelSizes)) as number[]
      const { orientation, position } = getPositionOrientation(mat4, vec3, quat, _m, voxelDimension)
      const otherOrientation = quat.rotateZ(quat.create(), orientation, Math.PI)
      
      actions.push({
        set: "iavic",
        icon: "iavic-rotation",
        action: () => {
          this.store$.dispatch(
            atlasSelection.actions.navigateTo({
              navigation: {
                orientation: Array.from(orientation),
                position: Array.from(position),
              },
              animation: true
            })
          )
        }
      }, {
        set: "iavic",
        icon: "iavic-rotation",
        action: () => {
          this.store$.dispatch(
            atlasSelection.actions.navigateTo({
              navigation: {
                orientation: Array.from(otherOrientation),
                position: Array.from(position),
              },
              animation: true
            })
          )
        }
      })
      
      mat4.scale(m, m, voxelSizes)
      mat4.transpose(m, m)
      const _matrix: number[] = Array.from(m)
      matrix = [
        _matrix.slice(0, 4),
        _matrix.slice(4, 8),
        _matrix.slice(8, 12),
      ]
      matrix[0].splice(2, 0, 0)
      matrix[1].splice(2, 0, 0)
      matrix[2].splice(2, 0, 0)
      matrix.splice(2, 0, [0, 0, 1, 0, 0])
    } catch (e) {
      messages.push({
        severity: 'error',
        message: e.toString()
      })
    }
    
    return {
      cleanup: noop,
      meta: {
        filename: `deepzoom://${url}`
      },
      option: {
        legacySpecFlag: "new",
        blend: "default",
        source: {
          url: `deepzoom://${url}`,
          transform: {
            inputDimensions: {
              "x": [1e-9, "m"],
              "y": [1e-9, "m"],
              "c^": [1, ""],
              "": [1e-9, "m"],
            },
            matrix,
            outputDimensions: {
              "x": [1e-9, "m"],
              "y": [1e-9, "m"],
              "c^": [1, ""],
              "z": [1e-9, "m"],
            },
            sourceRank: 3
          }
        },
        type: "image",
        visible: true,
        shader: getShader({ colormap: "rgb" }),
      },
      protocol: "deepzoom://",
      url,
      messages,
      actions,
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
        console.log(`Parsing PCJson failed. Expected json to be an array.`)
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
    const layers: AnnotationLayer[] = []
    for (const item of arr) {

      const { r, g, b } = item
    
      const rgbString = [r, g, b].every(v => Number.isInteger(v))
      ? rgbToHex([r, g, b])
      : "#ff0000"
  
      const id = getUuid()
      const src = "QUICKNII_ABA"
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
    }
    return {
      cleanup: () => {
        for (const layer of layers){
          layer.dispose()
        }
      },
      meta: {
        filename: file.name,
      }
    }
  }

  @RegisterSource(async input => {
    if (input instanceof File && input.name.endsWith(".pointcloud")) {
      return true
    }
    return false
  })
  async processPtCld(file: File):  Promise<ProcessorOutput>{

    const text = await file.text()
    
    const id = getUuid()
    const xform = await linearTransform("CYRIL_PTCLD", "NEHUBA")
    const layer = new AnnotationLayer(id, "#ff0000", xform)

    layer.addAnnotation(text.split("\n").map((line, idx) => ({
      id: `${id}-${idx}`,
      type: "point",
      point: line.split(" ").map(v => parseFloat(v)*1e6) as [number, number, number],
    })))
    return {
      cleanup: () => {
        layer.dispose()
      },
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
    try {
      const processedOutput = await this.#processInput(input)
      this.#addLayer(processedOutput)
      return
    } catch (e) {
      this.snackbar.open(`Error opening file: ${e.toString()}`, "Dismiss")
    }
  }

  #addLayer(processedOutput: ProcessorOutput){
    const { option, protocol, url, meta, cleanup, actions, messages } = processedOutput
    
    const source = protocol && url && `${protocol}${url}`
    const id = url ? QuickHash.GetHash(url) : getUuid()
    this.#idToCleanup.set(id, cleanup)

    if (source) {
      UserLayerService.VerifyUrl(source)
      const layer = {
        id,
        clType: "customlayer/nglayer" as const,
        source,
        ...option,
      }
      this.store$.dispatch(
        atlasAppearance.actions.addCustomLayers({
          customLayers: [layer],
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
        warning: [
          ...(meta.messages || []),
          ...(messages || []).map(v => v.message),
        ],
        actions,
        meta
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
          atlasAppearance.actions.removeCustomLayers({ customLayers: [{id}] })
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
    private routerSvc: RouterService,
    private snackbar: MatSnackBar,
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
