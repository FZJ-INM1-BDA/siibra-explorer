import { Component, Inject, Optional } from "@angular/core";
import { PointAssignmentDirective } from "../point-assignment.directive";
import { SAPI } from "src/atlasComponents/sapi/sapi.service";
import { select, Store } from "@ngrx/store";
import { CLICK_INTERCEPTOR_INJECTOR, ClickInterceptor, HOVER_INTERCEPTOR_INJECTOR, HoverInterceptor } from "src/util/injectionTokens";
import { MAT_DIALOG_DATA } from "src/sharedModules";
import { translateRegionName } from "src/atlasComponents/sapi/translateV3";
import { take } from "rxjs/operators";
import { atlasSelection } from "src/state";
import { generalActionError } from "src/state/actions";

@Component({
  templateUrl: './point-assignment-full.component.html',
  styleUrls: [
    "./point-assignment-full.component.scss"
  ]
})

export class PointAssignmentFull extends PointAssignmentDirective {

  constructor(
    sapi: SAPI,
    private store: Store,
    @Optional() @Inject(HOVER_INTERCEPTOR_INJECTOR)
    hoverInterceptor: HoverInterceptor,
    @Optional() @Inject(CLICK_INTERCEPTOR_INJECTOR)
    clickInterceptor: ClickInterceptor,
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    dialogData: any
  ) {
    super(sapi, hoverInterceptor, clickInterceptor)

    console.log("constructor", dialogData, dialogData.point)
    if (!!dialogData) {
      this.point = dialogData.point
      this.template = dialogData.template
      this.parcellation = dialogData.parcellation
    }
  }

  public async handleClickRegionName(name: string, toggleFlag: boolean = false){
    const regionName = translateRegionName(name)
    const regions = await this.store.pipe(
      select(atlasSelection.selectors.selectedParcAllRegions),
      take(1)
    ).toPromise()

    const foundRegion = regions.find(r => r.name === regionName)
    if (!foundRegion) {
      this.store.dispatch(
        generalActionError({
          message: `Region with name ${regionName} not found.`
        })
      )
      return
    }
    if (toggleFlag) {
      
      this.store.dispatch(
        atlasSelection.actions.toggleRegion({
          region: foundRegion
        })
      )
    } else {
      
      this.store.dispatch(
        atlasSelection.actions.selectRegion({
          region: foundRegion
        })
      )
    }
    
  }

}