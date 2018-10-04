# Interactive Atlas Viewer

Interactive Atlas Viewer is an frontend module wrapping around [nehuba](https://github.com/HumanBrainProject/nehuba). It provides additional features, such as metadata integration, data visualisation and a robust plugin system.

## Getting Started

A live version of the Interactive Atlas Viewer is available at [https://kg.humanbrainproject.org/viewer/](https://kg.humanbrainproject.org/viewer/). This section is useful for developers who would like to develop this project.

### General information
Interactive atlas viewer is built with [Angular (v6.0)](https://angular.io/) and [Bootstrap (v3.3.4)](http://getbootstrap.com/docs/3.3/). Some other notable packages used are: [ng2-charts](https://valor-software.com/ng2-charts/) for charts visualisation, [ngx-bootstrap (v 2.0.5)](https://valor-software.com/ngx-bootstrap/old/2.0.5/) for UI and [ngrx/platform](https://github.com/ngrx/platform) for state management. 

### Prerequisites

- node > 6
- npm > 4

### Develop Interactive Viewer

To run a dev server, run:

```
git clone https://github.com/HumanBrainProject/interactive-viewer
cd interactive-viewer
npm i
npm run dev-server
```

### Develop Plugins

To develop plugins for the interactive viewer, run:
```
git clone https://github.com/HumanBrainProject/interactive-viewer
cd interactive-viewer
npm i
PLUGINDEV=true npm run dev-plugin
```

The contents inside the folder in `./src/plugin_examples` will be automatically fetched by the dev instance of the interactive-viewer on load. 

[plugin readme](src/plugin_examples/README.md)

[plugin api](src/plugin_examples/plugin_api.md)

[plugin migration guide](src/plugin_examples/migrationGuide.md)


## Deployment

`package.json` provide with two ways of building the interactive atlas viewer, `JIT` or `AOT` compilation. In general, `AOT` compilation produces a smaller package and has better performance. 

## AOT compilation

Define `BUNDLEPLUGINS` as a comma separated environment variables to bundle the plugins. 

```
[BUNDLEDPLUGINS=pluginDir1[,pluginDir2...]] npm run build-aot
```

## JIT Compilation
```
npm run build

/* OR */

npm run build-min
```


## Contributing

Feel free to raise an issue in this repo and/or file a PR. 

## Versioning

Commit history prior to v0.2.0 is available in the [legacy-v0.2.0](https://github.com/HumanBrainProject/interactive-viewer/tree/legacy-v0.2.0) branch. The repo was rewritten to remove its dependency on neuroglancer and nehuba. This allowed for simpler webpack config, faster build time and AOT compilation. 

## License

MIT
