import { Directive, HostListener, Output, EventEmitter} from '@angular/core'

const HELP_SYMBOL = Symbol('HELP_SYMBOL')

@Directive({
  selector : '[helpdirective]'
})
export class HelpDirective{

  @Output('helpdirective')
  callhelp: EventEmitter<KeyboardEvent> = new EventEmitter()

  @HostListener('document:keydown', ['$event'])
  keydownHandler(ev:KeyboardEvent){
    
    const target = <HTMLElement> ev.target
    const tagName = target.tagName

    if (tagName === 'SELECT' || tagName === 'INPUT' || tagName === 'TEXTAREA') return
    
    if (ev.key === 'h' || ev.key === 'H' || ev.key === '?') {
      ev.stopPropagation()
      ev.preventDefault()
      /**
       * call help modal
       */
      this.callhelp.emit(ev)
    }
  }
}