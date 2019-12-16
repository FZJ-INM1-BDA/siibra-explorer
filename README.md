# Interactive Atlas Viewer

Interactive Atlas Viewer is an frontend module wrapping around [nehuba](https://github.com/HumanBrainProject/nehuba). It provides additional features, such as metadata integration, data visualisation and a robust plugin system.

## Getting Started

A live version of the Interactive Atlas Viewer is available at [https://interactive-viewer.apps.hbp.eu](https://interactive-viewer.apps.hbp.eu). This section is useful for developers who would like to develop this project.

### General information
Interactive atlas viewer is built with [Angular (v6.0)](https://angular.io/), [Bootstrap (v4)](http://getbootstrap.com/), and [fontawesome icons](https://fontawesome.com/). Some other notable packages used are: [ng2-charts](https://valor-software.com/ng2-charts/) for charts visualisation, [ngx-bootstrap](https://valor-software.com/ngx-bootstrap/) for UI and [ngrx/store](https://github.com/ngrx/platform) for state management. 

Releases newer than [v0.2.9](https://github.com/HumanBrainProject/interactive-viewer/tree/v0.2.9) also uses a nodejs backend, which uses [passportjs](http://www.passportjs.org/) for user authentication, [express](https://expressjs.com/) as a http framework.

### Prerequisites

- node >= 12

### Develop Interactive Viewer

To run a dev server, run:

```
$ git clone https://github.com/HumanBrainProject/interactive-viewer
$ cd interactive-viewer
$ npm i
$ npm run dev
```

### Develop Plugins

For releases newer than [v0.2.9](https://github.com/HumanBrainProject/interactive-viewer/tree/v0.2.9), Interactive Atlas Viewer attempts to fetch `GET {BACKEND_URL}/plugins` to retrieve a list of URLs. The interactive atlas viewer will then perform a `GET` request for each of the listed URLs, parsing them as [manifests](src/plugin_examples/README.md#Manifest%20JSON).

The backend reads the environment variable `PLUGIN_URLS` and separate the string with `;` as a delimiter. In order to return a response akin to the following:

```JSON
["http://localhost:3001/manifest.json","http://localhost:9001/manifest.json"]
```

Plugin developers may choose to do any of the following:

_shell_

set env var every time

```bash
$ PLUGIN_URLS=http://localhost:3001/manifest.json;http://localhost:9001/manifest.json npm run dev
```

_dotenv_

set a `.env` file in `./deploy/` once

```bash
$ echo `PLUGIN_URLS=http://localhost:3001/manifest.json;http://localhost:9001/manifest.json` > ./deploy/.env
```

then, simple start the dev process with

```bash
$ npm run dev
```

Plugin developers can start their own webserver, use [interactive-viewer-plugin-template](https://github.com/HumanBrainProject/interactive-viewer-plugin-template), or (coming soon) provide link to a github repository.


[plugin readme](src/plugin_examples/README.md)

[plugin api](src/plugin_examples/plugin_api.md)

[plugin migration guide](src/plugin_examples/migrationGuide.md)


## Compilation

`package.json` provide with two ways of building the interactive atlas viewer, `JIT` or `AOT` compilation. In general, `AOT` compilation produces a smaller package and has better performance. 

### AOT compilation

```
npm run build-aot
```

### JIT Compilation
```
npm run build

/* OR */

npm run build-min
```

### Docker

The repository also provides a `Dockerfile`. Here are the environment variables used:

_build time_
- __BACKEND_URL__ : same as `HOSTNAME` during run time. Needed as root URL when fetching templates / datasets etc. If left empty, will fetch without hostname.

_run time_

- __SESSION_SECRET__ : needed for session
- __HOSTNAME__ : needed for OIDC redirect
- __HBP_CLIENTID__ : neded for OIDC authentication
- __HBP_CLIENTSECRET__ : needed for OIDC authentication
- __PLUGIN_URLS__ : optional. Allows plugins to be populated
- __REFRESH_TOKEN__ : needed for access of public data

## Contributing

Feel free to raise an issue in this repo and/or file a PR. 

## Versioning

Commit history prior to v0.2.0 is available in the [legacy-v0.2.0](https://github.com/HumanBrainProject/interactive-viewer/tree/legacy-v0.2.0) branch. The repo was rewritten to remove its dependency on neuroglancer and nehuba. This allowed for simpler webpack config, faster build time and AOT compilation. 

## License

TO BE DECIDED