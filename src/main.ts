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

/* breaks plugins implementing webcomponents on chrome (natively support webcomponent) */
// import '@webcomponents/custom-elements/src/native-shim'
// import '@webcomponents/custom-elements/custom-elements.min'

import 'chart.js/src/chart.js'

import { NehubaUI } from 'nehubaUI/nehubaUI.module';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core'
import './assets/nehubaTheme.scss'

import { } from 'src/nehubaUI/exports'

enableProdMode();

platformBrowserDynamic().bootstrapModule(NehubaUI);

const requireAll = (r:any) => {r.keys().forEach(r)}
requireAll(require.context('./assets/json/',false, /.json$/))
requireAll(require.context('./assets/pdf/',false,/.pdf$/))
requireAll(require.context('./assets/receptor',true,/.jpg$/))