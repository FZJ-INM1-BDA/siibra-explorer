import 'zone.js'

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import { MainModule } from './main.module';

const requireAll = (r:any) => {r.keys().forEach(r)}
requireAll(require.context('./res/ext', false, /\.json$/))
requireAll(require.context('./res/images', true, /\.jpg|\.png/))
requireAll(require.context('./plugin_examples/jugex', false))

platformBrowserDynamic().bootstrapModule(MainModule)