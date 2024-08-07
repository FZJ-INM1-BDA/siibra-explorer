# Main elements of the user interface

## 3D view 
At its core, the viewer presents a 3D view of a brain. 
The precise layout of the 3D view depends on the select reference space. 

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-waxholm.png){: style="width:300px" }
![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-v1border.png){: style="width:250px" } 
![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-surfaceview.png){: style="width:235px" }

- (Left) For volumetric reference spaces, it presents 2D views of three orthogonal planes in the reference template, combined with a rotatable 3D overview of the brain surface indicating the location of these planes. The planes default to the coronal, sagittal and axial plane, and can be freely adjusted in position and orientation to select arbitrary oblique views. 
- (Middle) The volumetric views support ultrahigh-resolution data, and can be zoomed in if the underlying image data allows. Each of the 3 planar views can be maximized using the "[ ]" icon in each view.
- (Right) For pure surface spaces, such as the fsaverage space, the viewer shows only a 3D view.

For more information, read about [Exploring 3D parcellation maps](../basics/exploring_3d_parcellation_maps.md).


## View navigation panel & coordinate lookups

At the top left of the user interface, `siibra-explorer` displays the 3D coordinate of the currently selected center of view, together with buttons for expanding the panel (:material-chevron-down:) and entering custom coordinates (:fontawesome-solid-pen:).
Expanding the panel allows to allows to modify the center point and create a shareable link to the current view (see ["Storing and sharing 3D views"](../basics/storing_and_sharing_3d_views.md)).

!!! tip "Use coordinate lookups do probabilistic assignment"
	Entering coordinates allows to [lookup regions by coordinate](../basics/looking_up_coordinates.md) and this way perform detailed **probabilistic region assignment**.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-navigation.png){ style="width:500px"}

## Atlas selection panel

At the bottom of the window, you find buttons to switch between different species, reference templates and parcellation maps.
Working with parcellation maps is described in [Exploring parcellation maps](../basics/exploring_3d_parcellation_maps.md). 
Note that some of the buttons may be hidden in case that only one option is available.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-chips.png){ style="width:500px"}

## Region search panel

The magnifying glass icon (:octicons-search-16:) in the top left reveals the region search panel. Here you can type keywords to find matching brain regions in the currently selected parcellation, and open the extended regionstree search. 
To learn more, read about [selecting brain regions](../basics/selecting_brain_regions.md). 

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-regionsearch.png){ style="width:500px"}


## Tools and plugins

At the top right of the viewer, there are several icons guiding you to additional functionalites.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-tools.png){ style="width:500px"}

#### :octicons-question-16: Help panel
The help button :octicons-question-16: opens information about keyboard shortcuts and terms of use. Here you can also launch the interactive quick tour, which is started automatically when you use `siibra-explorer` for the first time.

#### :material-download: Download current view 
The download button (:material-download:) will retrieve the reference template and parcellation map currently displayed in a zip file package

#### :material-apps: Plugins
The plugin button (:material-apps:) reveals a menu of interactive plugins, including advanced tools for [annotation](../advanced/annotating_structures.md) and [differential gene expression analysis](../advanced/differential_gene_expression_analysis.md)

#### :fontawesome-solid-user: Sign in with EBRAINS
The login button (:fontawesome-solid-user:) allows you to sign in with an EBRAINS account to access some custom functionalities for sharing. 

!!! tip "Get an EBRAINS account!"
	You can sign up for a free EBRAINS account at <https://ebrains.eu/register>

