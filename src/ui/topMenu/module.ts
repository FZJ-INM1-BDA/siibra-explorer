import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AuthModule } from "src/auth";
import { ComponentsModule } from "src/components";
import { FabSpeedDialModule } from "src/components/fabSpeedDial";
import { PluginModule } from "src/plugin";
import { UtilModule } from "src/util";
import { ConfigModule } from "src/ui/config/module";
import { CookieModule } from "src/ui/cookieAgreement/module";
import { HelpModule } from "src/ui/help/module";
import { KgTosModule } from "src/ui/kgtos/module";
import { ScreenshotModule } from "src/screenshot";
import { TopMenuCmp } from "./topMenuCmp/topMenu.components";
import { UserAnnotationsModule } from "src/atlasComponents/userAnnotations";
import { QuickTourModule } from "src/ui/quickTour/module";
import { KeyFrameModule } from "src/keyframesModule/module";
import { AtlasDownloadModule } from "src/atlas-download/atlas-download.module";
import { AngularMaterialModule } from "src/sharedModules";


@NgModule({
  imports: [
    CommonModule,
    UtilModule,
    AngularMaterialModule,
    FabSpeedDialModule,
    ComponentsModule,
    CookieModule,
    KgTosModule,
    ConfigModule,
    HelpModule,
    PluginModule,
    AuthModule,
    ScreenshotModule,
    UserAnnotationsModule,
    KeyFrameModule,
    QuickTourModule,
    AtlasDownloadModule,
  ],
  declarations: [
    TopMenuCmp
  ],
  exports: [
    TopMenuCmp
  ]
})

export class TopMenuModule{}
