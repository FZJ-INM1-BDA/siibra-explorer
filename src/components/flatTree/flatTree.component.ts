import { EventEmitter, Component, Input, Output, ChangeDetectionStrategy, ChangeDetectorRef, Optional } from "@angular/core";
import { FlattenedTreeInterface } from "./flattener.pipe";

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

  @Output() treeNodeClick : EventEmitter<any> = new EventEmitter()

  /* highly non-performant. rerenders each time on mouseover or mouseout */
  // @Output() treeNodeEnter : EventEmitter<any> = new EventEmitter()
  // @Output() treeNodeLeave : EventEmitter<any> = new EventEmitter()

  @Input() renderNode : (item:any)=>string = (item)=>item.name
  @Input() findChildren : (item:any)=>any[] = (item)=>item.children ? item.children : [] 
  @Input() searchFilter : (item:any)=>boolean | null = ()=>true

  getClass(level:number){
    return [...Array(level+1)].map((v,idx) => `render-node-level-${idx}`).join(' ')
  }

  collapsedLevels: Set<string> = new Set()
  searchedVisibleSet: Set<string> = new Set()

  toggleCollapse(flattenedItem:FlattenedTreeInterface){
    this.collapsedLevels.has(flattenedItem.lvlId)
      ? this.collapsedLevels.delete(flattenedItem.lvlId)
      : this.collapsedLevels.add(flattenedItem.lvlId)
  }

  isCollapsed(flattenedItem:FlattenedTreeInterface):boolean{
    return this.collapsedLevels.has(flattenedItem.lvlId)
  }

  collapseRow(flattenedItem:FlattenedTreeInterface):boolean{
    return flattenedItem.lvlId.split('_')
      .filter((v,idx,arr) => idx < arr.length -1 )
      .reduce((acc,curr) => acc
        .concat(acc.length === 0 
          ? curr 
          : acc[acc.length -1].concat(`_${curr}`)), [])
      .find(id => this.collapsedLevels.has(id))
        ? true
        : false
  }
}