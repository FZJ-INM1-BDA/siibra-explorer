APIs for atlas viewer
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
      }) /* returns an eventStream that satisfies { target : 'loadTemplate' } */
      ```
      * subscribe() : listens to events caused by user (loading a template, selecting regions)

      ```javascript
      const subscriber = window.nehubaUI.viewControl
            .subscribe((data)=>{
                  data.target = 'loadTemplate' | 'selectRegions' 
                  /* target signifies the action to be taken */
                  data.code : 100 | 101 | 102 | 103 | 200 | 500
                  /* code signifies the lifecycle of an event
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

            /* 
            data = { 
                  target : mousedown | mouseup | click | movemove ,
                  body : originalEvent
                  } 
            */
      ```

---

* window
  * pluginControl : rxjs Subject. Used to control plugin state/lifecycle. 
    * subscribe () : listening to plugin events

    ```javascript
    const subscriber = 
      window.pluginControl
        .filter(data=>data.target=='AFFILIATION.AUTHOR.PLUGINNAME') /* always subscribe to the events relevant to your own package */
        .subscribe(data=>{
          if(data.body.shutdown){
            /* user attempts to close the plugin window */
            switch(data.code){
              case 100: /* initiation of the shutdown intention */
              break;
              case 101: /* preshutdown hook */
              break;
              case 102: /* shutdown hook */
              break;
              case 103: /* postshutdown hook */
              break;
              case 200: /* gracely end */
              break;
              case 500: /* error */
              break;
            }
          }
          if(data.body.blink){
            /* plugin is asked to blink to attempt to gain user attention */
          }
          if(data.body.popoverMessage){
            /* plugin is asked to display a popover message */
          }
        })
    ```

    * next () : send signals to control the state of the plugin. This is useful when the user has minimised the plugin, and the plugin needs the user's attention. 

    ```javascript
    window.pluginControl
      .next({
        target : 'AFFILIATION.AUTHOR.PLUGINNAME', /* please only target your own plugin */
        code : 100, /* code 100 to indicate the initiation of the process */
        body : {
          blink : true, /* ask the plugin panel to blink */
          popoverMessage : 'This plugin has a new message', /* ask the plugin to display a popovermessage when it is minimised */
          shutdown : true /* initiate the shutdown sequence. */
        }
      })
    ```

---

* window
  * nehubaViewer (for more details, see the docs of nehuba[links upcoming], can return undefined)
    * mousePosition
      * inRealSpace : rxjs Observable of number[3]
      * inVoxels : rxjs Observable of number[3]
    * navigationState
      * position
        * inRealSpace : rxjs Observable of number[3]
        * inVoxels : rxjs Observable of number [3]
      * orientation : rxjs Observable of number[4]
      * sliceZoom : rxjs Observable of number
      * full : rxjs Observable of {position:number[3],orientation:number[4],zoom:number}
      * perspectiveZoom : rxjs Observable of number
      * all : rxjs Observable of {position:number[3],orientation:number[4],zoom:number,perspectiveZoom:number}
    * mouseOver
      * segment : rxjs Observable of {segId:number | null , layer : {name:string,url?:string}}
      * image : rxjs Observable of {value:number | null , layer : {name:string,url?:string}}
      * layer : rxjs Observable of {value:number | null , layer : {name:string,url?:string}}
    * setPosition (newPosition : number[3], realSpace? : boolean) sets navigation state of the viewer to the position. 
    * showSegment(id : number, layer ? : { name? : string, url? :string }) : show parcellation region with the id passed. Second argument (optional) specifying the layer.
    * hideSegment(id : number, layer ? : { name? : string, url? :string }) : hide parcellation region with the id passed. Second argument (optional) specifying the layer

---

