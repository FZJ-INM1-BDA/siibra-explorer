import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: 'root'
})

export class ParcellationVisibilityService {
  private _visibility$ = new BehaviorSubject<boolean>(true)
  public readonly visibility$ = this._visibility$.asObservable()

  setVisibility(flag: boolean) {
    this._visibility$.next(flag)
  }

  toggleVisibility(){
    this.setVisibility(
      !this._visibility$.getValue()
    )
  }
}
