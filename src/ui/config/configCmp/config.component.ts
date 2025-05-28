import { Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core'
import { select, Store } from '@ngrx/store';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, shareReplay, startWith, take } from 'rxjs/operators';
import { isIdentityQuat } from 'src/viewerModule/nehuba/util';
import { MatSlideToggleChange } from 'src/sharedModules/angularMaterial.exports'
import { atlasSelection, userPreference, userInterface } from 'src/state';
import { Z_TRAVERSAL_MULTIPLIER } from 'src/viewerModule/nehuba/layerCtrl.service/layerCtrl.util';
import { FormControl, FormGroup } from '@angular/forms';


const Z_TRAVERSAL_TOOLTIP = `Value to use when traversing z level. If toggled off, will use the voxel dimension of the template.`
const GPU_TOOLTIP = `Higher GPU usage can cause crashes on lower end machines`
const ANIMATION_TOOLTIP = `Animation can cause slowdowns in lower end machines`
const MOBILE_UI_TOOLTIP = `Mobile UI enables touch controls`
const ROOT_TEXT_ORDER: [string, string, string, string] = ['Coronal', 'Sagittal', 'Axial', '3D']
const OBLIQUE_ROOT_TEXT_ORDER: [string, string, string, string] = ['Slice View 1', 'Slice View 2', 'Slice View 3', '3D']

@Component({
  selector: 'config-component',
  templateUrl: './config.template.html',
  styleUrls: [
    './config.style.css',
  ],
})

export class ConfigComponent implements OnInit, OnDestroy {

  customZFormGroup = new FormGroup({
    customZValue: new FormControl<number>({
      value: 1,
      disabled: true
    }),
    customZFlag: new FormControl<boolean>(false)
  })

  public Z_TRAVERSAL_TOOLTIP = Z_TRAVERSAL_TOOLTIP
  public GPU_TOOLTIP = GPU_TOOLTIP
  public ANIMATION_TOOLTIP = ANIMATION_TOOLTIP
  public MOBILE_UI_TOOLTIP = MOBILE_UI_TOOLTIP

  public experimentalFlag$ = this.store.pipe(
    select(userPreference.selectors.showExperimental)
  )

  public panelModes: Record<string, userInterface.PanelMode> = {
    FOUR_PANEL: "FOUR_PANEL",
    H_ONE_THREE: "H_ONE_THREE",
    SINGLE_PANEL: "SINGLE_PANEL",
    PIP_PANEL: "PIP_PANEL",
    V_ONE_THREE: "V_ONE_THREE",
  }


  /**
   * in MB
   */
  public gpuLimit$ = this.store.pipe(
    select(userPreference.selectors.gpuLimit),
    map(v => v / 1e6),
  )

  public useMobileUI$: Observable<boolean> = this.store.pipe(
    select(userPreference.selectors.useMobileUi),
  )
  public animationFlag$ = this.store.pipe(
    select(userPreference.selectors.useAnimation),
  )
  private subscriptions: Subscription[] = []

  public gpuMin: number = 100
  public gpuMax: number = 1000

  public panelMode$ = this.store.pipe(
    select(userInterface.selectors.panelMode),
    map(panelMode => panelMode || "FOUR_PANEL")
  )

