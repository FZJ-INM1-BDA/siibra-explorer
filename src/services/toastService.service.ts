import { Injectable } from "@angular/core";

@Injectable({
  providedIn : 'root'
})
export class ToastService{
  showToast: (message: string, config?: Partial<ToastConfig>)=>()=>void
}

export interface ToastConfig{
  dismissable: boolean
  timeout: number
}

export const defaultToastConfig : ToastConfig = {
  dismissable: true,
  timeout : 2000
}