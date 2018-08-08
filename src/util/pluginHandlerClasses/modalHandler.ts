export class ModalHandler{

  hide : () => void
  show : () => void
  // onHide : (callback: () => void) => void
  // onHidden : (callback : () => void) => void
  // onShow : (callback : () => void) => void
  // onShown : (callback : () => void) => void
  title : string
  body : string
  footer : String
  
  dismissable: boolean = true
}