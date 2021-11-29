import { Pipe, PipeTransform } from "@angular/core"

const previewImgMap = new Map([
  ['minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588', 'bigbrain.png'],
  ['minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2', 'icbm2009c.png'],
  ['minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992', 'colin27.png'],

  ['minds/core/referencespace/v1.0.0/265d32a0-3d84-40a5-926f-bf89f68212b9', 'allen-mouse.png'],
  
  ['minds/core/referencespace/v1.0.0/d5717c4a-0fa1-46e6-918c-b8003069ade8', 'waxholm.png'],

  ['minds/core/referencespace/v1.0.0/tmp-fsaverage', 'freesurfer.png'],
  ['minds/core/referencespace/v1.0.0/tmp-fsaverage6', 'freesurfer.png'],

  ['minds/core/referencespace/v1.0.0/tmp-hcp32k', 'freesurfer.png'],
  ['minds/core/referencespace/v1.0.0/MEBRAINS_T1.masked', 'primate.png'],
  
])

@Pipe({
  name: 'getTemplatePreviewUrl',
  pure: true
})

export class GetTemplatePreviewUrlPipe implements PipeTransform{
  public transform(tile: any){
    const filename = previewImgMap.get(tile['@id'])
    return filename && `assets/images/atlas-selection/${filename}`
  }
}
