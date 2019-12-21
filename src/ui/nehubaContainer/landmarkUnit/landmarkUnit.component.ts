import { ChangeDetectionStrategy, Component, HostBinding, Input, OnChanges } from "@angular/core";

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

  @Input() public highlight: boolean = false
  @Input() public flatProjection: boolean = false

  @Input() public fasClass: string = 'fa-map-marker'

  @HostBinding('style.transform')
  public transform: string = `translate(${this.positionX}px, ${this.positionY}px)`

  get className() {
    return `fas ${this.fasClass}`
  }
  public styleNode() {
    return({
      'color' : `rgb(${this.highlight ? HOVER_COLOR : NORMAL_COLOR})`,
      'z-index' : this.positionZ >= 0 ? 0 : -2,
    })
  }

  public ngOnChanges() {
    this.transform = `translate(${this.positionX}px, ${this.positionY}px)`
  }

  public calcOpacity(): number {
    return this.flatProjection ?
      this.calcOpacityFlatMode() :
      this.positionZ >= 0 ?
        1 :
        0.4
  }

  public calcOpacityFlatMode(): number {
    return this.highlight ? 1.0 : 10 / (Math.abs(this.positionZ) + 10)
  }

  public styleShadow() {

    return ({
      background: `radial-gradient(
        circle at center,
        rgba(${this.highlight ? HOVER_COLOR + ',0.3' : NORMAL_COLOR + ',0.3'}) 10%,
        rgba(${this.highlight ? HOVER_COLOR + ',0.8' : NORMAL_COLOR + ',0.8'}) 30%,
        rgba(0,0,0,0.8))`,
      transform : `scale(3,3)`,
    })
  }

  get markerTransform() {
    return `translate(0px, ${-1 * this.positionZ}px)`
  }

  get beamTransform() {
    return `translate(0px, ${-1 * this.positionZ / 2}px) scale(1,${Math.abs(this.positionZ)})`
  }

  public styleBeamDashedColor() {
    return({
      'border-left-color' : `rgba(${this.highlight ? HOVER_COLOR + ',0.8' : NORMAL_COLOR + ',0.8'})`,
    })
  }

  public styleBeamColor(inner: boolean) {
    return inner ? ({
      "transform" : `scale(1.0,1.0)`,
      'border-top-color' : `rgba(${this.highlight ? HOVER_COLOR + ',0.8' : NORMAL_COLOR + ',0.8'})`,
    }) : ({
      "transform" : `scale(1.5,1.0)`,
      'border-top-color' : 'rgb(0,0,0)',
    })
  }
}

const NORMAL_COLOR: string = '201,54,38'
const HOVER_COLOR: string = '250,150,80'
