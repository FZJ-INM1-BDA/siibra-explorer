import { EventEmitter, Component, Input, Output, ChangeDetectionStrategy, ElementRef, OnDestroy, ChangeDetectorRef, ViewChildren, QueryList, AfterViewChecked, AfterViewInit, OnInit } from "@angular/core";
import { FlattenedTreeInterface } from "./flattener.pipe";

@Component({
  selector : 'flat-tree-component',
  templateUrl : './flatTree.template.html',
  styleUrls : [
    './flatTree.style.css'
  ],
  changeDetection:ChangeDetectionStrategy.OnPush
})

export class FlatTreeComponent implements AfterViewChecked, AfterViewInit, OnInit, OnDestroy{
  @Input() inputItem : any = {
    name : 'Untitled',
    children : []
  }
  @Input() childrenExpanded : boolean = true

  @Output() treeNodeClick : EventEmitter<any> = new EventEmitter()

  /* highly non-performant. rerenders each time on mouseover or mouseout */
  // @Output() treeNodeEnter : EventEmitter<any> = new EventEmitter()
  // @Output() treeNodeLeave : EventEmitter<any> = new EventEmitter()

  @Input() renderNode : (item:any)=>string = (item)=>item.name
  @Input() findChildren : (item:any)=>any[] = (item)=>item.children ? item.children : [] 
  @Input() searchFilter : (item:any)=>boolean | null = ()=>true

  @Input() flatTreeViewPort : HTMLElement

  @ViewChildren('flatTreeStart',{read : ElementRef}) flatTreeStartCollection : QueryList<ElementRef>
  @ViewChildren('flatTreeEnd',{read : ElementRef}) flatTreeEndCollection : QueryList<ElementRef>

  intersectionObserver : IntersectionObserver

  constructor(
    private cdr:ChangeDetectorRef
  ){

  }

  ngAfterViewChecked(){
    if(this.intersectionObserver){
      this.intersectionObserver.disconnect()
      this.flatTreeStartCollection.forEach(er => this.intersectionObserver.observe(er.nativeElement))
      this.flatTreeEndCollection.forEach(er => this.intersectionObserver.observe(er.nativeElement))
    }
  }

  ngOnInit(){
    if(this.flatTreeViewPort){
      this.clusterNumber = 50
    }
  }

  ngAfterViewInit(){

    if(this.flatTreeViewPort){
      this.intersectionObserver = new IntersectionObserver(entries => {
        const currPos = entries
          .filter(entry => entry.isIntersecting)
          .filter(entry => Number(entry.target.getAttribute('clusterindex')) !== NaN )
          .map(entry => Number(entry.target.getAttribute('clusterindex')))
          .reduce((acc, clusterindex, i, array) => acc + (clusterindex / array.length), 0)
        
        if( currPos - this._currentPos >= 1 ){
          this._currentPos = Math.round(currPos)
          this.cdr.markForCheck()
        }
      },{
        root: this.flatTreeViewPort,
        rootMargin : '0px',
        threshold : 0.1
      })
    }
  }

  ngOnDestroy(){
    if(this.intersectionObserver){
      this.intersectionObserver.disconnect()
    }
  }

  getClass(level:number){
    return [...Array(level+1)].map((v,idx) => `render-node-level-${idx}`).join(' ')
  }

  collapsedLevels: Set<string> = new Set()
  uncollapsedLevels : Set<string> = new Set()

  toggleCollapse(flattenedItem:FlattenedTreeInterface){
    this.isCollapsed(flattenedItem)
      ? (this.collapsedLevels.delete(flattenedItem.lvlId), this.uncollapsedLevels.add(flattenedItem.lvlId))
      : (this.collapsedLevels.add(flattenedItem.lvlId), this.uncollapsedLevels.delete(flattenedItem.lvlId))
  }

  isCollapsed(flattenedItem:FlattenedTreeInterface):boolean{
    return this.isCollapsedById(flattenedItem.lvlId)
  }

  isCollapsedById(id:string):boolean{
    return this.collapsedLevels.has(id) 
      ? true
      : this.uncollapsedLevels.has(id)
        ? false
        : !this.childrenExpanded
  }

  collapseRow(flattenedItem:FlattenedTreeInterface):boolean{
    return flattenedItem.lvlId.split('_')
      .filter((v,idx,arr) => idx < arr.length -1 )
      .reduce((acc,curr) => acc
        .concat(acc.length === 0 
          ? curr 
          : acc[acc.length -1].concat(`_${curr}`)), [])
      .some(id => this.isCollapsedById(id))
  }

  private _currentPos : number = 0
  public clusterNumber : number = Number.POSITIVE_INFINITY

  showCluster(index:number){
    return index <= this._currentPos + 1
  }
}