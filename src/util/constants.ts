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
export const BACKENDURL = BACKEND_URL || 'http://localhost:3000/'

export const MIN_REQ_EXPLAINER = `
- Interactive atlas viewer requires **webgl2.0**, and the \`EXT_color_buffer_float\` extension enabled.
- You can check browsers' support of webgl2.0 by visiting <https://caniuse.com/#feat=webgl2>
- Unfortunately, Safari and iOS devices currently do not support **webgl2.0**: <https://webkit.org/status/#specification-webgl-2>
`