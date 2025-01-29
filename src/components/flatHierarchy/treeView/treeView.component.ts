import { FlatTreeControl } from "@angular/cdk/tree";
import { MatTreeFlatDataSource, MatTreeFlattener } from 'src/sharedModules/angularMaterial.exports'
import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, OnChanges, Output, SimpleChanges, TemplateRef } from "@angular/core";
import { TreeNode } from "../const"
import { Tree } from "./treeControl"

@Component({
  selector: `sxplr-flat-hierarchy-tree-view`,
  templateUrl: `./treeView.template.html`,
  styleUrls: [
    `./treeView.style.css`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'flatHierarchyTreeView'
})

export class SxplrFlatHierarchyTreeView<T extends Record<string, unknown>> extends Tree<T> implements OnChanges{
  @HostBinding('class')
  class = 'sxplr-custom-cmp'

  @Input('sxplr-flat-hierarchy-nodes')
  sxplrNodes: T[] = []

  @Input('sxplr-flat-hierarchy-is-parent')
  sxplrIsParent: (child: T, parent: T) => boolean

  @Input('sxplr-flat-hierarchy-render-node-tmpl')
  renderNodeTmplRef: TemplateRef<unknown>

  @Input('sxplr-flat-hierarchy-tree-view-lineheight')
  lineHeight: number = 35

  @Input('sxplr-flat-hierarchy-tree-view-show-control')
  showControl: boolean = false

  @Input('sxplr-flat-hierarchy-tree-view-node-label-toggles')
  nodeLabelToggles: boolean = true

  @Input('sxplr-flat-hierarchy-tree-view-expand-on-init')
  expandOnInit: boolean = true

  @Output('sxplr-flat-hierarchy-tree-view-node-clicked')
  nodeClicked = new EventEmitter<{ node: T, event: MouseEvent}>()

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.sxplrNodes || changes.sxplrIsParent) {
      this.nodes = this.sxplrNodes || []
      this.isParent = this.sxplrIsParent
      this.dataSource.data = this.rootNodes
      if (this.expandOnInit) {
        this.treeControl.expandAll()
      }
    }
  }

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

  handleClickNode(node: TreeNode<T>, event: MouseEvent){
    if (this.nodeLabelToggles) {
      this.treeControl.toggle(node)
    }
    this.nodeClicked.emit({ node: node.node, event })
  }

  expandAll(){
    this.treeControl.expandAll()
  }

  collaseAll(){
    this.treeControl.collapseAll()
  }

  constructor(){
    super()
  }
}
