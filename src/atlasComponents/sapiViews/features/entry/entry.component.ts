import { Component, Input, OnDestroy } from "@angular/core";
import { Store } from "@ngrx/store";
import { TNgAnnotationPoint } from "src/atlasComponents/annotations";
import { SapiFeatureModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel, CLEANED_IEEG_DATASET_TYPE } from "src/atlasComponents/sapi";
import { IeegOnFocusEvent, ContactPoint, Electrode, Session, IeegOnDefocusEvent } from "../ieeg";
import { atlasSelection, annotation } from "src/state"

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

  private addedAnnotations: annotation.UnionAnnotation[] = []

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
      const allInRoiPoints: TNgAnnotationPoint[] = this.getPointsFromSession(ev.session, true)
      const allNonInRoiPoints: TNgAnnotationPoint[] = this.getPointsFromSession(ev.session, false)
      const annotationsToBeAdded: annotation.UnionAnnotation[] = []
      for (const pt of allInRoiPoints) {
        annotationsToBeAdded.push({
          "@id": pt.id,
          color: annotation.AnnotationColor.RED,
          openminds: {
            "@id": pt.id,
            "@type": "https://openminds.ebrains.eu/sands/CoordinatePoint",
            coordinateSpace: {
              "@id": this.space["@id"]
            },
            coordinates: pt.point.map(v => {
              return {
                value: v / 1e6
              }
            })
          },
          name: pt.description || "Untitled"
        })
      }
      for (const pt of allNonInRoiPoints) {
        annotationsToBeAdded.push({
          "@id": pt.id,
          color: annotation.AnnotationColor.WHITE,
          openminds: {
            "@id": pt.id,
            "@type": "https://openminds.ebrains.eu/sands/CoordinatePoint",
            coordinateSpace: {
              "@id": this.space["@id"]
            },
            coordinates: pt.point.map(v => {
              return {
                value: v / 1e6
              }
            })
          },
          name: pt.description || "Untitled"
        })
      }
      this.addedAnnotations = annotationsToBeAdded
      this.store.dispatch(
        annotation.actions.addAnnotations({
          annotations: annotationsToBeAdded
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
    }
  }

  ngOnDestroy(): void {
    this.store.dispatch(
      annotation.actions.rmAnnotations({
        annotations: this.addedAnnotations
      })
    )
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
