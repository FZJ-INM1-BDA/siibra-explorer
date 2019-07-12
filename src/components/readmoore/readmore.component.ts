import { Component, Input, OnChanges, ViewChild, ElementRef, AfterContentChecked } from "@angular/core";
import { readmoreAnimations } from "./readmore.animations";

@Component({
  selector : 'readmore-component',
  templateUrl : './readmore.template.html',
  styleUrls : [
    './readmore.style.css'
  ],
  animations : [ readmoreAnimations ]
})

export class ReadmoreComponent implements OnChanges, AfterContentChecked{
  @Input() collapsedHeight : number = 45
  @Input() show : boolean = false
  @Input() animationLength: number = 180
  // @ts-ignore
  @ViewChild('contentContainer') contentContainer : ElementRef
  
  public fullHeight : number = 200

  ngAfterContentChecked(){
    this.fullHeight = this.contentContainer.nativeElement.offsetHeight
  }

  ngOnChanges(){
    this.fullHeight = this.contentContainer.nativeElement.offsetHeight
  }

  public toggle(event:MouseEvent){
    
    this.show = !this.show
    event.stopPropagation()
    event.preventDefault()
  }
}