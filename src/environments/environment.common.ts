export const environment = {

  VERSION: 'unspecificied hash',
  PRODUCTION: true,
  BACKEND_URL: null,
  DATASET_PREVIEW_URL: 'https://hbp-kg-dataset-previewer.apps.hbp.eu/v2',
  BS_REST_URL: 'https://siibra-api-edge.apps-dev.hbp.eu/v1_0',
  SPATIAL_TRANSFORM_BACKEND: 'https://hbp-spatial-backend.apps.hbp.eu',
  MATOMO_URL: null,
  MATOMO_ID: null,

  // strick local hides "explore" and "download" btns, which requires internet
  STRICT_LOCAL: false,

  // invite user to touch/interact after 5 min of inactivity
  KIOSK_MODE: false,
}
