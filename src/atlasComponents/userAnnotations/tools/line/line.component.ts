import { Component, ElementRef, Inject, Input, OnDestroy, Optional, ViewChild } from "@angular/core";
import { MatSnackBar } from 'src/sharedModules/angularMaterial.exports'
import { Store } from "@ngrx/store";
import { Line, LINE_ICON_CLASS } from "../line";
import { ToolCmpBase } from "../toolCmp.base";
import { IAnnotationGeometry, TExportFormats, UDPATE_ANNOTATION_TOKEN } from "../type";
import { Point } from "../point";
import { ARIA_LABELS } from 'common/constants'
import { ComponentStore } from "src/viewerModule/componentStore";
import { actions } from "src/state/atlasSelection";

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
  public LINE_ICON_CLASS = LINE_ICON_CLASS

  @ViewChild('copyTarget', { read: ElementRef, static: false })
  copyTarget: ElementRef

  constructor(
    private store: Store<any>,
    private snackbar: MatSnackBar,
    cStore: ComponentStore<{ useFormat: TExportFormats }>,
    @Optional() @Inject(UDPATE_ANNOTATION_TOKEN) updateAnnotation: IAnnotationGeometry,
  ){
    super(cStore)

    if (updateAnnotation) {
      if (updateAnnotation instanceof Line) {
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

  gotoRoi(roi?: IAnnotationGeometry){
    if (!this.updateAnnotation && !roi) {
      throw new Error(`updateAnnotation undefined`)
    }

    if (roi && roi instanceof Point) {
      const { x, y, z } = roi

      this.store.dispatch(
        actions.navigateTo({
          navigation: {
            position: [x, y, z]
          },
          physical: true,
          animation: true
        })
      )
      return
    }

    if (this.updateAnnotation.points.length < 1) {
      this.snackbar.open('No points added to polygon yet.', 'Dismiss', {
        duration: 3000
      })
      return
    }
    const { x, y, z } = this.updateAnnotation.points[0]
    
    this.store.dispatch(
      actions.navigateTo({
        navigation: {
          position: [x, y, z]
        },
        physical: true,
        animation: true
      })
    )
  }

  remove(){
    this.updateAnnotation?.remove()
  }
}
