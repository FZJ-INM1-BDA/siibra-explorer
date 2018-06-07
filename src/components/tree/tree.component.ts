import { Component, Input, Output, EventEmitter, ViewChildren, QueryList, HostBinding } from "@angular/core";


@Component({
  selector : 'tree',
  templateUrl : './tree.template.html',
  styleUrls : [
    './tree.style.css'
  ]
})

export class TreeComponent{
  @Input() inputItem : any = {
    name : 'Untitled',
    children : []
  }
  @Input() renderNode : (item:any)=>string = (item)=>item.name
  @Input() findChildren : (item:any)=>any[] = (item)=>item.children
  @Input() childrenExpanded : boolean = true

  @Input() searchFilter : (item:any)=>boolean | null = null

  @Output() mouseentertree : EventEmitter<any> = new EventEmitter()
  @Output() mouseleavetree : EventEmitter<any> = new EventEmitter()
  @Output() mouseclicktree : EventEmitter<any> = new EventEmitter()

  @ViewChildren(TreeComponent) treeChildren : QueryList<TreeComponent>

  get chevronClass():string{
    return this.children ? 
      this.children.length > 0 ?
        this.childrenExpanded ? 
          'glyphicon-chevron-down' :
          'glyphicon-chevron-right' :
        'glyphicon-none' :
      'glyphicon-none'
  }

  public handleEv(event:Event){
    event.preventDefault();
    event.stopPropagation();
  }

  public toggleChildrenShow(event:Event){
    this.childrenExpanded = !this.childrenExpanded
    event.stopPropagation()
    event.preventDefault()
  }

  get children():any[]{
    return this.findChildren(this.inputItem)
  }

  @HostBinding('attr.filterHidden')
  get visibilityOnFilter():boolean{
    return (this.searchFilter ? 
      this.searchFilter(this.inputItem) || (this.treeChildren.some(tree=>tree.visibilityOnFilter) ) :
      true)
  }
}