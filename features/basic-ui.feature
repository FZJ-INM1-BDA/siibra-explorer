Feature: Basic UI

    User should expect basic UI to work.

    Scenario: User launches the atlas viewer
        When User launches the atlas viewer
        Then the user should be able to login via ebrains OIDC
    
    Scenario: siibra-explorer and siibra-api version is compatible
        When User launches the atlas viewer
        Then the user should *not* see the message `Expecting <VERSION>, but got <VERSION>, some functionalities may not work as expected`

    Scenario: User trying to find debug information
        Given User launches the atlas viewer
        When User navigates to `?` -> `About`
        Then The git hash matches to that of [HEAD of staing](https://github.com/FZJ-INM1-BDA/siibra-explorer/commits/staging/)

    Scenario: User trying to copy a highlighted text in viewer
        Given User launches the atlas viewer
        When User finds > 0 spatial features
        When User uncollapses spatial feature panel
        When User highlights and copies a text string
        Then The string is copied

    Scenario: User trying to copy a highlighted text in modal
        Given User launches the atlas viewer
        When User opens region hierarchy
        When User highlights and copies region name
        Then The region name is copied
