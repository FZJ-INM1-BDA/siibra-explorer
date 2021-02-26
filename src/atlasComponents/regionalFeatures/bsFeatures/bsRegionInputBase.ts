import { Input } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { TRegion } from "./constants";

export class BsRegionInputBase{

  protected region$ = new BehaviorSubject<TRegion>(null)
  private _region: TRegion

  @Input()
  set region(val: TRegion) {
    this._region = val
    this.region$.next(val)
  }

  get region() {
    return this._region
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(){}
}