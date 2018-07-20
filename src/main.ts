import 'zone.js'
import 'reflect-metadata'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import { MainModule } from './main.module';

import 'chart.js/src/chart.js'

const requireAll = (r:any) => {r.keys().forEach(r)}
requireAll(require.context('./res/ext',false, /\.json$/))
requireAll(require.context('./res/images',true,/\.jpg|\.png/))

platformBrowserDynamic().bootstrapModule(MainModule)