(function(exports){

  exports.ARIA_LABELS = {
    // generic
    CLOSE: 'Close',
    OPEN: 'Open',
    EXPAND: 'Expand',
    COLLAPSE: 'Collapse',
    COPY_TO_CLIPBOARD: 'Copy to clipboard',
    OPEN_IN_NEW_WINDOW: 'Open in a new window',

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
    STATUS_PANEL: 'Viewer status panel',
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
    PARC_VER_SELECT: 'Select parcellation versions',
    PARC_VER_CONTAINER: 'List of parcellation versions',
    GO_TO_REGION_CENTROID: 'Navigate to region centroid',
    SHOW_ORIGIN_DATASET: `Show probabilistic map`,
    SHOW_CONNECTIVITY_DATA: `Show connectivity data`,
    SHOW_IN_OTHER_REF_SPACE: `Show in other reference space`,
    AVAILABILITY_IN_OTHER_REF_SPACE: 'Availability in other reference spaces',

    // additional volumes
    TOGGLE_SHOW_LAYER_CONTROL: `Show layer control`,
    ADDITIONAL_VOLUME_CONTROL: 'Additional volumes control',

    //Viewer mode
    VIEWER_MODE_ANNOTATING: 'annotating',
    VIEWER_MODE_KEYFRAME: 'key frame',

    // Annotations
    USER_ANNOTATION_LIST: 'user annotations footer',
    USER_ANNOTATION_IMPORT: 'Import annotations',
    USER_ANNOTATION_EXPORT: 'Export all of my annotations',
    USER_ANNOTATION_EXPORT_SINGLE: 'Export annotation',
    USER_ANNOTATION_HIDE: 'user annotations hide',
    USER_ANNOTATION_DELETE: 'Delete annotation',
    GOTO_ANNOTATION_ROI: 'Navigate to annotation location of interest',
    EXIT_ANNOTATION_MODE: 'Exit annotation mode',

    // volume tuning specific
    VOLUME_TUNING_EXPAND: 'Expand volume tuning widget'
  }

  exports.IDS = {
    // mesh loading status
    MESH_LOADING_STATUS: 'mesh-loading-status'
  }

  exports.CONST = {
    CANNOT_DECIPHER_HEMISPHERE: 'Cannot decipher region hemisphere.',
    DOES_NOT_SUPPORT_MULTI_REGION_SELECTION: `Please only select a single region.`,
    MULTI_REGION_SELECTION: `Multi region selection`,
    REGIONAL_FEATURES: 'Regional features',
    NO_ADDIONTAL_INFO_AVAIL: `Currently, no additional information is linked to this region.`,

    ATLAS_NOT_FOUND: `Atlas not found. Maybe it is still loading. Try again in a few seconds?`,
    TEMPLATE_NOT_FOUND: `Template not found. Maybe it is still loading. Try again in a few seconds?`,
    PARC_NOT_FOUND: ``,

    PINNED_DATASETS_BADGE_DESC: `Number of pinned datasets`,

    GDPR_TEXT: `This dataset is currently reviewed by the EBRAINS Data Protection Office regarding GDPR compliance. Therefore the atlas does not provide access to the underlying data files yet. The data will be available after this review.`,

    RECEPTOR_FP_CAPTION: `The receptor densities are visualized as fingerprints (fp), which provide the mean density and standard deviation for each of the analyzed receptor types, averaged across samples.`,
    RECEPTOR_PR_CAPTION: `For a single tissue sample, an exemplary density distribution for a single receptor from the pial surface to the border between layer VI and the white matter.`,
    RECEPTOR_AR_CAPTION: `An exemplary density distribution of a single receptor for one laminar cross-section in a single tissue sample.`,

    DATA_NOT_READY: `Still fetching data. Please try again in a few moments.`,
    QUICKTOUR_HEADER: `Welcome to ebrains siibra explorer`,
    PERMISSION_TO_QUICKTOUR: `Would you like a quick tour?`,
    QUICKTOUR_OK: `Start`,
    QUICKTOUR_NEXTTIME: `Not now`,
    QUICKTOUR_CANCEL: `Dismiss`,
  }

  exports.QUICKTOUR_DESC ={
    REGION_SEARCH: `Use the region quick search for finding, selecting and navigating brain regions in the selected parcellation map.`,
    ATLAS_SELECTOR: `This is the atlas selector. Click here to choose between EBRAINS reference atlases of different species.`,
    CHIPS: `These "chips" indicate the currently selected parcellation map as well as selected region. Click the chip to see different versions, if any. Click (i) to read more about a selected item. Click (x) to clear a selection.`,
    SLICE_VIEW: `The planar views allow you to zoom in to full resolution (mouse wheel), pan the view (click+drag), and select oblique sections (shift+click+drag). You can double-click brain regions to select them.`,
    PERSPECTIVE_VIEW: `The 3D view gives an overview of the brain with limited resolution. It can be independently rotated. On the 3d view you can find additional settings.`,
    VIEW_ICONS: `Use these icons in any of the views to maximize it and zoom in/out.`,
    TOP_MENU: `These icons provide access to plugins, pinned datasets, and user documentation. Use the profile icon to login with your EBRAINS account.`,
    LAYER_SELECTOR: `This is the atlas layer browser. If an atlas supports multiple template spaces or parcellation maps, you will find them here.`,
    STATUS_CARD: `This is the coordinate navigator. Expand it to manipulate voxel and physical coordinates, to reset the view, or to create persistent links to the current view for sharing.`,
  }
})(typeof exports === 'undefined' ? module.exports : exports)
