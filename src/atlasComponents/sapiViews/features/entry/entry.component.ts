import { Component, Input, OnDestroy } from "@angular/core";
import { Store } from "@ngrx/store";
import { AnnotationLayer, TNgAnnotationPoint } from "src/atlasComponents/annotations";
import { SapiFeatureModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel, CLEANED_IEEG_DATASET_TYPE } from "src/atlasComponents/sapi";
import { IeegOnFocusEvent, ContactPoint, Electrode, Session, IeegOnDefocusEvent } from "../ieeg";
import { atlasSelection, annotation, atlasAppearance } from "src/state"

@Component({
  selector: 'sxplr-sapiviews-features-entry',
  templateUrl: './entry.template.html',
  styleUrls: [
    './entry.style.css'
  ]
})

export class FeatureEntryCmp implements OnDestroy{

  /**
   * in future, hopefully feature detail can be queried with just id,
   * and atlas/space/parcellation/region are no longer necessary
   */
  @Input('sxplr-sapiviews-features-entry-atlas')
  atlas: SapiFeatureModel

  @Input('sxplr-sapiviews-features-entry-space')
  space: SapiSpaceModel

  @Input('sxplr-sapiviews-features-entry-parcellation')
  parcellation: SapiParcellationModel

  @Input('sxplr-sapiviews-features-entry-region')
  region: SapiRegionModel

  @Input('sxplr-sapiviews-features-entry-feature')
  feature: SapiFeatureModel

  featureType = {
    receptor: "siibra/features/receptor",
    ieeg: CLEANED_IEEG_DATASET_TYPE
  }

  static readonly IEEG_ANNOTATION_LAYER_RED = `ieeg-annotation-layer-red`
  static readonly IEEG_ANNOTATION_LAYER_WHITE = `ieeg-annotation-layer-white`
  private ieegRedAnnLayer: AnnotationLayer
  private ieegWhiteAnnLayer: AnnotationLayer
  
  ieegOnFocus(ev: IeegOnFocusEvent){
    if (ev.contactPoint) {
      /**
       * navigate to the point
       */
      this.store.dispatch(
        atlasSelection.actions.navigateTo({
          navigation: {
            position: ev.contactPoint.point.coordinates.map(v => v.value * 1e6)
          },
          animation: true
        })
      )
      return
    }
    if (ev.session) {
      /**
       * 
       */
      if (!this.ieegRedAnnLayer) {
        this.ieegRedAnnLayer = new AnnotationLayer(FeatureEntryCmp.IEEG_ANNOTATION_LAYER_RED, "#ff0000")
      }
      if (!this.ieegWhiteAnnLayer) {
        this.ieegWhiteAnnLayer = new AnnotationLayer(FeatureEntryCmp.IEEG_ANNOTATION_LAYER_WHITE, "#ffffff")
      }
      const allInRoiPoints: TNgAnnotationPoint[] = this.getPointsFromSession(ev.session, true)
      const allNonInRoiPoints: TNgAnnotationPoint[] = this.getPointsFromSession(ev.session, false)
      for (const pt of allInRoiPoints) {
        this.ieegRedAnnLayer.addAnnotation(pt)
      }
      for (const pt of allNonInRoiPoints) {
        this.ieegWhiteAnnLayer.addAnnotation(pt)
      }
      this.store.dispatch(
        annotation.actions.addAnnotations({
          annotations: [...allInRoiPoints, ...allNonInRoiPoints].map(p => {
            return { "@id": p.id }
          })
        })
      )
      this.store.dispatch(
        atlasAppearance.actions.setOctantRemoval({
          flag: false
        })
      )
    }
  }
  ieegOnDefocus(ev: IeegOnDefocusEvent){
    if (ev.session) {
      const allInRoiPoints: TNgAnnotationPoint[] = this.getPointsFromSession(ev.session, true)
      const allNonInRoiPoints: TNgAnnotationPoint[] = this.getPointsFromSession(ev.session, false)

      this.store.dispatch(
        annotation.actions.rmAnnotations({
          annotations: [...allInRoiPoints, ...allNonInRoiPoints].map(p => {
            return { "@id": p.id }
          })
        })
      )

      this.store.dispatch(
        atlasAppearance.actions.setOctantRemoval({
          flag: true
        })
      )

      if (this.ieegRedAnnLayer) {
        for (const pt of allInRoiPoints) {
          this.ieegRedAnnLayer.removeAnnotation(pt)
        }
      }
      
      if (this.ieegWhiteAnnLayer) {
        for (const pt of allNonInRoiPoints) {
          this.ieegWhiteAnnLayer.removeAnnotation(pt)
        }
      }
      

    }
  }
  ngOnDestroy(): void {
    if (this.ieegRedAnnLayer) this.ieegRedAnnLayer.dispose()
    if (this.ieegWhiteAnnLayer) this.ieegWhiteAnnLayer.dispose()
  }

  constructor(
    private store: Store
  ){

  }

  private getPointsFromSession(session: Session<string>, inRoi: boolean):TNgAnnotationPoint[]{
    const allPoints: TNgAnnotationPoint[] = []
    for (const electrodeKey in session.electrodes) {
      const electrode = session.electrodes[electrodeKey]
      const points = this.getPointsFromElectrode(electrode, inRoi)
      allPoints.push(...points)
    }
    return allPoints.map(pt => {
      return {
        ...pt,
        id: `${session.sub_id}:${pt.id}`
      }
    })
  }

  private getPointsFromElectrode(electrode: Electrode<string>, inRoi: boolean): TNgAnnotationPoint[] {
    const allPoints: TNgAnnotationPoint[] = []
    for (const ctptKey in electrode.contact_points) {
      const ctpt = electrode.contact_points[ctptKey]
      if (!inRoi !== !ctpt.inRoi) {
        continue
      }
      const point = this.getPointFromCtPt(ctpt)
      allPoints.push(point)
    }
    return allPoints.map(pt => {
      return {
        ...pt,
        id: `${electrode.electrode_id}:${pt.id}`
      }
    })
  }

  private getPointFromCtPt(ctpt: ContactPoint<string>): TNgAnnotationPoint {
    return {
      id: ctpt.id,
      point: ctpt.point.coordinates.map(coord => coord.value * 1e6 ) as [number, number, number],
      type: 'point'
    }
  }
}
