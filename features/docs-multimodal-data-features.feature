Feature: Doc Multimodal Data Features

    # Other modal features were tested already

    Scenario: Finding data features linked to 3D view
        Given User launched siibra-explorer
        Given User selected Big Brain space
        Then User should find >0 spatial features
    
    Scenario: Inspect spatial data feature
        Given User found data features linked to 3D view
        When User clicks on one of the features
        Then User should be shown the VOI interest, teleported to the best viewing point
