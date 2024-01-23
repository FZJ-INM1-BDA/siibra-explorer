Feature: Point assignment

    Users should expect point assignment to work as expected

    Scenario: User performs point assignment on Julich Brain v3.0.3 in MNI152 space
        Given User launched the atlas viewer
        Given User selects Julich Brain v3.0.3 in MNI152 
        When User right clicks on any voxel on the viewer, and clicks `x, y, z (mm) Point`
        Then User should see statistical assignment of the point, sorted by `map value`
    
    Scenario: User inspects the full table of the point assignment
        Given User performed point assignment on Julich Brain v3.0.3 in MNI152 space
        When User clicks `Show full assignment` button
        Then User should see a full assignment table in a modal dialog
    
    Scenario: User wishes to download the assignment
        Given User is inspecting the full table of point assignment
        When User clicks `Download CSV` button
        Then A CSV containing the data should be downloaded
    
    Scenario: user performs point assignment on Waxholm v4
        Given User launched the atlas viewer
        Given User selects Waxholm atlas, v4 parcellation
        When User right clicks on any voxel on the viewer, and clicks `x, y, z (mm) Point`
        Then User should see labelled assignment of the point
    
    Scenario: User performs point assignment on fsaverage
    Scenario: User performs point assignment on Julich Brain in Big Brain
