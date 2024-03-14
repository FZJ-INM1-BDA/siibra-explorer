Feature: Doc Launch and Quicktour

    From doc - Launch and Quicktour

    Scenario: Accessing quicktour on startup
        Given User first launched siibra-explorer
        Then User should be asked if they would like a quick tour
        
    Scenario: Accessing quicktour on return
        Given User launched siibra-explorer second time
        When User hit `?` key or clicks `(?)` button (top right)
        Then User should be able to find `Quick Tour` button at the modal dialog