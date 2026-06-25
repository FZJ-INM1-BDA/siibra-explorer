import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { select, Store } from "@ngrx/store";
import { combineLatest, merge, Observable, of, Subject } from "rxjs";
import { debounceTime, filter, map, takeUntil, withLatestFrom } from "rxjs/operators";
import { ShareModule } from "src/share";
import { AngularMaterialModule } from "src/sharedModules";
import { atlasAppearance, atlasSelection } from "src/state";
import { enLabels } from "src/uiLabels";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { SapiViewsUtilModule } from "../sapiViews";
import { MediaQueryDirective } from "src/util/directives/mediaQuery.directive";
import { DialogModule } from "src/ui/dialogInfo";

type PasteTarget = "pos"|"zoom"|"rot"

type NavigationState = {
  x: number
  y: number
  z: number

  zoom: number

  rotx: number
  roty: number
  rotz: number
  rotw: number
}


function parseString(input: string): number[]{
  return input
    .split(/[\s|,]+/)
    .map(v => {
      if (/mm$/.test(v)) {
        return v.replace(/mm$/, "")
      }
      return v
    })
    .map(Number)
}

function validateNumbers(input: (number|null|undefined)[]): input is number[]{
  return input.every(v => !Number.isNaN(v) && !!v || v === 0)
}

@Component({
  selector: 'sxplr-nav',
  templateUrl: './navigationInputs.template.html',
  styleUrls: [
    './navigationInputs.style.scss'
  ],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    ShareModule,
    SapiViewsUtilModule,
    MediaQueryDirective,
    DialogModule,
  ],
  hostDirectives: [
    DestroyDirective,
  ]
})

export class NavigationInput {

  #destroy$ = inject(DestroyDirective).destroyed$

  #pasted$ = new Subject<{target: PasteTarget, value: string}>()

  public navigationCtlForm = new FormGroup({
    x: new FormControl<string>('0'),
    y: new FormControl<string>('0'),
    z: new FormControl<string>('0'),
    
    zoom: new FormControl<string>('1'),

    rotx: new FormControl<string>('0'),
    roty: new FormControl<string>('0'),
    rotz: new FormControl<string>('0'),
    rotw: new FormControl<string>('1'),
  })

  constructor(private store: Store){

    const navStateFromPaste$: Observable<Partial<NavigationState>> = this.#pasted$.pipe(
      filter(({ value }) => !!value),
      map(({ value, target }) => {
        // TODO perhaps handle copy past full state (e.g. pos, zoom and rot?)
        if (target === "pos") {
          const [x, y, z] = parseString(value)
          return {
            x, y, z
          }
        }
        if (target === "rot") {
          const [ rotx, roty, rotz, rotw ] = parseString(value)
          return {
            rotx, roty, rotz, rotw
          }
        }
        return {}
      })
    )

    const navStateFromState$: Observable<NavigationState> = this.store.pipe(
      select(atlasSelection.selectors.navigation),
      filter(v => !!v),
      map(({ position, orientation, zoom }) => {
        const [x, y, z] = position.map(v => Number((v/1e6).toFixed(3)))
        const [rotx, roty, rotz, rotw] = orientation
        return {
          x, y, z,
          zoom,
          rotx, roty, rotz, rotw
        }  
      }),
    )

    merge(
      navStateFromState$,
      navStateFromPaste$,
    ).pipe(
      debounceTime(16),
      takeUntil(this.#destroy$)
    ).subscribe(({ x, y, z, zoom, rotx, roty, rotz, rotw }) => {
      let state: Partial<Record<keyof NavigationState, string>> = {}
      if (validateNumbers([x, y, z])) {
        state = {
          ...state,
          x: `${x}`,
          y: `${y}`,
          z: `${z}`, 
        }
      }
      if (zoom && validateNumbers([zoom])) {
        state = {
          ...state,
          zoom: `${zoom}`
        }
      }
      if (validateNumbers([rotx, roty, rotz, rotw])) {
        state = {
          ...state,
          rotx: `${rotx}`,
          roty: `${roty}`,
          rotz: `${rotz}`,
          rotw: `${rotw}`,
        }
      }
      this.navigationCtlForm.patchValue(state)
    })


    this.navigationCtlForm.valueChanges.pipe(
      takeUntil(this.#destroy$),
      debounceTime(500),
      withLatestFrom(navStateFromState$),
      filter(([ newState, oldState ]) => {
        for (const stateKey in newState) {
          if (newState[stateKey] !== oldState[stateKey].toString()) {
            return true
          }
        }
        return false
      }),
      map(([ newState, _oldState ]) => newState),
    ).subscribe(({ x, y, z, zoom, rotx, roty, rotz, rotw }) => {
      this.store.dispatch(
        atlasSelection.actions.navigateTo({
          navigation: {
            zoom: Number(zoom),
            position: [x, y, z].map(v => Number(v) * 1e6),
            orientation: [rotx, roty, rotz, rotw].map(v => Number(v)),
          },
          animation: true,
          physical: true
        })
      )
    })
  }

  #userSelectionDeducedState$ = combineLatest([
    this.store.pipe(
      select(atlasAppearance.selectors.useViewer),
      map(useviewer => {
        if (useviewer === "NEHUBA") return "nehuba" as const
        if (useviewer === "THREESURFER") return "threeSurfer" as const
        if (useviewer === "NOT_SUPPORTED") return "notsupported" as const
        return null
      })
    )
  ]).pipe(
    map(([ useViewer ]) => {
      return {
        useViewer
      }
    })
  )

  #atlasSelection$ = this.store.pipe(
    select(atlasSelection.selectors.navigation),
    map(nav => {
      return {
        zoom: nav?.zoom || 1,
        position: nav?.position || [0, 0, 0],
        orientation: nav?.orientation || [0, 0, 0, 1]
      }
    }),
  )

  #labels$ = of(enLabels)

  view$ = combineLatest([
    this.#userSelectionDeducedState$,
    this.#atlasSelection$,
    this.#labels$,
  ]).pipe(
    map(([ { useViewer }, { position }, labels ]) => {
      return {
        useViewer, position, labels, positionMm: position.map(v => v/1e6)
      }
    })
  )

  
  onPaste(ev: ClipboardEvent, target: PasteTarget="pos") {
    const text = ev.clipboardData?.getData('text/plain')
    if (!text) {
      return
    }
    this.#pasted$.next({ target, value: text})
  }
}
