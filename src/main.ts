import 'zone.js'
import 'reflect-metadata'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import { MainModule } from './main.module';

const requireAll = (r:any) => {r.keys().forEach(r)}
requireAll(require.context('./res/ext',false, /\.json$/))
requireAll(require.context('./res/images',true,/\.jpg|\.png/))
requireAll(require.context(`./plugin_examples`, true))

platformBrowserDynamic().bootstrapModule(MainModule)