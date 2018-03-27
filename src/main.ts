/**
 * @license
 * Copyright 2016 Google Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import 'zone.js';
import 'reflect-metadata';

import { NehubaUI } from 'nehubaUI/nehubaUI.module';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core'
import './assets/nehubaTheme.scss'

enableProdMode();

platformBrowserDynamic().bootstrapModule(NehubaUI);

import './assets/json/colin.json'
import './assets/json/colinNehubaConfig.json'
import './assets/json/colinJubrainPMap.json'
import './assets/json/colinJubrainReceptor.json'
import './assets/json/colinIEEG.json'

import './assets/json/bigbrain.json'
import './assets/json/bigbrainNehubaConfig.json'
import './assets/json/waxholmRatV2_0.json'
import './assets/json/waxholmRatV2_0NehubaConfig.json'
import './assets/json/allenMouse.json'
import './assets/json/allenMouseNehubaConfig.json'