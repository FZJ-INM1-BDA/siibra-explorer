export class ToastHandler{
  message : string = 'Toast message'
  timeout : number = 3000
  dismissable : boolean = true
  show : () => void
  hide : () => void
  htmlMessage: string
}