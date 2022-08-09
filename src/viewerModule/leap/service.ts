import { DOCUMENT } from "@angular/common";
import { Inject, Injectable, Optional } from "@angular/core";
import { BehaviorSubject, EMPTY, interval, Observable, Subject } from "rxjs";
import { distinctUntilChanged, filter, map, switchMap, take, takeUntil } from "rxjs/operators";
import { NehubaViewerUnit } from "../nehuba";
import { NEHUBA_INSTANCE_INJTKN } from "../nehuba/util";

const PINCH_THRESHOLD = 0.80
const PALM_Z_THRESHOLD = 0.55
const ROTATION_SPEED = 0.0001
const ZOOM_SPEED = 40

type Finger = {
  extended: boolean
}

type Hand = {
  pinchStrength: number
  palmNormal: [number, number, number]
  palmVelocity: [number, number, number]

  thumb: Finger
  indexFinger: Finger
  middleFinger: Finger
  ringFinger: Finger
  pinky: Finger
}

export enum HandShape {
  PINCHING="PINCHING",
  POINTING_ONE_FINGER="POINTING_ONE_FINGER",
  POINTING_TWO_FINGERS="POINTING_TWO_FINGERS",
  PALM_FORWARD="PALM_FORWARD",
}

function getHandShape(hand: Hand): HandShape {
  if (!hand) return null
  if (hand.pinchStrength >= PINCH_THRESHOLD) return HandShape.PINCHING
  if (
    hand.thumb.extended &&
    hand.indexFinger.extended &&
    !hand.middleFinger.extended &&
    !hand.ringFinger.extended &&
    !hand.pinky.extended
  ) return HandShape.POINTING_ONE_FINGER
  if (
    hand.thumb.extended &&
    hand.indexFinger.extended &&
    hand.middleFinger.extended &&
    !hand.ringFinger.extended &&
    !hand.pinky.extended
  ) return HandShape.POINTING_TWO_FINGERS

  const palmNormalZ = hand.palmNormal[2]
  if (
    hand.thumb.extended &&
    hand.indexFinger.extended &&
    hand.middleFinger.extended &&
    hand.ringFinger.extended &&
    hand.pinky.extended &&
    palmNormalZ <= -PALM_Z_THRESHOLD
  ) return HandShape.PALM_FORWARD
  return null
}

@Injectable()
export class LeapService{
  static initFlag = false

  private destroy$ = new Subject()

  public leapReady$ = new BehaviorSubject(false)

  public hand$ = new Subject<Hand[]>()
  public gesture$ = new Subject<HandShape>()
  public palmVelocity$ = new Subject<[number, number, number]>()

  private sliceLock = false
  private vec3: any
  private quat: any

  private rotation: any
  private WORLD_UP: any
  private WORLD_RIGHT: any

