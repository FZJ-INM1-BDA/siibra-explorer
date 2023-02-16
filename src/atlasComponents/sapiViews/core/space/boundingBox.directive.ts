import { Directive, Input, OnChanges, SimpleChanges } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { BoundingBox, SxplrTemplate, SxplrAtlas } from "src/atlasComponents/sapi/sxplrTypes"

function validateBbox(input: any): boolean {
  if (!Array.isArray(input)) return false
  if (input.length !== 2) return false
  return input.every(el => Array.isArray(el) && el.length === 3 && el.every(val => typeof val === "number"))
}

@Directive({
  selector: '[sxplr-sapiviews-core-space-boundingbox]',
  exportAs: 'sxplrSapiViewsCoreSpaceBoundingBox'
})

export class SapiViewsCoreSpaceBoundingBox implements OnChanges{
  @Input('sxplr-sapiviews-core-space-boundingbox-atlas')
  atlas: SxplrAtlas

  @Input('sxplr-sapiviews-core-space-boundingbox-space')
  space: SxplrTemplate

  private _bbox: BoundingBox
  @Input('sxplr-sapiviews-core-space-boundingbox-spec')
  set bbox(val: string | BoundingBox ) {

    if (typeof val === "string") {
      try {
        const [min, max]: [
          [number, number, number],
          [number, number, number],
        ] = JSON.parse(val)
        this._bbox = {
          minpoint: min,
          maxpoint: max,
          center: min.map((v, idx) => (v + max[idx]) / 2) as [number, number, number],
          space: this.space
        }
      } catch (e) {
        console.warn(`Parse bbox input error`)
      }
      return
    }
    if (!validateBbox(val)) {
      // console.warn(`Bbox is not string, and validate error`)
      return
    }
    this._bbox = val
  }
  get bbox(): BoundingBox {
    return this._bbox
  }

  private _bbox$: BehaviorSubject<{
    atlas: SxplrAtlas
    space: SxplrTemplate
    bbox: BoundingBox
  }> = new BehaviorSubject({
    atlas: null,
    space: null,
    bbox: null
  })

  public bbox$: Observable<{
    atlas: SxplrAtlas
    space: SxplrTemplate
    bbox: BoundingBox
  }> = this._bbox$.asObservable().pipe(
    distinctUntilChanged(
      (prev, curr) => prev.atlas?.["@id"] === curr.atlas?.['@id']
        && prev.space?.["@id"] === curr.space?.["@id"]
        && JSON.stringify(prev.bbox) === JSON.stringify(curr.bbox)
    )
  )

  ngOnChanges(): void {
    const {
      atlas,
      space,
      bbox
    } = this
    this._bbox$.next({
      atlas,
      space,
      bbox
    })
  }
}
