import { Component, Input, OnChanges } from "@angular/core";
import { BsFeatureReceptorBase } from "../base";
import { CONST } from 'common/constants'

const { RECEPTOR_AR_CAPTION } = CONST

@Component({
  selector: 'bs-features-receptor-autoradiograph',
  templateUrl: './autoradiograph.template.html',
  styleUrls: [
    './autoradiograph.style.css'
  ]
})

export class BsFeatureReceptorAR extends BsFeatureReceptorBase implements OnChanges {

  public RECEPTOR_AR_CAPTION = RECEPTOR_AR_CAPTION
  private DS_PREVIEW_URL = DATASET_PREVIEW_URL

  @Input()
  bsLabel: string

  public imgUrl: string

  constructor(){
    super()
  }
  ngOnChanges(){
    this.error = null
    this.urls = []
    if (!this.bsFeature) {
      this.error = `bsFeature not populated`
      return
    }
    if (!this.bsLabel) {
      this.error = `bsLabel not populated`
      return
    }

    const url = this.bsFeature.__data.__autoradiographs[this.bsLabel]
    if (!url) {
      this.error = `ar cannot be found`
      return
    }
    this.urls = [{ url }]
    const query = url.replace('https://object.cscs.ch/v1', '')
    this.imgUrl = `${this.DS_PREVIEW_URL}/imageProxy/v1?u=${encodeURIComponent(query)}`
    
  }
}