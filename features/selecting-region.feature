Feature: Selecting a region

    User should be able to select a region

    Scenario: User selecting a region of interest
        Given User launched the atlas viewer
        Given User selected Julich Brain v3.0.3 in ICBM 2007c nonlinear space
        When User clicks a parcel
        Then The clicked parcel is selected
        
    Scenario: User searching for a region of interest via express search
        Given User launched the atlas viewer
        Given User selected Julich Brain v3.0.3 in ICBM 2007c nonlinear space
        When User focuses on `Search for regions` and types `hoc1`
        Then Three options (hoc1 parent, hoc1 left and hoc1 right) should be shown, in this order
    
    Scenario: User selecting branch via express search
        Given User searched for `hoc1` via express search
        Given Three options (hoc1 parent, hoc1 left and hoc1 right) are shown, in this order
        When User hits `Enter` key
        Then Full hierarchy modal view should be shown, with the term `Area hOc1 (V1, 17, CalcS)` populated in the search field

    Scenario: User selecting node via express search
        Given User searched for `hoc1` via express search
        Given Three options (hoc1 parent, hoc1 left and hoc1 right) are shown, in this order
        When User clicks `hoc1 left`
        Then The region `hoc1 left` should be selected

