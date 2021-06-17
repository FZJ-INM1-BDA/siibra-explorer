import { Component, ElementRef, Inject, Input, OnDestroy, Optional, ViewChild } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Point, POINT_ICON_CLASS } from "../point";
import { IAnnotationGeometry, TExportFormats, UDPATE_ANNOTATION_TOKEN } from "../type";
import { Clipboard } from "@angular/cdk/clipboard";
import { ToolCmpBase } from "../toolCmp.base";
import { Store } from "@ngrx/store";
import { viewerStateChangeNavigation } from "src/services/state/viewerState/actions";
import { Subscription } from "rxjs";

@Component({
  selector: 'point-update-cmp',
  templateUrl: './point.template.html',
  styleUrls: [
    './point.style.css',
  ]
})

export class PointUpdateCmp extends ToolCmpBase implements OnDestroy{

  public POINT_ICON_CLASS = POINT_ICON_CLASS

  @Input('update-annotation')
  updateAnnotation: Point

  @Input('annotation-label')
  annotationLabel = 'Point'

  @Input('show-copy-button')
  showCopyBtn = true

  private sub: Subscription[] = []
  public useFormat: TExportFormats = 'string'

  @ViewChild('copyTarget', { read: ElementRef, static: false })
  copyTarget: ElementRef

  constructor(
    private store: Store<any>,
    snackbar: MatSnackBar,
    clipboard: Clipboard,
    @Optional() @Inject(UDPATE_ANNOTATION_TOKEN) updateAnnotation: IAnnotationGeometry,
  ){
    super(clipboard, snackbar)
    
    if (updateAnnotation) {
      if (updateAnnotation instanceof Point) {
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
    const { x, y, z } = this.updateAnnotation
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