  constructor(
    @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) private nehubaInst$: Observable<NehubaViewerUnit>,
    @Inject(DOCUMENT) document: Document,
  ){
    if (LeapService.initFlag) {
      console.error(`LeapService already initialised.`)
    }
    if (!(window as any).Leap) {
      console.error(`Leap not found. Terminating`)
      return
    }
    const lop = (window as any).Leap.loop({
      frame: frame => {
        this.leapReady$.next(true)
        this.hand$.next(frame?.hands)
        if (frame?.hands) {
          this.emitHand(frame.hands[0])
        }
      }
    })

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        lop.connection.disconnect()
      } else {
        lop.connection.reconnect()
      }
    })

    interval(160).pipe(
      filter(() => !!(window as any).export_nehuba),
      take(1)
    ).subscribe(() => {
      this.vec3 = (window as any).export_nehuba.vec3
      this.quat = (window as any).export_nehuba.quat
      
      this.rotation = this.quat.create()
      this.WORLD_UP = this.vec3.fromValues(0, 1, 0)
      this.WORLD_RIGHT = this.vec3.fromValues(1, 0, 0)
    })

    this.nehubaInst$.pipe(
      switchMap(nehuba => {
        if (!nehuba) return EMPTY
        return this.gesture$.pipe(
          distinctUntilChanged(),
          switchMap(gesture => {
            if (!gesture) return EMPTY
            return this.palmVelocity$.pipe(
              map(velocity => {
                return {
                  nehuba,
                  gesture,
                  velocity
                }
              })
            )
          })
        )
      }),
      takeUntil(this.destroy$)
    ).subscribe(({ gesture, nehuba, velocity }) => {
      if (gesture === HandShape.PINCHING) {
        const vel = velocity
        const temp = vel[1]
        vel[1] = -vel[2]
        vel[2] = temp
        this.leapToRotation(
          vel,
          ROTATION_SPEED * 4,
          nehuba.nehubaViewer.ngviewer.perspectiveNavigationState.pose.orientation
        )
        return
      }

      if (gesture === HandShape.PALM_FORWARD) {
        /**
         * zooming
         */
        const vel = -velocity[2]
        if (nehuba.nehubaViewer.ngviewer.navigationState.zoomFactor.value >= 10000) {
          nehuba.nehubaViewer.ngviewer.navigationState.zoomFactor.value += ZOOM_SPEED * vel;
        } else {
          nehuba.nehubaViewer.ngviewer.navigationState.zoomFactor.value = 10001;
        }
        return
      }

      if (gesture === HandShape.POINTING_ONE_FINGER) {
        /**
         * translating
         */
        const SPEED_SCALE = 5 * 8000 * (nehuba.nehubaViewer.ngviewer.navigationState.zoomFactor.value / 400000)
        const vel = velocity
        vel[1] = -vel[1]
        vel[2] = -vel[2]
        let cur = nehuba.nehubaViewer.ngviewer.perspectiveNavigationState.pose.orientation.orientation
        this.vec3.transformQuat(vel, vel, cur)
        const { position } = nehuba.nehubaViewer.ngviewer.navigationState.pose
        this.vec3.scaleAndAdd(
          position.spatialCoordinates,
          position.spatialCoordinates,
          vel,
          SPEED_SCALE
        )
        position.changed.dispatch();
      }

      if (gesture === HandShape.POINTING_TWO_FINGERS) {
        const ROTATION_SPEED = 0.0004;
        if (!this.sliceLock) {
          const vel = velocity
          const temp = vel[1]
          vel[0] = -vel[0]
          vel[1] = vel[2]
          vel[2] = -temp
          this.leapToRotation(
            vel,
            ROTATION_SPEED,
            nehuba.nehubaViewer.ngviewer.navigationState.pose.orientation,
            nehuba.nehubaViewer.ngviewer.perspectiveNavigationState.pose.orientation.orientation
          )
        }
      }
    })

    LeapService.initFlag = true
  }

  private leapToRotation(vel: [number, number, number], rotSpeed: number, orientationStream: any, camOrientation = null){
    let cur = orientationStream.orientation;
    const axis = this.vec3.create()
    if (camOrientation) {
      this.vec3.transformQuat(axis, this.WORLD_UP, camOrientation);
      this.vec3.transformQuat(axis, axis, cur);
    } else {
      this.vec3.transformQuat(axis, this.WORLD_UP, cur);
    }
    this.quat.setAxisAngle(this.rotation, axis, vel[0] * rotSpeed);
    this.quat.multiply(orientationStream.orientation, this.rotation, cur);
    cur = orientationStream.orientation;
    if (camOrientation) {
      this.vec3.transformQuat(axis, this.WORLD_RIGHT, camOrientation);
      this.vec3.transformQuat(axis, axis, cur);
    } else {
      this.vec3.transformQuat(axis, this.WORLD_RIGHT, cur);
    }
    this.quat.setAxisAngle(this.rotation, axis, vel[2] * rotSpeed);
    this.quat.multiply(orientationStream.orientation, this.rotation, cur);
    orientationStream.changed.dispatch();
  }

  private emitHand(hand: Hand){
    let handShape: HandShape
    try{
      handShape = getHandShape(hand)
      this.gesture$.next(
        handShape
      )
      this.palmVelocity$.next(
        hand?.palmVelocity
      )
    } catch (e) {
      console.error(e)
    }
  }
}
