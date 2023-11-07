# Deploy Environment Variables

##### Application

| name | description | default | example |
| --- | --- | --- | --- |
| `SESSIONSECRET` | session secret for cookie session |
| `V2_7_PLUGIN_URLS` | semi colon separated urls to be returned when user queries plugins | `''`
| `V2_7_STAGING_PLUGIN_URLS` | semi colon separated urls to be returned when user queries plugins | `''`
| `BUILD_TEXT` | overlay text at bottom right of the viewer. set to `''` to hide. | |
| `OVERWRITE_API_ENDPOINT` | overwrite build time siibra-api endpoint |
| `PATH_TO_PUBLIC` | path to built frontend | `../dist/aot` |


##### ebrains user authentication

| name | description | default | example |
| --- | --- | --- | --- |
| `HOSTNAME` | 
| `HOST_PATHNAME` | pathname to listen on, restrictions: leading slash, no trailing slash | `''` | `/viewer` |
| `HBP_CLIENTID_V2` | 
| `HBP_CLIENTSECRET_V2` | 


##### Logging

| name | description | default | example |
| --- | --- | --- | --- |
| `LOGGER_DIR` | Path (if any) to store the time rotated log files |  |

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
| `SXPLR_EBRAINS_IAM_SA_CLIENT_ID` | client id used for service to service communication with data-proxy | 
| `SXPLR_EBRAINS_IAM_SA_CLIENT_SECRET` | client secret used for service to service communication with data-proxy |