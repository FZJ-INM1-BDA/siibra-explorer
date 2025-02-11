import { Component } from "@angular/core";
import { AngularMaterialModule } from "src/sharedModules";
import { AssignmentViewBaseDirective } from "../assignment-view-base.directive";
import { UtilModule } from "src/util";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'sxplr-assignment-view-full',
  templateUrl: `./assignment-view-full.template.html`,
  styleUrls: [
    './assignment-view-full.style.scss'
  ],
  standalone: true,
  imports: [
    AngularMaterialModule,
    UtilModule,
    CommonModule,
  ]
})

export class FullAssignmentView extends AssignmentViewBaseDirective {

}
