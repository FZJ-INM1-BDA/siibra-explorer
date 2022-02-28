import { Component, OnChanges } from "@angular/core";
import { SAPI } from "src/atlasComponents/sapi";
import { BaseReceptor } from "../base";

@Component({
  selector: 'sxplr-sapiviews-features-receptor-fingerprint',
  templateUrl: './fingerprint.template.html',
  styleUrls: [
    './fingerprint.style.css'
  ]
})

export class Fingerprint extends BaseReceptor implements OnChanges{

  async ngOnChanges() {
    console.log('ng on changes claled onc hild')
    await super.ngOnChanges()
  }
  constructor(sapi: SAPI){
    super(sapi)
    console.log(this.atlas)
  }
}
