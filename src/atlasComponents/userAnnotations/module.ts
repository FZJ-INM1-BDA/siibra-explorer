import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {DatabrowserModule} from "src/atlasComponents/databrowserModule";
import {AngularMaterialModule} from "src/ui/sharedModules/angularMaterial.module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {AnnotationMode} from "src/atlasComponents/userAnnotations/annotationMode/annotationMode.component";
import {AnnotationList} from "src/atlasComponents/userAnnotations/annotationList/annotationList.component";
import { UserAnnotationToolModule } from "./tools/module";
import {AnnotationSwitch} from "src/atlasComponents/userAnnotations/directives/annotationSwitch.directive";
import {CoordinateInputTextPipe} from "src/atlasComponents/userAnnotations/annotationList/coordinateInputText.pipe";
import { UtilModule } from "src/util";
import { SingleAnnotationClsIconPipe, SingleAnnotationNamePipe, SingleAnnotationUnit } from "./singleAnnotationUnit/singleAnnotationUnit.component";
import { AnnotationVisiblePipe } from "./annotationVisible.pipe";
import { FileInputModule } from "src/getFileInput/module";
import { ZipFilesOutputModule } from "src/zipFilesOutput/module";

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
    FileInputModule,
    ZipFilesOutputModule,
  ],
  declarations: [
    AnnotationMode,
    AnnotationList,
    AnnotationSwitch,
    CoordinateInputTextPipe,
    SingleAnnotationUnit,
    SingleAnnotationNamePipe,
    SingleAnnotationClsIconPipe,
    AnnotationVisiblePipe,
  ],
  exports: [
    AnnotationMode,
    AnnotationList,
    AnnotationSwitch
  ]
})

export class UserAnnotationsModule{}
