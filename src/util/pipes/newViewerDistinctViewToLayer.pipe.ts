import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name : 'newViewerDisctinctViewToLayer',
})

export class NewViewerDisctinctViewToLayer implements PipeTransform {
  public transform(input: [any | null, string | null]): AtlasViewerLayerInterface[] {
    try {
      if (!input) {
        return []
      }
      const newViewer = input[0]
      const dedicatedViewer = input[1]
      return []
        .concat(newViewer
          ? Object.keys(newViewer.nehubaConfig.dataset.initialNgState.layers).map(key => ({
              name : key,
              url : newViewer.nehubaConfig.dataset.initialNgState.layers[key].source,
              type : newViewer.nehubaConfig.dataset.initialNgState.layers[key].type === 'image'
                ? 'base'
                : newViewer.nehubaConfig.dataset.initialNgState.layers[key].type === 'segmentation'
                  ? 'mixable'
                  : 'nonmixable',
              transform : newViewer.nehubaConfig.dataset.initialNgState.layers[key].transform
                ? newViewer.nehubaConfig.dataset.initialNgState.layers[key].transform.map(quat => Array.from(quat))
                : null,
            }))
          : [])
        .concat(dedicatedViewer
          ? { name : 'dedicated view', url : dedicatedViewer, type : 'nonmixable' }
          : [])
        .sort((l1, l2) => l1.type < l2.type
          ? -1
          : l1.type > l2.type
            ? 1
            : 0 )
    } catch (e) {

      // tslint:disable-next-line
      console.error('new viewer distinct view to layer error', e)
      return []
    }
  }
}

export interface AtlasViewerLayerInterface {
  name: string
  url: string
  type: string // 'base' | 'mixable' | 'nonmixable'
  transform?: [[number, number, number, number], [number, number, number, number], [number, number, number, number], [number, number, number, number]] | null
  // colormap : string
}
