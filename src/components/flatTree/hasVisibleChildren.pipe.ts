import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name : 'hasVisibleChildrenPipe'
})

export class HasVisibleChildrenPipe implements PipeTransform{
  public transform(item:any, getChildren: (item:any)=>any[], filterFn: (item:any)=>boolean){
    return filterFn(item) || getChildren(item).some(c => this.transform(c, getChildren, filterFn))
  }
}