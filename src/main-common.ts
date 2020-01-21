import 'zone.js'

import 'third_party/testSafari.js'

import { defineCustomElements as defineConnectivityComponent } from 'hbp-connectivity-component/dist/loader'
import { defineCustomElements as definePreviewComponent } from 'kg-dataset-previewer/loader'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import { MainModule } from './main.module';

const requireAll = (r: any) => {r.keys().forEach(r)}
requireAll(require.context('./res/ext', false, /\.json$/))
requireAll(require.context('./res/images', true, /\.jpg$|\.png$|\.svg$/))
requireAll(require.context(`./plugin_examples`, true))

platformBrowserDynamic().bootstrapModule(MainModule)

defineConnectivityComponent(window)
definePreviewComponent(window)