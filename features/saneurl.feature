Feature: SaneURL a.k.a. URL shortener

    SaneURL should continue to function.
    
    Scenario: User navigates to SaneURL UI
        Given User launched the atlas viewer
        Given User selects an atlas, parcellation, parcellation
        When User expands navigation submenu, clicks `[share]` button, clicks `Create custom URL` button
        Then User should see the SaneURL UI
    
    Scenario: SaneURL UI should be informative
        Given User navigated to SaneURL UI
        Then User should see that links expire if they are not loggedin
        Then User should see the links they potentially generate (e.g. `https://atlases.ebrains.eu/viewer-staging/go/<link>`)

    Scenario: User attempts to generate existing saneurl
        Given User navigated to SaneURL UI
        When User enters `human`
        Then User should be informed that the shortlink is not available

    Scenario: User attempts to use illegal characters
        Given User navigated to SaneURL UI
        When User enters `foo:bar`
        Then User should be informed that the shortlink is not legal

    Scenario: User attempts to generate valid saneurl
        Given User navigated to SaneURL UI
        When User enters `x_tmp_foo`
        Then User should be informed that the shortlink is available

    Scenario: User generates a valid saneurl
        Given User navigated to SaneURL UI
        When User enters `x_tmp_foo` and clicks `Create`
        Then The short link will be created. User will be informed, and given the option to copy the generated shortlink
    
    Scenario: Generated shortlink works
        Given User generated a valid saneurl
        When User enters the said saneURL to a browser
        Then They should be taken to where the shortlink is generated
    
    Scenario: Permalink works (Big Brain)
        Given <https://atlases.ebrains.eu/viewer-staging/saneUrl/bigbrainGreyWhite>
        Then Works

    Scenario: Permalink works (Juclih Brain in Colin 27)
        Given <https://atlases.ebrains.eu/viewer-staging/saneUrl/julichbrain>
        Then Works

    Scenario: Permalink works (Waxholm v4)
        Given <https://atlases.ebrains.eu/viewer-staging/saneUrl/whs4>
        Then Works

    Scenario: Permalink works (Allen CCFv3)
        Given <https://atlases.ebrains.eu/viewer-staging/saneUrl/allen2017>
        Then Works

    Scenario: Permalink works (MEBRAINS)
        Given <https://atlases.ebrains.eu/viewer-staging/saneUrl/mebrains>
        Then Works

    Scenario: Permalink works (contains annotations)
        Given <https://atlases.ebrains.eu/viewer-staging/saneUrl/stnr>
        Then Works
    
    Scenario: Permalink works (PMAP)
        Given <https://atlases.ebrains.eu/viewer-staging/go/BST_r_MNI152>
        Then Works

    Scenario: Permalink works (MPM)
        Given <https://atlases.ebrains.eu/viewer-staging/go/BST_r_MPM_MNI152>
        Then Works
    
    Scenario: Permalink works (no delineation overlay)
        Given <https://atlases.ebrains.eu/viewer-staging/go/BST_BigBrain_1um>
        Then Works
    

    Scenario: VIP link works (human)
        Given <https://atlases.ebrains.eu/viewer-staging/human>
        Then Works

    Scenario: VIP link works (monkey)
        Given <https://atlases.ebrains.eu/viewer-staging/monkey>
        Then Works

    Scenario: VIP link works (rat)
        Given <https://atlases.ebrains.eu/viewer-staging/rat>
        Then Works

    Scenario: VIP link works (mouse)
        Given <https://atlases.ebrains.eu/viewer-staging/mouse>
        Then Works
