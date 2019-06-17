import { EventEmitter, Component, Input, Output, ChangeDetectionStrategy } from "@angular/core";
import { FlattenedTreeInterface } from "./flattener.pipe";

/**
 * TODO to be replaced by virtual scrolling when ivy is in stable
 */

@Component({
  selector : 'flat-tree-component',
  templateUrl : './flatTree.template.html',
  styleUrls : [
    './flatTree.style.css'
  ],
  changeDetection:ChangeDetectionStrategy.OnPush
})

export class FlatTreeComponent{
  @Input() inputItem : any = {
    name : 'Untitled',
    children : []
  }
  @Input() childrenExpanded : boolean = true

  @Input() useDefaultList: boolean = false

  @Output() treeNodeClick : EventEmitter<any> = new EventEmitter()

  /* highly non-performant. rerenders each time on mouseover or mouseout */
  // @Output() treeNodeEnter : EventEmitter<any> = new EventEmitter()
  // @Output() treeNodeLeave : EventEmitter<any> = new EventEmitter()

  @Input() renderNode : (item:any)=>string = (item)=>item.name
  @Input() findChildren : (item:any)=>any[] = (item)=>item.children ? item.children : [] 
  @Input() searchFilter : (item:any)=>boolean | null = ()=>true

  public flattenedItems : any[] = []

  getClass(level:number){
    return [...Array(level+1)].map((v,idx) => `render-node-level-${idx}`).join(' ')
  }

  collapsedLevels: Set<string> = new Set()
  uncollapsedLevels : Set<string> = new Set()

  toggleCollapse(flattenedItem:FlattenedTreeInterface){
    if (this.isCollapsed(flattenedItem)) {
      this.collapsedLevels.delete(flattenedItem.lvlId)
      this.uncollapsedLevels.add(flattenedItem.lvlId)
    } else {
      this.collapsedLevels.add(flattenedItem.lvlId)
      this.uncollapsedLevels.delete(flattenedItem.lvlId)
    }
    this.collapsedLevels = new Set(this.collapsedLevels)
    this.uncollapsedLevels = new Set(this.uncollapsedLevels)
  }

  isCollapsed(flattenedItem:FlattenedTreeInterface):boolean{
    return this.isCollapsedById(flattenedItem.lvlId)
  }

  isCollapsedById(id:string):boolean{
    return this.collapsedLevels.has(id) 
      ? true
      : this.uncollapsedLevels.has(id)
        ? false
        : !this.childrenExpanded
  }

  collapseRow(flattenedItem:FlattenedTreeInterface):boolean{
    return flattenedItem.lvlId.split('_')
      .filter((v,idx,arr) => idx < arr.length -1 )
      .reduce((acc,curr) => acc
        .concat(acc.length === 0 
          ? curr 
          : acc[acc.length -1].concat(`_${curr}`)), [])
      .some(id => this.isCollapsedById(id))
  }

}