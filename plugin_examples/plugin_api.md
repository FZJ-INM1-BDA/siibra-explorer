Plugin APIs
======
- *window.nehubaUI*
  - *metadata* 
    - *selectedTemplate* : nullable Object 
    - *selectedParcellation* : nullable Object
    - *selectedRegions* : Array of Object
  - *mouseEvent* : EventStream
  - *util*
    - *modalControl*
      - *getModalHandler()* : Function returning a handler to change/show/hide/listen to a Modal. 

- *window.viewerControl*
  - *loadTemplate(TemplateDescriptor)* : Function that loads a new template
  - *onViewerInit(callback)* : Functional that allows a callback function to be called just before a nehuba viewer is initialised
  - *afterViewerInit(callback)* : Function that allows a callback function to be called just after a nehuba viewer is initialised
  - *onViewerDestroy(callback)* : Function that allows a callback function be called just before a nehuba viewer is destroyed
  - *onParcellationLoading(callback)* : Function that allows a callback function to be called just before a parcellation is selected
  - *afterParcellationLoading(callback)* : Function that allows a callback function to be called just after a parcellation is selected
  - *setNavigationLoc(loc,realSpace?)* : Function that teleports to loc : number[3]. Optional argument to determine if the loc is in realspace (default) or voxelspace.
  - *setNavigationOrientation(ori)* : Function that teleports to ori : number[4]. (Does not work currently)
  - *moveToNavigationLoc(loc,realSpace?)* : same as *setNavigationLoc(loc,realSpace?)*, except moves to target location over 500ms.
  - *showSegment(id)* : Function that selectes a segment in the viewer and UI. 
  - *hideSegment(id)* : Function that deselects a segment in the viewer and UI.
  - *showAllSegments()* : Function that selects all segments.
  - *hideAllSegments()* : Function that deselects all segments.
  - *loadLayer(layerObject)* : Function that loads a custom neuroglancer compatible layer into the viewer (e.g. precomputed, NIFTI, etc). Does not influence UI. 
  - *reapplyNehubaMeshFix()* Function that reapplies the cosmetic change to NehubaViewer (such as custom colour map, if defined)

- *window.uiControl*
  - *onTemplateSelection(callback)* : Function that allows a callback function to be called just after user clicks to navigate to a new template, before *selectedTemplate* is updated
  - *afterTemplateSelection(callback)* : Function that allows a callback function to be called after the template selection process is complete, and *selectedTemplate* is updated