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

import { createNehubaViewer } from 'nehuba/exports'
import { BigBrain,JuBrain } from './dataset/datasetConfig'

import { NehubaUI } from 'nehubaUI/nehubaUI.module';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import 'nehubaUI/templates/sass/theme.scss'

window.addEventListener('DOMContentLoaded', () => {
    JuBrain
    // let button0 = document.getElementById('testButton0')
    // button0!.addEventListener('click',()=>{
    //   nehubaViewer.config = BigBrain
    //   nehubaViewer.relayout()
    //   nehubaViewer.applyInitialNgState()
    //   nehubaViewer.disableSegmentSelectionForLoadedLayers()
    // })
    // let button1 = document.getElementById('testButton1')
    // button1!.addEventListener('click',()=>{
    //   nehubaViewer.config = JuBrain
    //   nehubaViewer.relayout()
      
    //   nehubaViewer.applyInitialNgState()
    // })

    // let button2 = document.getElementById('testButton2')
    // button2!.addEventListener('click',()=>{
      
    // })

    // let button3 = document.getElementById('testButton3')
    // button3!.addEventListener('click',()=>{
    //    nehubaViewer
    // })
});

let nehubaConfig = BigBrain
export const nehubaViewer = createNehubaViewer(nehubaConfig)
nehubaViewer.disableSegmentSelectionForLoadedLayers()

/* waiting for nehuba native navigation control */
export const navigationControl = nehubaViewer.ngviewer

platformBrowserDynamic().bootstrapModule(NehubaUI);
