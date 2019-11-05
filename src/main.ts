import 'zone.js'
import 'reflect-metadata'

import 'third_party/testSafari.js'

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import { MainModule } from './main.module';
import {defineCustomElements} from 'hbp-connectivity-component/dist/loader'

const requireAll = (r:any) => {r.keys().forEach(r)}
requireAll(require.context('./res/ext',false, /\.json$/))
requireAll(require.context('./res/images',true,/\.jpg|\.png/))
requireAll(require.context(`./plugin_examples`, true))

platformBrowserDynamic().bootstrapModule(MainModule)

defineCustomElements(window)