# Build-time environment variables

As interactive atlas viewer uses [webpack define plugin](https://webpack.js.org/plugins/define-plugin/), where necessary, the environmental variables are `JSON.stringify`'ed and directly replaced in the code.

| name | description | default | example |
| --- | --- | --- | --- |
| `VERSION` | printed in console on viewer startup | `GIT_HASH` \|\| unspecificed hash | v2.2.2 |
| `PRODUCTION` | if the build is for production, toggles optimisations such as minification | `undefined` | true |
| `BACKEND_URL` | backend that the viewer calls to fetch available template spaces, parcellations, plugins, datasets | `null` | https://interactive-viewer.apps.hbp.eu/ |
| `BS_REST_URL` | [brainscape-api](https://jugit.fz-juelich.de/v.marcenko/brainscapes-api) used to fetch different resources | https://brainscapes.apps-dev.hbp.eu/v1_0 |
| `DATASET_PREVIEW_URL` | dataset preview url used by component <https://github.com/fzj-inm1-bda/kg-dataset-previewer>. Useful for diagnosing issues with dataset previews.| https://hbp-kg-dataset-previewer.apps.hbp.eu/datasetPreview | http://localhost:1234/datasetPreview |
| `MATOMO_URL` | base url for matomo analytics | `null` | https://example.com/matomo/ |
| `MATOMO_ID` | application id for matomo analytics | `null` | 6 |
| `STRICT_LOCAL` | hides **Explore** and **Download** buttons. Useful for offline demo's | `false` | `true` |
| `KIOSK_MODE` | after 5 minutes of inactivity, shows overlay inviting users to interact | `false` | `true` |
| `BUILD_TEXT` | overlay text at bottom right of the viewer. set to `''` to hide. | |