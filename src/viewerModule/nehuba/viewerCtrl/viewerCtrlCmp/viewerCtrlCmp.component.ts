import { Component, HostBinding, Inject, Optional } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, merge, Observable, of, Subscription } from "rxjs";
import {filter, map, pairwise, withLatestFrom} from "rxjs/operators";
import { ngViewerActionSetPerspOctantRemoval } from "src/services/state/ngViewerState/actions";
import { ngViewerSelectorOctantRemoval } from "src/services/state/ngViewerState/selectors";
import { viewerStateCustomLandmarkSelector, viewerStateGetSelectedAtlas, viewerStateSelectedTemplatePureSelector } from "src/services/state/viewerState/selectors";
import { NehubaViewerUnit } from "src/viewerModule/nehuba";
import { NEHUBA_INSTANCE_INJTKN } from "src/viewerModule/nehuba/util";
import { ARIA_LABELS } from 'common/constants'
import { actionSetAuxMeshes, selectorAuxMeshes } from "../../store";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import {PureContantService} from "src/util";
import {ConfigStore} from "src/ui/config/configCmp/config.store";

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

  private _flagDelin = true
  get flagDelin(){
    return this._flagDelin
  }
  set flagDelin(flag){
    this._flagDelin = flag
    this.toggleParcVsbl()
  }

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
    select(ngViewerSelectorOctantRemoval),
  )

  public customLandmarks$: Observable<any> = this.store$.pipe(
    select(viewerStateCustomLandmarkSelector),
    map(lms => lms.map(lm => ({
      ...lm,
      geometry: {
        position: lm.position
      }
    }))),
  )

  public auxMeshFormGroup: FormGroup
  private auxMeshesNamesSet: Set<string> = new Set()
  public auxMeshes$ = this.store$.pipe(
    select(selectorAuxMeshes),
  )

  private nehubaInst: NehubaViewerUnit

  get ngViewer() {
    return this.nehubaInst?.nehubaViewer.ngviewer || (window as any).viewer
  }

  constructor(
    private store$: Store<any>,
    formBuilder: FormBuilder,
    private pureConstantService: PureContantService,
    public readonly configStore: ConfigStore,
    @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) private nehubaInst$: Observable<NehubaViewerUnit>,
  ){

    this.auxMeshFormGroup = formBuilder.group({})
  

    if (this.nehubaInst$) {
      this.sub.push(
        combineLatest([
          this.customLandmarks$,
          this.nehubaInst$,
        ]).pipe(
          filter(([_, nehubaInst]) => !!nehubaInst),
        ).subscribe(([landmarks, nehubainst]) => {
          this.setOctantRemoval(landmarks.length === 0)
          nehubainst.updateUserLandmarks(landmarks)
        }),
        this.nehubaInst$.subscribe(nehubaInst => this.nehubaInst = nehubaInst)
      )
    } else {
      console.warn(`NEHUBA_INSTANCE_INJTKN not provided`)
    }

    this.sub.push(
      this.store$.select(viewerStateGetSelectedAtlas)
        .pipe(filter(a => !!a))
        .subscribe(sa => this.selectedAtlasId = sa['@id']),
      this.store$.pipe(
        select(viewerStateSelectedTemplatePureSelector)
      ).subscribe(tmpl => {
        this.selectedTemplateId = tmpl['@id']
        const { useTheme } = tmpl || {}
        this.darktheme = useTheme === 'dark'
      }),

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

  private async toggleParcVsbl(){
    const viewerConfig = await this.pureConstantService.getViewerConfig(this.selectedAtlasId, this.selectedTemplateId, null)

    if (this.flagDelin) {
      for (const name of this.hiddenLayerNames) {
        const l = this.ngViewer.layerManager.getLayerByName(name)
        l && l.setVisible(true)
      }
      this.hiddenLayerNames = []
    } else {
      this.hiddenLayerNames = []
      const segLayerNames: string[] = []
      for (const layer of this.ngViewer.layerManager.managedLayers) {
        if (layer.visible && layer.name in viewerConfig) {
          segLayerNames.push(layer.name)
        }
      }
      for (const name of segLayerNames) {
        const l = this.ngViewer.layerManager.getLayerByName(name)
        l && l.setVisible(false)
        this.hiddenLayerNames.push( name )
      }
    }

    requestAnimationFrame(() => {
      this.ngViewer.display.scheduleRedraw()
    })
  }

  public setOctantRemoval(octantRemovalFlag: boolean) {
    this.store$.dispatch(
      ngViewerActionSetPerspOctantRemoval({
        octantRemovalFlag
      })
    )
  }

  public trackByAtId(_idx: number, obj: { ['@id']: string }) {
    return obj['@id']
  }
}
