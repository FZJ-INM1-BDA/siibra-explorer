import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {DatabrowserModule} from "src/atlasComponents/databrowserModule";
import {AngularMaterialModule} from "src/ui/sharedModules/angularMaterial.module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {AnnotationMode} from "src/atlasComponents/userAnnotations/annotationMode/annotationMode.component";
import {AnnotationList} from "src/atlasComponents/userAnnotations/annotationList/annotationList.component";
import {AnnotationService} from "src/atlasComponents/userAnnotations/annotationService.service";
import {AnnotationMessage} from "src/atlasComponents/userAnnotations/annotationMessage/annotationMessage.component";
import { UserAnnotationToolModule } from "./tools/module";
import {AnnotationSwitch} from "src/atlasComponents/userAnnotations/directives/annotationSwitch.directive";
import {ExportAnnotation} from "src/atlasComponents/userAnnotations/directives/exportAnnotation.directive";
import {ImportAnnotation} from "src/atlasComponents/userAnnotations/directives/importAnnotation.directive";
import {KeyListener} from "src/atlasComponents/userAnnotations/directives/keyListener.directive";
import {CoordinateInputTextPipe} from "src/atlasComponents/userAnnotations/annotationList/coordinateInputText.pipe";
import { UtilModule } from "src/util";
import { SingleAnnotationClsIconPipe, SingleAnnotationNamePipe, SingleAnnotationUnit } from "./singleAnnotationUnit/singleAnnotationUnit.component";
import { AnnotationVisiblePipe } from "./annotationVisible.pipe";

@NgModule({
  imports: [
    CommonModule,
    DatabrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    UserAnnotationToolModule,
    UtilModule,
  ],
  declarations: [
    AnnotationMode,
    AnnotationList,
    AnnotationMessage,
    AnnotationSwitch,
    ImportAnnotation,
    ExportAnnotation,
    KeyListener,
    CoordinateInputTextPipe,
    SingleAnnotationUnit,
    SingleAnnotationNamePipe,
    SingleAnnotationClsIconPipe,
    AnnotationVisiblePipe,
  ],
  providers: [
    AnnotationService
  ],
  exports: [
    AnnotationMode,
    AnnotationList,
    AnnotationMessage,
    AnnotationSwitch
  ]
})

export class UserAnnotationsModule{}
