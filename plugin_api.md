General
======
Plugins needs to contain three files. Metadata JSON, template HTML, and script JS. 

These files needs to have the same origin and port. Alternatively, these files needs to be served with appropriate CORS header.

---
Metadata JSON
------


```json
{
      "name":"NAME",
      "icon":"ICON | null", 
      "type":"plugin",
      "templateURL":"http://LINK-TO-YOUR-PLUGIN-TEMPLATE.html",
      "scriptURL":"http://LINK-TO-YOUR-PLUGIN-SCRIPT.js"
}
```

TODO: more meta data, e.g., author, validation hash etc

---
Template
------

bootstrap4.0 css is already included. 

Keep in mind of the width limitation of the widget (400px). Uncaught overflows are not pleasant to look at. 

Whilst there are no hard limitations on the vertical size of the widget, it may influence the usability of the widget. For tall elements, consider using *max-height* style, and set *overflow-y* to auto or scroll. 

Your template will interact with your script via **element id**. As a result, it is imperative that you use unique id's. 
It is recommended that you use *domain.developer.packagename.uniqueid* e.g.: *fzj.xiaogui.remotecontrol.wsurl* to avoid id duplication.

---
Script
------

A good idea is to scope it so that the variables you declare stays local:

```javascript
(()=>{
      /* your code here */
})()
```

Note: *window.nehubaViewer* and *window.viewer* can be destroyed / return null (e.g., before the user select any template). Any subscriptions/event listeners tied to them can be lost. As a result, if your plugin relies on interacting with these two APIs, use them in a *try catch* block, and listen to the appropriate events when they are destroyed and reattach your listeners appropriately.

---
APIs
======

There are three levels of APIs available to developers. 

window.nehubaUI
------
provide a higher level of abstraction over nehubaViewer
provide event streams that are concatenated with metadata
provide controls over widget (minimise, unminimise, blink, etc)

window.nehubaViewer
------
nehuba (NEuroglancer HUman Brain Atlas) - abstraction above neuroglancer
provides a higher level of abstraction with customisability over mesh views and UI.
react'ify events such as navigation state, segment hover etc. 
For a full list of nehuba API, consult nehuba (inlinne) documentation

window.viewer
------
The original neuroglancer viewer object. 
Providing low level access to the viewer.
Gets destroyed and recreated when a new template is selected.
May interfere with how nehuba and atlas viewer interact with neuroglancer
For a full list of how to interact with window.viewer object, consult neuroglancer github page, or console.log(window.viewer)

---
In addition, you may interact with the container of your widget with **window[PLUGINNAME]**.

```javascript
/* in jugex.js */
window['JuGeX'].next({
      body : {
            blink : true, /* makes the widget blink */
            popoverMessage : 'Analysis Complete!' /* append to the popover message */
      }
})
```
If you would like to hook up onDestroy lifecycle events, subscribe to *window[PLUGINNAME* and listen for code 200. e.g.
```javascript
/* in jugex.js */
window['JuGeX'].subscribe(evPk=>{
      if(evPk.code == 200){
            window['JuGeX'].unsubscribe()
            /* do this when user closes the widget */
            /* this task is carried out synchronisely */
      }
})

```

---

Example plugins
======
JuGeX

Remote Control

