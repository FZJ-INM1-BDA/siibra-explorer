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

'use strict';

const path = require('path');
const original_webpack_helpers = require('neuroglancer/config/webpack_helpers');
const resolveReal = require('neuroglancer/config/resolve_real');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const webpack = require('webpack')

const extractSass = new ExtractTextPlugin({
  filename : 'ui.css',
  allChunks : true
})

function modifyViewerOptions(options) {
  options = options || {};
  options.resolveLoaderRoots = [
    ...(options.resolveLoaderRoots || []),

    // Allow loader modules to be resolved from node_modules directory of this
    // project in addition to the node_modules directory of neuroglancer.
    resolveReal(__dirname, '../node_modules')
  ];

  // This references the tsconfig.json file of this project, rather than of
  // neuroglancer.
  options.tsconfigPath = resolveReal(__dirname, '../tsconfig.json');

  // This references the main.ts of this project, rather than of
  // neuroglancer.
  options.frontendModules = [resolveReal(__dirname, '../src/main.ts')];

  options.htmlPlugin = new HtmlWebpackPlugin({template : "src/index.html"})
  options.commonPlugins = [
    new webpack.ContextReplacementPlugin(/@angular(\\|\/)core(\\|\/)/,path.join(__dirname,'../src'))
  ]
  
  let ruleScss = {
    test : /\.scss$/,
    use : extractSass.extract({
      use: [{
        loader : 'css-loader'
      },{
        loader : 'sass-loader'
      }]
    })
  }

  let ruleHtml = {
    test : /src\/nehubaUI.*?\.html$/,
    loader : 'raw-loader'
  }

  let ruleJson = {
    test : /assets\/json\/.*?\.json$/,
    use : [{
      loader : 'file-loader',
      options : {
        name : '[name].[ext]',
        outputPath : 'res/json/'
      }
    }]
  }

  let ruleImage = {
    test : /(jpg|png)$/,
    use : [{
      loader : 'file-loader',
      options : {
        name : '[name].[ext]',
        outputPath : 'res/image/'
      }
    }]
  }

  const compareRegex = (r1,r2)=>(r1 instanceof RegExp) && (r2 instanceof RegExp)
    && r1.source == r2.source  

  let ruleCss = {
    test : /src\/nehubaUI.*?\.css$/,
    loader : 'raw-loader'
  }
  
  options.modifyBaseConfig = (baseConfig) => {
    baseConfig.module.rules.push(ruleScss)
    baseConfig.module.rules.push(ruleHtml)
    
    const idx = baseConfig.module.rules.findIndex(r=>compareRegex(r.test,/\.css$/))
    if (idx >= 0) baseConfig.module.rules[idx].exclude = /nehubaUI/
    baseConfig.module.rules.push(ruleCss)

    const idx2 = baseConfig.module.rules.findIndex(r=>compareRegex(r.test,/\.json$/))
    if (idx2 >= 0) baseConfig.module.rules[idx2].exclude = /assets\/json/
    baseConfig.module.rules.push(ruleJson)

    baseConfig.module.rules.push(ruleImage)
  }
  options.frontendPlugins = [ extractSass ]
  return options;
}

exports.getViewerConfig = function(options) {
  return original_webpack_helpers.getViewerConfig(modifyViewerOptions(options));
};
