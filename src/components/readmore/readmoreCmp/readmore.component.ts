import { AfterContentChecked, Component, ElementRef, Input, OnChanges, ViewChild } from "@angular/core";
import { readmoreAnimations } from "./readmore.animations";

@Component({
  selector : 'readmore-component',
  templateUrl : './readmore.template.html',
  styleUrls : [
    './readmore.style.css',
  ],
  animations : [ readmoreAnimations ],
})

export class ReadmoreComponent implements OnChanges, AfterContentChecked {
  @Input() public collapsedHeight: number = 45
  @Input() public show: boolean = false
  @Input() public animationLength: number = 180
  @ViewChild('contentContainer', { read: ElementRef, static: true }) public contentContainer: ElementRef

  public fullHeight: number = 200

  public ngAfterContentChecked() {
    this.fullHeight = this.contentContainer.nativeElement.offsetHeight
  }

  public ngOnChanges() {
    this.fullHeight = this.contentContainer.nativeElement.offsetHeight
  }

  public toggle(event: MouseEvent) {

    this.show = !this.show
    event.stopPropagation()
    event.preventDefault()
  }
}
