import { Directive, Input, OnChanges, SimpleChanges } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { BoundingBoxConcept, SapiAtlasModel, SapiSpaceModel } from "src/atlasComponents/sapi/type";

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
  atlas: SapiAtlasModel

  @Input('sxplr-sapiviews-core-space-boundingbox-space')
  space: SapiSpaceModel

  private _bbox: BoundingBoxConcept
  @Input('sxplr-sapiviews-core-space-boundingbox-spec')
  set bbox(val: string | BoundingBoxConcept ) {

    if (typeof val === "string") {
      try {
        const [min, max] = JSON.parse(val)
        this._bbox = [min, max]
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
  get bbox(): BoundingBoxConcept {
    return this._bbox
  }

  private _bbox$: BehaviorSubject<{
    atlas: SapiAtlasModel
    space: SapiSpaceModel
    bbox: BoundingBoxConcept
  }> = new BehaviorSubject({
    atlas: null,
    space: null,
    bbox: null
  })

  public bbox$: Observable<{
    atlas: SapiAtlasModel
    space: SapiSpaceModel
    bbox: BoundingBoxConcept
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