  #panelOrder$ = this.store.pipe(
    select(userInterface.selectors.panelOrder),
    shareReplay(1),
  )

  private viewerObliqueRotated$ = this.store.pipe(
    select(atlasSelection.selectors.navigation),
    map(navigation => navigation?.orientation || [0, 0, 0, 1]),
    debounceTime(100),
    map(isIdentityQuat),
    map(flag => !flag),
    distinctUntilChanged(),
  )
  public panelTexts$ = combineLatest([
    this.#panelOrder$.pipe(
      map(panelOrder => panelOrder.split('').map(s => Number(s))),
    ),
    this.viewerObliqueRotated$,
  ]).pipe(
    map(([arr, isObliqueRotated]) => arr.map(idx => (isObliqueRotated ? OBLIQUE_ROOT_TEXT_ORDER : ROOT_TEXT_ORDER)[idx]) as [string, string, string, string]),
    startWith(ROOT_TEXT_ORDER),
  )

  constructor(
    private store: Store<any>,
    @Optional() @Inject(Z_TRAVERSAL_MULTIPLIER) private zTraversalMult$: Observable<number> = of(1)
  ) {
  }

  public ngOnInit() {
    this.subscriptions.push(
      combineLatest([
        this.zTraversalMult$,
        this.store.pipe(
          select(userPreference.selectors.overrideZTraversalMultiplier),
          map(val => !!val)
        ),
      ]).subscribe(([ zVal, customZFlag ]) => {
        this.customZFormGroup.setValue({
          customZFlag: customZFlag,
          customZValue: zVal
        })
      }),
      this.customZFormGroup.valueChanges.pipe(
        map(v => v.customZFlag),
        distinctUntilChanged(),
      ).subscribe(customZFlag => {
        if (customZFlag !== this.customZFormGroup.controls.customZValue.enabled) {
          if (customZFlag) {
            this.customZFormGroup.controls.customZValue.enable()
          } else {
            this.customZFormGroup.controls.customZValue.disable()
          }
        }
      }),
      this.customZFormGroup.valueChanges.pipe(
        debounceTime(160)
      ).subscribe(() => {
        const { customZFlag, customZValue } = this.customZFormGroup.value
        // if customzflag is unset, unset zmultiplier
        if (!customZFlag) {
          this.store.dispatch(
            userPreference.actions.setZMultiplier({
              value: null
            })
          )
          return
        }
        // if the entered value cannot be parsed to number, skip for now.
        if (customZValue) {
          this.store.dispatch(
            userPreference.actions.setZMultiplier({
              value: customZValue
            })
          )
        }
      })
    )
  }

  public ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  public toggleMobileUI(ev: MatSlideToggleChange) {
    const { checked } = ev
    this.store.dispatch(
      userPreference.actions.useMobileUi({
        flag: checked
      })
    )
  }

  public toggleAnimationFlag(ev: MatSlideToggleChange ) {
    const { checked } = ev
    this.store.dispatch(
      userPreference.actions.setAnimationFlag({
        flag: checked
      })
    )
  }

  public updateGpuLimit(newVal: number){
    this.store.dispatch(
      userPreference.actions.setGpuLimit({
        limit: newVal * 1e6
      })
    )
  }
  public usePanelMode(panelMode: userInterface.PanelMode) {

    this.store.dispatch(
      userInterface.actions.setPanelMode({
        panelMode
      })
    )
  }

  public async handleDrop(event: DragEvent) {
    event.preventDefault()
    const droppedAttri = (event.target as HTMLElement).getAttribute('panel-order')
    const draggedAttri = event.dataTransfer.getData('text/plain')
    if (droppedAttri === draggedAttri) { return }
    const idx1 = Number(droppedAttri)
    const idx2 = Number(draggedAttri)
    const panelOrder = await this.#panelOrder$.pipe(
      take(1)
    ).toPromise()
    const arr = panelOrder.split('');

    [arr[idx1], arr[idx2]] = [arr[idx2], arr[idx1]]
    this.store.dispatch(
      userInterface.actions.setPanelOrder({
        order: arr.join('')
      })
    )
  }
  public handleDragOver(event: DragEvent) {
    event.preventDefault()
    const target = (event.target as HTMLElement)
    target.classList.add('onDragOver')
  }
  public handleDragLeave(event: DragEvent) {
    (event.target as HTMLElement).classList.remove('onDragOver')
  }
  public handleDragStart(event: DragEvent) {
    const target = (event.target as HTMLElement)
    const attri = target.getAttribute('panel-order')
    event.dataTransfer.setData('text/plain', attri)

  }
  public handleDragend(event: DragEvent) {
    const target = (event.target as HTMLElement)
    target.classList.remove('onDragOver')
  }

  public updateExperimentalFlag(event: MatSlideToggleChange) {
    this.store.dispatch(
      userPreference.actions.setShowExperimental({
        flag: event.checked
      })
    )
  }

  public stepSize: number = 10
}
