import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'hasSubMenu',
  pure: true
})

export class HasSubMenuPipe<T extends object> implements PipeTransform{
  public transform(item: T, getChildren: (obj: T) => T[]): boolean {
    return (getChildren(item) || []).length > 0
  }
}
