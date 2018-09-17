import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name : 'appendSiblingFlagPipe'
})

export class AppendSiblingFlagPipe implements PipeTransform{
  public transform(objs:any[]):any[]{
    const idSet = new Set(objs.map(obj => obj.lvlId))
    return objs.map(obj => 
      Object.assign({}, obj, {
        siblingFlags : obj.lvlId
          .split('_')
          .reduce((acc,curr) => acc.concat(acc.length === 0 ? curr : acc[acc.length -1].concat(`_${curr}`)), [])
          .map(prevIds => this.isLast(prevIds,idSet))
          .slice(1)
      })
    )
  }

  private isLast(id:string, set:Set<string>):boolean{
    return !set.has(id.split('_').slice(0,-1).concat( (Number(id.split('_').reverse()[0]) + 1).toString() ).join('_'))
  }
}