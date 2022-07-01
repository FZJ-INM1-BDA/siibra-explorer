# Migrate from siibra-explorer < 2.7.0

Plugin within siibra-explorer existed since before `pre-0.2.0`. We changed the way plugin works on `siibra-explorer==2.7.0`.

## Why

In siibra-explorer < 2.7.0, the HTML, JS are rendered directly in the same frame as siibra-explorer. 

Whilst this approach provided a lot of flexibility for the plugin, it also introduced a lot of points of failures and/or non-optimal practices.

For example, the objects passed to the plugin was not always structureClone'd. This meant that plugins which mutate these objects could cause issues difficult to debug. 

Another example is that plugin authors often have to write HTML and JS specificially to interact with siibra-explorer. These code snippets often cannot be reused (since they expect a globally defined `interactiveViewer` object to exist.)

Additionally, the previous system necessitates the running of arbitary JS code, which can be a security vulnerability.

## The new system

The plugin now runs in an iframe, and the data are passed between `siibra-explorer` and the plugin via [postMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage). This address all/most of the three concerns above:

- objects passed will always be a clone (per `postMessage` spec). This allows plugin authors to do as their heart content with the received data, and it will not affect the viewer instance

- plugin authors will provide a valid HTML (rather than HTML fragment). It can be rendered independently without `siibra-explorer`.[1]

- any arbitary code from the plugin is sandboxed in the iframe, and should not interfere with `siibra-explorer`. This does **not** completely eliminate potential security threats:

  - Best practices still needs to be followed to harden the security (e.g. use `sandbox` attribute (WIP))

  - Existing browser vulnerabilities, which the browser vendors have much greater resources and incentive to provide a fix.  

[1] Most modern browser are quite forgiving when it comes to rendering HTML. They could often render partial/invalid HTML. We still believe having spec compliant HTML is a good practice.
