import { Pipe, PipeTransform } from "@angular/core";
import { TreeNode } from "./const"

@Pipe({
  name: 'flatHierarchySpacer',
  pure: true
})

export class FlatHierarchySpacer implements PipeTransform{
  public transform<T>(inputNode: TreeNode<T>, ..._args: any[]) {
    return Array(inputNode.level).fill(null)
  }
}
