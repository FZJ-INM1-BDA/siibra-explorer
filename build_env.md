# Build-time environment variables

As interactive atlas viewer uses [webpack define plugin](https://webpack.js.org/plugins/define-plugin/), where necessary, the environmental variables are `JSON.stringify`'ed and directly replaced in the code.

| name | description | default | example |
| --- | --- | --- | --- |
| `VERSION` | printed in console on viewer startup | `GIT_HASH` \|\| unspecificed hash | v2.2.2 |
| `PRODUCTION` | if the build is for production, toggles optimisations such as minification | `undefined` | true |
| `BACKEND_URL` | backend that the viewer calls to fetch available template spaces, parcellations, plugins, datasets | `null` | https://interactive-viewer.apps.hbp.eu/ |
| ~~`BS_REST_URL`~~ _deprecated. use `SIIBRA_API_ENDPOINTS` instead_ | [siibra-api](https://github.com/FZJ-INM1-BDA/siibra-api) used to fetch different resources | `https://siibra-api-stable.apps.hbp.eu/v1_0` |
| `SIIBRA_API_ENDPOINTS` | Comma separated endpoints of [siibra-api](https://github.com/FZJ-INM1-BDA/siibra-api) used to fetch different resources | `https://siibra-api-stable.apps.hbp.eu/v2_0,https://siibra-api-stable-ns.apps.hbp.eu/v2_0,https://siibra-api-stable.apps.jsc.hbp.eu/v2_0` |
| `MATOMO_URL` | base url for matomo analytics | `null` | https://example.com/matomo/ |
| `MATOMO_ID` | application id for matomo analytics | `null` | 6 |
| `STRICT_LOCAL` | hides **Explore** and **Download** buttons. Useful for offline demo's | `false` | `true` |
| `KIOSK_MODE` | after 5 minutes of inactivity, shows overlay inviting users to interact | `false` | `true` |
| `BUILD_TEXT` | overlay text at bottom right of the viewer. set to `''` to hide. | |
