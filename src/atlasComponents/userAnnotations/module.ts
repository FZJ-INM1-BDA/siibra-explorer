import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {DatabrowserModule} from "src/atlasComponents/databrowserModule";
import {AngularMaterialModule} from "src/ui/sharedModules/angularMaterial.module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {EditAnnotationComponent} from "src/atlasComponents/userAnnotations/editAnnotation/editAnnotation.component";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {AnnotationMode} from "src/atlasComponents/userAnnotations/annotationMode/annotationMode.component";
import {AnnotationList} from "src/atlasComponents/userAnnotations/annotationList/annotationList.component";
import {AnnotationService} from "src/atlasComponents/userAnnotations/annotationService.service";
import {GroupAnnotationPolygons} from "src/atlasComponents/userAnnotations/groupAnnotationPolygons.pipe";

@NgModule({
  imports: [
    CommonModule,
    DatabrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    AngularMaterialModule,
  ],
  declarations: [
    EditAnnotationComponent,
    AnnotationMode,
    AnnotationList,
    GroupAnnotationPolygons
  ],
  providers: [
    AnnotationService
  ],
  exports: [
    AnnotationMode,
    AnnotationList
  ]
})

export class UserAnnotationsModule{}
