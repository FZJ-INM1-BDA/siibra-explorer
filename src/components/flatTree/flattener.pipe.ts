import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name : 'flattenTreePipe',
})

export class FlattenTreePipe implements PipeTransform {
  public transform(root: any, findChildren: (root: any) => any[]): any&IFlattenedTreeInterface[] {
    return this.recursiveFlatten(root, findChildren, 0, '0')
  }

  private recursiveFlatten(obj, findChildren, flattenedTreeLevel, lvlId) {
    return [
      this.attachLvlAndLvlIdAndSiblingFlag(
        obj,
        flattenedTreeLevel,
        lvlId,
      ),
    ].concat(
      ...findChildren(obj)
        .map((c, idx) => this.recursiveFlatten(c, findChildren, flattenedTreeLevel + 1, `${lvlId}_${idx}` )),
    )
  }

  private attachLvlAndLvlIdAndSiblingFlag(obj: any, flattenedTreeLevel: number, lvlId: string) {
    return Object.assign({}, obj, {
      flattenedTreeLevel,
      collapsed : typeof obj.collapsed === 'undefined' ? false : true,
      lvlId,
    })
  }

}

export interface IFlattenedTreeInterface {
  flattenedTreeLevel: number
  lvlId: string
}
