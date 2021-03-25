# Interactive Atlas Viewer

Interactive Atlas Viewer is an frontend module wrapping around [nehuba](https://github.com/HumanBrainProject/nehuba). It provides additional features, such as metadata integration, data visualisation and a robust plugin system.

## Getting Started

A live version of the Interactive Atlas Viewer is available at [https://interactive-viewer.apps.hbp.eu](https://interactive-viewer.apps.hbp.eu). This section is useful for developers who would like to develop this project.

### General information
Interactive atlas viewer is built with [Angular (v9.0)](https://angular.io/), [Bootstrap (v4)](http://getbootstrap.com/), and [fontawesome icons](https://fontawesome.com/). Some other notable packages used are [ngrx/store](https://github.com/ngrx/platform) for state management. 

Releases newer than [v0.2.9](https://github.com/HumanBrainProject/interactive-viewer/tree/v0.2.9) also uses a nodejs backend, which uses [passportjs](http://www.passportjs.org/) for user authentication, [express](https://expressjs.com/) as a http framework.

### Develop viewer

#### Prerequisites

- node >= 12

#### Buildtime environments

It is recommended to manage your environments with `.env` file.

As interactive atlas viewer uses [webpack define plugin](https://webpack.js.org/plugins/define-plugin/), where necessary, the environmental variables are `JSON.stringify`'ed and directly replaced in the code.

| name | description | default | example |
| --- | --- | --- | --- |
| `VERSION` | printed in console on viewer startup | `GIT_HASH` \|\| unspecificed hash | v2.2.2 |
| `PRODUCTION` | if the build is for production, toggles optimisations such as minification | `undefined` | true |
| `BACKEND_URL` | backend that the viewer calls to fetch available template spaces, parcellations, plugins, datasets | `null` | https://interactive-viewer.apps.hbp.eu/ |
| `DATASET_PREVIEW_URL` | dataset preview url used by component <https://github.com/fzj-inm1-bda/kg-dataset-previewer>. Useful for diagnosing issues with dataset previews.| https://hbp-kg-dataset-previewer.apps.hbp.eu/datasetPreview | http://localhost:1234/datasetPreview |
| `MATOMO_URL` | base url for matomo analytics | `null` | https://example.com/matomo/ |
| `MATOMO_ID` | application id for matomo analytics | `null` | 6 |
| `STRICT_LOCAL` | hides **Explore** and **Download** buttons. Useful for offline demo's | `false` | `true` |
| `KIOSK_MODE` | after 5 minutes of inactivity, shows overlay inviting users to interact | `false` | `true` |
| `BUILD_TEXT` | overlay text at bottom right of the viewer. set to `''` to hide. | |

#### Deploy environments

It is recommended to manage your environments with `.env` file.

##### Application

| name | description | default | example |
| --- | --- | --- | --- |
| `PORT` | port to listen on | 3000 |
| `HOST_PATHNAME` | pathname to listen on, restrictions: leading slash, no trailing slash | `''` | `/viewer` |
| `SESSIONSECRET` | session secret for cookie session |
| `NODE_ENV` | determines where the built viewer will be served from | | `production` |
| `PRECOMPUTED_SERVER` | redirect data uri to another server. Useful for offline demos | | `http://localhost:8080/precomputed/` |
| `LOCAL_CDN` | rewrite cdns to local server. useful for offlnie demo | | `http://localhost:7080/` |
| `PLUGIN_URLS` | semi colon separated urls to be returned when user queries plugins | `''`
| `STAGING_PLUGIN_URLS` | semi colon separated urls to be returned when user queries plugins | `''`
| `USE_LOGO` | possible values are `hbp`, `ebrains`, `fzj` | `hbp` | `ebrains` |

##### ebrains user authentication

| name | description | default | example |
| --- | --- | --- | --- |
| `HOSTNAME` | 
| `HBP_CLIENTID` | `{HOSTNAME}{HOST_PATHNAME}/hbp-oidc/cb` |
| `HBP_CLIENTSECRET` |
| `HBP_CLIENTID_V2` | `{HOSTNAME}{HOST_PATHNAME}/hbp-oidc-v2/cb`
| `HBP_CLIENTSECRET_V2` | 

##### Querying ebrains knowledge graph

| name | description | default | example |
| --- | --- | --- | --- |
| `REFRESH_TOKEN` |
| `ACCESS_TOKEN` | **nb** as access tokens are usually short lived, this should only be set for development purposes 
| `CACHE_DATASET_FILENAME` | | `deploy/dataset/cachedKgDataset.json` |
| `KG_ROOT` | | `https://kg.humanbrainproject.eu/query` |
| `KG_SEARCH_VOCAB` | | `https://schema.hbp.eu/myQuery/` |
| `KG_DATASET_SEARCH_QUERY_NAME` | | `interactiveViewerKgQuery-v0_3` |
| `KG_DATASET_SEARCH_PATH` | | `/minds/core/dataset/v1.0.0` |
| `KG_SEARCH_SIZE` | | `1000` |
| `KG_SPATIAL_DATASET_SEARCH_QUERY_NAME` | | `iav-spatial-query-v2` |
| `KG_SPATIAL_DATASET_SEARCH_PATH` | | `/neuroglancer/seeg/coordinate/v1.0.0` | 

##### Logging

| name | description | default | example |
| --- | --- | --- | --- |
| `FLUENT_PROTOCOL` | protocol for fluent logging | `http` |
| `FLUENT_HOST` | host for fluent logging | `localhost` |
| `FLUENT_PORT` | port for fluent logging | 24224 |
| `IAV_NAME` | application name to be logged | `IAV` | 
| `IAV_STAGE` | deploy of the application | `unnamed-stage` |

##### CSP

| name | description | default | example |
| --- | --- | --- | --- |
| `DISABLE_CSP` | disable csp | | `true` |
| `CSP_REPORT_URI` | report uri for csp violations | `/report-violation` |
| `NODE_ENV` | set to `production` to disable [`reportOnly`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy-Report-Only) | `null` |
| `SCRIPT_SRC` | `JSON.stringify`'ed array of allowed scriptSrc | `[]` |
| `CSP_CONNECT_SRC` | `JSON.stringify`'ed array of allowed dataSrc | `[]` |
| `WHITE_LIST_SRC` | `JSON.stringify`'ed array of allowed src | `[]` |
| `PROXY_HOSTNAME_WHITELIST` |

##### Rate limiting

| name | description | default | example |
| --- | --- | --- | --- |
| `REDIS_PROTO` | fall back to `REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_PROTO` |
| `REDIS_ADDR` | fall back to `REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_ADDR` |
| `REDIS_PORT` | fall back to `REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_PORT` |
| `REDIS_USERNAME` |
| `REDIS_PASSWORD` |
| `DISABLE_LIMITER` | disable rate limiting (maybe required for automated tests) |

##### SaneUrl

| name | description | default | example |
| --- | --- | --- | --- |
| `OBJ_STORAGE_ROOT_URL` |
| `HBP_V2_REFRESH_TOKEN` |
| `HBP_V2_ACCESS_TOKEN` |

##### Test deploy denvironments

| name | description | default | example |
| --- | --- | --- | --- |
| `SERVICE_ACCOUNT_CRED` | 
| `SERVICE_ACCOUNT_CRED_PATH` | 
| `WAXHOLM_RAT_GOOGLE_SHEET_ID` |
| `SKIP_RETRY_TEST` | retry tests contains some timeouts, which may slow down tests | 

##### e2e test environments

| name | description | default | example | 
| --- | --- | --- | --- |
| PROTRACTOR_SPECS | specs relative to `./e2e/` | `./src/**/*.prod.e2e-spec.js` |  |
| DISABLE_CHROME_HEADLESS | disable headless chrome, spawns chrome window | `unset` (falsy) | 1 |
| ENABLE_GPU | uses GPU. nb, in headless mode, will show requirement not met | `unset` (falsy) | 1 |

#### Start dev server

To run a dev server, run:

```bash
$ git clone https://github.com/HumanBrainProject/interactive-viewer
$ cd interactive-viewer
$ npm i
$ npm run dev-server
```

Start backend (in a separate terminal):

```bash
$ cd deploy
$ node server.js
```

#### Build

```bash
$ npm run build-aot
```

### Develop plugins

Below demonstrates an example workflow for developing plugins:

```bash

$ # build aot version of the atlas viewer
$ npm run build-aot
$ cd deploy
$ # run server with PLUGIN_URLS
$ PLUGIN_URLS=http://localhost:3333/manifest.json;http://localhost:3334/manifest.json node server.js
```

Interactive Atlas Viewer attempts to fetch list of manifests:

```
GET {BACKEND_URL}/plugins
```

The response from this endpoint will be:

```json
[
  "http://localhost:3333/manifest.json",
  "http://localhost:3334/manifest.json"
]
```

When user launches the viewer, the atlas viewer will attempt to fetch the metadata of the plugins:

```
GET http://localhost:3333/manifest.json
GET http://localhost:3334/manifest.json
```

The response from these endpoints are expected to adhere to [manifests](src/plugin_examples/README.md#Manifest%20JSON).

When the user launches the plugin, the viewer will fetch `templateUrl` and `scriptUrl`, if necessary.

Plugin developers can start their own webserver, use [interactive-viewer-plugin-template](https://github.com/HumanBrainProject/interactive-viewer-plugin-template), or (coming soon) provide link to a github repository.


[plugin readme](src/plugin_examples/README.md)

[plugin api](src/plugin_examples/plugin_api.md)

[plugin migration guide](src/plugin_examples/migrationGuide.md)

## Contributing

Feel free to raise an issue in this repo and/or file a PR. 

## Versioning

Commit history prior to v0.2.0 is available in the [legacy-v0.2.0](https://github.com/HumanBrainProject/interactive-viewer/tree/legacy-v0.2.0) branch. The repo was rewritten to remove its dependency on neuroglancer and nehuba. This allowed for simpler webpack config, faster build time and AOT compilation. 

## License

Apache-2.0
