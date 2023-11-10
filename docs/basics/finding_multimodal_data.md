# Multimodal data features

`siibra-explorer` provides access to multimodal datasets that were linked to locations in the brain. 
You can discover such datasets 

- by [selecting brain regions](#data-features-of-brain-regions), or 
- by [navigating the 3D view](#data-features-linked-to-the-3d-view)

## Data features of brain regions

When a brain region is selected (see [selecting brain regions](selecting_brain_regions.md)), `siibra-explorer` opens the region sidepanel with detailed information. 
The sidepanel provides a dedicated tab entitled "Features" which lists all found data feautres for this specific region.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-datafeatures.png){ style="width:800px"}

Features are so far organized into categories "cellular", "molecular", "functional", "connectivity", "macrostructural" and "other". 
Each entry in these categories corresponds to a dataset on a public repository, typically the [EBRAINS Knowlege Graph](https://kg.ebrains.eu/search). 
Their basic metadata is shown in the viewer, including a description and link to the original resource, as shown below for a dataset of cortical receptor densities from the "molecular" category. 

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-receptor1.png){ style="width:800px"}

Except for entries in the category "other", the underlying data are also interpreted by `siibra-explorer`, which means that the viewer offers direct access to the data: It typically provides a basic visualization in the form of a plot, and allows to download it. 

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-receptor2.png){ style="width:800px"}


For connectivity matrix features specifically, `siibra-explorer` provides advanced interaction by showing a full connectivity profile and coloring the 3D view by connection strength.


![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-surfaceview.png){ style="width:700px"}

## Data features linked to the 3D view

When no region is selected, `siibra-explorer` searches for image data anchored to the current view, that is image data matching the selected reference space and viewport.
The number of anchored features is indicated in the top left:

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-spatialsearch.png){ style="width:800px"}

By clickig on the number, a spatial search panel with the list of data features is shown, together withe 3D bounding boxes corresponding to their locations in the 3D view. By zooming in or panning the view, the list can be filtered. 

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-spatialsearch-details.png){ style="width:800px"}

Since this involves evaluating many bounding boxes, the filtering may sometimes take a little delay.
An image dataset can be selecting from the list, or by clicking its bounding box.
The selection will open a sidepanel for the data feature, and also display it as an overlay in the 3D view. The sidepanel display metadata and links in the same way as the brain region features explained above.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-spatialsearch-voi.png){ style="width:800px"}

