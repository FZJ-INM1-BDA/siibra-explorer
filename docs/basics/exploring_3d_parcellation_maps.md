# Exploring 3D Parcellation Maps

On the bottom left of the viewer, you find the atlas selection panel which provides buttons choosing the species, reference space, and parcellation map. The latter two are shown only if more than one option is available.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-chips.png){ style="width:600px"}

Note: 

- When selecting a species, a default reference space and parcellation will be automatically preselected.
- If you switch to a different reference space, `siibra-explorer` will first check if a map of the currently selected parcellation is available for the chosen space. If it is not, you will be asked to select a different parcellation.
- Vice versa, when selecting a parcellation which is not available as a map in the currently selected reference space, you will be asked to select a different space.

!!! tip "Downloading the current parcellation map"
	You can download the currently selected reference template and parcellation map for offline use by clicking the download button :material-download: on the top right.

In the case of a volumetric template, siibra-explorer combines a rotatable 3D surface view of a brain volume with three planar views of orthogonal image planes (coronal, sagittal, horizontal). It can visualize very large brain volumes in the Terabyte range (here: BigBrain model [^1]).

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/julichbrain_bigbrain_4panel.png){: style="width:600px" }

Each planar view allows zooming (`[mouse-wheel]`) and panning (`[mouse-drag]`). 
You can change the default planes to arbitrary oblique cutting planes using `<shift> + [mouse-drag]`. This is especially useful for inspecting cortical layers and brain regions in their optimal 3D orientation when browsing a microscopic volume.
In addition, each planar view can be maximized to full screen (`[mouse-over]` then `<click>` on :fontawesome-solid-expand: icon) to behave like a 2D image viewer.
After maximizing a view, `[space]` cycles between the four available views.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/julichbrain_bigbrain_coronal.png){: style="width:600px" }


The rotable 3D overview can be zoomed (`[mouse-wheel]`) and rotated (`[mouse-drag]`) independently.
However, its resolution is locked to always show the whole brain and provide the 3D topographical context even when zoomed in deeply to the planar views. 
Per default, it indicates the currently selected cutting planes by removing the octant facing towards the observer. This functionality can be disabled by clicking the settings icon in the bottom right.

In the case of a pure surface space, no planes are shown. siibra-explorer then shows a single 3D view presenting the surface of the reference template. It uses the same controls as the 3D overview of the volumetric view for zooming and rotation, but does not restrict the zoom level.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/julichbrain_fsaverage.png){: style="width:600px" }


	
[^1]: Amunts K, Lepage C, Borgeat L, Mohlberg H, Dickscheid T, Rousseau ME, Bludau S, Bazin PL, Lewis LB, Oros-Peusquens AM, Shah NJ, Lippert T, Zilles K, Evans AC. BigBrain: An Ultrahigh-Resolution 3D Human Brain Model. Science. 2013;340(6139):1472-1475. doi:[10.1126/science.1235381](https://doi.org/10.1126/science.1235381)# Relationships between different reference spaces

