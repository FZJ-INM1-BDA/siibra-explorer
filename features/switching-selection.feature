Feature: Switching Atlas, Parcellation, Template

    User should be able to freely switch atlas, parcellation and templates

    Scenario: User switches template
        Given User launched the atlas viewer
        Given User selected Julich Brain v3.0.3 in ICBM 2007c nonlinear space
        When User selects `Big Brain` template
        Then User should be taken to Julich Brain BigBrain in Big Brain space
    
    Scenario: User switches parcellation
        Given User launched the atlas viewer
        Given User selected Julich Brain v2.9 in Big Brain space
        When User selects `Deep fibre bundle` parcellation
        Then User should be taken to `Deep fibre bundle` in MNI152 space
    
    