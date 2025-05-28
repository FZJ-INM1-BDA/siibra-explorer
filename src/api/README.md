# Post message API

This page outline how an other application can communicate with siibra-explorer. This includes, but is not limited to how plugins communicate with siibra-explorer. 

All communications between siibra-explorer and plugin will occur via the [postMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).

## APIs

All APIs are categorized under `{broadcast|handshake|request}/sxplr.{$EVENT_NAME}__{toSxplr|fromSxplr}__{request|response}.json`

The json files are JSON schema, of the shape of the request/response API clients can expect. The shape described by the aforementioned JSON schema complies with [jsonrpc 2.0](https://www.jsonrpc.org/specification) specification.

## [Handshake events](handshake/README.md)

All handshake events originates from siibra-explorer. Handshake events are expected to be responded to. Without handshake, siibra-explorer will not honor any [Request events](#request-events) , nor will it send any [Broadcast events](#broadcast-events) until handshake event is responded to.

## [Broadcast events](broadcast/README.md)

All broadcast events originates from siibra-explorer. Broadcast events usually signifies when the state of siibra-explorer changes (with a debounce). Broadcast events expects and requires no response from the plugin.

## [Request events](request/README.md)

All request events originates from the plugin. Often, this is a request from the plugin to do something on behave of the user. A response will always be sent on completion (this could take from milliseconds to seconds, if user interaction is required).

