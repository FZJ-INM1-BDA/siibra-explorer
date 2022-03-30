import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from "@angular/core";
import { BehaviorSubject, forkJoin } from "rxjs";
import { SAPI } from "src/atlasComponents/sapi/sapi.service";
import { CleanedIeegDataset, cleanIeegSessionDatasets, SapiAtlasModel, SapiIeegSessionModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel } from "src/atlasComponents/sapi/type";

export type Session<SId extends string> = CleanedIeegDataset['sessions'][SId]
export type Electrode<EId extends string> = Session<string>['electrodes'][EId]
export type ContactPoint<CId extends string> = Electrode<string>['contact_points'][CId]

export type IeegOnFocusEvent = {
  contactPoint: ContactPoint<string>
  electrode: Electrode<string>
  session: Session<string>
}

export type IeegOnDefocusEvent = {
  contactPoint: ContactPoint<string>
  electrode: Electrode<string>
  session: Session<string>
}

@Component({
  selector: `sxplr-sapiviews-features-ieeg-ieegdataset`,
  templateUrl: `./ieegDataset.template.html`,
  styleUrls: [
    `./ieegDataset.style.css`
  ]
})

export class IEEGDatasetCmp implements OnChanges{

  @Input('sxplr-sapiviews-features-ieeg-ieegdataset-atlas')
  public atlas: SapiAtlasModel
  
  @Input('sxplr-sapiviews-features-ieeg-ieegdataset-space')
  public space: SapiSpaceModel

  @Input('sxplr-sapiviews-features-ieeg-ieegdataset-parcellation')
  public parcellation: SapiParcellationModel

  @Input('sxplr-sapiviews-features-ieeg-ieegdataset-region')
  public region: SapiRegionModel
  
  /**
   * we must assume that the passed feature does not have the detail flag on
   * We need to fetch the 
   */
  @Input('sxplr-sapiviews-features-ieeg-ieegdataset-feature')
  public feature: CleanedIeegDataset
  public detailedFeature: CleanedIeegDataset

  @Output('sxplr-sapiviews-features-ieeg-ieegdataset-on-focus')
  public onFocus = new EventEmitter<IeegOnFocusEvent>()

  @Output('sxplr-sapiviews-features-ieeg-ieegdataset-on-defocus')
  public onDefocus = new EventEmitter<IeegOnDefocusEvent>()
  
  public busy$ = new BehaviorSubject<boolean>(false)

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.feature) {
      return
    }
    if (this.feature && this.feature["@type"] !== "sxplr/cleanedIeegDataset") {
      throw new Error(`expected @type to be sxplr-cleaned-ieeg-dataset, but is ${this.feature['@type']}.`)
    }
    this.busy$.next(true)
    
    forkJoin(
      Object.entries(this.feature.sessions).map(([ key, session ]) => {
        return this.sapi.getSpace(this.atlas["@id"], this.space["@id"]).getFeatureInstance(session["@id"], { parcellationId: this.parcellation["@id"], region: this.region.name })
      })
    ).subscribe(feats => {

      const ieegSessions: SapiIeegSessionModel[] = feats.filter(feat => feat["@type"] === "siibra/features/ieegSession")
      const features = cleanIeegSessionDatasets(ieegSessions)
      const foundFeat = features.find(f => f["@id"] === this.feature["@id"])
      if (foundFeat) {
        this.detailedFeature = foundFeat
      }
      this.busy$.next(false)
    })
  }

  public onContactPointClicked(cpt: ContactPoint<string>, ele: Electrode<string>, sess: Session<string>){
    this.onFocus.emit({
      contactPoint: cpt,
      electrode: ele,
      session: sess
    })
  }

  public onPanelOpen(session: Session<string>){
    this.onFocus.emit({
      contactPoint: null,
      electrode: null,
      session: session
    })
  }

  public onPanelClose(session: Session<string>){
    this.onDefocus.emit({
      contactPoint: null,
      electrode: null,
      session: session
    })
  }

  constructor(private sapi: SAPI){

  }

}
