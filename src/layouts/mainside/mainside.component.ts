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
  @Input() showSide : boolean = false
  @Input() sideWidth : number = 300
  @Input() animationFlag : boolean = false

  @Output() panelShowStateChanged : EventEmitter<boolean> = new EventEmitter()
  @Output() panelAnimationStart : EventEmitter<boolean> = new EventEmitter()
  @Output() panelAnimationEnd : EventEmitter<boolean> = new EventEmitter()

  togglePanelShow(){
    this.showSide = !this.showSide
    this.panelShowStateChanged.emit(this.showSide)
  }

  animationStart(){
    this.panelAnimationStart.emit(true)
  }

  animationEnd(){
    this.panelAnimationEnd.emit(true)
  }
}