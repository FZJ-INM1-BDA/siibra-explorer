export { LayerBrowserModule } from './layerBrowser.module'


export interface INgLayerInterface {
  name: string
  visible: boolean
  source: string
  type: string // image | segmentation | etc ...
  transform?: [[number, number, number, number], [number, number, number, number], [number, number, number, number], [number, number, number, number]] | null
  // colormap : string
}
