Feature: Doc User Interface Structure

    From doc - User Interface Structure
    
    Scenario: User can expand coordinate view
        Given User launched the atlas viewer
        Given User selects an atlas, parcellation, parcellation
        When User clicks `[chevron-down]` button
        Then The coordinate view expands
    
    Scenario: User can enter custom coordinates
        Given User launched the atlas viewer
        Given User selects an atlas, parcellation, parcellation
        When User clicks `[pen]` button
        Then User can directly enter/copy/paste/select MNI coordinates
    
    Scenario: User can select via atlas selection panel
        Given user launched the atlas viewer
        Then User should have access to atlas selection panel at the bottom of the UI

    Scenario: User can search for regions
        Given User launched the atlas viewer
        Given User selects an atlas, parcellation, parcellation
        Given User minimized side panel
        When User clicks `[magnifiying glass]` and then focus on the input box
        Then User can type keywords to search for regions
    
    Scenario: User accesses help panel
        Given User launched the atlas viewer
        When User clicks the `[circled-question-mark]` button
        Then A modal dialog about keyboard shortcuts, terms of use and so on should be visible
    
    Scenario: User downloads current view
        Given User launched the atlas viewer
        When User clicks the `[download]` button
        Then A zip file containing current view is downloaded
    
    Scenario: User accesses tools
        Given User launched the atlas viewer
        When User clicks the `[apps]` button
        Then User should see tools available to them, including screenshot, annotation, jugex
    
    Scenario: User signs in using ebrains credentials
        Given User launched the atlas viewer
        When User clicks the `[account]` button
        Then User should be able to sign in with ebrains credential
    