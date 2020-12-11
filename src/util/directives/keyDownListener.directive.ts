import { Directive, ElementRef, EventEmitter, Inject, Input, OnChanges, OnDestroy, Output } from "@angular/core";
import { DOCUMENT } from '@angular/common'
import { fromEvent, merge, Subscription } from "rxjs";

@Directive({
  selector: '[iav-key-listener]',
})

export class KeyListner implements OnChanges, OnDestroy{

  @Input('iav-key-listener')
  public keydownConfig: KeyListenerConfig[] = []

  private isTextField(ev: KeyboardEvent): boolean {

    const target = ev.target as HTMLElement
    const tagName = target.tagName

    return (tagName === 'SELECT' || tagName === 'INPUT' || tagName === 'TEXTAREA')
  }

  private subs: Subscription[] = []

  ngOnChanges(){
    if (this.keydownConfig) {
      this.ngOnDestroy()

      const documentEv = this.keydownConfig.filter(c => c.target === 'document')
      const documentCaptureEv = documentEv.filter(c => c.capture)
      const documentBubbleEv = documentEv.filter(c => !c.capture)

      const selfEv = this.keydownConfig.filter(c => c.target !== 'document')
      const selfCaptureEv = selfEv.filter(c => c.capture)
      const selfBubbleEv = selfEv.filter(c => !c.capture)

      this.subs.push(
        merge(
          fromEvent(this.document, 'keydown', { capture: true }),
          fromEvent(this.document, 'keyup', { capture: true })
        ).subscribe(this.getEvHandler(documentCaptureEv).bind(this)),

        merge(
          fromEvent(this.document, 'keydown'),
          fromEvent(this.document, 'keyup')
        ).subscribe(this.getEvHandler(documentBubbleEv).bind(this)),

        merge(
          fromEvent(this.el.nativeElement, 'keydown', { capture: true }),
          fromEvent(this.el.nativeElement, 'keyup', { capture: true })
        ).subscribe(this.getEvHandler(selfCaptureEv).bind(this)),

        merge(
          fromEvent(this.el.nativeElement, 'keydown'),
          fromEvent(this.el.nativeElement, 'keyup')
        ).subscribe(this.getEvHandler(selfBubbleEv).bind(this)),
      )
    }
  }

  ngOnDestroy(){
    while(this.subs.length > 0) this.subs.pop().unsubscribe()
  }

  constructor(
    private el: ElementRef,
    @Inject(DOCUMENT) private document
  ){

  }

  private getEvHandler(cfgs: KeyListenerConfig[]){
    return (ev: KeyboardEvent) => {
      if (this.isTextField(ev)) return
      const filteredCfgs = cfgs.filter(c => c.key === ev.key && c.type === ev.type)
      for (const cfg of filteredCfgs) {
        if (cfg.stop) ev.stopPropagation()
      }
      this.emitEv(filteredCfgs.map(cfg => ({
        config: cfg,
        ev
      })))
    }
  }

  private emitEv(items: Array<{config: KeyListenerConfig, ev: KeyboardEvent}>) {
    for (const item of items) {
      const { config, ev } = item as {config: KeyListenerConfig, ev: KeyboardEvent}
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
  capture?: boolean
  stop: boolean
  // fromEvent seems to be a passive listener, wheather or not { passive: false } flag is set or not
  // so preventDefault cannot be called anyway
}
