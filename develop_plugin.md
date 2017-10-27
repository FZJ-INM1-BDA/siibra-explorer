General
======
Plugins needs to contain three files. Metadata JSON, template HTML, and script JS. 

These files needs to have the same origin and port. Alternatively, these files needs to be served with appropriate CORS header.

---
Metadata JSON
------


```json
{
      "name":"fzj.xg.JuGeX",
      "icon":"lamp", 
      "type":"plugin",
      "templateURL":"http://LINK-TO-YOUR-PLUGIN-TEMPLATE/jugex.template.html",
      "scriptURL":"http://LINK-TO-YOUR-PLUGIN-SCRIPT/jugex.script.js"
}
```

NB: required fields: name, type='plugin', templateURL, scriptURL.

Plugin name must be unique globally. To prevent plugin name clashing, please adhere to the convention of naming your package **AFFILIATION.AUTHORNAME.PACKAGENAME**. 

You may choose to add more fields to the JSON object. Brain Atlas Viewer will not parse them.

TODO: more meta data, e.g., author, validation hash etc

---
Template
------

bootstrap 3.6 css is already included. 

Keep in mind of the width limitation of the widget (400px). Uncaught overflows are not pleasant to look at. 

Whilst there are no hard limitations on the vertical size of the widget, it may influence the usability of the widget. For tall elements, consider using *max-height* style, and set *overflow-y* to auto or scroll. 

Your template will interact with your script via **element id**. As a result, it is imperative that you use unique id's. 
It is recommended that you use *domain.developer.packagename.uniqueid* e.g.: *fzj.xiaogui.remotecontrol.wsurl* to avoid id duplication.

Here is an example template:

```html
<form>
      <div class = "input-group">
            <span class = "input-group-addon">Area 1</span>
            <input type = "text" id = "fzj.xg.jugex.area1" name = "fzj.xg.jugex.area1" class = "form-control" placeholder="Select a region" value = "">
      </div>

      <div class = "input-group">
            <span class = "input-group-addon">Area 2</span>
            <input type = "text" id = "fzj.xg.jugex.area2" name = "fzj.xg.jugex.area2" class = "form-control" placeholder="Select a region" value = "">
      </div>

      <hr class = "col-md-10">

      <div class = "col-md-12">
            Select genes of interest:
      </div>
      <div class = "input-group">
            <input type = "text" id = "fzj.xg.jugex.genes" name = "fzj.xg.jugex.genes" class = "form-control" placeholder = "Genes of interest ...">
            <span class = "input-group-btn">
                  <button id = "fzj.xg.jugex.addgenes" name = "fzj.xg.jugex.addgenes" class = "btn btn-default" type = "button">Add</button>
            </span>
      </div>

      <hr class = "col-md-10">

      <button id = "fzj.xg.jugex.submit" name = "fzj.xg.jugex.submit" type = "button" class = "btn btn-default btn-block">Submit</button>

      <hr class = "col-md-10">

      <div class = "col-md-12" id = "fzj.xg.jugex.result">

      </div>
</form>
```

---
Script
------

A good idea is to scope it so that the variables you declare stays local:

```javascript
(()=>{
      /* your code here */
})()
```

---
APIs
======
see [atlas_api.md](atlas_api.md)

---

Example plugins
======
JuGeX

Remote Control

