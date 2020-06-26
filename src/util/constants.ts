import { HttpHeaders } from "@angular/common/http"

export const LOCAL_STORAGE_CONST = {
  GPU_LIMIT: 'fzj.xg.iv.GPU_LIMIT',
  ANIMATION: 'fzj.xg.iv.ANIMATION_FLAG',
  SAVED_REGION_SELECTIONS: 'fzj.xg.iv.SAVED_REGION_SELECTIONS',
  MOBILE_UI: 'fzj.xg.iv.MOBILE_UI',
  AGREE_COOKIE: 'fzj.xg.iv.AGREE_COOKIE',
  AGREE_KG_TOS: 'fzj.xg.iv.AGREE_KG_TOS',

  FAV_DATASET: 'fzj.xg.iv.FAV_DATASET_V2',
}

export const COOKIE_VERSION = '0.3.0'
export const KG_TOS_VERSION = '0.3.0'
export const DS_PREVIEW_URL = DATASET_PREVIEW_URL
export const BACKENDURL = (() => {
  if (!BACKEND_URL) return `http://localhost:3000/`
  if (/^http/.test(BACKEND_URL)) return BACKEND_URL

  const url = new URL(window.location.href)
  const { protocol, hostname, pathname } = url
  return `${protocol}//${hostname}${pathname.replace(/\/$/, '')}/${BACKEND_URL}`
})()

export const MIN_REQ_EXPLAINER = `
- Interactive atlas viewer requires **webgl2.0**, and the \`EXT_color_buffer_float\` extension enabled.
- You can check browsers' support of webgl2.0 by visiting <https://caniuse.com/#feat=webgl2>
- Unfortunately, Safari and iOS devices currently do not support **webgl2.0**: <https://webkit.org/status/#specification-webgl-2>
`

export const APPEND_SCRIPT_TOKEN = `APPEND_SCRIPT_TOKEN`

export const appendScriptFactory = (document: Document) => {
  return src => new Promise((rs, rj) => {
    const scriptEl = document.createElement('script')
    scriptEl.src = src
    scriptEl.onload = () => rs(scriptEl)
    scriptEl.onerror = (e) => rj(e)
    document.head.appendChild(scriptEl)
  })
}

export const REMOVE_SCRIPT_TOKEN = `REMOVE_SCRIPT_TOKEN`

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

export const getShader = ({
  colormap = EnumColorMapName.GREYSCALE, 
  lowThreshold = 0,
  highThreshold = 1,
  brightness = 0, 
  contrast = 0,
  removeBg = false
} = {}): string => {
  const { header, main, premain } = mapKeyColorMap.get(colormap) || (() => {
    console.warn(`colormap ${colormap} not found. Using default colormap instead`)
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

export const compareLandmarksChanged: (prevLandmarks: any[], newLandmarks: any[]) => boolean = (prevLandmarks: any[], newLandmarks: any[]) => {
  return prevLandmarks.every(lm => typeof lm.name !== 'undefined') &&
    newLandmarks.every(lm => typeof lm.name !== 'undefined') &&
    prevLandmarks.length === newLandmarks.length
}

export const CYCLE_PANEL_MESSAGE = `[spacebar] to cycle through views`
