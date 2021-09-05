import {Component, EventEmitter, Input, Output} from '@angular/core';
import {MatTreeFlatDataSource, MatTreeFlattener} from "@angular/material/tree";
import {FlatTreeControl} from "@angular/cdk/tree";
import { ARIA_LABELS } from 'common/constants'

@Component({
  selector: 'app-region-tree',
  templateUrl: './region-tree.component.html',
  styleUrls: ['./region-tree.component.css']
})
export class RegionTreeComponent {

  public ARIA_LABELS = ARIA_LABELS

  @Input() regions: any

  @Input() public inputItem: any = [{
    name : 'Untitled',
    children : [],
  }]
  @Input() public childrenExpanded: boolean = true

  public _searchString: string
  @Input()
  set searchString(ss: string) {
    this._searchString = ss
    this.filterChanged(ss)
  }
  get searchString() { return this._searchString }

  @Output() public selectRegion: EventEmitter<any> = new EventEmitter()
  @Output() public navigateToRegion: EventEmitter<any> = new EventEmitter()

  public treeControl: FlatTreeControl<any> = new FlatTreeControl<any>((e => e.level), (e => e.hasChildren))
  public dataSource: MatTreeFlatDataSource<any, any>
  public lineHeight = 42
  public selectedRegion: any = {}
  
  toggleNode(node) {
    if (this.treeControl.isExpanded(node)) {
      this.treeControl.collapseDescendants(node)
    } else {
      this.treeControl.toggle(node)
    }
  }

  filterChanged(filterText: string) {
    const filter = (array, text) => {
      const getChildren = (result, object) => {
        if (object.name.toLowerCase().includes(text.toLowerCase())) {
          result.push(object)
          return result
        }
        if (Array.isArray(object.children)) {
          const children = object.children.reduce(getChildren, [])
          if (children.length) result.push({ ...object, children })
        }
        return result
      }

      return array.reduce(getChildren, [])
    }

    const filteredItems = filterText? filter(this.inputItem, filterText) : this.inputItem

    const treeFlattener =
      new MatTreeFlattener<any, any>(
        ((node: any, level: number) => ({
          ...node,
          level,
          hasChildren: node.children.length > 0,
        })),
        (e => e.level),
        (e => e.hasChildren),
        (e => e.children),
      )
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, treeFlattener)
    this.dataSource.data = filteredItems
    this.treeControl.expandAll()
  }

  toggleSelection(event, node) {
    event.preventDefault()
    if (JSON.stringify(node) === JSON.stringify(this.selectedRegion)) {
      this.selectedRegion = {}
    } else {
      this.selectedRegion = node
    }
    this.selectRegion.emit(node)
  }

}
