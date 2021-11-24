// Included to include a copy of vanilla nehuba
import '!!file-loader?context=third_party&name=vanilla.html!third_party/vanilla.html'
import '!!file-loader?context=third_party&name=vanilla_styles.css!third_party/styles.css'
import '!!file-loader?context=third_party&name=preinit_vanilla.html!third_party/preinit_vanilla.html'

/**
* Catching Safari 10 bug:
* 
* https://bugs.webkit.org/show_bug.cgi?id=171041
*
* moved to angular.json
* look for  
* - third_party/catchSyntaxError.js
* - third_party/syntaxError.js
*/


import '!!file-loader?context=src/res&name=icons/iav-icons.css!src/res/icons/iav-icons.css'
import '!!file-loader?context=src/res&name=icons/iav-icons.ttf!src/res/icons/iav-icons.ttf'
import '!!file-loader?context=src/res&name=icons/iav-icons.woff!src/res/icons/iav-icons.woff'
import '!!file-loader?context=src/res&name=icons/iav-icons.svg!src/res/icons/iav-icons.svg'

/**
 * favicons
 */
import '!!file-loader?context=src/res/favicons&name=favicon-128-light.png!src/res/favicons/favicon-128-light.png'

/**
 * version css
 */
import '!!file-loader?name=version.css!src/version.css'

import 'zone.js'
import { enableProdMode } from '@angular/core';

import * as ConnectivityComponent from 'hbp-connectivity-component/dist/loader'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import { MainModule } from './main.module';

import { environment } from 'src/environments/environment'
const { PRODUCTION, VERSION, GIT_HASH } = environment
if (PRODUCTION) enableProdMode()
if (PRODUCTION) { console.log(`Siibra Explorer: ${VERSION}::${GIT_HASH}`) }


platformBrowserDynamic().bootstrapModule(MainModule)

ConnectivityComponent.defineCustomElements(window)