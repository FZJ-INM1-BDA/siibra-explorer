import { Component, Input } from "@angular/core";
import { TPRB } from "../util";
import { CommonModule } from "@angular/common";
import { AngularMaterialModule } from "src/sharedModules";
import { BehaviorSubject } from "rxjs";
import { map, throttleTime } from "rxjs/operators";

@Component({
  selector: 'tpbr-viewer',
  templateUrl: './TPBRView.template.html',
  styleUrls: [
    './TPBRView.style.scss'
  ],
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
  ]
})
export class TPBRViewCmp {
  @Input('tpbr-concept')
  set _tpbr(value: TPRB){
    this.#tpbr.next(value)
  }
  #tpbr = new BehaviorSubject<TPRB>(null)

  view$ = this.#tpbr.pipe(
    throttleTime(16),
    map(v => {
      if (!v) return null
      return {
        ...v,
        bboxString: v.bbox && {
          from: v.bbox[0].map(v => v.toFixed(2)).join(", "),
          to: v.bbox[1].map(v => v.toFixed(2)).join(", "),
        }
      }
    })
  )
}
