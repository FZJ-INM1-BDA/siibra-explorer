import { Component, HostBinding, Inject, Optional } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { merge, Observable, of, Subscription } from "rxjs";
import { pairwise, withLatestFrom} from "rxjs/operators";
import { NehubaViewerUnit } from "src/viewerModule/nehuba";
import { NEHUBA_INSTANCE_INJTKN } from "src/viewerModule/nehuba/util";
import { ARIA_LABELS } from 'common/constants'
import { actionSetAuxMeshes, selectorAuxMeshes } from "../../store";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { PureContantService } from "src/util";
import { atlasSelection, atlasAppearance } from "src/state";

@Component({
  selector: 'viewer-ctrl-component',
  templateUrl: './viewerCtrlCmp.template.html',
  styleUrls: [
    './viewerCtrlCmp.style.css'
  ],
  exportAs: 'viewerCtrlCmp'
})

export class ViewerCtrlCmp{

  public ARIA_LABELS = ARIA_LABELS

  @HostBinding('attr.darktheme')
  darktheme = false

  private selectedAtlasId: string
  private selectedTemplateId: string


  private sub: Subscription[] = []
  private hiddenLayerNames: string[] = []

  private _removeOctantFlag: boolean
  get removeOctantFlag(){
    return this._removeOctantFlag
  }
  set removeOctantFlag(val){
    if (val === this._removeOctantFlag) return
    this._removeOctantFlag = val
    this.setOctantRemoval(this._removeOctantFlag)
  }

  public nehubaViewerPerspectiveOctantRemoval$ = this.store$.pipe(
    select(atlasAppearance.selectors.octantRemoval),
  )

  public auxMeshFormGroup: FormGroup
  private auxMeshesNamesSet: Set<string> = new Set()
  public auxMeshes$ = this.store$.pipe(
    select(selectorAuxMeshes),
  )

  constructor(
    private store$: Store<any>,
    formBuilder: FormBuilder,
    private pureConstantService: PureContantService,
    @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) private nehubaInst$: Observable<NehubaViewerUnit>,
  ){

    this.auxMeshFormGroup = formBuilder.group({})
  

    // TODO move this to... nehubadirective?
    if (this.nehubaInst$) {
      this.sub.push(
        // combineLatest([
        //   this.customLandmarks$,
        //   this.nehubaInst$,
        // ]).pipe(
        //   filter(([_, nehubaInst]) => !!nehubaInst),
        // ).subscribe(([landmarks, nehubainst]) => {
        //   this.setOctantRemoval(landmarks.length === 0)
        //   nehubainst.updateUserLandmarks(landmarks)
        // }),
      )
    } else {
      console.warn(`NEHUBA_INSTANCE_INJTKN not provided`)
    }

    this.sub.push(

      this.store$.pipe(
        select(atlasSelection.selectors.selectedATP)
      ).subscribe(({ atlas, parcellation, template }) => {
        this.selectedAtlasId = atlas["@id"]
        this.selectedTemplateId = template["@id"]
      }),

      this.pureConstantService.darktheme$.subscribe(darktheme => this.darktheme = darktheme),

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

  public setOctantRemoval(octantRemovalFlag: boolean) {
    this.store$.dispatch(
      atlasAppearance.actions.setOctantRemoval({
        flag: octantRemovalFlag
      })
    )
  }

  public trackByAtId(_idx: number, obj: { ['@id']: string }) {
    return obj['@id']
  }
}
