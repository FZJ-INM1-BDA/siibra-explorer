# Selecting Parcellation Maps

On the bottom left of the viewer, you find selectors for choosing the species, reference space, and parcellation map. The latter two are shown only if more than one option is available.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-chips.png){ style="width:700px"}

When selecting a species, a default reference space and parcellation will be automatically preselected.
If you switch to a different reference space, `siibra-explorer` will first check if a map of the currently selected parcellation is available for the chosen space. If it is not, you will be asked to select a different parcellation.
Vice versa, when selecting a parcellation which is not available as a map in the currently selected reference space, you will be asked to select a different space.

