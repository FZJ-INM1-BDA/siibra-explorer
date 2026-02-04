Feature: Plugin jugex

    Plugin jugex should work fine.
    
    Scenario: User can launch jugex plugin
        Given User launched the atlas viewer
        Given User selects an human atlas, Julich Brain v3.0.3 parcellation, MNI152 template
        When User expands the `[App]` icon at top right, and clicks siibra-jugex
        Then siibra-jugex should launch as a plugin
    
    Scenario: User can select ROI via typing
        Given User launched jugex plugin
        When User focus on `Select ROI 1` and type `fp1`
        Then A list of suggestions should be populated and shown to the user. They can be selected either via left click, or `Enter` key (selecting the first in the list).
    
    Scenario: User can select ROI via scanning atlas
        Given User selected ROI1 via typing
        When User clicks `[radar]` button next to `Select ROI 2` text box
        Then User should be prompted to `Select a region`. Single click on any region will select the region.
    
    Scenario: User can select genes of interest by typing
        Given User selected ROI2 via scanning atlas
        When User focuses selected genes, and starts typing (e.g. `GABA`)
        Then A list of suggestions should be populated and shown to the user. They can be selected either via left click, or `Enter` key (selecting the first in the list).

    Scenario: User can export notebook
        Given User selected gene(s) of interest
        When User clicks `notebook` button
        Then A new window should be opened, allowing the user to download the notebook, running it on ebrains labs or my binder
    
    Scenario: User can run the analysis
        Given User selected gene(s) of interest
        When User clicks `run` button
        Then Jugex analysis should be run based on the user's specification
    
    Scenario: Analysis should be downloadable
        Given User ran the analysis
        When User clicks the `Save` Button
        Then A result.json file should be downloaded
    
    Scenario: Result can be visualized on the atlas viewer
        Given User ran the analysis
        When User toggles `Annotate`
        Then the sample sites should be visible in the atlas viewer

    Scenario: Block listed 
        Given User launched the atlas viewer
        Given User selects any mouse atlas
        When User expands the `[App]` icon at top right
        Then siibra-jugex icon should be greyed out
        Then hover should show reason as tooltip
        Then clicking should _not_ launch the plugin
