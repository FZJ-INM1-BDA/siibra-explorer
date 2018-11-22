import { Directive, Input, TemplateRef, HostListener, OnDestroy } from "@angular/core";
import { ToastService } from "../../services/toastService.service";

@Directive({
  selector: '[showToast]'
})

export class ShowToastDirective implements OnDestroy{
  @Input()
  showToast : string | TemplateRef<any> = null

  private _toastLength: number = 1000

  @Input()
  set toastLength(input:any){
    if(typeof input === 'number'){
      this._toastLength = input
      return
    }
      
    const parsedNumber = Number(input)
    if(!Number.isNaN(parsedNumber)){
      this._toastLength = parsedNumber
    }
  }

  get toastLength(){
    return this._toastLength
  }

  private dismissHandler : () => void

  @HostListener('click', ['$event.target'])
  click(ev:MouseEvent){
    if(this.dismissHandler) this.dismissHandler()
    this.dismissHandler = this.toastService.showToast(this.showToast, {
      dismissable: true,
      timeout: this.toastLength
    })
  }

  constructor(private toastService:ToastService){
  }

  ngOnDestroy(){
    if(this.dismissHandler) this.dismissHandler()
  }
}