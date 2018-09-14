import { Component, Input, Output, EventEmitter, ViewChildren, QueryList, HostBinding, ChangeDetectionStrategy, OnChanges, AfterContentChecked, ViewChild, ElementRef, Optional, OnInit, ChangeDetectorRef, OnDestroy } from "@angular/core";
import { treeAnimations } from "./tree.animation";
import { TreeService } from "./treeService.service";
import { Subscription } from "rxjs";
import { ParseAttributeDirective } from "../parseAttribute.directive";


@Component({
  selector : 'tree-component',
  templateUrl : './tree.template.html',
  styleUrls : [
    './tree.style.css'
  ],
  animations : [
    treeAnimations
  ],
  changeDetection:ChangeDetectionStrategy.OnPush
})

export class TreeComponent extends ParseAttributeDirective implements OnChanges,OnInit,OnDestroy,AfterContentChecked{
  @Input() inputItem : any = {
    name : 'Untitled',
    children : []
  }
  @Input() childrenExpanded : boolean = true

  @Output() mouseentertree : EventEmitter<any> = new EventEmitter()
  @Output() mouseleavetree : EventEmitter<any> = new EventEmitter()
  @Output() mouseclicktree : EventEmitter<any> = new EventEmitter()

  @ViewChildren(TreeComponent) treeChildren : QueryList<TreeComponent>
  @ViewChild('childrenContainer',{ read : ElementRef }) childrenContainer : ElementRef

  constructor( 
    private cdr : ChangeDetectorRef,
    @Optional() public treeService : TreeService 
  ){
    super()
  }
  
  subscriptions : Subscription[] = []

  ngOnInit(){
    if( this.treeService ){
      this.subscriptions.push(
        this.treeService.markForCheck.subscribe(()=>this.cdr.markForCheck())
      )
    }
  }


  ngOnDestroy(){
    this.subscriptions.forEach(s=>s.unsubscribe())
  }

  _fullHeight : number = 9999

  set fullHeight(num:number){
    this._fullHeight = num
  }

  get fullHeight(){
    return this._fullHeight
  }

  ngAfterContentChecked(){
    this.fullHeight = this.childrenContainer ? this.childrenContainer.nativeElement.offsetHeight : 0
    this.cdr.detectChanges()
  }

  mouseenter(ev:MouseEvent){
    this.treeService.mouseenter.next({
      inputItem : this.inputItem,
      node : this,
      event : ev
    })
  }

  mouseleave(ev:MouseEvent){
    this.treeService.mouseleave.next({
      inputItem : this.inputItem,
      node : this,
      event : ev
    })
  }

  mouseclick(ev:MouseEvent){
    this.treeService.mouseclick.next({
      inputItem : this.inputItem,
      node : this,
      event : ev
    })
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
    return this.treeService ? 
      this.treeService.findChildren(this.inputItem) :
      this.inputItem.children
  }

  @HostBinding('attr.filterHidden')
  get visibilityOnFilter():boolean{
    return this.treeService ?
      this.treeService.searchFilter(this.inputItem) :
      true
  }
  handleMouseEnter(fullObj:any){

    this.mouseentertree.emit(fullObj)

    if(this.treeService){
      this.treeService.mouseenter.next(fullObj)
    }
  }

  handleMouseLeave(fullObj:any){
    
    this.mouseleavetree.emit(fullObj)

    if(this.treeService){
      this.treeService.mouseleave.next(fullObj)
    }
  }

  handleMouseClick(fullObj:any){

    this.mouseclicktree.emit(fullObj)

    if(this.treeService){
      this.treeService.mouseclick.next(fullObj)
    }
  }

  public defaultSearchFilter = ()=>true
}