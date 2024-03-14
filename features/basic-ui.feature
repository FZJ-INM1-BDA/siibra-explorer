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
