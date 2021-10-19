import { Component } from "@angular/core";
import { interval, merge, of } from "rxjs";
import { map } from "rxjs/operators";
import { UNSUPPORTED_INTERVAL, UNSUPPORTED_PREVIEW } from "src/util/constants";
import { MIN_REQ_EXPLAINER } from 'src/util/constants'

@Component({
  selector: 'not-supported-component',
  templateUrl: './notSupported.template.html',
  styleUrls: [
    './notSupported.style.css'
  ]
})

export class NotSupportedCmp{
  public unsupportedPreviews: any[] = UNSUPPORTED_PREVIEW
  public unsupportedPreviewIdx: number = 0
  public MIN_REQ_EXPLAINER = MIN_REQ_EXPLAINER
  ngOnInit(){
    merge(
      of(-1),
      interval(UNSUPPORTED_INTERVAL),
    ).pipe(
      map(v => {
        let idx = v
        while (idx < 0) {
          idx = v + this.unsupportedPreviews.length
        }
        return idx % this.unsupportedPreviews.length
      }),
    ).subscribe(val => {
      this.unsupportedPreviewIdx = val
    })
  }
}