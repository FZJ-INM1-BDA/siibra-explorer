# Request API

Request  messages are sent when the plugin requests siibra-explorer to do something on its behalf.

Be it request the user to select a region, a point, navigate to a specific location etc. 

> :warning: Please note that `beforeunload` window event does not fire on iframe windows. Plugins should do whatever cleanup it needs, then send the message `sxplr.exit`. 

```javascript

let parentWindow
window.addEventListener('message', msg => {
  const { source, data, origin } = msg
  const { id, method, params, result, error } = data

  if (method === "sxplr.init") {
    parentWindow = source
  }
})

window.addEventListener('pagehide', () => {

  // do cleanup
  // n.b. since iframe unload usually do not trigger DOM events
  // one will need to manually trigger destroying any apps manually

  parentWindow.postMessage({
    jsonrpc: '2.0',
    method: `sxplr.exit`,
    params: {
      requests: [] // any remaining requests to be carried out
    }
  })
})
```

## API

<!-- DO NOT UPDATE THIS AND BELOW: UPDATED BY SCRIPT -->

| event name | initiator | request | response |
| --- | --- | --- | --- |
| sxplr.addAnnotations | client | [jsonschema](sxplr.addAnnotations__toSxplr__request.json) | [jsonschema](sxplr.addAnnotations__toSxplr__response.json) |
| sxplr.cancelRequest | client | [jsonschema](sxplr.cancelRequest__toSxplr__request.json) | [jsonschema](sxplr.cancelRequest__toSxplr__response.json) |
| sxplr.exit | client | [jsonschema](sxplr.exit__toSxplr__request.json) | [jsonschema](sxplr.exit__toSxplr__response.json) |
| sxplr.getAllAtlases | client | [jsonschema](sxplr.getAllAtlases__toSxplr__request.json) | [jsonschema](sxplr.getAllAtlases__toSxplr__response.json) |
| sxplr.getSupportedParcellations | client | [jsonschema](sxplr.getSupportedParcellations__toSxplr__request.json) | [jsonschema](sxplr.getSupportedParcellations__toSxplr__response.json) |
| sxplr.getSupportedTemplates | client | [jsonschema](sxplr.getSupportedTemplates__toSxplr__request.json) | [jsonschema](sxplr.getSupportedTemplates__toSxplr__response.json) |
| sxplr.getUserToSelectARoi | client | [jsonschema](sxplr.getUserToSelectARoi__toSxplr__request.json) | [jsonschema](sxplr.getUserToSelectARoi__toSxplr__response.json) |
| sxplr.loadLayers | client | [jsonschema](sxplr.loadLayers__toSxplr__request.json) | [jsonschema](sxplr.loadLayers__toSxplr__response.json) |
| sxplr.navigateTo | client | [jsonschema](sxplr.navigateTo__toSxplr__request.json) | [jsonschema](sxplr.navigateTo__toSxplr__response.json) |
| sxplr.removeLayers | client | [jsonschema](sxplr.removeLayers__toSxplr__request.json) | [jsonschema](sxplr.removeLayers__toSxplr__response.json) |
| sxplr.rmAnnotations | client | [jsonschema](sxplr.rmAnnotations__toSxplr__request.json) | [jsonschema](sxplr.rmAnnotations__toSxplr__response.json) |
| sxplr.selectAtlas | client | [jsonschema](sxplr.selectAtlas__toSxplr__request.json) | [jsonschema](sxplr.selectAtlas__toSxplr__response.json) |
| sxplr.selectParcellation | client | [jsonschema](sxplr.selectParcellation__toSxplr__request.json) | [jsonschema](sxplr.selectParcellation__toSxplr__response.json) |
| sxplr.selectTemplate | client | [jsonschema](sxplr.selectTemplate__toSxplr__request.json) | [jsonschema](sxplr.selectTemplate__toSxplr__response.json) |
| sxplr.updateLayers | client | [jsonschema](sxplr.updateLayers__toSxplr__request.json) | [jsonschema](sxplr.updateLayers__toSxplr__response.json) |
