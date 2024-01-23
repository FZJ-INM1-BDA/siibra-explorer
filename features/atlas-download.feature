Feature: Atlas Download

    Users should be able to download atlas

    Scenario: User downloads Julich Brain v3.0.3 in MNI152
        Given User launched the atlas viewer
        Given User selects Julich Brain v3.0.3 in MNI152 
        When User click `[download]` button (top right of UI)
        Then After a few seconds of preparation, the download should start automatically. A snack bar message should appear when it does.
    
    Scenario: The downloaded archive should contain the expected files
        Given User downloaded Julich Brain v3.0.3 in MNI152
        Then The downloaded archive should contain: README.md, LICENSE.md, template (nii.gz + md), parcellation (nii.gz + md)
    
    Scenario: User downloads hOc1 left hemisphere in MNI152
        Given User launched the atlas viewer
        Given User selects Julich Brain v3.0.3 in MNI152 
        Given user selects hOc1 left hemisphere
        When User click `[download]` button (top right of UI)
        Then After a few seconds of preparation, the download should start automatically. A snack bar message should appear when it does.
    
    Scenario: The downloaded archive should contain the expected files (#2)
        Given User downloaded hOc1 left hemisphere in MNI152
        Then the downloaded archive should contain: README.md, LICENSE.md, template (nii.gz + md), regional map (nii.gz + md)
