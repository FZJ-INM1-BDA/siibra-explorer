import 'zone.js'

import './theme.scss'
import './res/css/extra_styles.css'

import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { ExportModule } from "./export.module";

platformBrowserDynamic().bootstrapModule(ExportModule)