import { Input } from "@angular/core"

export class LandmarkUnitBase{
  @Input() public positionX: number = 0
  @Input() public positionY: number = 0
  @Input() public positionZ: number = 0
}
