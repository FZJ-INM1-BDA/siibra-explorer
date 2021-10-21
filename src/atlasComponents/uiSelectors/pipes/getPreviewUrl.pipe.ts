import { Pipe, PipeTransform } from "@angular/core";

const previewImgMap = new Map([
  ['minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588', 'bigbrain.png'],
  ['minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2', 'icbm2009c.png'],
  ['minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992', 'colin27.png'],
  ['minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579', 'cytoarchitectonic-maps.png'],
  ['juelich/iav/atlas/v1.0.0/3', 'cortical-layers.png'],
  ['juelich/iav/atlas/v1.0.0/4', 'grey-white-matter.png'],
  ['juelich/iav/atlas/v1.0.0/5', 'firbe-long.png'],
  ['juelich/iav/atlas/v1.0.0/6', 'firbe-short.png'],
  ['minds/core/parcellationatlas/v1.0.0/d80fbab2-ce7f-4901-a3a2-3c8ef8a3b721', 'difumo-64.png'],
  ['minds/core/parcellationatlas/v1.0.0/73f41e04-b7ee-4301-a828-4b298ad05ab8', 'difumo-128.png'],
  ['minds/core/parcellationatlas/v1.0.0/141d510f-0342-4f94-ace7-c97d5f160235', 'difumo-256.png'],
  ['minds/core/parcellationatlas/v1.0.0/63b5794f-79a4-4464-8dc1-b32e170f3d16', 'difumo-512.png'],
  ['minds/core/parcellationatlas/v1.0.0/12fca5c5-b02c-46ce-ab9f-f12babf4c7e1', 'difumo-1024.png'],
  ['minds/core/referencespace/v1.0.0/265d32a0-3d84-40a5-926f-bf89f68212b9', 'allen-mouse.png'],
  ['minds/core/parcellationatlas/v1.0.0/05655b58-3b6f-49db-b285-64b5a0276f83', 'allen-mouse-2017.png'],
  ['minds/core/parcellationatlas/v1.0.0/39a1384b-8413-4d27-af8d-22432225401f', 'allen-mouse-2015.png'],
  ['minds/core/referencespace/v1.0.0/d5717c4a-0fa1-46e6-918c-b8003069ade8', 'waxholm.png'],
  ['minds/core/parcellationatlas/v1.0.0/ebb923ba-b4d5-4b82-8088-fa9215c2e1fe', 'waxholm-v3.png'],
  ['minds/core/parcellationatlas/v1.0.0/2449a7f0-6dd0-4b5a-8f1e-aec0db03679d', 'waxholm-v2.png'],
  ['minds/core/parcellationatlas/v1.0.0/11017b35-7056-4593-baad-3934d211daba', 'waxholm-v1.png'],
  ['juelich/iav/atlas/v1.0.0/79cbeaa4ee96d5d3dfe2876e9f74b3dc3d3ffb84304fb9b965b1776563a1069c', 'short-bundle-hcp.png'],
  ['minds/core/referencespace/v1.0.0/tmp-fsaverage', 'freesurfer.png'],
  ['minds/core/referencespace/v1.0.0/tmp-fsaverage6', 'freesurfer.png'],
  ['minds/core/referencespace/v1.0.0/tmp-hcp32k', 'freesurfer.png'],
  ['minds/core/referencespace/v1.0.0/MEBRAINS_T1.masked', 'primate.png'],
  ['minds/core/parcellationatlas/v1.0.0/mebrains-tmp-id', 'primate-parc.png'],
])

/**
 * used for directories
 */
const previewNameToPngMap = new Map([
  ['fibre architecture', 'firbe-long.png'],
  ['functional modes', 'difumo-128.png']
])

@Pipe({
  name: 'getPreviewUrlPipe',
  pure: true
})

export class GetPreviewUrlPipe implements PipeTransform{
  public transform(tile: any){
    const filename = tile['@id']
      ? previewImgMap.get(tile['@id'])
      : previewNameToPngMap.get(tile['name'])
    if (!filename) {
      console.log(tile)
    }
    return filename && `assets/images//atlas-selection/${filename}`
  }
}
