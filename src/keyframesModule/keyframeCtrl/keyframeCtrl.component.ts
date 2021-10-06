import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, OnDestroy, Optional } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Subscription } from "rxjs";
import { getUuid } from "src/util/fn";
import { timedValues } from "src/util/generator";
import { TInteralStatePayload, ViewerInternalStateSvc } from "src/viewerModule/viewerInternalState.service";

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
  ]
})

export class KeyFrameCtrlCmp implements OnDestroy {

  public loopFlag = false
  public linearFlag = false
  public currState: any
  private currViewerType: string
  public internalStates: TStoredState[] = []

  private subs: Subscription[] = []

  ngOnDestroy(){
    while(this.subs.length) this.subs.pop().unsubscribe()
  }

  constructor(
    private snackbar: MatSnackBar,
    @Optional() private viewerInternalSvc: ViewerInternalStateSvc
  ){
    if (!viewerInternalSvc) {
      this.snackbar.open(`error: ViewerInternalStateSvc not injected.`)
      return
    }

    this.subs.push(
      viewerInternalSvc.viewerInternalState$.pipe(
      ).subscribe(state => {
        this.currState = state.payload
        this.currViewerType = state.viewerType
      })
    )
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

  private raf: number
  
  private isPlaying = false
  async togglePlay(){
    if (this.isPlaying) {
      this.isPlaying = false
      return
    }
    this.isPlaying = true

    let idx = 0
    this.gotoFrame(this.internalStates[0])
    while (true) {
      try {
        await this.animateFrame(
          this.internalStates[idx % this.internalStates.length],
          this.internalStates[(idx + 1) % this.internalStates.length]
        )
        idx ++
        if (idx >= this.internalStates.length-1 && !this.loopFlag) break
      } catch (e) {
        // user interrupted
        console.log(e)
      }
    }
    this.isPlaying = false
  }
  private async animateFrame(fromFrame: TStoredState, toFrame: TStoredState) {
    const toPayloadCamera = (toFrame.payload as any).camera
    const fromPayloadCamera = (fromFrame.payload as any).camera

    const delta = {
      x: toPayloadCamera.x - fromPayloadCamera.x,
      y: toPayloadCamera.y - fromPayloadCamera.y,
      z: toPayloadCamera.z - fromPayloadCamera.z,
    }

    const applyDelta = (() => {
      if (this.linearFlag) {
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
        const vec1Length = vec1.length()
        const vec2 = new THREE.Vector3(
          toPayloadCamera.x,
          toPayloadCamera.y,
          toPayloadCamera.z,
        )
        const vec2Length = vec2.length()
        vec1.normalize()
        vec2.normalize()

        targetQ.setFromUnitVectors(vec1, vec2)

        return (d: number) => {
          const deltaQ = idQ.clone()
          deltaQ.slerp(targetQ, d)
          const v = startVec.clone()
          v.applyQuaternion(deltaQ)
          return {
            x: v.x,
            y: v.y,
            z: v.z
          }
        }
      }
    })()

    const gen = timedValues(toFrame.duration)

    return new Promise((rs, rj) => {

      const animate = () => {
        if (!this.isPlaying) {
          this.raf = null
          return rj('User interrupted')
        }
        const next = gen.next()
        const d = next.value

        if (this.viewerInternalSvc) {
          const camera = applyDelta(d)
          this.viewerInternalSvc.applyInternalState({
            "@id": getUuid(),
            "@type": "TViewerInternalStateEmitterEvent",
            viewerType: fromFrame.viewerType,
            payload: {
              camera
            }
          })
        }

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
}
