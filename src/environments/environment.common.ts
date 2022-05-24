export const environment = {

  GIT_HASH: 'unknown hash',
  VERSION: 'unknown version',
  PRODUCTION: true,
  BACKEND_URL: null,
  BS_REST_URL: 'https://siibra-api-rc.apps.hbp.eu/v2_0',
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
