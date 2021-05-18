import { Component, Input } from "@angular/core";
import { BsRegionInputBase } from "../../bsRegionInputBase";
import { TBSDetail } from "../type";

@Component({
  selector: 'kg-regional-feature-detail',
  templateUrl: './kgRegDetail.template.html',
  styleUrls: [
    './kgRegDetail.style.css'
  ]
})

export class KgRegDetailCmp extends BsRegionInputBase {

  @Input()
  public detail: TBSDetail
}
