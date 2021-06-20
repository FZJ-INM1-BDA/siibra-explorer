import { Overlay, OverlayRef } from "@angular/cdk/overlay"
import { TemplatePortal } from "@angular/cdk/portal"
import { Injectable, TemplateRef, ViewContainerRef } from "@angular/core"
import { ReplaySubject, Subject, Subscription } from "rxjs"
import { RegDeregController } from "src/util/regDereg.base"

type TTmpl = {
  tmpl: TemplateRef<any>
  data: any
}

type TSimple = {
  data: {
    message: string
    iconClass?: string
  }
}

type TTmplRef = (TTmpl | TSimple) & {
  order?: number
  onClick?: Function
}

type CtxMenuInterArg<T> = {
  context: T
  append: (arg: TTmplRef) => void
}

@Injectable({
  providedIn: 'root'
})

export class ContextMenuService<T> extends RegDeregController<CtxMenuInterArg<T>, boolean>{
  
  public vcr: ViewContainerRef
  private overlayRef: OverlayRef

  private subs: Subscription[] = []
  
  public context$ = new Subject<T>()
  public context: T

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
    let tmplRefs: TTmplRef[] = []
    for (const fn of this.callbacks){
      const resp = fn({
        context: this.context,
        append: arg => tmplRefs.push(arg),
      })
      if (!resp) {
        tmplRefs = []
        return false
      }
    }
    this.tmplRefs = tmplRefs
    this.tmplRefs$.next(tmplRefs)
    return true
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
    const flag = this.callRegFns()
    if (!flag) return 

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

export type TContextMenuReg<T> = (arg: CtxMenuInterArg<T>) => boolean
