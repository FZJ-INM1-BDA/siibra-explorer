# Interactive Atlas Viewer

Interactive Atlas Viewer is an frontend module wrapping around [nehuba](https://github.com/HumanBrainProject/nehuba). It provides additional features, such as metadata integration, data visualisation and a robust plugin system.

## Getting Started

A live version of the Interactive Atlas Viewer is available at [https://interactive-viewer.apps.hbp.eu](https://interactive-viewer.apps.hbp.eu). This section is useful for developers who would like to develop this project.

### General information

Interactive atlas viewer is built with [Angular (v9.0)](https://angular.io/), [Bootstrap (v4)](http://getbootstrap.com/), and [fontawesome icons](https://fontawesome.com/). Some other notable packages used are [ngrx/store](https://github.com/ngrx/platform) for state management. 

Releases newer than [v0.2.9](https://github.com/HumanBrainProject/interactive-viewer/tree/v0.2.9) also uses a nodejs backend, which uses [passportjs](http://www.passportjs.org/) for user authentication, [express](https://expressjs.com/) as a http framework.

### Develop

#### Prerequisites

- node >= 12

#### Environments

It is recommended to manage your environments with `.env` file.

##### Buildtime environments

Please see [build_env.md](build_env.md)

##### Deploy environments

Please see [deploy_env.md](deploy_env.md)

##### e2e test environments

Please see [e2e_env.md](e2e_env.md)

#### Start dev server

To run a dev server, run:

```bash
$ git clone https://github.com/HumanBrainProject/interactive-viewer
$ cd interactive-viewer
$ npm i
$ npm run dev-server
```

Start backend (in a separate terminal):

```bash
$ cd deploy
$ node server.js
```

#### Build

```bash
$ npm run build-aot
```

### Develop plugins

Below demonstrates an example workflow for developing plugins:

```bash

$ # build aot version of the atlas viewer
$ npm run build-aot
$ cd deploy
$ # run server with PLUGIN_URLS
$ PLUGIN_URLS=http://localhost:3333/manifest.json;http://localhost:3334/manifest.json node server.js
```

Interactive Atlas Viewer attempts to fetch list of manifests:

```
GET {BACKEND_URL}/plugins
```

The response from this endpoint will be:

```json
[
  "http://localhost:3333/manifest.json",
  "http://localhost:3334/manifest.json"
]
```

When user launches the viewer, the atlas viewer will attempt to fetch the metadata of the plugins:

```
GET http://localhost:3333/manifest.json
GET http://localhost:3334/manifest.json
```

The response from these endpoints are expected to adhere to [manifests](src/plugin_examples/README.md#Manifest%20JSON).

When the user launches the plugin, the viewer will fetch `templateUrl` and `scriptUrl`, if necessary.

Plugin developers can start their own webserver, use [interactive-viewer-plugin-template](https://github.com/HumanBrainProject/interactive-viewer-plugin-template), or (coming soon) provide link to a github repository.


[plugin readme](src/plugin_examples/README.md)

[plugin api](src/plugin_examples/plugin_api.md)

[plugin migration guide](src/plugin_examples/migrationGuide.md)

## Contributing

Feel free to raise an issue in this repo and/or file a PR. 

## Versioning

Commit history prior to v0.2.0 is available in the [legacy-v0.2.0](https://github.com/HumanBrainProject/interactive-viewer/tree/legacy-v0.2.0) branch. The repo was rewritten to remove its dependency on neuroglancer and nehuba. This allowed for simpler webpack config, faster build time and AOT compilation. 

## License

Apache-2.0
