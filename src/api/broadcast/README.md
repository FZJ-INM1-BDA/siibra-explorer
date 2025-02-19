# Broadcasting API

Broadcasting messages are sent under two circumstances:

- the state of the viewer changed, initiated by any source (user, plugin etc). Sent to all active plugin clients.

- immediately after the plugin client acknowledged `handshake.init` to the specific client. This is so that the client can get the current state of the viewer.

Broadcasting messages never expects a response (and thus will never contain an `id` attribute)

## API

<!-- DO NOT UPDATE THIS AND BELOW: UPDATED BY SCRIPT -->

| event name | initiator | request | response |
| --- | --- | --- | --- |
| sxplr.on.allRegions | viewer | [jsonschema](sxplr.on.allRegions__fromSxplr__request.json) |  |
| sxplr.on.atlasSelected | viewer | [jsonschema](sxplr.on.atlasSelected__fromSxplr__request.json) |  |
| sxplr.on.navigation | viewer | [jsonschema](sxplr.on.navigation__fromSxplr__request.json) |  |
| sxplr.on.parcellationSelected | viewer | [jsonschema](sxplr.on.parcellationSelected__fromSxplr__request.json) |  |
| sxplr.on.regionsSelected | viewer | [jsonschema](sxplr.on.regionsSelected__fromSxplr__request.json) |  |
| sxplr.on.templateSelected | viewer | [jsonschema](sxplr.on.templateSelected__fromSxplr__request.json) |  |
