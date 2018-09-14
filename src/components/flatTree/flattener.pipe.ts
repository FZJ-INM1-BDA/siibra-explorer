import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name : 'flattenTreePipe'
})

export class FlattenTreePipe implements PipeTransform{
  public transform(root:any, findChildren: (root:any) => any[]):any&FlattenedTreeInterface[]{
    return this.recursiveFlatten(root,findChildren,0, '0', [])
  }

  private recursiveFlatten(obj, findChildren, flattenedTreeLevel, lvlId, siblingFlags){
    return [
        this.attachLvlAndLvlIdAndSiblingFlag(
          obj,
          flattenedTreeLevel, 
          lvlId,
          siblingFlags
        )
      ].concat(
      ...findChildren(obj)
        .map((c,idx,arr) => this.recursiveFlatten(c,findChildren,flattenedTreeLevel + 1, `${lvlId}_${idx}`, siblingFlags.concat( idx === (arr.length - 1)) ))
    )
  }

  private attachLvlAndLvlIdAndSiblingFlag(obj:any, flattenedTreeLevel:number, lvlId:string, siblingFlags : boolean[]){
    return Object.assign({}, obj,{
      flattenedTreeLevel, 
      collapsed : typeof obj.collapsed === 'undefined' ? false : true,
      lvlId,
      siblingFlags
    })
  }

}

export interface FlattenedTreeInterface{
  flattenedTreeLevel : number
  lvlId : string
}