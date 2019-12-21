import 'zone.js'

import 'third_party/testSafari.js'

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import { MainModule } from './main.module';

const requireAll = (r: any) => {r.keys().forEach(r)}
requireAll(require.context('./res/ext', false, /\.json$/))
requireAll(require.context('./res/images', true, /\.jpg$|\.png$|\.svg$/))
requireAll(require.context(`./plugin_examples`, true))

/* aot === production mode */
enableProdMode()

if (PRODUCTION) { this.log.log(`Interactive Atlas Viewer: ${VERSION}`) }

platformBrowserDynamic().bootstrapModule(MainModule)
