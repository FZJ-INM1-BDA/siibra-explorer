Feature: Atlas data availability

    Users should expect all facets of atlas to be available

    Scenario: User checks out high resolution Julich Brain regions
        Given User launched the atlas viewer
        When User selects Julich Brain v2.9 in Big Brain space
        Then User should find high resolution hOc1, hOc2, hOc3, lam1-6

    Scenario: User checks out deepzoom overlay
        When User clicks the deepzoom overlay [link](https://atlases.ebrains.eu/viewer-staging/#/a:minds:core:parcellationatlas:v1.0.0:522b368e-49a3-49fa-88d3-0870a307974a/t:minds:core:referencespace:v1.0.0:d5717c4a-0fa1-46e6-918c-b8003069ade8/p:minds:core:parcellationatlas:v1.0.0:ebb923ba-b4d5-4b82-8088-fa9215c2e1fe-v4/@:z3gE6.2xbsMQ.2ya0U4.-Vyrg..2_N8QN.2-6fg4.-Bcyf.2_jBuJ..1LSm..1Lm9~.8kYz~.2b7b..EBe/x-overlay-layer:deepzoom:%2F%2Fhttps:%2F%2Fdata-proxy.ebrains.eu%2Fapi%2Fv1%2Fbuckets%2Fimg-40416c56-c645-11ec-aecc-00090faa0001%2FH108b_Timm_dark_coronal_s228.tif%2FH108b_Timm_dark_coronal_s228.dzi)
        Then User sees deepzoom slice showing fine
        Then User sees deepzoom slice is anchored at the right orientation and position
    
    Scenario: User checks out nifti overlay
        When User clicks the nifti overlay [link](https://atlases.ebrains.eu/viewer-staging/#/a:juelich:iav:atlas:v1.0.0:2/t:minds:core:referencespace:v1.0.0:265d32a0-3d84-40a5-926f-bf89f68212b9/p:minds:core:parcellationatlas:v1.0.0:05655b58-3b6f-49db-b285-64b5a0276f83/@:0.0.0.-W000.._eCwg.2-FUe3._-s_W.2_evlu..mr0..3tUu~.49WJ.50E3~..39D/x-overlay-layer:nifti:%2F%2Fhttps:%2F%2Fdata-proxy.ebrains.eu%2Fapi%2Fv1%2Fpublic%2Fbuckets%2Ftest-sept-22%2Fheat_volume_interpolated_smoothed_half_res_16bit_int.nii.gz)
        Then User sees nifti slice showing fine
    
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
        
    
    