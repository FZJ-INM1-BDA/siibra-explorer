import {CdkVirtualScrollViewport} from "@angular/cdk/scrolling";
import {AfterViewChecked, ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild} from "@angular/core";
import { IFlattenedTreeInterface } from "./flattener.pipe";

/**
 * TODO to be replaced by virtual scrolling when ivy is in stable
 */

@Component({
  selector : 'flat-tree-component',
  templateUrl : './flatTree.template.html',
  styleUrls : [
    './flatTree.style.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class FlatTreeComponent implements AfterViewChecked {
  @Input() public inputItem: any = {
    name : 'Untitled',
    children : [],
  }
  @Input() public childrenExpanded: boolean = true

  @Input() public useDefaultList: boolean = false

  @Output() public treeNodeClick: EventEmitter<any> = new EventEmitter()

  /* highly non-performant. rerenders each time on mouseover or mouseout */
  // @Output() treeNodeEnter : EventEmitter<any> = new EventEmitter()
  // @Output() treeNodeLeave : EventEmitter<any> = new EventEmitter()

  @Input() public renderNode: (item: any) => string = (item) => item.name
  @Input() public findChildren: (item: any) => any[] = (item) => item.children ? item.children : []
  @Input() public searchFilter: (item: any) => boolean | null = () => true

  @ViewChild('flatTreeVirtualScrollViewPort') public virtualScrollViewPort: CdkVirtualScrollViewport
  @Output() public totalRenderedListChanged = new EventEmitter<{ previous: number, current: number }>()
  private totalDataLength: number = null

  public flattenedItems: any[] = []

  public getClass(level: number) {
    return [...Array(level + 1)].map((v, idx) => `render-node-level-${idx}`).join(' ')
  }

  public collapsedLevels: Set<string> = new Set()
  public uncollapsedLevels: Set<string> = new Set()

  public ngAfterViewChecked() {
    /**
     * if useDefaultList is true, virtualscrollViewPort will be undefined
     */
    if (!this.virtualScrollViewPort) {
      return
    }
    const currentTotalDataLength = this.virtualScrollViewPort.getDataLength()
    const previousDataLength = this.totalDataLength

    this.totalRenderedListChanged.emit({
      current: currentTotalDataLength,
      previous: previousDataLength,
    })
    this.totalDataLength = currentTotalDataLength
  }

  public toggleCollapse(flattenedItem: IFlattenedTreeInterface) {
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

  public isCollapsed(flattenedItem: IFlattenedTreeInterface): boolean {
    return this.isCollapsedById(flattenedItem.lvlId)
  }

  public isCollapsedById(id: string): boolean {
    return this.collapsedLevels.has(id)
      ? true
      : this.uncollapsedLevels.has(id)
        ? false
        : !this.childrenExpanded
  }

  public collapseRow(flattenedItem: IFlattenedTreeInterface): boolean {
    return flattenedItem.lvlId.split('_')
      .filter((v, idx, arr) => idx < arr.length - 1 )
      .reduce((acc, curr) => acc
        .concat(acc.length === 0
          ? curr
          : acc[acc.length - 1].concat(`_${curr}`)), [])
      .some(id => this.isCollapsedById(id))
  }

  public handleTreeNodeClick(event: MouseEvent, inputItem: any) {
    this.treeNodeClick.emit({
      event,
      inputItem,
    })
  }
}
