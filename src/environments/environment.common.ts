export const environment = {

  GIT_HASH: 'unknown hash',
  VERSION: 'unknown version',
  PRODUCTION: false,
  BACKEND_URL: null,
  // N.B. do not update the SIIBRA_API_ENDPOITNS directly
  // some libraries rely on the exact string formatting to work properly
  SIIBRA_API_ENDPOINTS: 
    // 'http://localhost:10081/v3_0', // endpoint-local-10081
    // 'https://siibra-api-latest.apps-dev.hbp.eu/v3_0', //endpoint-latest
    'https://siibra-api-stable.apps.hbp.eu/v3_0', // endpoint-stable
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
