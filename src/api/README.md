# Post message API

This page outline how an other application can communicate with siibra-explorer. This includes, but is not limited to how plugins communicate with siibra-explorer. 

All communications between siibra-explorer and plugin will occur via the [postMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).

## APIs

All APIs are categorized under `{broadcast|handshake|request}/sxplr.{$EVENT_NAME}__{toSxplr|fromSxplr}__{request|response}.json`

The json files are JSON schema, of the shape of the request/response API clients can expect. The shape described by the aforementioned JSON schema complies with [jsonrpc 2.0](https://www.jsonrpc.org/specification) specification.

- `fromSxplr`

Request originates from siibra-explorer. Either `handshake` or `broadcast` events

- `toSxplr`

Request origintes from the client. `request` events

- `request`

Describes the schema of the request

- `reesponse`

Describe the schema of the response (if any)

- `handshake`

Sent from siibra-explorer to the client, and expects a response. Requests from a non-responding client is ignored. Broadcasts will not be made to non-responding clients.

- `broadcast`

Sent from siibra-explorer to client. Sent when (with a debounce timer) the state of siibra-explorer changes (either user initiated or otherwise).  Siibra-explorer does not expect a response. Siibra-explorer will only broadcast to clients who responded to a hand shake.

- `request`

Sent from the client to siibra-explorer. If the `id` field is present, siibra-explorer will respond success or error of the operation.
