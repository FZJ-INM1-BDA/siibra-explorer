export class ToastHandler{
  message : string = 'handler.body'
  timeout : number = 3000
  dismissable : boolean = true
  show : () => void
  hide : () => void
}