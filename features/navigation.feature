Feature: Navigating the viewer

    Users should be able to easily navigate the atlas

    Scenario: User launches the atlas viewer
        When User launches the atlas viewer
        Then The user should be directed to Human Multilevel Atlas, in MNI152 space, with Julich Brain 3.0 loaded

    Scenario: On hover shows region name(s)
        Given User launched atlas viewer
        Given User navigated to Human Multilevel Atals, in MNI152 space, with Julich brain 3.0 loaded
        Given User has not enabled mobile view
        Given The browser's width is at least 900px wide

        When User hovers over non empty voxel
        Then Label representing the voxel should show as tooltip

    Scenario: User wishes to hide parcellation
        Given User launched atlas viewer
        When User clicks the `[eye]` icon
        Then Active parcellation should hide, showing the template
        
    Scenario: User wishes to hide parcellation via keyboard shortcut
        Given User launched atlas viewer
        When User uses `q` shortcut
        Then Active parcellation should hide, showing the template
    
    Scenario: User wishes to learn more about the active parcellation
        Given User launched atlas viewer
        Given User selected Julich Brain v3.0.3
        When User clicks `[info]` icon associated with the parcellation
        Then User should see more information, including name, desc, doi.
        
    Scenario: User wishes to learn more about the active space
        Given User launched atlas viewer
        Given User selected ICBM 2007c nonlinear asym
        When User clicks `[info]` icon associated with the space
        Then User should see more information, including name, desc, doi.
