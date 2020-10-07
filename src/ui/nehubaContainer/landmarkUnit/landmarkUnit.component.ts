import { ChangeDetectionStrategy, Component, HostBinding, Input, OnChanges, SimpleChanges } from "@angular/core";

@Component({
  selector : 'nehuba-2dlandmark-unit',
  templateUrl : './landmarkUnit.template.html',
  styleUrls : [
    `./landmarkUnit.style.css`,
  ],
  changeDetection : ChangeDetectionStrategy.OnPush,
})

export class LandmarkUnit implements OnChanges {
  @Input() public positionX: number = 0
  @Input() public positionY: number = 0
  @Input() public positionZ: number = 0

  @Input() public color: [number, number, number]

  @Input() public highlight: boolean = false
  @Input() public flatProjection: boolean = false

  @Input() public fasClass: string = 'fa-map-marker'

  @HostBinding('style.transform')
  public transform: string = `translate(${this.positionX}px, ${this.positionY}px)`

  public className = `fas fa-map-marker`

  public nodeStyle = {
    color: `rgb(${NORMAL_COLOR.join(',')})`,
    'z-index': 0
  }

  public shadowStyle = {
    background: `radial-gradient(
      circle at center,
      rgba(${NORMAL_COLOR.join(',')},0.3) 10%,
      rgba(${NORMAL_COLOR.join(',')},0.8) 30%,
      rgba(0,0,0,0.8))`,
    transform : `scale(3,3)`,
  }

  public beamColorInner = {
    "transform" : `scale(1.0,1.0)`,
    'border-top-color' : `rgba(${NORMAL_COLOR.join(',')},0.8)`,
  }

  public beamColorOuter = {
    "transform" : `scale(1.5,1.0)`,
    'border-top-color' : 'rgb(0,0,0)',
  }

  public markerTransform = `translate(0px, 0px)`
  public beamTransform = `translate(0px, 0px) scale(1,0)`
  public beamDashedColor = {
    'border-left-color': `rgba(${NORMAL_COLOR.join(',')},0.8)`
  }
  public opacity: number = 1

  public ngOnChanges(simpleChanges: SimpleChanges) {
    const {
      positionX,
      positionY,
      positionZ,
      color,
      highlight,
      flatProjection,
      fasClass,
    } = simpleChanges

    if (fasClass) {
      this.className = `fas ${fasClass.currentValue}`
    }

    if (positionX || positionY) {
      this.transform = `translate(${positionX?.currentValue || this.positionX}px, ${positionY?.currentValue || this.positionY}px)`
    }

    if (color || positionZ || highlight) {
      const zIndex = (positionZ.currentValue || this.positionZ) >= 0 ? 0 : -2
      const nColor = color?.currentValue
        || this.color
        || (highlight?.currentValue || this.highlight)
        ? this.color? this.color : HOVER_COLOR : NORMAL_COLOR

      this.nodeStyle = {
        color: `rgb(${nColor.join(',')})`,
        'z-index': zIndex
      }


      const shadowStyleBackground = `radial-gradient(
        circle at center,
        rgba(${nColor.join(',')},0.3) 10%,
        rgba(${nColor.join(',')},0.8) 30%,
        rgba(0,0,0,0.8))`

      this.shadowStyle = {
        ...this.shadowStyle,
        background: shadowStyleBackground,
      }

      this.beamColorInner = {
        ...this.beamColorInner,
        'border-top-color' : `rgba(${nColor.join(',')},0.8)`, }
    }

    if (flatProjection || highlight || positionZ) {

      const flatProjectionVal = typeof flatProjection === 'undefined'
        ? this.flatProjection
        : flatProjection.currentValue

      const highlightVal = typeof highlight === 'undefined'
        ? this.highlight
        : flatProjection.currentValue

      const positionZVal = typeof positionZ === 'undefined'
        ? this.positionZ
        : positionZ.currentValue

      this.opacity = flatProjectionVal
        ? highlightVal
          ? 1.0
          : 10 / (Math.abs(positionZVal))
        : positionZVal >= 0
          ? 1.0
          : 0.4
    }

    if (positionZ) {
      this.markerTransform = `translate(0px, ${-1 * positionZ.currentValue}px)`
      this.beamTransform = `translate(0px, ${-1 * positionZ.currentValue / 2}px) scale(1,${Math.abs(positionZ.currentValue)})`
    }

    if (highlight) {
      console.log('highlight change')
      this.beamDashedColor = {
        'border-left-color' : `rgba(${highlight.currentValue ? HOVER_COLOR.join(',') : NORMAL_COLOR.join(',')}, 0.8)`,
      }
    }
  }
}

const NORMAL_COLOR: number[] = [201,54,38]
const HOVER_COLOR: number[] = [250,150,80]
