type _Filter = {
  allow?: string[]
}

export type PluginManifest = {
  'siibra-explorer': true
  name: string
  iframeUrl: string
  parcellations?: _Filter
  spaces?: _Filter
}
