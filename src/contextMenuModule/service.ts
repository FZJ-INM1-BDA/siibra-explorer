import { Overlay, OverlayRef } from "@angular/cdk/overlay"
import { TemplatePortal } from "@angular/cdk/portal"
import { Injectable, TemplateRef, ViewContainerRef } from "@angular/core"
import { ReplaySubject, Subject, Subscription } from "rxjs"
import { RegDeregController } from "src/util/regDereg.base"

type TTmplRef = {
  tmpl: TemplateRef<any>,
  data: any,
}

@Injectable({
  providedIn: 'root'
})
export class ContextMenuService extends RegDeregController<unknown, { tmpl: TemplateRef<any>, data: any}>{
  
  public vcr: ViewContainerRef
  private overlayRef: OverlayRef

  private subs: Subscription[] = []
  
  public context$ = new Subject()
  public context: any

  public tmplRefs$ = new ReplaySubject<TTmplRef[]>(1)
  public tmplRefs: TTmplRef[] = []

  constructor(
    private overlay: Overlay,
  ){
    super()
    this.subs.push(
      this.context$.subscribe(v => this.context = v)
    )
  }

  callRegFns(){
    const tmplRefs: TTmplRef[] = []
    for (const fn of this.callbacks){
      const resp = fn(this.context)
      if (resp) {
        const { tmpl, data } = resp
        tmplRefs.push({ tmpl, data })
      }
    }
    this.tmplRefs = tmplRefs
    this.tmplRefs$.next(tmplRefs)
  }

  dismissCtxMenu(){
    if (this.overlayRef) {
      this.overlayRef.dispose()
      this.overlayRef = null
    }
  }

  showCtxMenu(ev: MouseEvent, tmplRef: TemplateRef<any>){
    if (!this.vcr) {
      console.warn(`[ctx-menu-host] not attached to any component!`)
      return
    }
    this.dismissCtxMenu()
    this.callRegFns()

    const { x, y } = ev
    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo({ x, y })
      .withPositions([
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
        }
      ])

    this.overlayRef = this.overlay.create({
      positionStrategy,
    })

    this.overlayRef.attach(
      new TemplatePortal(
        tmplRef,
        this.vcr,
        {
          tmplRefs: this.tmplRefs
        }
      )
    )
  }
}
