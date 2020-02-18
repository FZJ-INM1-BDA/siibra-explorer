import 'zone.js'
import 'third_party/testSafari.js'
import { enableProdMode } from '@angular/core';

import * as ConnectivityComponent from 'hbp-connectivity-component/dist/loader'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import { MainModule } from './main.module';

if (PRODUCTION) enableProdMode()
if (PRODUCTION) { console.log(`Interactive Atlas Viewer: ${VERSION}`) }

const requireAll = (r: any) => {r.keys().forEach(r)}
requireAll(require.context('./res/ext', false, /\.json$/))
requireAll(require.context('./res/images', true, /\.jpg$|\.png$|\.svg$/))
requireAll(require.context(`./plugin_examples`, true))

platformBrowserDynamic().bootstrapModule(MainModule)

ConnectivityComponent.defineCustomElements(window)