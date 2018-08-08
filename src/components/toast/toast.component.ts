import { Component, Input, ViewContainerRef, ViewChild, Output, EventEmitter } from "@angular/core";


@Component({
  selector : 'toast',
  templateUrl : './toast.template.html',
  styleUrls : ['./toast.style.css']
})

export class ToastComponent{
  @Input() message : string 
  @Input() timeout : number = 0
  @Input() dismissable : boolean = true

  @Output() dismissed : EventEmitter<boolean> = new EventEmitter()

  private timeoutId : number

  @ViewChild('messageContainer',{read:ViewContainerRef}) messageContainer : ViewContainerRef
  constructor(){
    
  }
  
  
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