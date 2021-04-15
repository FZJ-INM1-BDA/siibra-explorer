import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {DatabrowserModule} from "src/atlasComponents/databrowserModule";
import {AngularMaterialModule} from "src/ui/sharedModules/angularMaterial.module";
import {UserAnnotationsComponent} from "src/atlasComponents/userAnnotations/userAnnotationsCmp/userAnnotationsCmp.components";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {EditAnnotationComponent} from "src/atlasComponents/userAnnotations/editAnnotation/editAnnotation.component";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

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
    UserAnnotationsComponent,
    EditAnnotationComponent,
  ],
  exports: [
    UserAnnotationsComponent,
  ]
})

export class UserAnnotationsModule{}
