import { APP_INITIALIZER, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AngularMaterialModule } from "src/sharedModules";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AnnotationMode } from "src/atlasComponents/userAnnotations/annotationMode/annotationMode.component";
import { AnnotationList } from "src/atlasComponents/userAnnotations/annotationList/annotationList.component";
import { UserAnnotationToolModule } from "./tools/module";
import { AnnotationSwitch } from "src/atlasComponents/userAnnotations/directives/annotationSwitch.directive";
import { UtilModule } from "src/util";
import { SingleAnnotationClsIconPipe, SingleAnnotationNamePipe, SingleAnnotationUnit } from "./singleAnnotationUnit/singleAnnotationUnit.component";
import { AnnotationVisiblePipe } from "./annotationVisible.pipe";
import { FileInputModule } from "src/getFileInput/module";
import { ZipFilesOutputModule } from "src/zipFilesOutput/module";
import { FilterAnnotationsBySpace } from "./filterAnnotationBySpace.pipe";
import { AnnotationEventDirective } from "./directives/annotationEv.directive";
import { ShareModule } from "src/share";
import { StateModule } from "src/state";
import { RoutedAnnotationService } from "./routedAnnotation.service";

@NgModule({
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    UserAnnotationToolModule,
    UtilModule,
    FileInputModule,
    ZipFilesOutputModule,
    ShareModule,
    StateModule,
  ],
  declarations: [
    AnnotationMode,
    AnnotationList,
    AnnotationSwitch,
    SingleAnnotationUnit,
    SingleAnnotationNamePipe,
    SingleAnnotationClsIconPipe,
    AnnotationVisiblePipe,
    FilterAnnotationsBySpace,
    AnnotationEventDirective,
  ],
  exports: [
    AnnotationMode,
    AnnotationList,
    AnnotationSwitch,
    AnnotationEventDirective
  ],
  providers: [
    // initialize routerannotation service, so it will parse route and load annotations ...
    // ... in url correctly
    {
      provide: APP_INITIALIZER,
      useFactory:(svc: RoutedAnnotationService) => {
        return () => Promise.resolve()
      },
      deps: [ RoutedAnnotationService ],
      multi: true
    }
  ]
})

export class UserAnnotationsModule{}
