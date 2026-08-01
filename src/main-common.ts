/**
 * The following artefacts, previously emitted here via webpack's file-loader,
 * are now copied into the build output (and served by the dev server) as
 * `assets` / `styles` entries in angular.json (the esbuild `application`
 * builder does not support inline `!!file-loader!` imports):
 *
 * - a copy of vanilla nehuba:
 *   - third_party/vanilla.html         -> vanilla.html
 *   - third_party/preinit_vanilla.html -> preinit_vanilla.html
 *   - third_party/styles.css           -> vanilla_styles.css  (styles bundle)
 * - iav icon font:
 *   - src/res/icons/iav-icons.{css,ttf,woff,svg} -> icons/iav-icons.*
 * - version css:
 *   - src/version.css                  -> version.css
 *
 * Catching Safari 10 bug (https://bugs.webkit.org/show_bug.cgi?id=171041) is
 * also handled in angular.json; look for third_party/catchSyntaxError.js.
 */

import 'zone.js'
import { enableProdMode } from '@angular/core';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import { MainModule } from './main.module';
import { injectExternalScripts } from './injectExternalScripts'

import { environment } from 'src/environments/environment'
const { PRODUCTION, VERSION, GIT_HASH } = environment
if (PRODUCTION) enableProdMode()
console.log(`Siibra Explorer: ${VERSION}::${GIT_HASH}`)

injectExternalScripts()

platformBrowserDynamic().bootstrapModule(MainModule)
