export class ToastHandler {
  public message = 'Toast message'
  public timeout = 3000
  public dismissable = true
  public show: () => void
  public hide: () => void
  public htmlMessage: string
}
