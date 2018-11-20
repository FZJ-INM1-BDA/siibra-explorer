import { Component, Input, ViewContainerRef, ViewChild, Output, EventEmitter, HostBinding, ElementRef, ChangeDetectionStrategy, OnInit } from "@angular/core";
import { toastAnimation } from "./toast.animation";

@Component({
  selector : 'toast',
  templateUrl : './toast.template.html',
  styleUrls : ['./toast.style.css'],
  animations : [
    toastAnimation
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ToastComponent implements OnInit{
  @Input() message : string 
  @Input() timeout : number = 0
  @Input() dismissable : boolean = true

  @Output() dismissed : EventEmitter<boolean> = new EventEmitter()

  private timeoutId : any

  @HostBinding('@exists')
  exists : boolean = true

  @ViewChild('messageContainer',{read:ViewContainerRef}) messageContainer : ViewContainerRef
  
  ngOnInit(){
    if(this.timeout > 0) this.timeoutId = setTimeout(() => this.dismissed.emit(false), this.timeout)
  }

  dismiss(event:MouseEvent){
    event.preventDefault()
    event.stopPropagation()

    if(this.timeoutId) clearTimeout(this.timeoutId)

    this.dismissed.emit(true)
  }
}