import 'reflect-metadata'
import 'zone.js'

import 'third_party/testSafari.js'

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import {defineCustomElements} from 'hbp-connectivity-component/dist/loader'
import { MainModule } from './main.module';

const requireAll = (r: any) => {r.keys().forEach(r)}
requireAll(require.context('./res/ext', false, /\.json$/))
requireAll(require.context('./res/images', true, /\.jpg$|\.png$|\.svg$/))
requireAll(require.context(`./plugin_examples`, true))

platformBrowserDynamic().bootstrapModule(MainModule)

defineCustomElements(window)
