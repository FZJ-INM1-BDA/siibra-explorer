Plugin Migration Guide (v0.1.0 => v0.2.0)
======
Plugin APIs have changed drastically from v0.1.0 to v0.2.0. Here is a list of plugin API from v0.1.0, and how it has changed moving to v0.2.0.

**n.b.** `webcomponents-lite.js` is no longer included by default. You will need to request it explicitly with `window.interactiveViewer.pluginControl.loadExternalLibraries()` and unload it once you are done.

---

- ~~*window.nehubaUI*~~ removed
  - ~~*metadata*~~ => **window.interactiveViewer.metadata**
    - ~~*selectedTemplate* : nullable Object~~ removed. use **window.interactiveViewer.metadata.selectedTemplateBSubject** instead
    - ~~*availableTemplates* : Array of TemplateDescriptors (empty array if no templates are available)~~ => **window.interactiveViewer.metadata.loadedTemplates**
    - ~~*selectedParcellation* : nullable Object~~ removed. use **window.interactiveViewer.metadata.selectedParcellationBSubject** instead
    - ~~*selectedRegions* : Array of Object (empty array if no regions are selected)~~ removed. use **window.interactiveViewer.metadata.selectedRegionsBSubject** instead

- ~~window.pluginControl['YOURPLUGINNAME'] *nb: may be undefined if yourpluginname is incorrect*~~ => **window.interactiveViewer.pluginControl[YOURPLUGINNAME]**
  - blink(sec?:number) : Function that causes the floating widget to blink, attempt to grab user attention
  - ~~pushMessage(message:string) : Function that pushes a message that are displayed as a popover if the widget is minimised. No effect if the widget is not miniminised.~~ removed
  - shutdown() : Function that causes the widget to shutdown dynamically. (triggers onShutdown callback)
  - onShutdown(callback) : Attaches a callback function, which is called when the plugin is shutdown.
  
- ~~*window.viewerHandle*~~ => **window.interactiveViewer.viewerHandle**
  - ~~*loadTemplate(TemplateDescriptor)* : Function that loads a new template~~ removed. use **window.interactiveViewer.metadata.selectedTemplateBSubject** instead
  - ~~*onViewerInit(callback)* : Functional that allows a callback function to be called just before a nehuba viewer is initialised~~ removed
  - ~~*afterViewerInit(callback)* : Function that allows a callback function to be called just after a nehuba viewer is initialised~~ removed
  - ~~*onViewerDestroy(callback)* : Function that allows a callback function be called just before a nehuba viewer is destroyed~~ removed
  - ~~*onParcellationLoading(callback)* : Function that allows a callback function to be called just before a parcellation is selected~~ removed
  - ~~*afterParcellationLoading(callback)* : Function that allows a callback function to be called just after a parcellation is selected~~ removed
  - *setNavigationLoc(loc,realSpace?)* : Function that teleports to loc : number[3]. Optional argument to determine if the loc is in realspace (default) or voxelspace.
  - ~~*setNavigationOrientation(ori)* : Function that teleports to ori : number[4]. (Does not work currently)~~ => **setNavigationOri(ori)** (still non-functional)
  - *moveToNavigationLoc(loc,realSpace?)* : same as *setNavigationLoc(loc,realSpace?)*, except moves to target location over 500ms.
  - *showSegment(id)* : Function that selectes a segment in the viewer and UI. 
  - *hideSegment(id)* : Function that deselects a segment in the viewer and UI.
  - *showAllSegments()* : Function that selects all segments.
  - *hideAllSegments()* : Function that deselects all segments.
  - *loadLayer(layerObject)* : Function that loads a custom neuroglancer compatible layer into the viewer (e.g. precomputed, NIFTI, etc). Does not influence UI. 
  - *mouseEvent* RxJs Observable. Read more at [rxjs doc](http://reactivex.io/rxjs/)
    - *mouseEvent.filter(filterFn:({eventName : String, event: Event})=>boolean)* returns an Observable. Filters the event stream according to the filter function.
    - *mouseEvent.map(mapFn:({eventName : String, event: Event})=>any)* returns an Observable. Map the event stream according to the map function.
    - *mouseEvent.subscribe(callback:({eventName : String , event : Event})=>void)* returns an Subscriber instance. Call *Subscriber.unsubscribe()* when done to avoid memory leak. 
  - *mouseOverNehuba* RxJs Observable. Read more at [rxjs doc](http://reactivex.io/rxjs)
    - *mouseOverNehuba.filter* && *mouseOvernehuba.map* see above
    - *mouseOverNehuba.subscribe(callback:({nehubaOutput : any, foundRegion : any})=>void)*

- ~~*window.uiHandle*~~ => **window.interactiveViewer.uiHandle**
  - ~~*onTemplateSelection(callback)* : Function that allows a callback function to be called just after user clicks to navigate to a new template, before *selectedTemplate* is updated~~ removed. use **window.interactiveViewer.metadata.selectedTemplateBSubject** instead
  - ~~*afterTemplateSelection(callback)* : Function that allows a callback function to be called after the template selection process is complete, and *selectedTemplate* is updated~~ removed
  - ~~*onParcellationSelection(callback)* : Function that attach a callback function to user selecting a different parcellation~~ removed. use **window.interactiveViewer.metadata.selectedParcellationBSubject** instead.
  - ~~*afterParcellationSelection(callback)* : Function that attach a callback function to be called after the parcellation selection process is complete and *selectedParcellation* is updated.~~ removed
  - *modalControl*
    - ~~*getModalHandler()* : Function returning a handler to change/show/hide/listen to a Modal.~~ removed