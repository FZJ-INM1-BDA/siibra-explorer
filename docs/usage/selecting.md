# Selecting

## Selecting a template / atlas

The siibra explorer supports a number of atlases.

### From homepage

On the home page, the atlases are categorised under their respective template spaces.

[![](images/home.png)](images/home.png)

Select any of the parcellations listed, the siibra explorer will load the parcellation in the corresponding template space.

Clicking on the template card will load the template and the first of the listed parcellation under the template space.

### From viewer

If an atlas is already loaded, the list of available templates and parcellations can be accessed from the side bar.

[![](images/bigbrain_parcellation_selector_open.png)](images/bigbrain_parcellation_selector_open.png)

### Information on the selected template / parcellation

Information on the selected template or parcellation can be revealed by `hovering` or `tapping` the `info` button

[![](images/bigbrain_info_btn.png)](images/bigbrain_info_btn.png)

[![](images/bigbrain_moreinfo.png)](images/bigbrain_moreinfo.png)

## Browsing regions

There exist several ways of browsing the parcellated regions in a selected parcellation in the siibra explorer.

### From the viewer

Each of the region is represented as a coloured segment in _slice views_ (and in most circumstances, in _3d view_ as well). `mouse hover` on the segment will bring up a contextual tooltip, showing the name of the region.

[![](images/bigbrain_region_onhover.png)](images/bigbrain_region_onhover.png)

### Using the quick search box

Using the quick search box, regions of interest may be searched using keywords.

[![](images/bigbrain_quicksearch.png)](images/bigbrain_quicksearch.png)

[![](images/bigbrain_quicksearch_hoc.png)](images/bigbrain_quicksearch_hoc.png)

### Using the hierarchical tree

To view the full hierarchy, `click` the _hierarchy tree_ button. 

[![](images/bigbrain_region_hierarchy.png)](images/bigbrain_region_hierarchy.png)

[![](images/bigbrain_full_hierarchy.png)](images/bigbrain_full_hierarchy.png)

### Explore the region in other reference templates
If the parcellation region is available in multiple reference spaces, it is possible to explore them directly from the region context menu.

Click on a parcellation region (coloured segment) to reveal the region context menu. If the region is available in multiple reference spaces, a `Change template` button will appear. Click on `Change template` button to expand available templates.

[![](images/selecting_change_template_from_region.png)](images/selecting_change_template_from_region.png)

In the popout menu, you can jump directly to the region in a different reference template by clicking the corresponding option.

## Selecting / Deselecting region(s)

Region(s) of interest may also be selected, which will [fetch and display](search.md) additional information, such as descriptions and semantically linked datasets, about the region(s).

### From the viewer

`click` on a region (coloured segment) to bring up a context specific menu.

[![](images/bigbrain_region_specific_dialog.png)](images/bigbrain_region_specific_dialog.png)

From here, `click` on `[] Selected` checkbox will select or deselect the region.

### From the quick search box

`click` on the name or the checkbox will select or deselect the region.

[![](images/bigbrain_quicksearch_hoc.png)](images/bigbrain_quicksearch_hoc.png)

### From the hierarchical tree

`click` on any _region_ or _parent region_ will (mass) select / deselect the region(s). 

[![](images/bigbrain_mass_select_regions.png)](images/bigbrain_mass_select_regions.png)
