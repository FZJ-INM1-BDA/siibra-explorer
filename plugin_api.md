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

bootstrap4.0 css is already included. 

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
      
      const domArea1 = document.getElementById('fzj.xg.jugex.area1')
      const domArea2 = document.getElementById('fzj.xg.jugex.area2')
      const domGenes = document.getElementById('fzj.xg.jugex.genes')
      const domSubmit = document.getElementById('fzj.xg.jugex.submit')
      const URL = 'http://API_END_POINT/_jugex'
      

      const pendingRequestPanel = ()=>{
            const panel = document.createElement('div')
            panel.className = "panel panel-warning"

            const panelHeader = document.createElement('div')
            panelHeader.className = "btn btn-block panel-heading"

            const panelBody = document.createElement('div')
            panelBody.className = "panel-body"
            panelBody.style.maxHeight = '400px'
            panelBody.style.overflowY = 'scroll'
            panel.appendChild(panelHeader)
            panel.appendChild(panelBody)

            panelHeader.addEventListener('click',(ev)=>{
                  if(/panel\-success/gi.test(panel.className)){
                        if(/hidden/gi.test(panelBody.className)){
                              panelBody.className = panelBody.className.replace(/hidden/gi,'')
                        }else{
                              panelBody.className += ' hidden' 
                        }
                  }
            })

            return ({
                  panel : panel,
                  panelHeader : panelHeader,
                  panelBody : panelBody
            })
      }

      domSubmit.addEventListener('click',(ev)=>{
      
            const request = new Request(URL,{
                  method : 'GET',
            })

            const panelObj = pendingRequestPanel()
            panelObj.panelHeader.innerHTML = 'Pending request'
            panelObj.panelBody.className += ' hidden'

            document.getElementById('fzj.xg.jugex.result').appendChild(panelObj.panel)

            fetch(request)
                  .then(resp=>resp.json())
                  .then(json=>{
                        
                        window['fzj.xg.JuGeX'].next({
                              body:{
                                    blink:true,
                                    popoverMessage:'Analysis completed. '
                              }
                        })

                        const table = document.createElement('table')
                        table.className = "table table-bordered"
                        const thead = document.createElement('thead')
                        const col1 = document.createElement('th')
                        col1.innerHTML = 'gene'
                        const col2 = document.createElement('th')
                        col2.innerHTML = 'pval'
            
                        thead.appendChild(col1)
                        thead.appendChild(col2)
                        table.appendChild(thead)

                        const result = JSON.parse(json.result)
                        result.genes.forEach(gene=>{
                              const tr = document.createElement('tr')
                              const c1 = document.createElement('td')
                              c1.innerHTML = gene.name
                              const c2 = document.createElement('td')
                              c2.innerHTML = gene.pval

                              tr.appendChild(c1)
                              tr.appendChild(c2)
                              table.appendChild(tr)
                        })

                        panelObj.panelBody.appendChild(table)
                        
                        panelObj.panel.className = panelObj.panel.className.replace(/panel\-warning/gi,'')
                        panelObj.panel.className += ' panel-success'
                        panelObj.panelHeader.innerHTML = 'Request Completed.'

                        window['fzj.xg.JuGeX'].next({
                              target : 'lab',
                              id : Date.now().toString(),
                              code : 100,
                              body : {
                                    blink : true,
                                    popoverMessage : 'Request completed! '
                              }
                        })
                  })
                  .catch(e=>{
                        console.log('error',e)
                        panelObj.panel.className = panelObj.panel.className.replace(/panel\-warning/gi,'')
                        panelObj.panel.className += ' panel-danger'
                        panelObj.panelHeader.innerHTML = 'Error. Check console.'
                  })

      })
      
      try{
            window.nehubaViewer.mouseOver.segment
                  .filter(ev=>ev.layer.name=='atlas')
                  .subscribe(ev=>{
                        if ( document.activeElement === domArea1 ){
                              domArea1.setAttribute('value',ev.segment?ev.segment:'')
                        } else if ( document.activeElement === domArea2 ){
                              domArea2.setAttribute('value',ev.segment?ev.segment:'')
                        }
            })
      }catch(e){
            console.log('error!',e)
      }
      
      domArea1.focus()
})()
```

Note: *window.nehubaViewer* and *window.viewer* can be destroyed / return null (e.g., before the user select any template). Any subscriptions/event listeners tied to them can be lost. As a result, if your plugin relies on interacting with these two APIs, use them in a *try catch* block, and listen to the appropriate events when they are destroyed and reattach your listeners appropriately.

---
APIs
======

There are three levels of APIs available to developers. Try to use APIs from the highest possible level. Directly interacting with lower levels can potentially break nehuba.

window.nehubaUI
------
provide a higher level of abstraction over nehubaViewer
provide event streams that are concatenated with metadata. For a full list of APIs, see [window.nehubaUI.readme.md](window.nehubaUI.readme.md)

window.nehubaViewer
------
nehuba (NEuroglancer HUman Brain Atlas) - abstraction above neuroglancer
provides a higher level of abstraction with customisability over mesh views and UI.
react'ify events such as navigation state, segment hover etc. 
For a full list of nehuba API, consult nehuba (inline) documentation

window.viewer
------
The original neuroglancer viewer object. 
Providing low level access to the viewer.
Gets destroyed and recreated when a new template is selected.
May interfere with how nehuba and atlas viewer interact with neuroglancer
For a full list of how to interact with window.viewer object, consult neuroglancer github page, or *console.log(window.viewer)*

---
In addition, you may interact with the container of your widget with **window.pluginControl**.

```javascript
/* in jugex.js */
window.pluginControl.next({
      target : 'fzj.xg.JuGeX',
      body : {
            blink : true, /* makes the widget blink */
            popoverMessage : 'Analysis Complete!' /* append to the popover message */
      }
})

const shutdownHandler = window.pluginControl
      .filter(evPk=>evPk.target=='fzj.xg.JuGeX'&&evPk.body.shutdown)
      .subscribe(_=>{
            shutdownHandler.unsubscribe()
            /* do thing when your user closes your app */
            /* for example, unsubscribe all of the subscriptions */
            /* close ws sockets */
            /* remove custom DOM elements */
      })
```

---

Example plugins
======
JuGeX

Remote Control

