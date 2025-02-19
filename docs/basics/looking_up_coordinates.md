# Coordinate lookups & probabilistic assignment

Besides brain regions, `siibra-explorer` can process 3D coordinates as locations and link them to brain regions in a parcellation maps.
The 3D coordinate of the navigation cursor is always displayed in the [view navigation panel](../getstarted/ui.md#view-navigation-panel-coordinate-lookups) at the top left. 
By selecting the pencil icon (✎) close to it, you can directly enter different coordinates:

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-navigation-coordinate.png){ style="width:700px"}

You can then **select** this coordinate to bring up a sidepanel with detailed information, specifically including assignment of brain regions to this location. 
In maps where the statistical map is present (the actual Julich-Brain Atlas), the displayed map values describe the most likely area depending on the probability map (p-value). In maps where the statistical map is not present (e.g. Waxholm Space of the Sprague Dawley Rat Brain Atlas, Monkey Atlas), the point assignment is the integer index of the labeled map.
The assignment lists all brain regions of the current parcellation map that have a nonzero value at this location, starting with the one that has the highest value.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-navigation-coordinate2.png){ style="width:700px"}

The assignment can be downloaded as a csv file by seleting "Show Full Assignment". 

Instead of entering coordinates manually, you can also select any position in the viewer by using righ-click with your mouse pointer. This will bring up a context menu showing the region right under the curser and the corresponding coordinate, which you can select to bring up the corresponding location sidepanel.

![](https://data-proxy.ebrains.eu/api/v1/buckets/reference-atlas-data/static/siibra-explorer-navigation-coordinate3.png){ style="width:700px"}


