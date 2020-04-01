import { Component, EventEmitter, Input, Output } from "@angular/core";
import { mainSideAnimation } from "./mainside.animation";

@Component({
  selector : 'layout-mainside',
  templateUrl : './mainside.template.html',
  styleUrls : [
    './mainside.style.css',
  ],
  animations : [
    mainSideAnimation,
  ],
})

export class LayoutMainSide {
  @Input() public showResizeSliver: boolean = true
  @Input() public showSide: boolean = false
  @Input() public sideWidth: number = 300
  @Input() public animationFlag: boolean = false

  @Output() public panelShowStateChanged: EventEmitter<boolean> = new EventEmitter()
  @Output() public panelAnimationStart: EventEmitter<boolean> = new EventEmitter()
  @Output() public panelAnimationEnd: EventEmitter<boolean> = new EventEmitter()

  public togglePanelShow() {
    this.showSide = !this.showSide
    this.panelShowStateChanged.emit(this.showSide)
  }

  public animationStart() {
    this.panelAnimationStart.emit(true)
  }

  public animationEnd() {
    this.panelAnimationEnd.emit(true)
  }
}
