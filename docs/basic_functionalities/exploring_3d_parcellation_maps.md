# Exploring 3D Parcellation Maps

Based on the displayed reference template and brain parcellation, siibra-explorer provides functionalities for downloading the volumes, browsing brain region hierarchies, and retrieving various data features, such as regional distributions of cells and neurotransmitters structural, or/and functional connectivity between brain regions. 

Depending on the type of the selected reference template, the view differs.

## Navigation Volumetric Maps

In the case of a volumetric template, siibra-explorer combines a rotatable 3D surface view of a brain volume with three planar views of orthogonal image planes (coronal, sagittal, horizontal). It can visualize very large brain volumes in the terabyte range.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/julichbrain_bigbrain_4panel.png)

Each planar view allows zooming (`[mouse-wheel]`) and panning (`[mouse-drag]`), and can be maximized to full screen (`[mouse-over]` then `<click>` on `[ ]` icon) to behave like a 2D image viewer. You can select arbitrary non-orthogonal cutting planes (`<shift> + [mouse-drag]`), so that cortical layers may be inspected in their optimal 3D orientation when browsing a microscopic brain volume.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/julichbrain_bigbrain_coronal.png)

Users can explore the reference atlas at higher resolution (if available) by zooming in on the planar views.

Independent of the available resolution of the volumetric reference atlas, the resolution of the 3D view is locked to always show the whole brain and provide the 3D topographical context. 

## Navigating surface maps

In the case of a surface template, siibra-explorer shows a single view presenting the surface of the reference template.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/julichbrain_fsaverage.png)

