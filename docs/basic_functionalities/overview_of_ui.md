# Organisation of the user interface

At its core, the viewer presents a 3D view of a brain. 
The precise layout of the 3D view depends on the select reference space. 

For volumetric reference spaces, it presents 2D views of three orthogonal planes in the reference template, combined with a rotatable 3D overview of the brain surface indicating the location of these planes.
The planes default to the coronal, sagittal and axial plane, and can be freely adjusted in position and orientation to select arbitrary oblique views. 

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-waxholm.png){ style="width:300px"}

The volumetric views support ultrahigh-resolution data, and can be zoomed in if the underlying image data allows. Each of the 3 planar views can be maximized using the "[ ]" icon in each view.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-v1border.png){ style="width:300px"}

For pure surface spaces, such as the fsaverage space, the viewer shows only a 3D view.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-surfaceview.png){ style="width:300px"}

At the bottom of the window, you find buttons to switch between different species, different reference templates, and different parcellation maps. Note that buttons may be hidden in case that only one option is available.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-chips.png){ style="width:700px"}

At the top right of the viewer, there are several icons guiding you to additional functionalites.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-tools.png){ style="width:250px"}

From left to right you find

- The help button. Here you find information about keyboard shortcuts and terms of use. You can also launch the interactive quick tour, which is launched automatically when you use siibra-explorer for the first time.
- The download button, which will download the reference template and parcellation map currently displayed in the viewer
- The plugin menu, which allows you to launch interactive plugins (see “Advanced functionalities” below)
- The login menu, which allows you to login with an EBRAINS account to access some custom functionalities for sharing.

