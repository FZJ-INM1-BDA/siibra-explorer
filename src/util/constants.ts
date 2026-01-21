import { HttpHeaders } from "@angular/common/http"

export const LOCAL_STORAGE_CONST = {
  GPU_LIMIT: 'fzj.xg.iv.GPU_LIMIT',
  ANIMATION: 'fzj.xg.iv.DISABLE_ANIMATION_FLAG',
  MOBILE_UI: 'fzj.xg.iv.MOBILE_UI',
  AGREE_COOKIE: 'fzj.xg.iv.AGREE_COOKIE',
  AGREE_KG_TOS: 'fzj.xg.iv.AGREE_KG_TOS',
  QUICK_TOUR_VIEWED: 'fzj.dg.iv.QUICK_TOUR_VIEWED',
}

export const COOKIE_VERSION = '0.3.0'
export const KG_TOS_VERSION = '0.3.0'

export const MIN_REQ_EXPLAINER = `
- Siibra explorer requires **webgl2.0**, and the \`EXT_color_buffer_float\` extension enabled.
- You can check browsers' support of webgl2.0 by visiting <https://caniuse.com/#feat=webgl2>
- Unfortunately, Safari and iOS devices currently do not support **webgl2.0**: <https://webkit.org/status/#specification-webgl-2>
`

export const APPEND_SCRIPT_TOKEN: InjectionToken<(url: string) => Promise<HTMLScriptElement>> = new InjectionToken(`APPEND_SCRIPT_TOKEN`)

export const appendScriptFactory = (document: Document, defer: boolean = false) => {
  return (src: string) => new Promise((rs, rj) => {
    const scriptEl = document.createElement('script')
    if (defer) {
      scriptEl.defer = true
    }
    scriptEl.src = src
    scriptEl.onload = () => rs(scriptEl)
    scriptEl.onerror = (e) => rj(e)
    document.head.appendChild(scriptEl)
  })
}

export const REMOVE_SCRIPT_TOKEN: InjectionToken<(el: HTMLScriptElement) => void> = new InjectionToken(`REMOVE_SCRIPT_TOKEN`)

export const removeScriptFactory = (document: Document) => {
  return (srcEl: HTMLScriptElement) => {
    document.head.removeChild(srcEl)
  }
}

const getScopedReferer = () => {
  const url = new URL(window.location.href)
  url.searchParams.delete('regionsSelected')
  url.searchParams.delete('cRegionsSelected')
  return url.toString()
}

export const getFetchOption: () => Partial<RequestInit> = () => {
  return {
    referrer: getScopedReferer()
  }
}

export const getHttpHeader: () => HttpHeaders = () => {
  const header = new HttpHeaders()
  header.set('referrer', getScopedReferer())
  return header
}

export const COLORMAP_IS_JET = `// iav-colormap-is-jet`
import { Injectable, InjectionToken } from "@angular/core"
import { BehaviorSubject } from "rxjs"

export const CYCLE_PANEL_MESSAGE = `[spacebar] to cycle through views`

export const UNSUPPORTED_PREVIEW = [{
  text: 'Preview of Colin 27 and JuBrain Cytoarchitectonic',
  previewSrc: 'assets/images/1.png',
}, {
  text: 'Preview of Big Brain 2015 Release',
  previewSrc: 'assets/images/2.png',
}, {
  text: 'Preview of Waxholm Rat V2.0',
  previewSrc: 'assets/images/3.png',
}]

export const UNSUPPORTED_INTERVAL = 7000

export const SPECIES_ENUM = {
  HOMO_SAPIENS: "Homo sapiens",
  MACACA_FASCICULARIS: "Macaca fascicularis",
  RATTUS_NORVEGICUS: "Rattus norvegicus",
  MUS_MUSCULUS: "Mus musculus",
} as const

export const PARCELLATION_GROUPS = {
  FIBRE_ARCHITECTURE: "fibre architecture",
  FUNCTIONAL_MODES: "functional modes",
  CYTOARCHITECTURE: "cytoarchitecture",
} as const

/**
 * atlas should follow the following order
 */
export const speciesOrder = [
  SPECIES_ENUM.MUS_MUSCULUS,
  SPECIES_ENUM.RATTUS_NORVEGICUS,
  SPECIES_ENUM.MACACA_FASCICULARIS,
  SPECIES_ENUM.HOMO_SAPIENS,
]

export const parcellationGroupOrder = [
  PARCELLATION_GROUPS.CYTOARCHITECTURE,
  PARCELLATION_GROUPS.FIBRE_ARCHITECTURE,
  PARCELLATION_GROUPS.FUNCTIONAL_MODES,
]

export const parcBanList: string[] = [
  "https://identifiers.org/neurovault.image:23262", // dk
  "https://doi.org/10.1016/j.jneumeth.2020.108983/mni152", // vep
  "minds/core/parcellationatlas/v1.0.0/887da8eb4c36d944ef626ed5293db3ef", // marsatlas
]

export const GET_ATTR_TOKEN = new InjectionToken("GET_ATTR_TOKEN")

export type GetAttr = (attr: string) => string|null

/**
 * prefix hinting that the object is controlled by siibra-explorer
 */
export const SXPLR_PREFIX = "sxplr-"
export const SXPLR_ANNOTATIONS_KEY = {
  TEMPLATE_ID: "sxplrAnnotation.template.id",
  PARCELLATION_ID: "sxplrAnnotation.parcellation.id",
} as const


export const LABEL_EVENT_TRIGGER = new InjectionToken<(labels: string[]) => void>("LABEL_EVENT_TRIGGER")

@Injectable()
export class LblEventSvc {
  labels$ = new BehaviorSubject<string[]>([])
}

export const LABEL_EVENT = {
  atlasSelection: "atlasSelection",
  annotate: "annotate",
} as const

export const FOCUS_VIEW_LABELS = {
  VOI: "focusview:voi",
  CONNECTIVITY: "focusview:regionalconnectivity",
  GEOMETRY: "focusview:selectedgeometry",
} as const
