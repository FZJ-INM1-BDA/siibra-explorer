import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { combineLatest, of } from "rxjs";
import { map } from "rxjs/operators";
import { SapiViewsUtilModule } from "src/atlasComponents/sapiViews";
import { UserAnnotationsModule } from "src/atlasComponents/userAnnotations";
import { FileInputModule } from "src/getFileInput/module";
import { ShareModule } from "src/share";
import { AngularMaterialModule } from "src/sharedModules";
import { enLabels } from "src/uiLabels";
import { UtilModule } from "src/util";
import { ZipFilesOutputModule } from "src/zipFilesOutput/module";
import { DialogModule } from "../dialogInfo";
import { StateModule } from "src/state";

@Component({
  selector: 'sxplr-annotate',
  templateUrl: './annotate.template.html',
  styleUrls: [
    './annotate.style.scss'
  ],
  standalone: true,
  imports: [
    CommonModule,
    UserAnnotationsModule,
    SapiViewsUtilModule,
    AngularMaterialModule,
    UtilModule,
    FileInputModule,
    ZipFilesOutputModule,
    ShareModule,
    DialogModule,
    StateModule,
  ]
})

export class AnnotateCmp {
  @Input()
  expanded = true

  view$ = combineLatest([
    of(enLabels)
  ]).pipe(
    map(([ labels ]) => {
      return {
        labels
      }
    })
  )
}
