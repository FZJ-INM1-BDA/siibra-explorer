Plugin APIs
======

[plugin migration guide](migrationGuide.md)

window.interactiveViewer
---
- metadata

  - *selectedTemplateBSubject* : BehaviourSubject that emits a TemplateDescriptor object whenever a template is selected. Emits null onInit.

  - *selectedParcellationBSubject* : BehaviourSubject that emits a ParcellationDescriptor object whenever a parcellation is selected. n.b. selecting a new template automatically select the first available parcellation. Emits null onInit.

  - *selectedRegionsBSubject* BehaviourSubject that emits an Array of RegionDescriptor objects whenever the list of selected regions changes. Emits empty array onInit.

  - *loadedTemplates* : Array of TemplateDescriptor objects. Loaded asynchronously onInit.

  - *regionsLabelIndexMap* Map of labelIndex (used by neuroglancer and nehuba) to the corresponding RegionDescriptor object.

- viewerHandle

  - *setNavigationLoc(coordinates,realspace?:boolean)* Function that teleports the navigation state to coordinates : [x:number,y:number,z:number]. Optional arg determine if the set of coordinates is in realspace (default) or voxelspace.

  - *moveToNavigationLoc(coordinates,realspace?:boolean)*
  same as *setNavigationLoc(coordinates,realspace?)*, except the action is carried out over 500ms.

  - *setNavigationOri(ori)* (not yet live) Function that sets the orientation state of the viewer.

  - *moveToNavigationOri(ori)* (not yet live) same as *setNavigationOri*, except the action is carried out over 500ms.

  - *showSegment(labelIndex)* Function that shows a specific segment. Will trigger *selectedRegionsBSubject*.

  - *hideSegment(labelIndex)* Function that hides a specific segment. Will trigger *selectRegionsBSubject*
  
  - *showAllSegments()* Function that shows all segments. Will trigger *selectRegionsBSubject*

  - *hideAllSegments()* Function that hides all segments. Will trigger *selectRegionBSubject*

  - *segmentColourMap* : Map of *labelIndex* to an object with the shape of `{red: number, green: number, blue: number}`.

  - *applyColourMap(colourMap)* Function that applies a custom colour map (Map of number to and object with the shape of `{red: number , green: number , blue: number}`)

  - *loadLayer(layerObject)* Function that loads *ManagedLayersWithSpecification* directly to neuroglancer. Returns the values of the object successfully added. **n.b.** advanced feature, will likely break other functionalities. **n.b.** if the layer name is already taken, the layer will not be added.
  
  ```javascript
  const obj = {
    'advanced layer' : {
      type : 'image',
      source : 'nifti://http://example.com/data/nifti.nii',
    },
    'advanced layer 2' : {
      type : 'mesh',
      source : 'vtk://http://example.com/data/vtk.vtk'
    }
  }
  const returnValue = window.interactiveViewer.viewerHandle.loadLayer(obj)
  /* loads two layers, an image nifti layer and a mesh vtk layer */

  console.log(returnValue)
  /* prints
  
  [{ 
    type : 'image', 
    source : 'nifti...' 
  },
  {
    type : 'mesh',
    source : 'vtk...'
  }] 
  */
  ```

  - *removeLayer(layerObject)* Function that removes *ManagedLayersWithSpecification*, returns an array of the names of the layers removed. **n.b.** advanced feature. may break other functionalities.
  ```js
  const obj = {
    'name' : /^PMap/
  }
  const returnValue = window.interactiveViewer.viewerHandle.removeLayer(obj)
  
  console.log(returnValue)
  /* prints
  ['PMap 001','PMap 002']
  */
  ```
  - *add3DLandmarks(landmarks)* adds landmarks to both the perspective view and slice view. 

  ```js
  const landmarks = [{
    id : `fzj-xg-jugex-1`,
    position : [0,0,0]
  },{
    id : `fzj-xg-jugex-2`,
    position : [22,27,-1]
  }]
  window.interactiveViewer.viewerHandle.add3DLandmarks(landmarks)

  /* adds landmarks in perspective view and slice view */
  ```

  - *remove3DLandmarks(IDs)* removes the landmarks by their IDs
  ```js
  window.interactiveViewer.viewerHandle
    .remove3DLandmarks(['fzj-xg-jugex-1', 'fzj-xg-jugex-1'])
  /* removes the landmarks added above */
  ```

  - *setLayerVisibility(layerObject, visible)* Function that sets the visibility of a layer. Returns the names of all the layers that are affected as an Array of string.

  ```js
  const obj = {
    'type' : 'segmentation'
  }

  window.interactiveViewer.viewerHandle.setLayerVisibility(obj,false)

  /* turns off all the segmentation layers */
  ```

  - *mouseEvent* Subject that emits an object shaped `{ eventName : string, event: event }` when a user triggers a mouse event on the viewer. 

  - *mouseOverNehuba* BehaviourSubject that emits an object shaped `{ nehubaOutput : number | null, foundRegion : RegionDescriptor | null }`

