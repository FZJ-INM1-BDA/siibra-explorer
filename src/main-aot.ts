import 'zone.js'

import 'third_party/testSafari.js'

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import { MainModule } from './main.module';
import { enableProdMode } from '@angular/core';

const requireAll = (r:any) => {r.keys().forEach(r)}
requireAll(require.context('./res/ext', false, /\.json$/))
requireAll(require.context('./res/images', true, /\.jpg|\.png/))
requireAll(require.context(`./plugin_examples`, true))

/* aot === production mode */
enableProdMode()

if(PRODUCTION) console.log(`Interactive Atlas Viewer: ${VERSION}`)

platformBrowserDynamic().bootstrapModule(MainModule)