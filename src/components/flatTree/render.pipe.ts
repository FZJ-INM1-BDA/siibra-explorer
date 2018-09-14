import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name : 'renderPipe'
})

export class RenderPipe implements PipeTransform{
  public transform(node:any, renderFunction:(node:any)=>string):string{
    return renderFunction(node)
  }
}