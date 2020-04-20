# Exploring a connectivity matrix for the selected brain parcellation

Via the <https://github.com/FZJ-INM1-BDA/HBP-connectivity-component>, the interactive atlas viewer allows interactive exploration of a connectivity matrix, that is defined for the currently selected brain parcellation and available from the HBP Knowledge Graph. As of now, this function is only available for the `JuBrain Cytoarchitectonic Atlas.

## Launching the connectivity browser

- Select the `JuBrain Cytoarchitectonic Atlas` from the list of parcellations (available for  the `MNI Colin 27` and `ICBM 2009c Nonlinear Asymmetric` templates), and click on any brain region to bring up its context menu.

   [![](images/region_menu_with_connectivity.png)](images/region_menu_with_connectivity.png)

- Select `Connectivity` to select one of the available connecitivty matrices. Note that this list will be growing in the near future, to inlude connectivity information from different sources.

   [![](images/connectivity_dataset_menu.png)](images/connectivity_dataset_menu.png)
   
- This will load the connectivity browser with the source region for connection strengths set to the initially selected brain region.


## Working with connectivity data

Upon selecting a preview dataset, several aspects of the UI will change:

- the color map of the parcellation will be replaced by a heat map of the connection strengths to the source region, effectively visualizing the corresponding row of the connectivity matrix:

   | Regular color map | Connectivity heat map |
   | --- | --- |
   | [![](images/connectivity_color_before.png)](images/connectivity_color_before.png) | [![](images/connectivity_color_after.png)](images/connectivity_color_after.png) |
    

- a side panel will be opened, showing the same connections strenghts as a horizontal bar plot. The source reion

   [![](images/connectivity_data_main.png)](images/connectivity_data_main.png)


### Interactive exploration of connectivity using the tabulated view

In the side panel, the selected connectivity matrix can be changed if applicable. 

[![](images/see_dataset_connectivity.png)](images/see_dataset_connectivity.png)

[![](images/connectivity_dataset_description.png)](images/connectivity_dataset_description.png)

It also provides information about the selected source region.

[![](images/connectivity_source_region.png)](images/connectivity_source_region.png)

Display of connection strengths can be set to logarithmic scale using the `Log10` checkbox:

| Connectivity plotted logarithmically `default` | Connectivity plotted linearly |
| --- | --- |
| [![](images/con_diagram_log.png)](images/con_diagram_log.png) | [![](images/con_diagram_no_log.png)](images/con_diagram_no_log.png) |

Selecting the `All results` checkbox will make the bar plot display the floating point numbers for each connection strength:

| Hiding magnitude `default` | Showing magnitude |
| --- | --- |
| [![](images/conn_disabled_all.png)](images/conn_disabled_all.png) | [![](images/conn_enabled_all.png)](images/conn_enabled_all.png) |

By clicking any of the bars, a context menu of the corersponding brain region will be brought up, providing information about the region and allowing to center the 3D view at this region, or select it as the new source region. The latter effectively selects a new row from the connectivity matrix.

- `Navigate` - navigate to the region of interest.
- `Connectivity` - to the region of interest as the source, and explore its connectivity with other parcellation regions.

[![](images/conn_expanded_area.png)](images/conn_expanded_area.png)

### Export

Using the `export` buttons, the connectivity matrix can be exported as a CSV or PNG file.

[![](images/conn_export.png)](images/conn_export.png)

## Closing the connectivity browser

To exit the connectivity mode, click the close button located at the top right side of the side panel.

[![](images/close_connectivity.png)](images/close_connectivity.png)

This will restore the colour map of the parcellation and close the side panel. 
