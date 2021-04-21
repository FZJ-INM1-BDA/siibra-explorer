import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { CtxMenuHost } from "./ctxMenuHost.directive";
import { DismissCtxMenuDirective } from "./dismissCtxMenu.directive";

@NgModule({
  imports: [
    AngularMaterialModule,
    CommonModule,
  ],
  declarations: [
    DismissCtxMenuDirective,
    CtxMenuHost,
  ],
  exports: [
    DismissCtxMenuDirective,
    CtxMenuHost,
  ],
  providers: [
    
  ]
})

export class ContextMenuModule{}
