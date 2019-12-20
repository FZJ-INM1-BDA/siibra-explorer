export class ToastHandler {
  public message: string = 'Toast message'
  public timeout: number = 3000
  public dismissable: boolean = true
  public show: () => void
  public hide: () => void
  public htmlMessage: string
}
