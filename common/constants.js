(function(exports){

  exports.ARIA_LABELS = {
    // generic
    CLOSE: 'Close',
    OPEN: 'Open',
    EXPAND: 'Expand',
    COLLAPSE: 'Collapse',

    // dataset specific
    EXPLORE_DATASET_IN_KG: `Explore dataset in Knowledge Graph`,
    SHOW_DATASET_PREVIEW: 'Show dataset preview',
    TOGGLE_EXPLORE_PANEL: `Toggle explore panel`,
    MODALITY_FILTER: `Toggle dataset modality filter`,
    LIST_OF_MODALITIES: `List of modalities`,
    LIST_OF_DATASETS: `List of datasets`,
    DOWNLOAD_PREVIEW: `Download`,
    DOWNLOAD_PREVIEW_CSV: `Download CSV`,
    DATASET_FILE_PREVIEW: `Preview of dataset`,
    PIN_DATASET: 'Toggle pinning dataset',
    TEXT_INPUT_SEARCH_REGION: 'Search for any region of interest in the atlas selected',
    CLEAR_SELECTED_REGION: 'Clear selected region',
    BULK_DOWNLOAD: `Download all pinned data`,
    NO_BULK_DOWNLOAD: `No datasets pinned`,

    // overlay/layout specific
    SELECT_ATLAS: 'Atlas',
    CONTEXT_MENU: `Viewer context menu`,
    TOGGLE_FRONTAL_OCTANT: `Toggle perspective view frontal octant`,
    ZOOM_IN: 'Zoom in',
    ZOOM_OUT: 'Zoom out',
    MAXIMISE_VIEW: 'Maximise this view',
    UNMAXIMISE_VIEW: 'Undo maximise',
    STATUS_PANEL: 'Viewre status panel',
    SHOW_FULL_STATUS_PANEL: 'Show full status panel',
    HIDE_FULL_STATUS_PANEL: 'Hide full status panel',
    TOGGLE_SIDE_PANEL: 'Toggle side panel',
    TOGGLE_ATLAS_LAYER_SELECTOR: 'Toggle atlas layer selector',

    // sharing module
    SHARE_BTN: `Share this view`,
    SHARE_COPY_URL_CLIPBOARD: `Copy URL to clipboard`,
    SHARE_CUSTOM_URL: 'Create a custom URL',
    SHARE_CUSTOM_URL_DIALOG: 'Dialog for creating a custom URL',

    // parcellation region specific
    GO_TO_REGION_CENTROID: 'Navigate to region centroid',
    SHOW_ORIGIN_DATASET: `Show probabilistic map`,
    SHOW_CONNECTIVITY_DATA: `Show connectivity data`,
    SHOW_IN_OTHER_REF_SPACE: `Show in other reference space`,
    AVAILABILITY_IN_OTHER_REF_SPACE: 'Availability in other reference spaces',

    // additional volumes
    TOGGLE_SHOW_LAYER_CONTROL: `Show layer control`,
    ADDITIONAL_VOLUME_CONTROL: 'Additional volumes control'
  }

  exports.IDS = {
    // mesh loading status
    MESH_LOADING_STATUS: 'mesh-loading-status'
  }

  exports.CONST = {
    MULTI_REGION_SELECTION: `Multi region selection`,
    REGIONAL_FEATURES: 'Regional features',
    NO_ADDIONTAL_INFO_AVAIL: `Currently, no additional information is linked to this region.`,

    ATLAS_NOT_FOUND: `Atlas not found. Maybe it is still loading. Try again in a few seconds?`,
    TEMPLATE_NOT_FOUND: `Template not found. Maybe it is still loading. Try again in a few seconds?`,
    PARC_NOT_FOUND: ``
  }
})(typeof exports === 'undefined' ? module.exports : exports)
