import { Component, ElementRef, Inject, Input, OnDestroy, Optional, ViewChild } from "@angular/core";
import { Point } from "../point";
import { IAnnotationGeometry, TExportFormats, UDPATE_ANNOTATION_TOKEN } from "../type";
import { ToolCmpBase } from "../toolCmp.base";
import { Store } from "@ngrx/store";
import { ComponentStore } from "src/viewerModule/componentStore";
import { ARIA_LABELS } from 'common/constants'
import { actions } from "src/state/atlasSelection";

@Component({
  selector: 'point-update-cmp',
  templateUrl: './point.template.html',
  styleUrls: [
    './point.style.css',
  ]
})

export class PointUpdateCmp extends ToolCmpBase implements OnDestroy{

  public ARIA_LABELS = ARIA_LABELS

  @Input('update-annotation')
  updateAnnotation: Point

  @ViewChild('copyTarget', { read: ElementRef, static: false })
  copyTarget: ElementRef

  constructor(
    private store: Store<any>,
    cStore: ComponentStore<{ useFormat: TExportFormats }>,
    @Optional() @Inject(UDPATE_ANNOTATION_TOKEN) updateAnnotation: IAnnotationGeometry,
  ){
    super(cStore)
    
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
