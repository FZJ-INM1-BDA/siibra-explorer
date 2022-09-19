import {Component, OnDestroy, OnInit} from "@angular/core";
import {Observable, Subscription} from "rxjs";
import {select, Store} from "@ngrx/store";
import {userPreference} from "src/state";
import {map} from "rxjs/operators";
import {MatSlideToggleChange} from "@angular/material/slide-toggle";
import {MatSliderChange} from "@angular/material/slider";

const GPU_TOOLTIP = `Higher GPU usage can cause crashes on lower end machines`
const ANIMATION_TOOLTIP = `Animation can cause slowdowns in lower end machines`
const MOBILE_UI_TOOLTIP = `Mobile UI enables touch controls`

@Component({
  selector: 'hardware-config-component',
  templateUrl: './hardwareConfig.template.html',
  styleUrls: [
    './hardwareConfig.style.css',
  ],
})

export class HardwareConfigComponent {

  public GPU_TOOLTIP = GPU_TOOLTIP
  public ANIMATION_TOOLTIP = ANIMATION_TOOLTIP
  public MOBILE_UI_TOOLTIP = MOBILE_UI_TOOLTIP


  /**
   * in MB
   */
  public gpuLimit$: Observable<number>

  public useMobileUI$: Observable<boolean> = this.store.pipe(
    select(userPreference.selectors.useMobileUi)
  )
  public animationFlag$: Observable<boolean>

  public gpuMin: number = 100
  public gpuMax: number = 1000
  public stepSize: number = 10

  constructor(private store: Store<any>,) {
    this.gpuLimit$ = this.store.pipe(
      select(userPreference.selectors.gpuLimit),
      map(v => v / 1e6),
    )

    this.animationFlag$ = this.store.pipe(
      select(userPreference.selectors.useAnimation)
    )
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

  public handleMatSliderChange(ev: MatSliderChange) {
    this.store.dispatch(
      userPreference.actions.setGpuLimit({
        limit: ev.value * 1e6
      })
    )
  }

}