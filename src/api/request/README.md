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
