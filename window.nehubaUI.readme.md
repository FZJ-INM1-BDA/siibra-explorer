Guidelines for using **window.nehubaUI** Object
======
Overview
---
* window
  * nehubaUI
    * metadata
      * template : Object describing the selected template.
      * parcellation : Object describing the selected parcellation
      * regions : Array of Objects describing the selected regions
    * viewControl : rxjs Subject. For a complete list of APIs of eventstreams, visit http://reactivex.io/rxjs/class/es6/Subject.js~Subject.html
      * filter() : filter the event stream (to avoid if/switch blocks )
      ```javascript
      window.nehubaUI.viewControl.filter((data)=>{
            return data.target === 'loadTemplate'
      }) /* returns an eventStream */
      ```
      * subscribe() : listens to events caused by user (loading a template, selecting regions)

      ```javascript
      const subscriber = window.nehubaUI.viewControl
            .subscribe((data)=>{
                  data.target = 'loadTemplate' | 'selectRegions' 
                  /* intention of the event packet */
                  data.code : 100 | 101 | 102 | 103 | 200 | 500
                  /* lifecycle 
                  100 : initiation of the intention
                  101 : pre-action hook
                  102 : action
                  103 : post-action hook
                  200 : ends gracefully
                  500 : error 
                  */
            })
      ```

      * next () : initiate action (such as load a different template, select different regions)
      ```javascript
      window.nehubaUI.viewControl
            .next({
                  target = 'loadTemplate' | 'selectRegions',
                  /* intention of the event packet */
                  code : 100 
                  /* lifecycle 
                  100 : initiation of the intention
                  */
            })
      ```
    * mouseEvent : rxjs Subject ( TODO change to Observable )
      * subscribe () : listening to user interactions on the viewer canvas
      
      ```javascript
      /* example  */
      const subscriber = window.nehubaUI.mouseEvent
            .filter(data=>data.target==='mousedown')
            /* filters the eventStream such that only event with {target:'mousedown'} goes through */
            .subscribe((data)=>{
                  console.log(data.body)
                  /* logs all events that gets to this stage */
            })
      ```

---

*window.nehubaUI.viewControl* is a rxjs Subject.
---
```javascript
window.nehubaUI.viewControl.subscribe(evPk=>{
      /* listen to events here */
})
```
Filter events:
```javascript
window.nehubaUI.viewControl
      .filter(evPk=>evPk.target=='loadTemplate')
      .subscribe(evPk=>{
            /* listening to evPk that targets loadTemplate */
      })
```
Fire events:
```javascript
const loadCustomTemplate = (template) => {
      const evPk = {
            target : 'loadTemplate',
            id : '',
            code : 100,
            body : {
                  templateDescriptor : template
            }
      }
      window.nehubaUI.viewControl.next(evPk)
}
```
---
EventPacket definition for nehubaUI.viewControl
------
window.nehbaUI communicates via *eventPackets*, which are objects with the following schema:
```javascript
/* sample eventPacket */
const evPk = {
      id : Date.now().toString(),   /* unique identifier of the request */
      target : 'loadTemplate',      /* target/intent of the event packet, See individual event */
      code : 100 ,                  /* status of the request. See individual event */
      body : {}                     /* content of the request */
}
```

---
Events in nehubaUI
------

**Initiating/Listening to the loading of a new template**

Description: Request /listening to the loading of a (new) template. 

Quirks: *window.nehubaViewer* and *window.viewer* are destroyed and re-created when a new template is loaded. As a result, observers should unsubscribe and references should be appropriately disposed to avoid memory leaks. They may be reattached after the new template had been loaded. 

eventPacket.code gives indication of the lifecycle of the load template event.

```javascript
/* sample eventpacket */
const evPk = {
      target : 'loadTemplate',
      id : Date.now().toString(),
      code : 100,
      body : {
            templateDescriptor : { /* templateDescriptor  */ }
      } ||
      {
            name : 'Big Brain(Histology)' /* should be a unique identifier. But for now, name will have to do */
      }
}

window.nehubaUI.viewControl.next(evPk)

```
The code gives an indication of the lifecycle of the load template event. Plugins can *both* listen to and initiate 100, but should only *listen* to 101, 102,103, 200 and 500. 
```
100 : request to load template initiated
101 : pre action hook, unsubscribe observers etc
102 : action hook
103 : post action hook, resubscribe observers etc
200 : gracefully end of action
500 : error, check body for reason
```
---
**initiating/listening to region selection**

Description: Request /Listening to the (de)selection of regions.

eventPacket gives an indication of the lifecycle of selecting regions

```javascript
const evPk = {
      target : 'selectRegions',
      id : '',
      code: 100,
      body : {
            regions : [ /* regionindices as an array, or leave empty to hide every segments */ ]
      }
}
window.nehubaUI.next(evPk)
```
The code gives an indication of the lifecycle of the load template event. Plugins can *both* listen to and initiate 100, but should only *listen* to 101, 102,103, 200 and 500. 
```
100 : request to load template initiated
101 : pre action hook, unsubscribe observers etc
102 : action hook
103 : post action hook, resubscribe observers etc
200 : gracefully end of action
500 : error, check body for reason
```

---
**Listening to mouseEvents in viewer**

window.nehubaUI.mouseEvent

target : mousedown | mouseup | click | mousemove
body : event object