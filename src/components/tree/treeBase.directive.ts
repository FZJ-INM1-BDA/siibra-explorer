import { ChangeDetectorRef, Directive, EventEmitter, Input, OnChanges, OnDestroy, Output } from "@angular/core";
import { Subscription } from "rxjs";
import { TreeService } from "./treeService.service";

@Directive({
  selector : '[treebase]',
  host : {
    style : `

    `,
  },
  providers : [
    TreeService,
  ],
})

export class TreeBaseDirective implements OnDestroy, OnChanges {
  @Output() public treeNodeClick: EventEmitter<any> = new EventEmitter()
  @Output() public treeNodeEnter: EventEmitter<any> = new EventEmitter()
  @Output() public treeNodeLeave: EventEmitter<any> = new EventEmitter()

  @Input() public renderNode: (item: any) => string = (item) => item.name
  @Input() public findChildren: (item: any) => any[] = (item) => item.children
  @Input() public searchFilter: (item: any) => boolean | null = () => true

  private subscriptions: Subscription[] = []

  constructor(
    public changeDetectorRef: ChangeDetectorRef,
    public treeService: TreeService,
  ) {
    this.subscriptions.push(
      this.treeService.mouseclick.subscribe((obj) => this.treeNodeClick.emit(obj)),
    )
    this.subscriptions.push(
      this.treeService.mouseenter.subscribe((obj) => this.treeNodeEnter.emit(obj)),
    )
    this.subscriptions.push(
      this.treeService.mouseleave.subscribe((obj) => this.treeNodeLeave.emit(obj)),
    )
  }

  public ngOnChanges() {
    this.treeService.findChildren = this.findChildren
    this.treeService.renderNode = this.renderNode
    this.treeService.searchFilter = this.searchFilter

    this.treeService.markForCheck.next(true)
  }

  public ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe())
  }
}
