import { Input, Directive, Inject, Output, EventEmitter, Optional } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { PathReturn } from "src/atlasComponents/sapi/typeV3";
import { MAT_DIALOG_DATA } from "src/sharedModules";

const REQUIRED_KEYS = ["index", "columns", "ndim", "data"]

type DF = PathReturn<"/map/assign">

function isDf(input: unknown): input is DF{
  if (input === null) {
    return false
  }
  if (!(typeof input === "object")) {
    return false
  }
  try {
    return REQUIRED_KEYS.every(key => !!input[key])
  } catch (e) {
    console.error(`Error checking isDF`, e)
    return false
  }
}

@Directive({
  standalone: true
})
export class AssignmentViewBaseDirective {

  dataframe$ = new BehaviorSubject<DF>(null)

  @Input()
  set result(val: unknown){
    if (isDf(val)) {
      this.dataframe$.next(val)
    }
  }

  @Output()
  clickOnRegionName = new EventEmitter<{
    target: string
    event: MouseEvent
  }>()

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) dialogData: unknown
  ){
    if (isDf(dialogData)) {
      this.dataframe$.next(dialogData)
    }
  }

  selectRegion(target: string, event: MouseEvent){
    this.clickOnRegionName.next({ target, event })
  }

}
