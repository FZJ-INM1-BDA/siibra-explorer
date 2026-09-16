Feature: Exploring the selected region

    User should be able to explore the selected region

    Scenario: User selecting a region of interest
        Given User launched the atlas viewer
        Given User selected Julich Brain v3.0.3 in ICBM 2007c nonlinear space
        When User clicks a parcel
        Then The clicked parcel is selected
    
    Scenario: Selecting region navigates to ROI
        Given above scenario
        Then The viewer navigates to the said centroid of the region
        
    Scenario: User return to the selected region
        Given User selects a region of interest
        Given User pan to a different location
        When User clicks `Centroid` button
        Then The viewer navigates to the said centroid of the region

    Scenario: User finding out more about the selected region
        Given User selected a region of interest
        Then The user can find description about the region

    Scenario: User accesses the doi of the selected region
        Given User selected a region of interest
        When User clicks `DOI` button
        Then A new window opens for the said DOI

    Scenario: User searches for related regions
        Given User selected a region of interest (4p left, Julich Brain v3.0.3, MNI152)
        When User clicks `Related Region` button
        Then Related region modal shows previous/next versions, as well as homologeous regions