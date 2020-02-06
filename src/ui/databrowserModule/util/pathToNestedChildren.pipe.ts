import { Pipe, PipeTransform } from "@angular/core";

/**
 * The pipe transforms a flat array to a nested array, based on the path property, following Unix file path rule
 */

// TODO check what the hell prop should do

@Pipe({
  name : 'pathToNestedChildren',
})

export class PathToNestedChildren implements PipeTransform {
  public transform(array: HasPathProperty[], prop?: string): NestedChildren[] {
    if (!array) {
      return []
    }
    return this.constructDoubleHeirachy(array)
  }

  private constructDoubleHeirachy(array: HasPathProperty[]): NestedChildren[] {
    return array.reduce((acc: NestedChildren[], curr: HasPathProperty) => {
      return this.checkEntryExist(acc, curr) ?
        acc.map(item =>
          this.checkEntryExist([item], curr) ?
            this.concatItem(item, curr) :
            item ) as NestedChildren[] :
        acc.concat(
          this.constructNewItem(curr),
        ) as NestedChildren[]
    }, [] as NestedChildren[])
  }

  private constructNewItem(curr: HasPathProperty): NestedChildren {
    const finalPath = this.getCurrentPath(curr) === curr.path
    return Object.assign({},
      finalPath ?
        curr :
        {}, {
        path : this.getCurrentPath(curr),
        children : finalPath ?
          [] :
          this.constructDoubleHeirachy(
            [ this.getNextLevelHeirachy(curr) ],
          ),
      })
  }

  private concatItem(item: NestedChildren, curr: HasPathProperty): NestedChildren {
    const finalPath = this.getCurrentPath(curr) === curr.path
    return Object.assign({},
      item,
      finalPath ?
        curr :
        {},
      {
        children : item.children.concat(
          finalPath ?
            [] :
            this.constructDoubleHeirachy(
              [ this.getNextLevelHeirachy(curr) ],
            ),
        ),
      })
  }

  private checkEntryExist(acc: NestedChildren[], curr: HasPathProperty): boolean {
    const path = this.getCurrentPath(curr)
    return acc.findIndex(it => it.path === path) >= 0
  }

  private getNextLevelHeirachy(file: HasPathProperty): HasPathProperty {
    return Object.assign({}, file,
      {
        path: file.path
          ? file.path.slice(this.findRealIndex(file.path) + 1)
          : ' ',
      })
  }

  private getNextPath(curr: HasPathProperty): string {
    const realIdx = this.findRealIndex(curr.path)
    return realIdx > 0 ?
      curr.path.slice(realIdx + 1) :
      realIdx == 0 ?
        ' ' :
        curr.path
  }

  private getCurrentPath(curr: HasPathProperty): string {
    const realIdx = this.findRealIndex(curr.path)
    return realIdx > 0 ?
      curr.path.slice(0, realIdx) :
      realIdx == 0 ?
        ' ' :
        curr.path
  }

  private findRealIndex(path: string): number {

    if (!path) {
      return 0
    }

    let idx = path.indexOf('/')
    while (path[idx - 1] === '\\' && idx >= 0) {
      idx = path.indexOf('/', idx + 1)
    }
    return idx
  }

}

export interface HasPathProperty {
  path: string
}

export interface NestedChildren {
  path: string
  children: NestedChildren[]
}
