declare module '*.html' {
  const contents:string
  export = contents
}

declare module '*.css' {
  const contents:string
  export = contents
}

declare var PLUGINDEV : string
declare var BUNDLEDPLUGINS : string[]
declare var VERSION : string
declare var PRODUCTION: boolean
declare var BACKEND_URL: string
declare var USE_LOGO: string
declare var STRICT_LOCAL: boolean
declare var KIOSK_MODE: boolean