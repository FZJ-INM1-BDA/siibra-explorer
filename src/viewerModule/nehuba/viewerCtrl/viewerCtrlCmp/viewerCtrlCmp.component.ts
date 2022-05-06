import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, Optional } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { merge, Observable, of, Subscription } from "rxjs";
import { pairwise, withLatestFrom} from "rxjs/operators";
import { NehubaViewerUnit } from "src/viewerModule/nehuba";
import { NEHUBA_INSTANCE_INJTKN } from "src/viewerModule/nehuba/util";
import { ARIA_LABELS } from 'common/constants'
import { actionSetAuxMeshes, selectorAuxMeshes } from "../../store";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
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

  private sub: Subscription[] = []

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

  public nehubaViewerPerspectiveOctantRemoval$ = this.store$.pipe(
    select(atlasAppearance.selectors.octantRemoval),
  )

  public auxMeshFormGroup: FormGroup = this.formBuilder.group({})
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
          this.auxMeshFormGroup.addControl(mesh['@id'], new FormControl(mesh.visible))
        }
        this.cdr.detectChanges()
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
        this.cdr.detectChanges()
      })
    )
  }

  constructor(
    private store$: Store<any>,
    private formBuilder: FormBuilder,
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

  public trackByAtId(_idx: number, obj: { ['@id']: string }): string {
    return obj['@id']
  }
}
