import { Component } from '@angular/core';
import {ChangePerspectiveOrientationService} from "src/viewerModule/nehuba/viewerCtrl/change-perspective-orientation/changePerspectiveOrientation.service";

@Component({
  selector: 'app-change-perspective-orientation',
  templateUrl: './changePerspectiveOrientation.component.html',
  styleUrls: ['./changePerspectiveOrientation.component.sass']
})
export class ChangePerspectiveOrientationComponent {

  constructor(public poService: ChangePerspectiveOrientationService) { }

}
