Guidelines for using **window.pluginControl** Subject
======
*window.pluginControl* is how script.js can interact with the container of the widget. *window.pluginControl* is a rxjs Subject. 
```javascript
const subscription = window.pluginControl
      .filter(evPk.target==PLUGINNAME) /* important! or you will receive event streams from other plugins, too */
      .subscribe(evPk=>{
            /* do things */
      })
```
Fire events:
```javascript
const receivedNewEvents = (analysisResults) => {
      const evPk = {
            target : PLUGINNAME,
            body : {
                  blink : true,
                  popoverMessage : 'Request completed! '
            }
      }
      window.pluginControl.next(evPk)
}
```
---
EventPacket definition for window.pluginControl
------
window.pluginControl communicates via *eventPackets*, which are objects with the following schema:
```javascript
/* sample eventPacket */
const evPk = {
      id : Date.now().toString(),   /* unique identifier of the request */
      target : 'fzj.xg.jugex',      /* name of your plugin */
      code : 100,                   /* status of the request. See individual event */
      body : {                      /* content of the request */
            blink : true
      }
}
```

---
**Highlight**

Description: fire UI events that attempts to draw user attention to this widget. Usually indicates that the widget needs user input, or an async task is completed.

Quirks: popovermessages are cleared when widget is unminimised. Blinking is turned off when user clicks the widget UI.

```javascript
const evPk = {
      target : 'fzj.xg.jugex',
      id : '',
      code : 100,
      body : {
            blink : true,
            unminimise : true, /* TODO: implement unminimise API */
            popoverMessage : 'Analysis Complete!' 
      }
}
window.pluginControl.next(evPk)
```

---
**Shutdown**

Description: fires shutdown signal, resulting in the removal of both widget UI, as well as the script tag from the DOM. Listen to this event if there are onDestory lifecycle hooks

```javascript
const evPk = {
      target : 'fzj.xg.jugex',
      code : 100,
      body : {
            shutdown : true
      }
}
window.pluginControl.next(evPk)
```
the code gives an indication of the lifecycle of the shutdown template event
```
100 : request to shutdown widget initiated
101 : pre action hook
102 : post action hook (if applicable)
200 : gracefully end of action
500 : error. Check body for reason
```