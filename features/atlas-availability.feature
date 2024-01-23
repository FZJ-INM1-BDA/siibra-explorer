Feature: Atlas data availability

    Users should expect all facets of atlas to be available

    Scenario: User checks out high resolution Julich Brain regions
        Given User launched the atlas viewer
        When User selects Julich Brain v2.9 in Big Brain space
        Then User should find high resolution hOc1, hOc2, hOc3, lam1-6
    
    Scenario: User checks out PLI dataset from KG
        When User clicks the link curated in KG [link](https://atlases.ebrains.eu/viewer-staging/?templateSelected=Big+Brain+%28Histology%29&parcellationSelected=Grey%2FWhite+matter&cNavigation=0.0.0.-W000.._eCwg.2-FUe3._-s_W.2_evlu..7LIx..1uaTK.Bq5o~.lKmo~..NBW&previewingDatasetFiles=%5B%7B%22datasetId%22%3A%22minds%2Fcore%2Fdataset%2Fv1.0.0%2Fb08a7dbc-7c75-4ce7-905b-690b2b1e8957%22%2C%22filename%22%3A%22Overlay+of+data+modalities%22%7D%5D)
        Then User is redirected, and everything shows fine
    
    Scenario: User checks out Julich Brain in fsaverage
        Given User launched the atlas viewer
        When User selects Julich Brain in fsaverage space
        Then The atlas loads and shows fine
    
    Scenario: User checks out Waxholm atlas
        Given User launched the atlas viewer
        When User selects Waxholm atlas
        Then User is taken to the latest version (v4)
    
    Scenario: User finds Waxholm atlas showing fine
        Given User checked out waxholm atlas
        When User hovers volumetric atlas
        Then the label representing the voxel shows
        
    Scenario: User finds Waxholm atlas mesh loads fine
        Given User checked out waxholm atlas
        Then whole mesh loads
        
    
    