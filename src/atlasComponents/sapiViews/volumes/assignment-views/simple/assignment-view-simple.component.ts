import { Component } from "@angular/core";
import { AngularMaterialModule } from "src/sharedModules";
import { AssignmentViewBaseDirective } from "../assignment-view-base.directive";
import { UtilModule } from "src/util";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'sxplr-assignment-view-simple',
  templateUrl: `./assignment-view-simple.template.html`,
  styleUrls: [
    './assignment-view-simple.style.scss'
  ],
  standalone: true,
  imports: [
    AngularMaterialModule,
    UtilModule,
    CommonModule,
  ]
})

export class SimpleAssignmentView extends AssignmentViewBaseDirective {

  SIMPLE_COLUMNS = [
    "region",
    "map_value",
  ]
  SIMPLE_TABLE_MAX_LEN = 3
}
