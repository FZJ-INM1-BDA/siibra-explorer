import { Component, Input, EventEmitter, Output } from "@angular/core";
import { mainSideAnimation } from "./mainside.animation";

@Component({
  selector : 'layout-mainside',
  templateUrl : './mainside.template.html',
  styleUrls : [
    './mainside.style.css'
  ],
  animations : [
    mainSideAnimation
  ]
})

export class LayoutMainSide{
  @Input() showResizeSliver : boolean = true
  @Input() overlay : boolean = false
  @Input() showSide : boolean = false
  @Input() sideWidth : number = 300

  @Output() panelShowStateChanged : EventEmitter<boolean> = new EventEmitter()
  @Output() panelAnimationFlag : EventEmitter<boolean> = new EventEmitter()

  togglePanelShow(){
    this.showSide = !this.showSide
    this.panelShowStateChanged.emit(this.showSide)
  }

  animationStart(){
    this.panelAnimationFlag.emit(true)
  }

  animationEnd(){
    this.panelAnimationFlag.emit(false)
  }
}