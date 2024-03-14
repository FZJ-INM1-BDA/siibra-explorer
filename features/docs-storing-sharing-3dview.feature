Feature: Doc Storing and Sharing 3D view

    Scenario: Taking Screenshots
        Given User launched siibra-explorer
        When User takes a screenshot with the built in screenshot plugin
        Then the screenshot should work as intended
