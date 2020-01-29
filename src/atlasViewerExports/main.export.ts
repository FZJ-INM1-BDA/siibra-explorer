import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import 'reflect-metadata'
import 'zone.js'
import { ExportModule } from "./export.module";

platformBrowserDynamic().bootstrapModule(ExportModule)
