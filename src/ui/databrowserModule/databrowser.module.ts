import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DataBrowser } from "./databrowser/databrowser.component";
import { DatasetViewerComponent } from "./datasetViewer/datasetViewer.component";
import { ComponentsModule } from "src/components/components.module";
import { ModalityPicker } from "./modalityPicker/modalityPicker.component";
import { RegionHierarchy } from "./regionHierachy/regionHierarchy.component";
import { FilterNameBySearch } from "./filterNameBySearch.pipe";
import { FormsModule } from "@angular/forms";
import { DatabrowserService } from "./databrowser.service";
import { PathToNestedChildren } from "./pathToNestedChildren.pipe";
import { CopyPropertyPipe } from "./copyProperty.pipe";
import { FilterDataEntriesbyMethods } from "./filterDataEntriesByMethods.pipe";
import { FilterDataEntriesByRegion } from "./filterDataEntriesByRegion.pipe";

@NgModule({
  imports:[
    CommonModule,
    ComponentsModule,
    FormsModule
  ],
  declarations: [
    DataBrowser,
    DatasetViewerComponent,
    ModalityPicker,
    RegionHierarchy,

    /**
     * pipes
     */
    FilterNameBySearch,
    PathToNestedChildren,
    CopyPropertyPipe,
    FilterDataEntriesbyMethods,
    FilterDataEntriesByRegion
  ],
  exports:[
    DataBrowser
  ],
  entryComponents:[
    DataBrowser
  ],
  providers:[
    DatabrowserService
  ],
  /**
   * shouldn't need bootstrap, so no need for browser module
   */
})

export class DatabrowserModule{

}