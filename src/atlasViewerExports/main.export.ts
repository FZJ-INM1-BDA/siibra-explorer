import 'zone.js'
import 'reflect-metadata'
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { ExportModule } from "./export.module";

platformBrowserDynamic().bootstrapModule(ExportModule)