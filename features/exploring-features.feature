Feature: Exploring features

    User should be able to explore feature panel

    Scenario: User exploring the features related to a region of interest
        Given User launched the atlas viewer
        Given User selected Julich Brain v3.0.3 in ICBM 2007c nonlinear space
        Given User selects a region of interest (hOc1 left hemisphere)
        When User clicks the `Feature` tab
        Then Feature panel of region of interest is visible
    
    Scenario: User checking out a feature
        Given User is exploring features related to region of interest
        When User expands a category, and clicks a feature
        Then Feature side panel will be opened
    
    Scenario: User finding out more about selected feature
        Given User checked out a feature
        Then User can see description related to the selected feature
        
    Scenario: User checking out the DOI of the selected feature
        Given User checked out a feature (category=molecular, feature=receptor density fingerprint)
        When User clicks `DOI` button
        Then A new window opens for the said DOI
    
    Scenario: User downloads the feature
        Given User checked out a feature
        When User clicks `Download` button
        Then A zip file containing metadata and data is downloaded

    Scenario: User checking out feature visualization
        Given User checked out a feature (category=molecular, feature="receptor density profile, 5-HT1A")
        When User click the `Visualization` tab
        Then The visualization of the feature (cortical profile) becomes visible
    
    Scenario: User checking out connectivity strength
        Given User checked out a feature (category=connectivity)
        When User click the `Visualization` tab
        Then The probabilistic map hides, whilst connection strength is also visualized on the atlas

    Scenario: User quitting checking out connectivity strength
        Given User checked out connectivity strength
        When User unselects the feature
        Then The connection strength color mapped atlas disapepars, whilst the probabilistic map reappears.
