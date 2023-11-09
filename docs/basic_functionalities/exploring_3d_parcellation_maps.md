# Exploring 3D Parcellation Maps

In the case of a volumetric template, siibra-explorer combines a rotatable 3D surface view of a brain volume with three planar views of orthogonal image planes (coronal, sagittal, horizontal). It can visualize very large brain volumes in the Terabyte range.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/julichbrain_bigbrain_4panel.png){: style="width:700px" }

Each planar view allows zooming (`[mouse-wheel]`) and panning (`[mouse-drag]`). 
You can change the default planes to arbitrary oblique cutting planes using `<shift> + [mouse-drag]`. This is especially useful for inspecting cortical layers and brain regions in their optimal 3D orientation when browsing a microscopic volume.
In addition, each planar view can be maximized to full screen (`[mouse-over]` then `<click>` on `[ ]` icon) to behave like a 2D image viewer.
After maximizing a view, `[space]` cycles between the four available views.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/julichbrain_bigbrain_coronal.png){: style="width:700px" }


The rotable 3D overview can be zoomed (`[mouse-wheel]`) and rotated (`[mouse-drag]`) independently.
However, its resolution is locked to always show the whole brain and provide the 3D topographical context even when zoomed in deeply to the planar views. 
Per default, it indicates the currently selected cutting planes by removing the octant facing towards the observer. This functionality can be disabled by clicking the settings icon in the bottom right.

In the case of a pure surface space, no planes are shown. siibra-explorer then shows a single 3D view presenting the surface of the reference template. It uses the same controls as the 3D overview of the volumetric view for zooming and rotation, but does not restrict the zoom level.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/julichbrain_fsaverage.png){: style="width:700px" }

