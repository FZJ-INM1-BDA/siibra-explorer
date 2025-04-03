import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, Optional, inject } from "@angular/core";
import { add, getUuid, mul } from "src/util/fn";
import { timedValues } from "src/util/generator";
import { AUTO_ROTATE, TAutoRotatePayload, ViewerInternalStateSvc } from "src/viewerModule/viewerInternalState.service";
import { MatSnackBar } from 'src/sharedModules/angularMaterial.exports'
import { FormControl, FormGroup } from "@angular/forms";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { debounceTime, filter, takeUntil } from "rxjs/operators";

type TStoredState = {
  name: string
  duration: number
  viewerType: string
  payload: any
}

@Component({
  selector: 'key-frame-controller',
  templateUrl: './keyframeCtrl.template.html',
  styleUrls: [
    './keyframeCtrl.style.css'
  ],
  hostDirectives: [DestroyDirective]
})

export class KeyFrameCtrlCmp {

  #onDestroy$ = inject(DestroyDirective).destroyed$

  public currState: any
  public currViewerType: string
  public internalStates: TStoredState[] = []

  autoRotateFormGrp = new FormGroup({
    autorotate: new FormControl<boolean>(false),
    autoRotateSpeed: new FormControl<number>({
      value: 2,
      disabled: true,
    }),
    autorotateReverse: new FormControl<boolean>({
      value: false,
      disabled: true,
    })
  })

  frameFormGrp = new FormGroup({
    loop: new FormControl<boolean>(false),
    linearCamera: new FormControl<boolean>(false),
    steps: new FormGroup({})
  })

  constructor(
    private snackbar: MatSnackBar,
    @Optional() private viewerInternalSvc: ViewerInternalStateSvc
  ){
    if (!viewerInternalSvc) {
      this.snackbar.open(`error: ViewerInternalStateSvc not injected.`)
      return
    }

    viewerInternalSvc.viewerInternalState$.pipe(
      takeUntil(this.#onDestroy$),
      filter(v => !!v),
    ).subscribe(state => {
      this.currState = state.payload
      this.currViewerType = state.viewerType
    })

    this.autoRotateFormGrp.controls.autorotate.valueChanges.pipe(
      takeUntil(this.#onDestroy$)
    ).subscribe(value => {
      const { autoRotateSpeed, autorotateReverse } = this.autoRotateFormGrp.controls
      if (value) {
        autoRotateSpeed.enable()
        autorotateReverse.enable()
      } else {
        autoRotateSpeed.disable()
        autorotateReverse.disable()
      }
    })

    this.autoRotateFormGrp.valueChanges.pipe(
      debounceTime(160),
      takeUntil(this.#onDestroy$),
    ).subscribe({
      next: values => {
        const { autoRotateSpeed, autorotate, autorotateReverse } = values
        this.#setAutoRotate(autorotate, autoRotateSpeed, autorotateReverse)
      },
      complete: () => {
        this.#setAutoRotate(false, 0, false)
      }
    })

    this.#onDestroy$.subscribe(() => {
      this.isPlaying = false
    })
  }

  addKeyFrame(){
    this.internalStates = [
      ...this.internalStates,
      {
        name: `Frame ${this.internalStates.length + 1}`,
        duration: 1000,
        viewerType: this.currViewerType,
        payload: this.currState
      }
    ]
  }

  #setAutoRotate(play: boolean, speed: number, reverse: boolean) {
    
    this.viewerInternalSvc.applyInternalState<TAutoRotatePayload>({
      "@id": getUuid(),
      "@type": 'TViewerInternalStateEmitterEvent',
      payload: {
        play,
        speed,
        reverse,
      },
      viewerType: AUTO_ROTATE
    })
  }

  private raf: number
  
