# Deploy Environment Variables

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
| `__DEBUG__` | debug flag | 

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

##### SaneUrl

| name | description | default | example |
| --- | --- | --- | --- |
| `OBJ_STORAGE_AUTH_URL` |
| `OBJ_STORAGE_IDP_NAME` |
| `OBJ_STORAGE_IDP_PROTO` |
| `OBJ_STORAGE_IDP_URL` |
| `OBJ_STORAGE_USERNAME` |
| `OBJ_STORAGE_PASSWORD` |
| `OBJ_STORAGE_PROJECT_ID` |
| `OBJ_STORAGE_ROOT_URL` |

##### Test deploy denvironments

| name | description | default | example |
| --- | --- | --- | --- |
| `SERVICE_ACCOUNT_CRED` | 
| `SERVICE_ACCOUNT_CRED_PATH` | 
| `WAXHOLM_RAT_GOOGLE_SHEET_ID` |
| `SKIP_RETRY_TEST` | retry tests contains some timeouts, which may slow down tests | 
