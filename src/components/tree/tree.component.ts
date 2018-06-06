import { Component, Input, Output, EventEmitter } from "@angular/core";


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

  @Input() searchFilter : (item:any)=>boolean | null

  @Output() mouseentertree : EventEmitter<any> = new EventEmitter()
  @Output() mouseleavetree : EventEmitter<any> = new EventEmitter()
  @Output() mouseclicktree : EventEmitter<any> = new EventEmitter()

  public childrenExpanded : boolean = true

  get chevronClass():string{
    return this.findChildren(this.inputItem).length > 0 ?
      this.childrenExpanded ? 
        'glyphicon-chevron-down' :
        'glyphicon-chevron-right' :
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
}