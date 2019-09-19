import { Pipe, PipeTransform } from "@angular/core";

// TODO fix typo

@Pipe({
  name : 'filterRowsByVisbilityPipe'
})

export class FilterRowsByVisbilityPipe implements PipeTransform{
  public transform(rows:any[], getChildren : (item:any)=>any[], filterFn : (item:any)=>boolean){
    
    return rows.filter(row => this.recursive(row, getChildren, filterFn) )
  }

  private recursive(single : any, getChildren : (item:any) => any[], filterFn:(item:any) => boolean):boolean{
    return filterFn(single) || (getChildren && getChildren(single).some(c => this.recursive(c, getChildren, filterFn)))
  }
}