import { FlatTreeControl } from "@angular/cdk/tree";
import { MatTreeFlatDataSource, MatTreeFlattener } from "@angular/material/tree"
import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, OnChanges, Output, SimpleChanges, TemplateRef } from "@angular/core";
import { TreeNode } from "../const"

@Component({
  selector: `sxplr-flat-hierarchy-tree-view`,
  templateUrl: `./treeView.template.html`,
  styleUrls: [
    `./treeView.style.css`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'flatHierarchyTreeView'
})

export class SxplrFlatHierarchyTreeView<T extends object> implements OnChanges{
  @HostBinding('class')
  class = 'iv-custom-comp'

  @Input('sxplr-flat-hierarchy-nodes')
  nodes: T[] = []

  @Input('sxplr-flat-hierarchy-is-parent')
  isParent: (child: T, parent: T) => boolean

  @Input('sxplr-flat-hierarchy-render-node-tmpl')
  renderNodeTmplRef: TemplateRef<T>

  @Input('sxplr-flat-hierarchy-tree-view-lineheight')
  lineHeight: number = 35

  @Input('sxplr-flat-hierarchy-tree-view-show-control')
  showControl: boolean = false

  @Input('sxplr-flat-hierarchy-tree-view-node-label-toggles')
  nodeLabelToggles: boolean = true

  @Input('sxplr-flat-hierarchy-tree-view-expand-on-init')
  expandOnInit: boolean = true

  @Output('sxplr-flat-hierarchy-tree-view-node-clicked')
  nodeClicked = new EventEmitter<T>()

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.nodes) {

      /**
       * on new nodes passed, reset all maps
       * otherwise, tree will show stale data and will not update
       */
      this.childrenWeakMap = new WeakMap()
      this.parentWeakMap = new WeakMap()
      this.nodeAncestorIsLast = new WeakMap()
      
      const root = this.nodes.filter(node => !this.getParent(node))
      for (const el of root) {
        this.parentWeakMap.set(el, null)
        this.nodeAncestorIsLast.set(el, [])
      }
      this.dataSource.data = root
      if (this.expandOnInit) {
        this.treeControl.expandAll()
      }
    }
  }
  
  private getLevel(node: T): number {
    let level = -1, cursor = node
    const maxLevel = 32
    do {
      if (level >= maxLevel) {
        level = 0
        break
      }
      level++
      cursor = this.getParent(cursor)
    } while (!!cursor)
    return level
  }

  private getParent(node: T): T {
    if (!this.parentWeakMap.has(node)) {
      for (const parentNode of this.nodes) {
        if (this.isParent(node, parentNode)) {
          this.parentWeakMap.set(node, parentNode)
          break
        }
      }
    }
    return this.parentWeakMap.get(node)
  }

  private childrenWeakMap = new WeakMap<T, T[]>()
  private parentWeakMap = new WeakMap<T, T>()
  private nodeAncestorIsLast = new WeakMap<T, boolean[]>()

  private getNodeAncestorIsLast(node: T, visited = new WeakSet<T>() ): boolean[] {
    if (!this.nodeAncestorIsLast.has(node)) {
      if (visited.has(node)) {
        console.error(`getNodeAncestorIsLast visited node twice:`, node)
        throw new Error(`getNodeAncestorIsLast visited node twice. Check console for more details.`)
      }
      visited.add(node)

      const parent = this.getParent(node)
      const children = this.getChildren(parent)
      if (!children.includes(node)) {
        console.error(`getNodeAncestorIsLast node is not included in the parent's children!`, node, parent, children)
        throw new Error(`getNodeAncestorIsLast node is not included in the parent's children! Check console for more details.`)
      }
      const isLast = children.indexOf(node) === (children.length - 1)

      const ancestors = this.getNodeAncestorIsLast(parent, visited)
      this.nodeAncestorIsLast.set(node, [ ...ancestors, isLast ])
    }
    return this.nodeAncestorIsLast.get(node)
  }
  private getChildren(node: T): T[] {
    if (!this.childrenWeakMap.has(node)) {
      const children = this.nodes.filter(childNode => this.isParent(childNode, node))
      this.childrenWeakMap.set(node, children)
      for (const c of children) {
        this.parentWeakMap.set(c, node)
      }
    }
    return this.childrenWeakMap.get(node)
  }

  public treeControl = new FlatTreeControl<TreeNode<T>>(
    ({ level }) => level,
    ({ expandable }) => expandable,
  )
  
  private treeFlattener = new MatTreeFlattener<T, TreeNode<T>>(
    (node: T, level: number) => {
      return {
        node,
        level,
        expandable: this.getChildren(node).length > 0,
      }
    },
    ({ level }) => level,
    ({ expandable }) => expandable,
    node => this.getChildren(node)
  )

  public dataSource = new MatTreeFlatDataSource<T, TreeNode<T>>(
    this.treeControl,
    this.treeFlattener
  )

  hasChild(_: number, node: TreeNode<T>) {
    return node.expandable
  }

  getSpacerClass(node: TreeNode<T>, spacerIdx: number){
    const arrBool = this.getNodeAncestorIsLast(node.node).slice(0, -1)
    if (arrBool[spacerIdx]) {
      return `lvl-hide-left-border`
    }
    return ``
  }

  handleClickNode(node: TreeNode<T>){
    if (this.nodeLabelToggles) {
      this.treeControl.toggle(node)
    }
    this.nodeClicked.emit(node.node)
  }

  expandAll(){
    this.treeControl.expandAll()
  }

  collaseAll(){
    this.treeControl.collapseAll()
  }

  constructor(){
    
  }
}
