import { TemplateRef } from "@angular/core";

export class ToastHandler{
  message : string | TemplateRef<any> = 'handler.body'
  timeout : number = 3000
  dismissable : boolean = true
  show : () => void
  hide : () => void
  htmlMessage: string
}