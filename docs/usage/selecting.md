# Selection

## Selecting a template / an atlas

Interactive Atlas Viewer supports a number of atlases.

### From homepage

At the home page, the atlases are categorised under the template space.

[![](images/home.png)](images/home.png)

Click on any of the parcellation listed, the interactive atlas viewer will load the parcellation in the corresponding template space

Clicking on the template card will load the template and the first parcellation in the corresponding template space.

### From viewer

If an atlas is already loaded, the list of available templates and parcellation can be accessed from the side bar.

[![](images/bigbrain_parcellation_selector_open.png)](images/bigbrain_parcellation_selector_open.png)


### Information on the selected template / parcellation

Information on the selected template or parcellation can be revealed by `hovering` or `tapping` the `info` button

[![](images/bigbrain_info_btn.png)](images/bigbrain_info_btn.png)

[![](images/bigbrain_moreinfo.png)](images/bigbrain_moreinfo.png)

## Browsing regions

An atlas will likely contain parcellated regions of interest. The interactive atlas viewer presents several ways of browsing the regions of interest.

### From viewer

Each of the region is represented as a coloured segmentation in _slice views_ (and in most circumstances in _3d view_ as well). `mouse hover` on the segment will bring up a contextual menu, showing the name of the region.

[![](images/bigbrain_region_onhover.png)](images/bigbrain_region_onhover.png)

### From quick search

The interactive atlas viewer provides a quick search tool, which allow user to quickly find a region of interest by keyword

[![](images/bigbrain_quicksearch.png)](images/bigbrain_quicksearch.png)

[![](images/bigbrain_quicksearch_hoc.png)](images/bigbrain_quicksearch_hoc.png)

### From hierarchy tree

To view the full hierarchy, `click` the _hierarchy tree_ button. 

[![](images/bigbrain_region_hierarchy.png)](images/bigbrain_region_hierarchy.png)

[![](images/bigbrain_full_hierarchy.png)](images/bigbrain_full_hierarchy.png)

## Selecting / Deselecting region(s)

Selecting region(s) indicate a certain level of interest of these regions. Additional information on the selected regions, such as region descriptions, semantically linked datasets and so on, will be [fetched and displayed](search.md).

### From viewer

`click` on a segmented region will bring up a region specific dialog

[![](images/bigbrain_region_specific_dialog.png)](images/bigbrain_region_specific_dialog.png)

From here, `click` on `[] Selected` checkbox will select or deselect the region.

### From quick search

`click` on the name or the checkbox will select or deselect the region.

[![](images/bigbrain_quicksearch_hoc.png)](images/bigbrain_quicksearch_hoc.png)

### From hierarchy tree

`click` on any _region_ or _parent region_ will (mass) select / deselect the region(s). 

[![](images/bigbrain_mass_select_regions.png)](images/bigbrain_mass_select_regions.png)