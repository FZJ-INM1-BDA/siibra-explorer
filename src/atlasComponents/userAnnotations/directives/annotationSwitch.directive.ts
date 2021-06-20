import { Directive, HostListener, Inject, OnDestroy, Optional } from "@angular/core";
import { viewerStateSetViewerMode } from "src/services/state/viewerState/actions";
import { ARIA_LABELS } from "common/constants";
import { Store } from "@ngrx/store";
import { TContextArg } from "src/viewerModule/viewer.interface";
import { TContextMenuReg } from "src/contextMenuModule";
import { CONTEXT_MENU_ITEM_INJECTOR, TContextMenu } from "src/util";
import { ModularUserAnnotationToolService } from "../tools/service";
import { IAnnotationGeometry } from "../tools/type";
import { retry } from 'common/util'
import { MatSnackBar } from "@angular/material/snack-bar";

@Directive({
  selector: '[annotation-switch]'
})
export class AnnotationSwitch implements OnDestroy{
  
  private onDestroyCb: Function[] = []

  constructor(
    private store$: Store<any>,
    private svc: ModularUserAnnotationToolService,
    private snackbar: MatSnackBar,
    @Optional() @Inject(CONTEXT_MENU_ITEM_INJECTOR) ctxMenuInterceptor: TContextMenu<TContextMenuReg<TContextArg<'nehuba' | 'threeSurfer'>>>
  ) {
    
    const sub = this.svc.managedAnnotations$.subscribe(manAnn => this.manangedAnnotations = manAnn)
    this.onDestroyCb.push(
      () => sub.unsubscribe()
    )


    const loadAnn = async () => {
      try {
        const anns = await this.getAnnotation()
        for (const ann of anns) {
          this.svc.importAnnotation(ann)
        }
      } catch (e) {
        this.snackbar.open(`Error loading annotation from storage: ${e.toString()}`, 'Dismiss', {
          duration: 3000
        })
      }
    }
    loadAnn()
  }

  ngOnDestroy(){
    while(this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
  }

  /**
   * TODO move annotation storage/retrival to more logical location
   */
  @HostListener('window:beforeunload')
  onPageHide(){
    this.storeAnnotation(this.manangedAnnotations)
  }

  @HostListener('click')
  onClick() {
    this.store$.dispatch(
      viewerStateSetViewerMode({
        payload: ARIA_LABELS.VIEWER_MODE_ANNOTATING
      })
    )
  }

  private manangedAnnotations = []
  private localstoragekey = 'userAnnotationKey'
  private storeAnnotation(anns: IAnnotationGeometry[]){
    const arr = []
    for (const ann of anns) {
      const json = ann.toJSON()
      arr.push(json)
    }
    const stringifiedJSON = JSON.stringify(arr)
    const { pako } = (window as any).export_nehuba
    const compressed = pako.deflate(stringifiedJSON)
    let out = ''
    for (const num of compressed) {
      out += String.fromCharCode(num)
    }
    const encoded = btoa(out)
    window.localStorage.setItem(this.localstoragekey, encoded)
  }
  private async getAnnotation(): Promise<IAnnotationGeometry[]>{
    const encoded = window.localStorage.getItem(this.localstoragekey)
    if (!encoded) return []
    const bin = atob(encoded)
    
    await retry(() => {
      if (!!(window as any).export_nehuba) return true
      else throw new Error(`export nehuba not yet ready`)
    }, {
      timeout: 1000,
      retries: 10
    })
    
    const { pako } = (window as any).export_nehuba
    const decoded = pako.inflate(bin, { to: 'string' })
    const arr = JSON.parse(decoded)
    const out: IAnnotationGeometry[] = []
    for (const obj of arr) {
      const geometry = this.svc.parseAnnotationObject(obj)
      out.push(geometry)
    }
    return out
  }
}
