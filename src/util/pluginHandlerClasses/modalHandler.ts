export class ModalHandler {

  public hide: () => void
  public show: () => void
  // onHide : (callback: () => void) => void
  // onHidden : (callback : () => void) => void
  // onShow : (callback : () => void) => void
  // onShown : (callback : () => void) => void
  public title: string
  public body: string
  public footer: string

  public dismissable: boolean = true
}
