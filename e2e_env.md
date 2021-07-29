# End-to-end Tests Environment Variables

| name | description | default | example | 
| --- | --- | --- | --- |
| PROTRACTOR_SPECS | specs relative to `./e2e/` | `./src/**/*.prod.e2e-spec.js` |  |
| DISABLE_CHROME_HEADLESS | disable headless chrome, spawns chrome window | `unset` (falsy) | 1 |
| ENABLE_GPU | uses GPU. nb, in headless mode, will show requirement not met | `unset` (falsy) | 1 |
