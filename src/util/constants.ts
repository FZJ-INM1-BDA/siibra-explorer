import { HttpHeaders } from "@angular/common/http"
import { environment } from 'src/environments/environment'

export const LOCAL_STORAGE_CONST = {
  GPU_LIMIT: 'fzj.xg.iv.GPU_LIMIT',
  ANIMATION: 'fzj.xg.iv.DISABLE_ANIMATION_FLAG',
  MOBILE_UI: 'fzj.xg.iv.MOBILE_UI',
  AGREE_COOKIE: 'fzj.xg.iv.AGREE_COOKIE',
  AGREE_KG_TOS: 'fzj.xg.iv.AGREE_KG_TOS',
  QUICK_TOUR_VIEWED: 'fzj.dg.iv.QUICK_TOUR_VIEWED',

  FAV_DATASET: 'fzj.xg.iv.FAV_DATASET_V2',
}

export const COOKIE_VERSION = '0.3.0'
export const KG_TOS_VERSION = '0.3.0'
export const BACKENDURL = (() => {
  const { BACKEND_URL } = environment
  if (!BACKEND_URL) return ``
  if (/^http/.test(BACKEND_URL)) return BACKEND_URL

  const url = new URL(window.location.href)
  const { protocol, hostname, pathname } = url
  return `${protocol}//${hostname}${pathname.replace(/\/$/, '')}/${BACKEND_URL}`
})()

export const MIN_REQ_EXPLAINER = `
- Siibra explorer requires **webgl2.0**, and the \`EXT_color_buffer_float\` extension enabled.
- You can check browsers' support of webgl2.0 by visiting <https://caniuse.com/#feat=webgl2>
- Unfortunately, Safari and iOS devices currently do not support **webgl2.0**: <https://webkit.org/status/#specification-webgl-2>
`

export const APPEND_SCRIPT_TOKEN: InjectionToken<(url: string) => Promise<HTMLScriptElement>> = new InjectionToken(`APPEND_SCRIPT_TOKEN`)

export const appendScriptFactory = (document: Document, defer: boolean = false) => {
  return src => new Promise((rs, rj) => {
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
import { EnumColorMapName, mapKeyColorMap } from './colorMaps'
import { InjectionToken } from "@angular/core"

export const getShader = ({
  colormap = EnumColorMapName.GREYSCALE,
  lowThreshold = 0,
  highThreshold = 1,
  brightness = 0,
  contrast = 0,
  removeBg = false
} = {}): string => {
  const { header, main, premain } = mapKeyColorMap.get(colormap) || (() => {
    return mapKeyColorMap.get(EnumColorMapName.GREYSCALE)
  })()

  // so that if lowthreshold is defined to be 0, at least some background removal will be done
  const _lowThreshold = lowThreshold + 1e-10
  return `${header}
${premain}
void main() {
  float raw_x = toNormalized(getDataValue());
  float x = (raw_x - ${_lowThreshold.toFixed(10)}) / (${highThreshold - _lowThreshold}) ${ brightness > 0 ? '+' : '-' } ${Math.abs(brightness).toFixed(10)};

  ${ removeBg ? 'if(x>1.0){emitTransparent();}else if(x<0.0){emitTransparent();}else{' : '' }
    vec3 rgb;
    ${main}
    emitRGB(rgb*exp(${contrast.toFixed(10)}));
  ${ removeBg ? '}' : '' }
}
`
}

export const PMAP_DEFAULT_CONFIG = {
  colormap: EnumColorMapName.VIRIDIS,
  lowThreshold: 0.05,
  removeBg: true
}

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

/**
 * atlas should follow the following order
 */
export const speciesOrder = [
  SPECIES_ENUM.HOMO_SAPIENS,
  SPECIES_ENUM.MACACA_FASCICULARIS,
  SPECIES_ENUM.RATTUS_NORVEGICUS,
  SPECIES_ENUM.MUS_MUSCULUS,
]

export const parcBanList: string[] = [
  "https://identifiers.org/neurovault.image:23262",
  "https://doi.org/10.1016/j.jneumeth.2020.108983/mni152",
]
