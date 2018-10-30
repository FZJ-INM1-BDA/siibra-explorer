import { Directive, Output, EventEmitter, OnDestroy, Input, OnChanges, ChangeDetectorRef } from "@angular/core";
import { TreeService } from "./treeService.service";
import { Subscription } from "rxjs";

@Directive({
  selector : '[treebase]',
  host :{
    'style' : `

    `
  },
  providers : [
    TreeService
  ]
})

export class TreeBaseDirective implements OnDestroy, OnChanges{
  @Output() treeNodeClick : EventEmitter<any> = new EventEmitter()
  @Output() treeNodeEnter : EventEmitter<any> = new EventEmitter()
  @Output() treeNodeLeave : EventEmitter<any> = new EventEmitter()

  @Input() renderNode : (item:any)=>string = (item)=>item.name
  @Input() findChildren : (item:any)=>any[] = (item)=>item.children
  @Input() searchFilter : (item:any)=>boolean | null = ()=>true

  private subscriptions : Subscription[] = []

  constructor(
    public changeDetectorRef : ChangeDetectorRef,
    public treeService : TreeService
  ){
    this.subscriptions.push(
      this.treeService.mouseclick.subscribe((obj)=>this.treeNodeClick.emit(obj))
    )
    this.subscriptions.push(
      this.treeService.mouseenter.subscribe((obj)=>this.treeNodeEnter.emit(obj))
    )
    this.subscriptions.push(
      this.treeService.mouseleave.subscribe((obj)=>this.treeNodeLeave.emit(obj))
    )
  }

  ngOnChanges(){
    this.treeService.findChildren = this.findChildren
    this.treeService.renderNode = this.renderNode
    this.treeService.searchFilter = this.searchFilter

    this.treeService.markForCheck.next(true)
  }

  ngOnDestroy(){
    this.subscriptions.forEach(s=>s.unsubscribe())
  }
}