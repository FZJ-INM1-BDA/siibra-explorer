Feature: Doc Exploring 3D Parcellation Maps

    Scenario: Accessing to atlas selection panel
        Given User launched siibra-explorer
        Then User should have access to atlas selection panel

    Scenario: Accessing volumetric atlases
        Given User launched siibra-explorer
        When User selects multilevel human atlas, big brain template space
        Then User should see four panel volumetric atlas viewer
    
    Scenario: Zooming the volumetric atlas
        Given User is accessing a volumetric atlas
        When User scroll the wheel
        Then the view should zoom
        
    Scenario: Panning the volumetric atlas
        Given User is accessing a volumetric atlas
        When User drags with mouse
        Then the view should pan
        
    Scenario: Oblique slicing the volumetric atlas
        Given User is accessing a volumetric atlas
        When User drags with mouse whilst holding shift
        Then the view should rotate
    
    Scenario: Accessing the atlas viewer on 2D viewer
        Given User is accessing a volumetric atlas
        When User hovers, and clicks `[maximize]` button
        Then The specific panel will maximize, with 3D view as a picture-in-picture view
     
    Scenario: Cycling 2D view
        Given User is accessing the atlas viewer as a 2D viewer
        When User hits `[space bar]`
        Then The view rotates to the next orthogonal view
    
    Scenario: Restoring from 2D view
        Given User is accessing the atlas viewer as a 2D viewer
        When User clicks `[compress] button`
        Then the view restores to the original four panel view

