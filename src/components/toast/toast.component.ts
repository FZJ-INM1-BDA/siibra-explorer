import { Component, Input, ViewContainerRef, ViewChild, Output, EventEmitter, HostBinding, ElementRef, ChangeDetectionStrategy, OnInit, HostListener, NgZone } from "@angular/core";
import { toastAnimation } from "./toast.animation";

@Component({
  selector : 'toast',
  templateUrl : './toast.template.html',
  styleUrls : ['./toast.style.css'],
  animations : [
    toastAnimation
  ]
})

export class ToastComponent{
  @Input() message : string 
  @Input() timeout : number = 0
  @Input() dismissable : boolean = true

  @Output() dismissed : EventEmitter<boolean> = new EventEmitter()

  public progress: number = 0

  @HostBinding('@exists')
  exists : boolean = true

  @ViewChild('messageContainer',{read:ViewContainerRef}) messageContainer : ViewContainerRef

  dismiss(event:MouseEvent){
    event.preventDefault()
    event.stopPropagation()

    this.dismissed.emit(true)
  }
}