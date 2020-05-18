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
export const BACKENDURL = BACKEND_URL && /^http/.test(BACKEND_URL)
  ? BACKEND_URL
  : (() => {
    const url = new URL(window.location.href)
    const { protocol, hostname, pathname } = url
    return `${protocol}//${hostname}${pathname}`
  })() || 'http://localhost:3000/'

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