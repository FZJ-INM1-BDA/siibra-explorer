Plugin README
======
A plugin needs to contain three files. 
- Manifest JSON
- template HTML
- script JS. 

These files need to be served by GET requests over HTTP with appropriate CORS header.

---
Manifest JSON
------
The manifest JSON file describes the metadata associated with the plugin. 

```json
{
  "name":"fzj.xg.webJuGEx",
  "type":"plugin",
  "templateURL":"http://LINK-TO-YOUR-PLUGIN-TEMPLATE/jugex.template.html",
  "scriptURL":"http://LINK-TO-YOUR-PLUGIN-SCRIPT/jugex.script.js"
}
```
*NB* 
- Plugin name must be unique globally. To prevent plugin name clashing, please adhere to the convention of naming your package **AFFILIATION.AUTHORNAME.PACKAGENAME**. 


---
Template HTML
------
The template HTML file describes the HTML elements that will be rendered in the floating widget.


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
*NB*
- bootstrap 3.6 css is already included. (neither jQuery nor bootstrap.js are included. You can include them dynamically as needed.)
- keep in mind of the widget width restriction (400px) when crafting the template
- whilst there are no vertical limits on the widget, contents can be rendered outside the viewport. Consider setting the *max-height* attribute.
- your template and script will interact with each other likely via *element id*. As a result, it is highly recommended that unique id's are used. Please adhere to the convention: **AFFILIATION.AUTHOR.PACKAGENAME.ELEMENTID** 
---
Script JS
------
The script JS file describes the interaction between users, Interactive Atlas Viewer and the plugin.

```javascript
(()=>{
  /* your code here */
  const submitButton = document.getElemenById('fzj.xg.jugex.submit')
  submitButton.addEventListener('click',(ev)=>{
    console.log('submit button was clicked')
  })
})()
```
*NB*
- ensure the script is scoped locally, instead of poisoning the global scope
- ensure the right hook is applied at the right lifecycle of user initiated events [INSERT LINK TO USER EVENTS LIFECYCLE]
- another design philosophy is by using [webcomponents](https://www.webcomponents.org/). [Chrome 54 supports webcomponent natively](https://www.chromestatus.com/feature/4696261944934400), Firefox Polyfill script has been included, so developers may use 
```javascript
(()=>{
class MyCustomElement extends HTMLElement{
  //custom element
}
customElements.define('fzj-xg-pluginname-my-custom-element',MyCustomElement)
})()
```
- when/if using webcomponents, please be aware that the `connectedCallback()` and `disconnectedCallback` will be called everytime user toggle between *floating*, *docked* or *minimised* modes. 
- for a list of APIs, see [plugin_api.md](plugin_api.md)

---

Example plugins
---
webJuGEx

Remote Control

