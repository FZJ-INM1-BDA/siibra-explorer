# Main elements of the user interface

## 3D view 
At its core, the viewer presents a 3D view of a brain. 
The precise layout of the 3D view depends on the select reference space. 
For volumetric reference spaces, it presents 2D views of three orthogonal planes in the reference template, combined with a rotatable 3D overview of the brain surface indicating the location of these planes.
The planes default to the coronal, sagittal and axial plane, and can be freely adjusted in position and orientation to select arbitrary oblique views. 

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-waxholm.png){ style="width:500px"}

The volumetric views support ultrahigh-resolution data, and can be zoomed in if the underlying image data allows. Each of the 3 planar views can be maximized using the "[ ]" icon in each view.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-v1border.png){ style="width:500px"}

For pure surface spaces, such as the fsaverage space, the viewer shows only a 3D view.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-surfaceview.png){ style="width:500px"}


## Navigation panel 
At the top left of the user interface, `siibra-explorer` displays the 3D coordinate of the currently selected center of view. When you click it with the mouse pointer, a navigation panel opens, which allows to enter a different coordinates, and create a shareable link to the current view (see ["Storing and sharing 3D views"](../basics/storing_and_sharing_3d_views.md)).

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-navigation.png){ style="width:600px"}

## Parcellation map selectors 
At the bottom of the window, you find buttons to switch between different species, different reference templates, and different parcellation maps.
Working with different maps is described in ["Exploring parcellation maps"](../basics/exploring_3d_parcellation_maps.md)). 
Note that some of the buttons may be hidden in case that only one option is available.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-chips.png){ style="width:600px"}

## Tools and plugins

At the top right of the viewer, there are several icons guiding you to additional functionalites.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-tools.png){ style="width:500px"}

### ⓘ Help panel
The help button (ⓘ ) opens information about keyboard shortcuts and terms of use. Here you can also launch the interactive quick tour, which is started automatically when you use `siibra-explorer` for the first time.

### <u>↓</u> Download current view 
The download button (<u>↓</u>) will retrieve the reference template and parcellation map currently displayed in a zip file package

### ᎒᎒᎒ Plugins
The plugin button (᎒᎒᎒) reveals a menu of interactive plugins, including advanced tools for [annotation](../advanced/annotating_structures.md) and [differential gene expression analysis](../advanced/differential_gene_expression_analysis.md)

### 👤 Sign in with EBRAINS
The login button (👤) allows you to sign in with an EBRAINS account to access some custom functionalities for sharing. 

!!! tip "Get an EBRAINS account!"
	You can sign up for a free EBRAINS account at <https://ebrains.eu/register>

