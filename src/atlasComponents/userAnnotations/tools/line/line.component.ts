import { Component, ElementRef, Inject, Input, OnDestroy, Optional, ViewChild } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Store } from "@ngrx/store";
import { Subscription } from "rxjs";
import { Line, LINE_ICON_CLASS } from "../line";
import { ToolCmpBase } from "../toolCmp.base";
import { IAnnotationGeometry, TExportFormats, UDPATE_ANNOTATION_TOKEN } from "../type";
import { Clipboard } from "@angular/cdk/clipboard";
import { viewerStateChangeNavigation } from "src/services/state/viewerState/actions";
import { Point } from "../point";
import { ARIA_LABELS } from 'common/constants'
import { ComponentStore } from "src/viewerModule/componentStore";

@Component({
  selector: 'line-update-cmp',
  templateUrl: './line.template.html',
  styleUrls: [
    './line.style.css'
  ]
})

export class LineUpdateCmp extends ToolCmpBase implements OnDestroy{
  @Input('update-annotation')
  public updateAnnotation: Line

  public ARIA_LABELS = ARIA_LABELS

  public annotationLabel = 'Line'
  public LINE_ICON_CLASS = LINE_ICON_CLASS

  @ViewChild('copyTarget', { read: ElementRef, static: false })
  copyTarget: ElementRef

  public useFormat: TExportFormats = 'json'
  private sub: Subscription[] = []

  constructor(
    private store: Store<any>,
    snackbar: MatSnackBar,
    clipboard: Clipboard,
    private cStore: ComponentStore<{ useFormat: TExportFormats }>,
    @Optional() @Inject(UDPATE_ANNOTATION_TOKEN) updateAnnotation: IAnnotationGeometry,
  ){
    super(clipboard, snackbar)
    if (this.cStore) {
      this.sub.push(
        this.cStore.select(store => store.useFormat).subscribe((val: TExportFormats) => {
          this.useFormat = val
        })
      )
    }

    if (updateAnnotation) {
      if (updateAnnotation instanceof Line) {
        this.updateAnnotation = updateAnnotation
      }
    }
  }

  public viableFormats: TExportFormats[] = ['json', 'sands']

  setFormat(format: TExportFormats){
    if (this.cStore) {
      this.cStore.setState({
        useFormat: format
      })
    }
  }

  ngOnDestroy(){
    while (this.sub.length > 0) this.sub.pop().unsubscribe()
  }

  get copyValue(){
    return this.copyTarget && this.copyTarget.nativeElement.value
  }

  gotoRoi(roi?: IAnnotationGeometry){
    if (!this.updateAnnotation && !roi) {
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

  gotoPoint(point: Point){
    if (!point) throw new Error(`Point is not defined.`)
    const { x, y, z } = point

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
