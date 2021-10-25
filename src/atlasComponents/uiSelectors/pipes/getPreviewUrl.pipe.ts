import { Pipe, PipeTransform } from "@angular/core";
import { GetParcPreviewUrlPipe } from "src/atlasComponents/parcellation";
import { GetTemplatePreviewUrlPipe } from "src/atlasComponents/template";

const templateUrlPipe = new GetTemplatePreviewUrlPipe()
const parcUrlPipe = new GetParcPreviewUrlPipe()

@Pipe({
  name: 'getPreviewUrlPipe',
  pure: true
})

export class GetPreviewUrlPipe implements PipeTransform{
  public transform(tile: any){
    const filename = templateUrlPipe.transform(tile) || parcUrlPipe.transform(tile)
    return filename
  }
}
