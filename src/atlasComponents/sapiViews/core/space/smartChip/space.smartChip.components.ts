import {ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import { SapiSpaceModel } from "src/atlasComponents/sapi/type";
import {select, Store} from "@ngrx/store";
import {actionSetAuxMeshes, selectorAuxMeshes} from "src/viewerModule/nehuba/store";
import {merge, of, Subscription} from "rxjs";
import {pairwise, withLatestFrom} from "rxjs/operators";
import {FormBuilder, FormControl, FormGroup} from "@angular/forms";

@Component({
  selector: 'sxplr-sapiviews-core-space-smartchip',
  templateUrl: './space.smartChip.template.html',
  styleUrls: ['./space.smartChip.style.css']
})

export class SapiViewCoreSpaceSmartChip implements OnInit {

  @Input('sxplr-sapiviews-core-space-smartchip-space')
  space: SapiSpaceModel

  @Input('sxplr-sapiviews-core-space-smartchip-all-spaces')
  spaces: SapiSpaceModel[]

  @Input('sxplr-sapiviews-core-space-smartchip-custom-color')
  customColor: string

  @Output('sxplr-sapiviews-core-space-smartchip-select-space')
  onSelectSpace = new EventEmitter<SapiSpaceModel>()

  public spaceSettingEnabled: boolean
  private sub: Subscription[] = []

  public auxMeshFormGroup: FormGroup = this.formBuilder.group({})
  private auxMeshesNamesSet: Set<string> = new Set()

  constructor(
    private store: Store,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,) {
  }

  ngOnInit() {
    this.sub.push(
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
          this.store.dispatch(
            actionSetAuxMeshes({
              payload: auxMeshesCopy
            })
          )
        }
        this.cdr.detectChanges()
      })
    )
  }

  selectSpace(space: SapiSpaceModel){
    if (this.trackByFn(space) === this.trackByFn(this.space)) return
    this.onSelectSpace.emit(space)
  }

  trackByFn(space: SapiSpaceModel){
    return space["@id"]
  }

  public auxMeshes$ = this.store.pipe(
    select(selectorAuxMeshes),
  )
  public trackByAtId(_idx: number, obj: { ['@id']: string }): string {
    return obj['@id']
  }

}
