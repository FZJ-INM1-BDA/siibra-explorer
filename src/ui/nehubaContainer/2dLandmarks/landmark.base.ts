import { Directive, Input } from "@angular/core"

@Directive()
export class LandmarkUnitBase{
  @Input() public positionX: number = 0
  @Input() public positionY: number = 0
  @Input() public positionZ: number = 0

  @Input() public color: number[] = [255, 255, 255]
}
