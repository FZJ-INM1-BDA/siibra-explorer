import { Component, Input, Output, EventEmitter, ViewChildren, QueryList, HostBinding, ChangeDetectionStrategy, OnChanges, AfterContentChecked, ViewChild, ElementRef } from "@angular/core";
import { treeAnimations } from "./tree.animation";


@Component({
  selector : 'tree',
  templateUrl : './tree.template.html',
  styleUrls : [
    './tree.style.css'
  ],
  animations : [
    treeAnimations
  ],
  changeDetection:ChangeDetectionStrategy.OnPush
})

export class TreeComponent implements OnChanges,AfterContentChecked{
  @Input() inputItem : any = {
    name : 'Untitled',
    children : []
  }
  @Input() renderNode : (item:any)=>string = (item)=>item.name
  @Input() findChildren : (item:any)=>any[] = (item)=>item.children
  @Input() childrenExpanded : boolean = true

  @Input() searchFilter : (item:any)=>boolean | null = ()=>true

  @Output() mouseentertree : EventEmitter<any> = new EventEmitter()
  @Output() mouseleavetree : EventEmitter<any> = new EventEmitter()
  @Output() mouseclicktree : EventEmitter<any> = new EventEmitter()

  @ViewChildren(TreeComponent) treeChildren : QueryList<TreeComponent>
  @ViewChild('childrenContainer',{ read : ElementRef }) childrenContainer : ElementRef

  ngOnChanges(){
    if(typeof this.inputItem === 'string'){
      this.inputItem = JSON.parse(this.inputItem)
    }
  }

  fullHeight : number = 100

  ngAfterContentChecked(){
    this.fullHeight = this.childrenContainer ? this.childrenContainer.nativeElement.offsetHeight : 0
  }

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
    return this.searchFilter ? 
      this.searchFilter(this.inputItem) :
      false
  }
}