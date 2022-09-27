import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Optional } from "@angular/core";
import { Store } from "@ngrx/store";
import { Observable } from "rxjs";
import { NehubaViewerUnit } from "src/viewerModule/nehuba";
import { NEHUBA_INSTANCE_INJTKN } from "src/viewerModule/nehuba/util";
import { ARIA_LABELS } from 'common/constants'
import { atlasAppearance } from "src/state";

@Component({
  selector: 'viewer-ctrl-component',
  templateUrl: './viewerCtrlCmp.template.html',
  styleUrls: [
    './viewerCtrlCmp.style.css'
  ],
  exportAs: 'viewerCtrlCmp',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class ViewerCtrlCmp {

  public ARIA_LABELS = ARIA_LABELS

  private _removeOctantFlag: boolean = true
  get removeOctantFlag(): boolean{
    return this._removeOctantFlag
  }
  set removeOctantFlag(val: boolean){
    if (val === this._removeOctantFlag) return
    this._removeOctantFlag = val
    this.setOctantRemoval(this._removeOctantFlag)
    this.cdr.detectChanges()
  }



  constructor(
    private store$: Store<any>,
    private cdr: ChangeDetectorRef,
    @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) private nehubaInst$: Observable<NehubaViewerUnit>,
  ){

  }

  public setOctantRemoval(octantRemovalFlag: boolean): void {
    this.store$.dispatch(
      atlasAppearance.actions.setOctantRemoval({
        flag: octantRemovalFlag
      })
    )
  }

}
