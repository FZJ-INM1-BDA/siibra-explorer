import { Component, ElementRef, Inject, Input, OnDestroy, Optional, ViewChild } from "@angular/core";
import { MatSnackBar } from 'src/sharedModules/angularMaterial.exports'
import { Polygon } from "../poly";
import { ToolCmpBase } from "../toolCmp.base";
import { IAnnotationGeometry, TExportFormats, UDPATE_ANNOTATION_TOKEN } from "../type";
import { Store } from "@ngrx/store";
import { Point } from "../point";
import { ARIA_LABELS } from 'common/constants'
import { ComponentStore } from "src/viewerModule/componentStore";
import { actions } from "src/state/atlasSelection";

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

  public ARIA_LABELS = ARIA_LABELS

  @ViewChild('copyTarget', { read: ElementRef, static: false })
  copyTarget: ElementRef

  public useFormat: TExportFormats = 'string'

  constructor(
    private store: Store<any>,
    private snackbar: MatSnackBar,
    cStore: ComponentStore<{ useFormat: TExportFormats }>,
    @Optional() @Inject(UDPATE_ANNOTATION_TOKEN) updateAnnotation: IAnnotationGeometry,
  ){
    super(cStore)
    if (this.cStore) {
      this.sub.push(
        this.cStore.select(store => store.useFormat).subscribe((val: TExportFormats) => {
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

  gotoRoi(roi?: IAnnotationGeometry){
    if (!this.updateAnnotation) {
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
