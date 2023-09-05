export const environment = {

  GIT_HASH: 'unknown hash',
  VERSION: 'unknown version',
  PRODUCTION: false,
  BACKEND_URL: null,
  SIIBRA_API_ENDPOINTS: 'http://localhost:8000/v3_0', // 'https://siibra-api-latest.apps-dev.hbp.eu/v3_0', //'https://siibra-api-stable.apps.hbp.eu/v2_0,https://siibra-api-stable.apps.jsc.hbp.eu/v2_0,https://siibra-api-stable-ns.apps.hbp.eu/v2_0',
  SPATIAL_TRANSFORM_BACKEND: 'https://hbp-spatial-backend.apps.hbp.eu',
  MATOMO_URL: null,
  MATOMO_ID: null,

  // strick local hides "explore" and "download" btns, which requires internet
  STRICT_LOCAL: false,

  // invite user to touch/interact after 5 min of inactivity
  KIOSK_MODE: false,

  // experimental feature flag
  EXPERIMENTAL_FEATURE_FLAG: false,

  ENABLE_LEAP_MOTION: false,
}
