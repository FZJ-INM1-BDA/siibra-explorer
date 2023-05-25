<img align="right" src="https://raw.githubusercontent.com/FZJ-INM1-BDA/siibra-explorer/master/docs/images/siibra-explorer-square.jpeg" width="200">

[![DOI](https://zenodo.org/badge/109723444.svg)](https://zenodo.org/badge/latestdoi/109723444)
[![Documentation Status](https://readthedocs.org/projects/siibra-explorer/badge/?version=latest)](https://siibra-explorer.readthedocs.io/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

# siibra-explorer - Interactive atlas viewer for multilevel brain atlases

*Authors: Big Data Analytics Group, Institute of Neuroscience and Medicine (INM-1), Forschungszentrum Jülich GmbH*

Copyright 2020-2021, Forschungszentrum Jülich GmbH

`siibra-explorer` is an frontend module wrapping around [nehuba](https://github.com/HumanBrainProject/nehuba) for visualizing volumetric brain volumes at possible high resolutions, and connecting to `siibra-api` for offering access to brain atlases of different species, including to navigate their brain region hierarchies, maps in different coordinate spaces, and linked regional data features. It provides metadata integration with the [EBRAINS knowledge graph](https://kg.ebrains.eu), different forms of data visualisation, and a structured plugin system for implementing custom extensions.

## Getting Started

A live version of the siibra explorer is available at [https://atlases.ebrains.eu/viewer/](https://atlases.ebrains.eu/viewer/). This section is useful for developers who would like to develop this project.

### General information

Siibra explorer is built with [Angular (v14.0)](https://angular.io/), [Bootstrap (v4)](http://getbootstrap.com/), and [fontawesome icons](https://fontawesome.com/). Some other notable packages used are [ngrx/store](https://github.com/ngrx/platform) for state management. 

Releases newer than [v0.2.9](https://github.com/HumanBrainProject/interactive-viewer/tree/v0.2.9) also uses a nodejs backend, which uses [passportjs](http://www.passportjs.org/) for user authentication, [express](https://expressjs.com/) as a http framework.

### Develop

#### Prerequisites

- node 12.20.0 or later

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
$ git clone https://github.com/FZJ-INM1-BDA/siibra-explorer
$ cd siibra-explorer
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

Please see [src/plugin/README.md](src/plugin/README.md)

## Contributing

Feel free to raise an issue in this repo and/or file a PR. 

## Versioning

Commit history prior to v0.2.0 is available in the [legacy-v0.2.0](https://github.com/FZJ-INM1-BDA/siibra-explorer/tree/legacy-v0.2.0) branch. The repo was rewritten to remove its dependency on neuroglancer and nehuba. This allowed for simpler webpack config, faster build time and AOT compilation. 

## License

Apache-2.0

## Acknowledgements

This software code is funded from the European Union’s Horizon 2020 Framework
Programme for Research and Innovation under the Specific Grant Agreement No.
945539 (Human Brain Project SGA3).
