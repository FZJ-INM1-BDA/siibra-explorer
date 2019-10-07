import { Directive, Input, HostListener, Output, EventEmitter } from "@angular/core";

const getFilterFn = (ev: KeyboardEvent, isDocument: boolean) => ({ type, key, target }: KeyListenerConfig): boolean => type === ev.type && ev.key === key && (target === 'document') === isDocument

@Directive({
  selector: '[iav-key-listener]'
})

export class KeyListner{

  @Input('iav-key-listener')
  keydownConfig: KeyListenerConfig[] = []

  private isTextField(ev: KeyboardEvent):boolean{

    const target = <HTMLElement> ev.target
    const tagName = target.tagName

    return (tagName === 'SELECT' || tagName === 'INPUT' || tagName === 'TEXTAREA') 
  }

  @HostListener('keydown', ['$event'])
  keydown(ev: KeyboardEvent){
    this.handleSelfListener(ev)
  }

  @HostListener('document:keydown', ['$event'])
  documentKeydown(ev: KeyboardEvent){
    this.handleDocumentListener(ev)
  }

  @HostListener('keyup', ['$event'])
  keyup(ev: KeyboardEvent){
    this.handleSelfListener(ev)
  }

  @HostListener('document:keyup', ['$event'])
  documentKeyup(ev: KeyboardEvent){
    this.handleDocumentListener(ev)
  }

  private handleSelfListener(ev: KeyboardEvent) {
    if (!this.keydownConfig) return
    if (this.isTextField(ev)) return

    const filteredConfig = this.keydownConfig
      .filter(getFilterFn(ev, false))
      .map(config => {
        return {
          config,
          ev
        }
      })
    this.emitEv(filteredConfig)
  }

  private handleDocumentListener(ev:KeyboardEvent) {
    if (!this.keydownConfig) return
    if (this.isTextField(ev)) return

    const filteredConfig = this.keydownConfig
      .filter(getFilterFn(ev, true))
      .map(config => {
        return {
          config,
          ev
        }
      })
    this.emitEv(filteredConfig)
  }

  private emitEv(items: {config:KeyListenerConfig, ev: KeyboardEvent}[]){
    for (const item of items){
      const { config, ev } = item as {config:KeyListenerConfig, ev: KeyboardEvent}

      const { stop, prevent } = config
      if (stop) ev.stopPropagation()
      if (prevent) ev.preventDefault()

      this.keyEvent.emit({
        config, ev
      })
    }
  }

  @Output('iav-key-event') keyEvent = new EventEmitter<{ config: KeyListenerConfig, ev: KeyboardEvent }>()

}

export interface KeyListenerConfig{
  type: 'keydown' | 'keyup'
  key: string
  target?: 'document'
  stop: boolean
  prevent: boolean
}
