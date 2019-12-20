import { Directive, EventEmitter, HostListener, Input, Output } from "@angular/core";

const getFilterFn = (ev: KeyboardEvent, isDocument: boolean) => ({ type, key, target }: KeyListenerConfig): boolean => type === ev.type && ev.key === key && (target === 'document') === isDocument

@Directive({
  selector: '[iav-key-listener]',
})

export class KeyListner {

  @Input('iav-key-listener')
  public keydownConfig: KeyListenerConfig[] = []

  private isTextField(ev: KeyboardEvent): boolean {

    const target = ev.target as HTMLElement
    const tagName = target.tagName

    return (tagName === 'SELECT' || tagName === 'INPUT' || tagName === 'TEXTAREA')
  }

  @HostListener('keydown', ['$event'])
  public keydown(ev: KeyboardEvent) {
    this.handleSelfListener(ev)
  }

  @HostListener('document:keydown', ['$event'])
  public documentKeydown(ev: KeyboardEvent) {
    this.handleDocumentListener(ev)
  }

  @HostListener('keyup', ['$event'])
  public keyup(ev: KeyboardEvent) {
    this.handleSelfListener(ev)
  }

  @HostListener('document:keyup', ['$event'])
  public documentKeyup(ev: KeyboardEvent) {
    this.handleDocumentListener(ev)
  }

  private handleSelfListener(ev: KeyboardEvent) {
    if (!this.keydownConfig) { return }
    if (this.isTextField(ev)) { return }

    const filteredConfig = this.keydownConfig
      .filter(getFilterFn(ev, false))
      .map(config => {
        return {
          config,
          ev,
        }
      })
    this.emitEv(filteredConfig)
  }

  private handleDocumentListener(ev: KeyboardEvent) {
    if (!this.keydownConfig) { return }
    if (this.isTextField(ev)) { return }

    const filteredConfig = this.keydownConfig
      .filter(getFilterFn(ev, true))
      .map(config => {
        return {
          config,
          ev,
        }
      })
    this.emitEv(filteredConfig)
  }

  private emitEv(items: Array<{config: KeyListenerConfig, ev: KeyboardEvent}>) {
    for (const item of items) {
      const { config, ev } = item as {config: KeyListenerConfig, ev: KeyboardEvent}

      const { stop, prevent } = config
      if (stop) { ev.stopPropagation() }
      if (prevent) { ev.preventDefault() }

      this.keyEvent.emit({
        config, ev,
      })
    }
  }

  @Output('iav-key-event') public keyEvent = new EventEmitter<{ config: KeyListenerConfig, ev: KeyboardEvent }>()

}

export interface KeyListenerConfig {
  type: 'keydown' | 'keyup'
  key: string
  target?: 'document'
  stop: boolean
  prevent: boolean
}
