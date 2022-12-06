import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { merge, of, Subscription } from "rxjs";
import { pairwise, withLatestFrom} from "rxjs/operators";
import { ARIA_LABELS, CONST } from 'common/constants'
import { actionSetAuxMeshes, selectorAuxMeshes } from "../../store";
import { UntypedFormControl, UntypedFormGroup } from "@angular/forms";
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

export class ViewerCtrlCmp implements OnInit{

  public ARIA_LABELS = ARIA_LABELS
  public CONST = CONST

  private sub: Subscription[] = []

  private _removeOctantFlag: boolean = true
  get removeOctantFlag(): boolean{
    return this._removeOctantFlag
  }
  set removeOctantFlag(val: boolean){
    if (val === this._removeOctantFlag) return
    this._removeOctantFlag = val
    this.setOctantRemoval(this._removeOctantFlag)
  }

  public nehubaViewerPerspectiveOctantRemoval$ = this.store$.pipe(
    select(atlasAppearance.selectors.octantRemoval),
  )

  public auxMeshFormGroup: UntypedFormGroup = new UntypedFormGroup({})
  private auxMeshesNamesSet: Set<string> = new Set()
  public auxMeshes$ = this.store$.pipe(
    select(selectorAuxMeshes),
  )

  ngOnInit(): void {
    this.sub.push(

      this.nehubaViewerPerspectiveOctantRemoval$.subscribe(
        flag => this.removeOctantFlag = flag
      ),

      merge(
        of(null),
        this.auxMeshes$,
      ).pipe(
        pairwise()
      ).subscribe(([oldMeshes, meshes]) => {
        if (!!oldMeshes) {
          for (const mesh of oldMeshes) {
            this.auxMeshFormGroup.removeControl(mesh['@id'])
          }
        }
        if (meshes === null) {
          return
        }
        this.auxMeshesNamesSet.clear()
        for (const mesh of meshes) {
          this.auxMeshesNamesSet.add(mesh.ngId)
          this.auxMeshFormGroup.addControl(mesh['@id'], new UntypedFormControl(mesh.visible))
        }
      }),

      this.auxMeshFormGroup.valueChanges.pipe(
        withLatestFrom(this.auxMeshes$)
      ).subscribe(([v, auxMeshes]) => {
        if (!auxMeshes) return

        let changed = false
        const auxMeshesCopy = JSON.parse(JSON.stringify(auxMeshes))
        for (const key in v) {
          const found = auxMeshesCopy.find(mesh => mesh['@id'] === key)
          if (found && found.visible !== v[key]) {
            changed = true
            found.visible = v[key]
          }
        }

        if (changed) {
          this.store$.dispatch(
            actionSetAuxMeshes({
              payload: auxMeshesCopy
            })
          )
        }
      })
    )
  }

  constructor(
    private store$: Store<any>,
  ){

  }

  public setOctantRemoval(octantRemovalFlag: boolean): void {
    this.store$.dispatch(
      atlasAppearance.actions.setOctantRemoval({
        flag: octantRemovalFlag
      })
    )
  }

  public trackByAtId(_idx: number, obj: { ['@id']: string }): string {
    return obj['@id']
  }
}
