import { Input, SimpleChanges } from "@angular/core"
import { BehaviorSubject, of } from "rxjs"
import { IFeature, RegionalFeaturesService } from "./regionalFeature.service"

export class RegionFeatureBase{

  @Input()
  public region: any

  public features: IFeature[] = []

  /**
   * using isLoading flag for conditional rendering of root element (or display loading spinner)
   * this is necessary, or the transcluded tab will always be the active tab,
   * as this.features as populated via async
   */
  public isLoading$ = new BehaviorSubject(false)
  private _isLoading: boolean = false
  get isLoading(){
    return this._isLoading
  }
  set isLoading(val){
    if (val !== this._isLoading)
      this._isLoading = val
    this.isLoading$.next(val)
  }

  ngOnChanges(changes: SimpleChanges){
    if (changes.region && changes.region.previousValue !== changes.region.currentValue) {
      this.isLoading = true
      this.features = []
      
      const _ = (changes.region.currentValue
        ? this._regionalFeatureService.getAllFeaturesByRegion(changes.region.currentValue)
        : of([])
      ).pipe(

      ).subscribe({
        next: features => this.features = features,
        complete: () => this.isLoading = false
      })
    }
  }

  constructor(
    private _regionalFeatureService: RegionalFeaturesService
  ){

  }
}