- uiHandle

  - *getModalHandler()* returns a modalHandler object, which has the following methods/properties:

    - *hide()* : Dynamically hides the modal
    - *show()* : Shows the modal
    - title : title of the modal (String)
    - body : body of the modal shown (String)
    - footer : footer of the modal (String)
    - dismissable : whether the modal is dismissable on click backdrop/esc key (Boolean) *n.b. if true, users will not be able to interact with the viewer unless you specifically call `handler.hide()`*

  - *getToastHandler()* returns a toastHandler objectm, which has the following methods/properties:

    - *show()* : Show the toast
    - *hide()* : Dynamically hides the toast
    - message : message on the toast
    - dismissable : allow user dismiss the toast via x 
    - timeout : auto hide (in ms). set to 0 for not auto hide.

- pluginControl

  - *loadExternalLibraries([LIBRARY_NAME_1,LIBRARY_NAME_2])* Function that loads external libraries. Pass the name of the libraries as an Array of string, and returns a Promise. When promise resolves, the libraries are loaded. **n.b.** while unlikely, there is a possibility that multiple requests to load external libraries in quick succession can cause the promise to resolve before the library is actually loaded. 

  ```js
  const currentlySupportedLibraries = ['jquery@2','jquery@3','webcomponentsLite@1.1.0','react@16','reactdom@16','vue@2.5.16']

  window.interactivewViewer.loadExternalLibraries(currentlySupportedLibraries)
    .then(() => {
      /* loaded */
    })
    .catch(e=>console.warn(e))

  ```

  - *unloadExternalLibraries([LIBRARY_NAME_1,LIBRARY_NAME_2])* unloading the libraries (should be called on shutdown).

  - **[PLUGINNAME]** returns a plugin handler. This would be how to interface with the plugins.

    
    - *blink(sec?:number)* : Function that causes the floating widget to blink, attempt to grab user attention
    - *shutdown()* : Function that causes the widget to shutdown dynamically. (triggers onShutdown callback)
    - *onShutdown(callback)* : Attaches a callback function, which is called when the plugin is shutdown.
    - *initState* : passed from `manifest.json`. Useful for setting initial state of the plugin. Can be any JSON valid value (array, object, string).
    - *initStateUrl* : passed from `manifest.json`. Useful for setting initial state of the plugin.  Can be any JSON valid value (array, object, string).

    ```js
    const pluginHandler = window.interactiveViewer.pluginControl[PLUGINNAME]

    const subscription = window.interactiveViewer.metadata.selectedTemplateBSubject.subscribe(template=>console.log(template))

    fetch(`http://YOUR_BACKEND.com/API_ENDPOINT`)
      .then(data=>pluginHandler.blink(20))

    pluginHandler.onShutdown(()=>{
      subscription.unsubscribe()
    })
    ```

------

window.nehubaViewer
---

nehuba object, exposed if user would like to use it

-------

window.viewer
---

neuroglancer object, exposed if user would like to use it