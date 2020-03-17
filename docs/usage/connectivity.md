# Connectivity matrix

One of the new features from the Interactive Viewer's [version 2.1.0](https://interactive-viewer-user-documentation.apps.hbp.eu/releases/v2.1.0/) is to explore connectivity data, based on the parcellation area (region). Source of connectivity data is specific dataset(s) from HBP Knowledge Graph.

For now, connectivity data is explorable for parcellation: "JuBrain Cytoarchitectonic Atlas" which is available on "MNI Colin 27" and "ICBM 2009c Nonlinear Asymmetric" template spaces.

## Explore area connectivity
Select parcellation "JuBrain Cytoarchitectonic Atlas" and click on a region to bring up a context-specific menu

[![](images/region_menu_with_connectivity.png)](images/region_menu_with_connectivity.png)

By clicking on the "Connectivity" button, available datasets for connectivity will be displayed

[![](images/connectivity_dataset_menu.png)](images/connectivity_dataset_menu.png)

From the picture above, connectivity is available from the dataset "1000 Brain Study". Click on a dataset name to explore connectivity data and color visualization on the parcellation.
After selecting the desired dataset you can mention several changes:

1. Color map for parcellation regions will be changed by connectivity data. (The selected area is marked on the image below)
    
    - Color map before selecting connectivity
    
   [![](images/connectivity_color_before.png)](images/connectivity_color_before.png)
    
    - Color map after selecting connectivity
    
   [![](images/connectivity_color_after.png)](images/connectivity_color_after.png)

2. A Side panel will be opened (If it is closed) and connectivity data will be displayed

   [![](images/connectivity_data_main.png)](images/connectivity_data_main.png)


## Work with connectivity data
In the connectivity panel, under selected dataset, you can find the source region
    [![](images/connectivity_source_region.png)](images/connectivity_source_region.png)


### Explore/change dataset
From connectivity panel, you can change dataset or explore the description of the current dataset

   [![](images/see_dataset_connectivity.png)](images/see_dataset_connectivity.png)
   
Hover on (i) info icon to display dataset description

   [![](images/connectivity_dataset_description.png)](images/connectivity_dataset_description.png)
   
### Connected regions view
At the top of the connectivity diagram, you can see two checkboxes: "Log10" and "All results"
 
 1. "Log10" checkbox is to see a diagram with logarithmic data. (Log10 checkbox is checked by default)
 
  | Diagram with logarithmic data | Diagram without logarithmic data |
  |-------------------------------|----------------------------------|
  |    [![](images/con_diagram_log.png)](images/con_diagram_log.png) | [![](images/con_diagram_no_log.png)](images/con_diagram_no_log.png) |

2. To see a number of connections on each connected region, the cursor should hover the desired area. 
"All results" checkbox, displays connection number of all connected areas at once (Checkbox is unchecked by default)
  
  | Diagram with disabled "All results" | Diagram with enabled "All results" |
  |-------------------------------|----------------------------------|
  | [![](images/conn_disabled_all.png)](images/conn_disabled_all.png) | [![](images/conn_enabled_all.png)](images/conn_enabled_all.png) |

By clicking the connected region, special panel will be expanded.

 [![](images/conn_expanded_area.png)](images/conn_expanded_area.png)
 
At the panel you can find a full name of the connected area and two buttons:
 "Navigate" - to change template navigation and move to region.
 "Connectivity" - to set region as source region and explore connectivity of it.



## Export connectivity data
At the end of the connectivity panel, you can find export buttons. 

   [![](images/conn_export.png)](images/conn_export.png)


You can export connectivity data with two options

1. Export data as a CSV file
2. Export data as "png" format image

## Close Connectivity
You can close connectivity from a close button on the top right side of the connectivity section at the right-side panel.

   [![](images/close_connectivity.png)](images/close_connectivity.png)


1. After clicking the close button, the standard parcellation region color map will be returned to the viewer. 
2. Connectivity data will be disappeared from a side panel