Plugin README
======
A plugin needs to contain three files. 
- Manifest JSON
- template HTML
- script JS


These files need to be served by GET requests over HTTP with appropriate CORS header. If your application requires a backend, it is strongly recommended to host these three files with your backend. 

---
Manifest JSON
------
The manifest JSON file describes the metadata associated with the plugin. 

```json
{
  "name":"fzj.xg.helloWorld",
  "displayName": "Hello World - my first plugin",
  "templateURL":"http://LINK-TO-YOUR-PLUGIN-TEMPLATE/template.html",
  "scriptURL":"http://LINK-TO-YOUR-PLUGIN-SCRIPT/script.js",
  "initState":{
    "key1": "value1",
    "key2" : {
      "nestedKey1" : "nestedValue1"
    }
  },
  "initStateUrl": "http://LINK-TO-PLUGIN-STATE"
}
```
*NB* 
- Plugin name must be unique globally. To prevent plugin name clashing, please adhere to the convention of naming your package **AFFILIATION.AUTHORNAME.PACKAGENAME**. 
- the `initState` object and `initStateUrl` will be available prior to the evaluation of `script.js`, and will populate the objects `interactiveViewer.pluginControl[MANIFEST.name].initState` and `interactiveViewer.pluginControl[MANIFEST.name].initStateUrl` respectively. 

---
Template HTML
------
The template HTML file describes the HTML view that will be rendered in the widget.


```html
<form>
  <div class = "input-group">
    <span class = "input-group-addon">Area 1</span>
    <input type = "text" id = "fzj.xg.helloWorld.area1" name = "fzj.xg.helloWorld.area1" class = "form-control" placeholder="Select a region" value = "">
  </div>

  <div class = "input-group">
    <span class = "input-group-addon">Area 2</span>
    <input type = "text" id = "fzj.xg.helloWorld.area2" name = "fzj.xg.helloWorld.area2" class = "form-control" placeholder="Select a region" value = "">
  </div>

  <hr class = "col-md-10">

  <div class = "col-md-12">
    Select genes of interest:
  </div>
  <div class = "input-group">
    <input type = "text" id = "fzj.xg.helloWorld.genes" name = "fzj.xg.helloWorld.genes" class = "form-control" placeholder = "Genes of interest ...">
    <span class = "input-group-btn">
      <button id = "fzj.xg.helloWorld.addgenes" name = "fzj.xg.helloWorld.addgenes" class = "btn btn-default" type = "button">Add</button>
    </span>
  </div>

  <hr class = "col-md-10">

  <button id = "fzj.xg.helloWorld.submit" name = "fzj.xg.helloWorld.submit" type = "button" class = "btn btn-default btn-block">Submit</button>

  <hr class = "col-md-10">

  <div class = "col-md-12" id = "fzj.xg.helloWorld.result">

  </div>
</form>
```
*NB*
- *bootstrap 3.6* css is already included for templating.
- keep in mind of the widget width restriction (400px) when crafting the template
- whilst there are no vertical limits on the widget, contents can be rendered outside the viewport. Consider setting the *max-height* attribute.
- your template and script will interact with each other likely via *element id*. As a result, it is highly recommended that unique id's are used. Please adhere to the convention: **AFFILIATION.AUTHOR.PACKAGENAME.ELEMENTID** 
---
Script JS
------
The script will always be appended **after** the rendering of the template. 

```javascript
(()=>{
  /* your code here */

  if(interactiveViewer.pluginControl['fzj.xg.helloWorld'].initState){
    /* init plugin with initState */
  }
  
  const submitButton = document.getElemenById('fzj.xg.helloWorld.submit')
  submitButton.addEventListener('click',(ev)=>{
    console.log('submit button was clicked')
  })
})()
```
*NB*
- ensure the script is scoped locally, instead of poisoning the global scope
- for every observable subscription, call *unsubscribe()* in the *onShutdown* callback
- some frameworks such as *jquery2*, *jquery3*, *react/reactdom* and *webcomponents* can be loaded via *interactiveViewer.pluinControl.loadExternalLibraries([LIBRARY_NAME_1, LIBRARY_NAME_2])*. if the libraries are loaded, remember to hook *interactiveViewer.pluginControl.unloadExternalLibraries([LIBRARY_NAME_1,LIBRARY_NAME_2])* in the *onShutdown* callback
- when/if using webcomponents, please be aware that the `connectedCallback()` and `disconnectedCallback()` will be called everytime user toggle between *floating* and *docked* modes. 
- when user navigate to a new template all existing widgets will be destroyed.
- for a list of APIs, see [plugin_api.md](plugin_api.md)
