import { AfterContentChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostBinding, Input, OnChanges, OnDestroy, OnInit, Optional, Output, QueryList, ViewChild, ViewChildren } from "@angular/core";
import { Subscription } from "rxjs";
import { ParseAttributeDirective } from "../parseAttribute.directive";
import { treeAnimations } from "./tree.animation";
import { TreeService } from "./treeService.service";

@Component({
  selector : 'tree-component',
  templateUrl : './tree.template.html',
  styleUrls : [
    './tree.style.css',
  ],
  animations : [
    treeAnimations,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class TreeComponent extends ParseAttributeDirective implements OnChanges, OnInit, OnDestroy, AfterContentChecked {
  @Input() public inputItem: any = {
    name : 'Untitled',
    children : [],
  }
  @Input() public childrenExpanded: boolean = true

  @Output() public mouseentertree: EventEmitter<any> = new EventEmitter()
  @Output() public mouseleavetree: EventEmitter<any> = new EventEmitter()
  @Output() public mouseclicktree: EventEmitter<any> = new EventEmitter()

  @ViewChildren(TreeComponent) public treeChildren: QueryList<TreeComponent>
  @ViewChild('childrenContainer', { read : ElementRef }) public childrenContainer: ElementRef

  constructor(
    private cdr: ChangeDetectorRef,
    @Optional() public treeService: TreeService,
  ) {
    super()
  }

  public subscriptions: Subscription[] = []

  public ngOnInit() {
    if ( this.treeService ) {
      this.subscriptions.push(
        this.treeService.markForCheck.subscribe(() => this.cdr.markForCheck()),
      )
    }
  }

  public ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  public _fullHeight: number = 9999

  set fullHeight(num: number) {
    this._fullHeight = num
  }

  get fullHeight() {
    return this._fullHeight
  }

  public ngAfterContentChecked() {
    this.fullHeight = this.childrenContainer ? this.childrenContainer.nativeElement.offsetHeight : 0
    this.cdr.detectChanges()
  }

  public mouseenter(ev: MouseEvent) {
    this.treeService.mouseenter.next({
      inputItem : this.inputItem,
      node : this,
      event : ev,
    })
  }

  public mouseleave(ev: MouseEvent) {
    this.treeService.mouseleave.next({
      inputItem : this.inputItem,
      node : this,
      event : ev,
    })
  }

  public mouseclick(ev: MouseEvent) {
    this.treeService.mouseclick.next({
      inputItem : this.inputItem,
      node : this,
      event : ev,
    })
  }

  get chevronClass(): string {
    return this.children ?
      this.children.length > 0 ?
        this.childrenExpanded ?
          'fa-chevron-down' :
          'fa-chevron-right' :
        'fa-none' :
      'fa-none'
  }

  public handleEv(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  public toggleChildrenShow(event: Event) {
    this.childrenExpanded = !this.childrenExpanded
    event.stopPropagation()
    event.preventDefault()
  }

  get children(): any[] {
    return this.treeService ?
      this.treeService.findChildren(this.inputItem) :
      this.inputItem.children
  }

  @HostBinding('attr.filterHidden')
  get visibilityOnFilter(): boolean {
    return this.treeService ?
      this.treeService.searchFilter(this.inputItem) :
      true
  }
  public handleMouseEnter(fullObj: any) {

    this.mouseentertree.emit(fullObj)

    if (this.treeService) {
      this.treeService.mouseenter.next(fullObj)
    }
  }

  public handleMouseLeave(fullObj: any) {

    this.mouseleavetree.emit(fullObj)

    if (this.treeService) {
      this.treeService.mouseleave.next(fullObj)
    }
  }

  public handleMouseClick(fullObj: any) {

    this.mouseclicktree.emit(fullObj)

    if (this.treeService) {
      this.treeService.mouseclick.next(fullObj)
    }
  }

  public defaultSearchFilter = () => true
}
