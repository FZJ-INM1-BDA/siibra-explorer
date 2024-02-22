import { Pipe, PipeTransform } from "@angular/core"
import { CFIndex, isPoint } from "./util"
import { SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes"
import { translateV3Entities } from "src/atlasComponents/sapi/translateV3"

type Icon = {
  fontSet: string
  fontIcon: string
  message: string
}

@Pipe({
  name: 'idxToIcon',
  pure: true
})

export class IndexToIconPipe implements PipeTransform{
  transform(index: CFIndex, selectedTemplate: SxplrTemplate): Icon[] {
    if (!isPoint(index.index)) {
      return []
    }
    if (index.index.spaceId !== selectedTemplate.id) {
      const tmpl = translateV3Entities.getSpaceFromId(index.index.spaceId)
      return [{
        fontSet: 'fas',
        fontIcon: 'fa-exclamation-triangle',
        message: `This point is in space ${tmpl?.name || 'Unknown'}(id=${index.index.spaceId}). It cannot be shown in the currently selected space ${selectedTemplate.name}(id=${selectedTemplate.id})`
      }]
    }
    return []
  }
}
