import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ARIA_LABELS, CONST } from 'common/constants'

export type UserLayerInfoData = {
  layerName: string
  filename: string
  min: number
  max: number
  warning: string[]
}

@Component({
  selector: `sxplr-userlayer-info`,
  templateUrl: './userlayerInfo.template.html',
  styleUrls: [
    './userlayerInfo.style.css'
  ]
})

export class UserLayerInfoCmp {
  ARIA_LABELS = ARIA_LABELS
  CONST = CONST
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: UserLayerInfoData
  ){

  }
  public showMoreInfo = false
}
