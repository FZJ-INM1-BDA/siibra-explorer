import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MatTreeFlatDataSource, MatTreeFlattener} from "@angular/material/tree";
import {FlatTreeControl} from "@angular/cdk/tree";
import { ARIA_LABELS } from 'common/constants'

@Component({
  selector: 'iav-mat-region-tree',
  templateUrl: './searchable-tree.component.html',
  styleUrls: ['./searchable-tree.component.css']
})
export class SearchableTreeComponent {

  public ARIA_LABELS = ARIA_LABELS

  @Input() public inputItem: any = [{
    name : 'Untitled',
    children : [],
  }]
  @Input() public childrenExpanded: boolean = true
  @Input() selectedRegion: any = {}

  private _searchString: string
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
  public lineHeight = 20



  private treeFlattener =
    new MatTreeFlattener<any, any>(
      ((node: any, level: number) => ({
        ...node,
        level,
        hasChildren: node.children?.length > 0,
      })),
      (e => e.level),
      (e => e.hasChildren),
      (e => e.children),
    )



  toggleNodeExpansion(node) {
    if (this.treeControl.isExpanded(node)) {
      this.treeControl.collapseDescendants(node)
    } else {
      this.treeControl.toggle(node)
    }
  }

  filterChanged(filterText: string) {
    const filteredItems = filterText? this.filter(this.inputItem, filterText) : this.inputItem
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener)
    this.dataSource.data = filteredItems

    this.addmissBorderPaintingLevels()

    this.treeControl.expandAll()
  }



  private filter = (array, text): MatTreeFlattener<any, any> => {
    const getChildren = (result, object) => {
      const nameString = object.name.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, '')
      const textString = text.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, '')

      const nameArray = nameString.split(' ')
      const textArray = textString.split(' ')

      if (textArray.every(t => nameArray.find(n => n.includes(t)))) {
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

  private addmissBorderPaintingLevels() {
    for (let i = 0; i < this.treeControl.dataNodes.length; i++) {

      const node = this.treeControl.dataNodes[i]


      const nextItemIndex = this.treeControl.dataNodes.findIndex((dn, dnIndex) => {
        return dnIndex > i
          && dn.level <= node.level
      })

      // Add property for hiding dashes
      if (nextItemIndex>0 && this.treeControl.dataNodes[nextItemIndex].level < node.level) {
        for (let j = i+1; j < nextItemIndex; j++) {
          if (this.treeControl.dataNodes[j].children) {
            this.treeControl.dataNodes[j] = {
              ...this.treeControl.dataNodes[j],
              missBorderPaintingLevels: this.treeControl.dataNodes[j].missBorderPaintingLevels ? [
                ...this.treeControl.dataNodes[j].missBorderPaintingLevels,
                node.level
              ] : [node.level]
            }
          }
        }
      }
      const nodeIsLast = this.treeControl.dataNodes
        .findIndex((dn, dnIndex) => dnIndex > i && dn.level === node.level) < 0
      if (nodeIsLast) {
        for (let j = i+1; j < this.treeControl.dataNodes.length; j++) {
          this.treeControl.dataNodes[j] = {
            ...this.treeControl.dataNodes[j],
            missBorderPaintingLevels: this.treeControl.dataNodes[j].missBorderPaintingLevels ? [
              ...this.treeControl.dataNodes[j].missBorderPaintingLevels,
              node.level
            ] : [node.level]
          }
        }
      }
    }
  }

  toggleSelection(event, node) {
    this.selectRegion.emit(node)
  }

}
