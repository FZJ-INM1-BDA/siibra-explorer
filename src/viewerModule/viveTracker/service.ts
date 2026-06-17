import { Injectable, OnDestroy, Optional, Inject } from "@angular/core";
import { BehaviorSubject, EMPTY, Observable, Subject } from "rxjs";
import { distinctUntilChanged, filter, switchMap, take, takeUntil, map, interval } from "rxjs/operators";
import { NehubaViewerUnit } from "../nehuba";
import { NEHUBA_INSTANCE_INJTKN } from "../nehuba/util";

export const VIVE_TRACKER_WS_URL = 'VIVE_TRACKER_WS_URL'

// Degrees to radians
function deg2rad(deg: number): number {
  return deg * Math.PI / 180
}

// Parse message format: "x=0.86 y=-1.092 z=3.763 | yaw=189.0 pitch=47.0 roll=89.2"
function parsePoseMessage(msg: string): TrackerPose | null {
  try {
    const m = msg.match(
      /x=([^\s]+)\s+y=([^\s]+)\s+z=([^\s]+)\s*\|\s*yaw=([^\s]+)\s+p(?:t)?itch=([^\s]+)\s+roll=([^\s]+)/
    )
    if (!m) return null
    return {
      x: parseFloat(m[1]),
      y: parseFloat(m[2]),
      z: parseFloat(m[3]),
      yaw:   parseFloat(m[4]),
      pitch: parseFloat(m[5]),
      roll:  parseFloat(m[6]),
    }
  } catch {
    return null
  }
}

// Convert yaw/pitch/roll (degrees, ZYX convention) to a quaternion [x,y,z,w]
function eulerToQuat(yawDeg: number, pitchDeg: number, rollDeg: number): [number, number, number, number] {
  const y = deg2rad(yawDeg)   / 2
  const p = deg2rad(pitchDeg) / 2
  const r = deg2rad(rollDeg)  / 2

  const cy = Math.cos(y), sy = Math.sin(y)
  const cp = Math.cos(p), sp = Math.sin(p)
  const cr = Math.cos(r), sr = Math.sin(r)

  return [
    sr * cp * cy - cr * sp * sy, // x
    cr * sp * cy + sr * cp * sy, // y
    cr * cp * sy - sr * sp * cy, // z
    cr * cp * cy + sr * sp * sy, // w
  ]
}

export type TrackerPose = {
  x: number; y: number; z: number
  yaw: number; pitch: number; roll: number
}

// Scale factor: tracker units (meters) → neuroglancer units (nm)
const POSITION_SCALE = 1_000_000

@Injectable()
export class ViveTrackerService implements OnDestroy {
  private destroy$ = new Subject<void>()

  public connected$ = new BehaviorSubject(false)
  public pose$ = new Subject<TrackerPose>()

  private vec3: any
  private quat: any

  constructor(
    @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) private nehubaInst$: Observable<NehubaViewerUnit>,
    @Optional() @Inject(VIVE_TRACKER_WS_URL) private wsUrl: string,
  ) {
    const url = this.wsUrl ?? 'ws://localhost:8765'

    const ws = new WebSocket(url)

    ws.onopen = () => this.connected$.next(true)
    ws.onclose = () => this.connected$.next(false)
    ws.onerror = (err) => console.error('[ViveTracker] WebSocket error', err)

    ws.onmessage = (event: MessageEvent) => {
      const pose = parsePoseMessage(event.data)
      if (pose) {
        this.pose$.next(pose)
      } else {
        console.warn('[ViveTracker] Could not parse message:', event.data)
      }
    }

    // Wait for nehuba/glMatrix to be ready
    interval(160).pipe(
      filter(() => !!(window as any).export_nehuba),
      take(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.vec3 = (window as any).export_nehuba.vec3
      this.quat = (window as any).export_nehuba.quat
    })

    // Apply poses to neuroglancer once nehuba instance is available
    this.nehubaInst$.pipe(
      switchMap(nehuba => {
        if (!nehuba) return EMPTY
        return this.pose$.pipe(
          map(pose => ({ nehuba, pose }))
        )
      }),
      filter(() => !!this.vec3 && !!this.quat),
      takeUntil(this.destroy$)
    ).subscribe(({ nehuba, pose }) => {
      this.applyPose(nehuba, pose)
    })
  }

  private applyPose(nehuba: NehubaViewerUnit, pose: TrackerPose): void {
    const navState = nehuba.nehubaViewer.ngviewer.navigationState

    // --- Position ---
    const { position } = navState.pose
    position.spatialCoordinates[0] = pose.x * POSITION_SCALE
    position.spatialCoordinates[1] = pose.y * POSITION_SCALE
    position.spatialCoordinates[2] = pose.z * POSITION_SCALE
    position.changed.dispatch()

    // --- Orientation ---
    const [qx, qy, qz, qw] = eulerToQuat(pose.yaw, pose.pitch, pose.roll)
    const orientation = navState.pose.orientation
    orientation.orientation[0] = qx
    orientation.orientation[1] = qy
    orientation.orientation[2] = qz
    orientation.orientation[3] = qw
    orientation.changed.dispatch()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
