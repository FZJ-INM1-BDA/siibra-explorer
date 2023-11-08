# Siibra Explorer

> A web-based viewer for exploring multi-resolution 3D brain atlases

## Links

- production: <https://atlases.ebrains.eu/viewer/>
- support: [support@ebrains.eu](mailto:support@ebrains.eu?subject=[interactive%20atlas%20viewer]%20queries)

## Overview 

siibra-explorer is a browser based 3D viewer for exploring brain atlases that cover different spatial resolutions and modalities. It is built around an interactive 3D view of the brain displaying a unique selection of detailed templates and parcellation maps for the human, macaque, rat or mouse brain, including BigBrain as a microscopic resolution human brain model at its full resolution of 20 micrometers. By selecting brain regions or zooming into user-defined regions of interest, you can find and access data features from different modalities which have been linked to the respective locations in the brain, including structural and functional connectivity, histological features such as cell and neurotransmitter densities, 2D and 3D images, and gene expressions. This way siibra-explorer allows you to explore and study brain organization in many different facets.

| ![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/fsaverage_connectivity.png) | ![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/waxholmv4.png) | ![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/bigbrain_cortical.png) |
| :-: | :-: | :-: |
| A | B | C |

*Figure 1: Example views of siibra-explorer’s user interface. A: Surface map of the human brain, displaying connection strengths of a region in the occipital pole to other brain regions. B: Volumetric map of the rat brain, showing the coronal, sagittal and axial planes with a 3D overview. C: Zoomed-in view to a coronal section displaying a border region in the visual system at microscopic detail.*

siibra-explorer has been developed in the frame of the [Human Brain Project](https://www.humanbrainproject.eu/en/). The main installation is hosted as a publicly accessible service inside the European research infrastructure [EBRAINS](https://ebrains.eu) on <https://atlases.ebrains.eu/viewer>. All its contents are linked to publicly available curated datasets with rich metadata, mostly shared via the [EBRAINS Knowledge Graph](https://search.kg.ebrains.eu). The software code of siibra-explorer is openly accessible on [github](http://github.com/fzj-inm1-bda/siibra-explorer). 

!!! info
    siibra stands for "**s**oftware **i**nterfaces for **i**nteracting with **br**ain **a**tlases" and includes a whole suite of tools of which siibra-explorer is the most immediate and intuitive entry point. If you are into programming and reproducibility however, don't miss [siibra-python](https://siibra-python.readthedocs.io) which provides all the functionality of the explorer (and more) in Python. If you are into application development, check out our http interface [siibra-api](https://siibra-api-stable.apps.hbp.eu/). 

!!! info
    This documentation describes the functionalities of the software. Although it includes examples of brain templates, parcellation maps and multimodal data features, it does not  provide a catalogue of the atlas contents available in the public installation, since these are constantly growing and managed independently of the software. To see which contents are accessible, go and explore the viewer <https://atlases.ebrains.eu/viewer>. Learn more about EBRAINS brain atlases at <https://ebrains.eu/brain-atlases/reference-atlases>. 