// Included to include a copy of vanilla nehuba
import '!!file-loader?context=third_party&name=vanilla.html!third_party/vanilla.html'
import '!!file-loader?context=third_party&name=vanilla_styles.css!third_party/styles.css'
import '!!file-loader?context=third_party&name=vanilla_nehuba.js!third_party/vanilla_nehuba.js'

import 'zone.js'
import { enableProdMode } from '@angular/core';

import * as ConnectivityComponent from 'hbp-connectivity-component/dist/loader'
import * as PreviewDatasetComponent from 'kg-dataset-previewer/loader'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import { MainModule } from './main.module';

if (PRODUCTION) enableProdMode()
if (PRODUCTION) { console.log(`Interactive Atlas Viewer: ${VERSION}`) }

const requireAll = (r: any) => {r.keys().forEach(r)}
requireAll(require.context('./res/ext', false, /\.json$/))
requireAll(require.context('./res/images', true, /\.jpg$|\.png$|\.svg$/))
requireAll(require.context(`./plugin_examples`, true))

platformBrowserDynamic().bootstrapModule(MainModule)

PreviewDatasetComponent.defineCustomElements(window)
ConnectivityComponent.defineCustomElements(window)