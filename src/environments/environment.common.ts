export const environment = {

  GIT_HASH: 'unknown hash',
  VERSION: 'unknown version',
  PRODUCTION: true,
  BACKEND_URL: null,
  DATASET_PREVIEW_URL: 'https://hbp-kg-dataset-previewer.apps.hbp.eu/v2',
  BS_REST_URL: 'http://localhost:5000/v1_0',
  SPATIAL_TRANSFORM_BACKEND: 'https://hbp-spatial-backend.apps.hbp.eu',
  MATOMO_URL: null,
  MATOMO_ID: null,

  // strick local hides "explore" and "download" btns, which requires internet
  STRICT_LOCAL: false,

  // invite user to touch/interact after 5 min of inactivity
  KIOSK_MODE: false,

  // experimental feature flag
  EXPERIMENTAL_FEATURE_FLAG: false,
}
