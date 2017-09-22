Guidelines for using **window.nehubaUI** Object
======
*window.nehubaUI.metadata* is an object that contains all the metadata currently loaded.
---
TODO: flesh out the metadata that is available

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

**Load a new template**

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

