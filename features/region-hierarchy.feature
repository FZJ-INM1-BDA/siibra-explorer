Feature: Explore region hierarchy

    User should be able to explore region hierarchy

    Scenario: User exploring region hierarchy
        Given User launched the atlas viewer
        Given User selected Julich Brain v3.0.3 in ICBM 2007c nonlinear space
        When User clicks `[site-map]` icon
        Then The full hierarchy modal view should be shown
    
    Scenario: User are given search context
        Given User are exploring region hierarchy
        Then User should see the context of region hierachy, including atlas, parcellation and template
    
    Scenario: User searches for branch
        Given User are exploring region hierarchy
        When User searches for `frontal lobe`
        Then User should see the parent (cerebral cortex), the branch itself (frontal lobe) and its children (e.g. inferior frontal sulcus).
    