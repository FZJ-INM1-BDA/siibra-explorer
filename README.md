<img align="right" src="https://raw.githubusercontent.com/FZJ-INM1-BDA/siibra-explorer/master/docs/images/siibra-explorer-square.jpeg" width="200">

[![Documentation Status](https://readthedocs.org/projects/siibra-explorer/badge/?version=latest)](https://siibra-explorer.readthedocs.io/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

# siibra-explorer - Interactive viewer for multilevel brain atlases

*Authors: Big Data Analytics Group, Institute of Neuroscience and Medicine (INM-1), Forschungszentrum Jülich GmbH*

Copyright 2020-2021, Forschungszentrum Jülich GmbH

`siibra-explorer` is an frontend module wrapping around [nehuba](https://github.com/HumanBrainProject/nehuba) for visualizing volumetric brain volumes at possible high resolutions, and connecting to `siibra-api` for offering access to brain atlases of different species, including to navigate their brain region hierarchies, maps in different coordinate spaces, and linked regional data features. It provides metadata integration with the [EBRAINS knowledge graph](https://kg.ebrains.eu), different forms of data visualisation, and a structured plugin system for implementing custom extensions.

## Getting Started

A live version of the Interactive Atlas Viewer is available at [https://interactive-viewer.apps.hbp.eu](https://interactive-viewer.apps.hbp.eu). This section is useful for developers who would like to develop this project.

### General information

Interactive atlas viewer is built with [Angular (v12.0)](https://angular.io/), [Bootstrap (v4)](http://getbootstrap.com/), and [fontawesome icons](https://fontawesome.com/). Some other notable packages used are [ngrx/store](https://github.com/ngrx/platform) for state management. 

Releases newer than [v0.2.9](https://github.com/HumanBrainProject/interactive-viewer/tree/v0.2.9) also uses a nodejs backend, which uses [passportjs](http://www.passportjs.org/) for user authentication, [express](https://expressjs.com/) as a http framework.

### Develop

#### Prerequisites

- latest version of node 12.x.x or node 14.x.x

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

## Acknowledgements

This software code is funded from the European Union’s Horizon 2020 Framework
Programme for Research and Innovation under the Specific Grant Agreement No.
945539 (Human Brain Project SGA3).
