# Finding and selecting brain regions

`siibra-explorer` provides several ways to find brain regions: 

- by [➝ clicking a region](#selecting-regions-in-the-view) in the 3D view, 
- by [➝ typing a region name](#finding-regions-by-name), 
- by [➝ exploring the region tree](#exploring-the-region-tree), or 
- by performing [➝ coordinate lookups](looking_up_coordinates.md) for probabilistic assignment to 3D coordinates.

After finding and selecting a brain region using any of these possibilities, the viewer will 
show the individual map of the region, preferring a statistical map if available, and
open the [➝ region sidepanel](#the-region-sidepanel), where you can find detailed information regarding the region.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-regionpanel.png){ style="width:500px"}

!!! warning
	The current version of `siibra-explorer` does not allow to make multi-region selections,
	but we are working on such feature.

## Selecting regions in the 3D view

If you know where in the brain a region is located, the easiest way  to select is to click any point inside the region directly in the viewer.

## Finding regions by name

The magnifying glass icon (🔍) in the top left reveals the region search panel. Here you can type keywords to find matching brain regions in the currently selected parcellation.
As you type, a list of results is shown, where highlighted brain regions can be directly selected. 

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-regionsearch.png){ style="width:500px"}

Shaded brain regions in the list are not mapped in the currently selected reference space. 
Clicking these regions instead opens the [region tree browser](#browsing-the-region-tree) to see their relationships with other regions.

By hitting enter while you are typing in the region search panel, the [region tree browser](#browsing-the-region-tree) will be opened with the same search term.

## Browsing the region tree

The region tree browser allows you to view, filter and select the regions defined by the selected parcellation from a dynamic hierarchical list.
By typing a keyword (or word fragment), the tree will be automatically reduced to those elements matching the search term. 
If you know the macroscopic localization of the region of interest, you can find the area directly via the region tree.
For convenience, the region tree allows to you directly switch species, space and parcellation, so you need not close the window to access the [atlas selection panel](../getstarted/ui.md#atlas-selection-panel).

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-taxonomybrowser.png){ style="width:500px"}

Regions are typically organized as a hierarchy of parent and child regions. 
For example, in the Julich-Brain parcellation, the top parent nodes are *Telencephalon*, *Metencephalon*, and *Diencephalon*, further subdivided into macroscopic structures such as lobes which then contain subhierarchies of cortical and subcortical regions. 

## The region sidepanel

After finding and selecting a brain region, `siibra-explorer` opens the [region sidepanel](#the-region-sidepanel). 

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-regionpanel-detail.png){ style="width:300px"}


Here you can find detailed information regarding the region, such as

- corresponding publications,
- the original dataset which provides the map displayed for this brain region,
- related brain regions (such as earlier versions or homologies), and
- multimodal data features that characterize this brain region.

!!! info "Multimodal data features of a region"
	Multimodal data features are explained in more detail in [Finding multimodal data features](finding_multimodal_data.md).

