# Staging Checklist

**use incognito browser**

[home page](https://siibra-explorer.apps.hbp.eu/staging/)

## General

- [ ] Can access front page
- [ ] Can login to oidc v2 via top-right

## Atlas data specific

- [ ] Human multilevel atlas
  - [ ] on click from home page, MNI152, Julich v2.9 loads without issue
  - [ ] on hover, show correct region name(s)
  - [ ] regional is fine :: select hOC1 right
    - [ ] probabilistic map loads fine
    - [ ] segmentation layer hides
    - [ ] `navigate to` button exists, and works
    - [ ] `Open in KG` button exists and works
    - [ ] `Description` tabs exists and works
    - [ ] `Regional features` tab exists and works
      - [ ] `Receptor density` dataset exists and works
        - [ ] `Open in KG` button exists and works
        - [ ] `Preview` tab exists and works
          - [ ] fingerprint is shown, interactable
          - [ ] profiles can be loaded, interactable
          - [ ] AR can be loaded
      - [ ] `IEEG recordings` exists and works (at least 3)
        - [ ] GDPR warning triangle
        - [ ] `Open in KG` button exists and works
        - [ ] perspective view works
          - [ ] mesh becomes transparent
          - [ ] mesh transparency returns when exit the panel
          - [ ] electrodes appear in perspective view
          - [ ] some contact points should apepar red (intersect with region)
        - [ ] electrode tab
          - [ ] show should a number of contact points
          - [ ] clicking on electrode should navigate to the contact point location
    - [ ] `Connectivity` tab exists and works
      - [ ] on opening tab, PMap disappear, colour mapped segmentation appears
      - [ ] on closing tab, PMap reappear, segmentation hides
    - [ ] Explore in other templates exists, and has MNI152 and big brain
      - [ ] clicking on the respective space will load julich 2.9 in that space
      - [ ] the navigation should be preserved
  - [ ] in big brain v2.9 (or latest)
    - [ ] high res hoc1, hoc2, hoc3, lam1-6 are visible
- [ ] Waxholm
  - [ ] v4 are visible
  - [ ] on hover, show correct region name(s)