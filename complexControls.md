
```javascript
/* sample eventpacket */
const evPk = {
      target : 'loadTemplate',
      id : Date.now().toString(),
      code : 100,
      body : {
            templateDescriptor : { /* templateDescriptor  */ }
      } |
      {
            name : 'Big Brain(Histology)' /* should be a unique identifier. But for now, name will have to do */
      }
}

window.nehubaUI.viewControl.next(evPk)

```


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