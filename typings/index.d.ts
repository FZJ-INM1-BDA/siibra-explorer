declare module '*.html' {
  const contents:string
  export = contents
}

declare module '*.css' {
  const contents:string
  export = contents
}

declare var PLUGINDEV : boolean
declare var BUNDLEDPLUGINS : string[]
declare var VERSION : string