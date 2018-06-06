import { Pipe, PipeTransform } from "@angular/core";


@Pipe({
  name : 'getName'
})

export class GetNamePipe implements PipeTransform{

  public transform(object:any):string{
    return object ? 
      object.name ? object.name : 'Untitled' : 
      'Untitled'
  }
}