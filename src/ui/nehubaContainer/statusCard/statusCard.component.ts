import { Component, Input } from "@angular/core";
import { Store } from "@ngrx/store";
import { LoggingService } from "src/services/logging.service";
import { CHANGE_NAVIGATION, ViewerStateInterface } from "src/services/stateStore.service";
import { NehubaViewerUnit } from "../nehubaViewer/nehubaViewer.component";

@Component({
  selector : 'ui-status-card',
  templateUrl : './statusCard.template.html',
  styleUrls : ['./statusCard.style.css'],
})
export class StatusCardComponent {

  @Input() public selectedTemplate: any;
  @Input() public isMobile: boolean;
  @Input() public nehubaViewer: NehubaViewerUnit;
  @Input() public onHoverSegmentName: string;

  constructor(
    private store: Store<ViewerStateInterface>,
    private log: LoggingService,
  ) {}

  public statusPanelRealSpace: boolean = true

  get mouseCoord(): string {
    return this.nehubaViewer ?
      this.statusPanelRealSpace ?
        this.nehubaViewer.mousePosReal ?
          Array.from(this.nehubaViewer.mousePosReal.map(n => isNaN(n) ? 0 : n / 1e6))
            .map(n => n.toFixed(3) + 'mm').join(' , ') :
          '0mm , 0mm , 0mm (mousePosReal not yet defined)' :
        this.nehubaViewer.mousePosVoxel ?
          this.nehubaViewer.mousePosVoxel.join(' , ') :
          '0 , 0 , 0 (mousePosVoxel not yet defined)' :
      '0 , 0 , 0 (nehubaViewer not defined)'
  }

  public editingNavState: boolean = false

  public textNavigateTo(string: string) {
    if (string.split(/[\s|,]+/).length >= 3 && string.split(/[\s|,]+/).slice(0, 3).every(entry => !isNaN(Number(entry.replace(/mm/, ''))))) {
      const pos = (string.split(/[\s|,]+/).slice(0, 3).map((entry) => Number(entry.replace(/mm/, '')) * (this.statusPanelRealSpace ? 1000000 : 1)))
      this.nehubaViewer.setNavigationState({
        position : (pos as [number, number, number]),
        positionReal : this.statusPanelRealSpace,
      })
    } else {
      this.log.log('input did not parse to coordinates ', string)
    }
  }

  public navigationValue() {
    return this.nehubaViewer ?
      this.statusPanelRealSpace ?
        Array.from(this.nehubaViewer.navPosReal.map(n => isNaN(n) ? 0 : n / 1e6))
          .map(n => n.toFixed(3) + 'mm').join(' , ') :
        Array.from(this.nehubaViewer.navPosVoxel.map(n => isNaN(n) ? 0 : n)).join(' , ') :
      `[0,0,0] (neubaViewer is undefined)`
  }

  /**
   * TODO
   * maybe have a nehuba manager service
   * so that reset navigation logic can stay there
   *
   * When that happens, we don't even need selectTemplate input
   *
   * the info re: nehubaViewer can stay there, too
   */
  public resetNavigation({rotation: rotationFlag = false, position: positionFlag = false, zoom : zoomFlag = false}: {rotation?: boolean, position?: boolean, zoom?: boolean}) {
    const initialNgState = this.selectedTemplate.nehubaConfig.dataset.initialNgState

    const perspectiveZoom = initialNgState ? initialNgState.perspectiveZoom : undefined
    const perspectiveOrientation = initialNgState ? initialNgState.perspectiveOrientation : undefined
    const zoom = (zoomFlag
      && initialNgState
      && initialNgState.navigation
      && initialNgState.navigation.zoomFactor)
      || undefined

    const position = (positionFlag
      && initialNgState
      && initialNgState.navigation
      && initialNgState.navigation.pose
      && initialNgState.navigation.pose.position.voxelCoordinates
      && initialNgState.navigation.pose.position.voxelCoordinates)
      || undefined

    const orientation = rotationFlag
      ? [0, 0, 0, 1]
      : undefined

    this.store.dispatch({
      type : CHANGE_NAVIGATION,
      navigation : {
        ...{
          perspectiveZoom,
          perspectiveOrientation,
          zoom,
          position,
          orientation,
        },
        ...{
          positionReal : false,
          animation : {},
        },
      },
    })
  }
}
