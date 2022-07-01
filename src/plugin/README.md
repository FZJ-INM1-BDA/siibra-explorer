# Plugins

:warning: the API in this document refer to `siibra-explorer>=2.7.0`. For migration guide/rationale, please see [MIGRATION.md](./MIGRATION.md)

siibra-explorer provides a plugin system, which allow a third party application to interact with siibra-explorer.

## Quickstart

### manifest

The plugin need to expose a manifest json file. The manifest file needs to have the following properties:

```json
{
  "iframeUrl": "<iframeUrl>",
  "name": "<name>",
  "siibra-explorer": "<siibra-explorer>"
}
```

| property | required | desc | 
| --- | --- | --- |
| `iframeUrl` | true | points to the html where the iframe is located. If does not start with `https?://`, siibra-explorer will try to resolve it relative to the absolute path of manifest. |
| `name` | true | name of the plugin | 
| `siibra-explorer` | true | the version siibra-explorer this plugin is targetting. Should be >= 2.7.0. n.b. currently this entry is partially implemented, and any truthy value is sufficient.
 |


<!-- TBD -->

## Architecture

The plugin needs to provide a HTML page, served over HTTP. This will be embedded into siibra-explorer as an iframe.

All communications between siibra-explorer and plugin will occur via the [postMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).

## Lifecycle

`handshake.init` (up to 10x attempts, 1sec debounce) -> `{broadcast|request}` -> `handshake.exit` (NYI)

Please note that the `handshake.init` needs to be responded to, *before* any other messages are sent.

## API References

[handshake API](./handshake.md)

[broadcast API](./broadcast.md)

[request API](./request.md)
