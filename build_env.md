# Build-time environment variables

As siibra-explorer uses [webpack define plugin](https://webpack.js.org/plugins/define-plugin/), where necessary, the environmental variables are `JSON.stringify`'ed and directly replaced in the code.

| name | description | default | example |
| --- | --- | --- | --- |
| `GIT_HASH` | Used to finely identify siibra-explorer version | | |
| `VERSION` | Used to coarsely identify siibra-explorer version | | |
| `PRODUCTION` | if the build is for production, toggles optimisations such as minification | `undefined` | true |
| `BACKEND_URL` | backend that the viewer calls to fetch available template spaces, parcellations, plugins, datasets | `null` | https://interactive-viewer.apps.hbp.eu/ |
| `SIIBRA_API_ENDPOINTS` | Comma separated endpoints of [siibra-api](https://github.com/FZJ-INM1-BDA/siibra-api) used to fetch different resources | `https://siibra-api-stable.apps.hbp.eu/v3_0,https://siibra-api.apps.ebrains.eu/v3_0` |
| `MATOMO_URL` | base url for matomo analytics | `null` | https://example.com/matomo/ |
| `MATOMO_ID` | application id for matomo analytics | `null` | 6 |
| `STRICT_LOCAL` | hides **Explore** and **Download** buttons. Useful for offline demo's | `false` | `true` |
| `KIOSK_MODE` | after 5 minutes of inactivity, shows overlay inviting users to interact | `false` | `true` |
| `EXPERIMENTAL_FEATURE_FLAG` | enabling experimental features | `false` | `true` |
| `ENABLE_LEAP_MOTION` | enable leap motion controller | `false` | `true` |
