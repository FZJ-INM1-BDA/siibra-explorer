import { Directive, Input, TemplateRef, HostListener } from "@angular/core";
import { ToastService } from "../../services/toastService.service";

@Directive({
  selector: '[showToast]'
})

export class ShowToastDirective{
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

  @HostListener('click', ['$event.target'])
  click(ev:MouseEvent){
    
    this.toastService.showToast(this.showToast, {
      dismissable: true,
      timeout: this.toastLength
    })
  }

  constructor(private toastService:ToastService){
  }
}