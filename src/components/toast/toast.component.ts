import { Component, Input, ViewContainerRef, ViewChild } from "@angular/core";


@Component({
  selector : 'toast',
  templateUrl : './toast.template.html',
  styleUrls : ['./toast.style.css']
})

export class ToastComponent{
  @Input() message : string = 'template'
  @Input() timeout : number = 0
  @Input() dismissable : boolean = true

  @ViewChild('message',{read:ViewContainerRef}) messageContainer : ViewContainerRef
  constructor(){

  }

  dismiss(event:MouseEvent){
    event.preventDefault()
    event.stopPropagation()
    
    console.warn('dismiss')

  }
}