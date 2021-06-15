import { Component, ElementRef, Inject, Input, OnDestroy, Optional, ViewChild } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Polygon, POLY_ICON_CLASS } from "../poly";
import { ToolCmpBase } from "../toolCmp.base";
import { EXPORT_FORMAT_INJ_TOKEN, IAnnotationGeometry, TExportFormats, UDPATE_ANNOTATION_TOKEN } from "../type";
import { Clipboard } from "@angular/cdk/clipboard";
import { viewerStateChangeNavigation } from "src/services/state/viewerState/actions";
import { Store } from "@ngrx/store";
import { Observable, Subscription } from "rxjs";

@Component({
  selector: 'poly-update-cmp',
  templateUrl: './poly.template.html',
  styleUrls: [
    './poly.style.css',
  ]
})

export class PolyUpdateCmp extends ToolCmpBase implements OnDestroy{
  @Input('update-annotation')
  public updateAnnotation: Polygon

  public annotationLabel = 'Polygon'
  public POLY_ICON_CLASS = POLY_ICON_CLASS

  @ViewChild('copyTarget', { read: ElementRef, static: false })
  copyTarget: ElementRef

  public useFormat: TExportFormats = 'string'
  private sub: Subscription[] = []

  constructor(
    private store: Store<any>,
    snackbar: MatSnackBar,
    clipboard: Clipboard,
    @Optional() @Inject(EXPORT_FORMAT_INJ_TOKEN) useFormat$: Observable<TExportFormats>,
    @Optional() @Inject(UDPATE_ANNOTATION_TOKEN) updateAnnotation: IAnnotationGeometry,
  ){
    super(clipboard, snackbar)
    if (useFormat$) {
      this.sub.push(
        useFormat$.subscribe(val => {
          this.useFormat = val
        })
      )
    }

    if (updateAnnotation) {
      if (updateAnnotation instanceof Polygon) {
        this.updateAnnotation = updateAnnotation
      }
    }
  }

  ngOnDestroy(){
    while (this.sub.length > 0) this.sub.pop().unsubscribe()
  }

  get copyValue(){
    return this.copyTarget && this.copyTarget.nativeElement.value
  }

  gotoRoi(){
    if (!this.updateAnnotation) {
      throw new Error(`updateAnnotation undefined`)
    }
    if (this.updateAnnotation.points.length < 1) {
      this.snackbar.open('No points added to polygon yet.', 'Dismiss', {
        duration: 3000
      })
      return
    }
    const { x, y, z } = this.updateAnnotation.points[0]
    
    this.store.dispatch(
      viewerStateChangeNavigation({
        navigation: {
          position: [x, y, z],
          positionReal: true,
          animation: {}
        }
      })
    )
  }
}