  public isPlaying = false
  async togglePlay(){
    if (this.isPlaying) {
      this.isPlaying = false
      return
    }

    if (this.internalStates.length === 0) {
      return
    }

    this.isPlaying = true

    let idx = 0
    this.gotoFrame(this.internalStates[0])

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (!this.isPlaying) break
      try {
        if (!this.internalStates[idx]) {
          const loopFlag = this.frameFormGrp.controls.loop.value
          if (!loopFlag) {
            break
          }
          idx = idx - this.internalStates.length
        }
        
        await this.animateFrame(
          this.internalStates[idx % this.internalStates.length],
          this.internalStates[(idx + 1) % this.internalStates.length]
        )
        idx ++
      } catch (e) {
        // user interrupted
        console.log(e)
        break
      }
    }
    this.isPlaying = false
  }
  private async animateFrame(fromFrame: TStoredState, toFrame: TStoredState) {
    const { viewerType: fViewerType } = fromFrame
    const { viewerType: tViewerType } = toFrame
    if (fViewerType !== tViewerType) {
      console.warn(`from and to type must be the same, but ${fViewerType} !== ${tViewerType}`)
      return
    }
    let getFrame: ((value: number) => void)|undefined
    if (fViewerType === "ThreeSurfer") {
      getFrame = this.#getThreeSurferFrameGen(fromFrame, toFrame)
    }
    if (fViewerType === "nehuba") {
      getFrame = this.#getNgFrameGen(fromFrame, toFrame)
    }
    if (!getFrame) {
      // TODO catch when getFrame is not set
      return
    }
    return new Promise((rs, rj) => {

      const gen = timedValues(toFrame.duration)

      const animate = () => {
        if (!this.isPlaying) {
          this.raf = null
          return rj('User interrupted')
        }
        const next = gen.next()
        const d = next.value
        getFrame(d)

        if (next.done) {
          this.raf = null

          rs('')
        } else {
          this.raf = requestAnimationFrame(() => {
            animate()
          })
        }
      }
      this.raf = requestAnimationFrame(() => {
        animate()
      })
    })
  }

  #getThreeSurferFrameGen(fromFrame: TStoredState, toFrame: TStoredState) {
    const toPayloadCamera = (toFrame.payload as any).camera
    const fromPayloadCamera = (fromFrame.payload as any).camera

    const delta = {
      x: toPayloadCamera.x - fromPayloadCamera.x,
      y: toPayloadCamera.y - fromPayloadCamera.y,
      z: toPayloadCamera.z - fromPayloadCamera.z,
    }
    const linearFlag = this.frameFormGrp.controls.linearCamera.value
    const applyDelta = (() => {
      if (linearFlag) {
        return (d: number) => {
          return {
            x: delta.x * d + fromPayloadCamera.x,
            y: delta.y * d + fromPayloadCamera.y,
            z: delta.z * d + fromPayloadCamera.z,
          }
        }
      } else {
        const THREE = (window as any).ThreeSurfer.THREE
        const idQ = new THREE.Quaternion()
        const targetQ = new THREE.Quaternion()
        const vec1 = new THREE.Vector3(
          fromPayloadCamera.x,
          fromPayloadCamera.y,
          fromPayloadCamera.z,
        )

        const startVec = vec1.clone()
        const vec2 = new THREE.Vector3(
          toPayloadCamera.x,
          toPayloadCamera.y,
          toPayloadCamera.z,
        )
        
        const modRatio = (vec2.lengthSq() / vec1.lengthSq()) ** 0.5
        
        vec1.normalize()
        vec2.normalize()

        targetQ.setFromUnitVectors(vec1, vec2)

        return (d: number) => {
          const scale = d * modRatio + (1 - d)

          const deltaQ = idQ.clone()
          deltaQ.slerp(targetQ, d)
          const v = startVec.clone()
          v.applyQuaternion(deltaQ)
          v.multiplyScalar(scale)
          return {
            x: v.x,
            y: v.y,
            z: v.z
          }
        }
      }
    })()
    return (value: number) => {
      if (this.viewerInternalSvc) {
        const camera = applyDelta(value)
        this.viewerInternalSvc.applyInternalState({
          "@id": getUuid(),
          "@type": "TViewerInternalStateEmitterEvent",
          viewerType: fromFrame.viewerType,
          payload: {
            camera
          }
        })
      }
    }
  }

  #getNgFrameGen(fromFrame: TStoredState, toFrame: TStoredState){
    const { payload: fPayload } = fromFrame
    const { payload: tPayload } = toFrame
    const keys = [
      "zoom", 
      "perspectiveZoom", 
      "position", 
      "orientation", 
      "perspectiveOrientation", 
    ]

    const delta = {}
    for (const key of keys){
      delta[key] = add(mul(fPayload[key], -1), tPayload[key])
    }
    return (value: number) => {
      if (this.viewerInternalSvc) {
        const clone = structuredClone(fPayload)
        
        for (const key of keys){
          clone[key] = add(mul(delta[key], value), fPayload[key])
        }

        this.viewerInternalSvc.applyInternalState({
          '@id': '',
          '@type': 'TViewerInternalStateEmitterEvent',
          viewerType: 'nehuba',
          payload: {
            ...clone,
            positionReal: true
          }
        })
      }
    }
  }

  gotoFrame(item: TStoredState) {
    if (this.viewerInternalSvc) {
      this.viewerInternalSvc.applyInternalState({
        "@id": getUuid(),
        "@type": "TViewerInternalStateEmitterEvent",
        viewerType: item.viewerType,
        payload: item.payload
      })
    }
  }

  removeFrame(item: TStoredState){
    this.internalStates = this.internalStates.filter(v => item !== v)
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.internalStates, event.previousIndex, event.currentIndex);
  }

  displayWith(value: number) {
    return `${(value / 1e3).toFixed(1)}s`
  }
}
