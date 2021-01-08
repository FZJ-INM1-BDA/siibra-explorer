import { regionsEqual, FilterDataEntriesByRegion } from './filterDataEntriesByRegion.pipe'

const cytoPmapHoc1 = {
  "formats": [
    "NIFTI"
  ],
  "datasetDOI": [
    {
      "cite": "Amunts, K., Malikovic, A., Mohlberg, H., Schormann, T., & Zilles, K. (2000). Brodmann’s Areas 17 and 18 Brought into Stereotaxic Space—Where and How Variable? NeuroImage, 11(1), 66–84. ",
      "doi": "10.1006/nimg.1999.0516"
    }
  ],
  "activity": [
    {
      "protocols": [
        "histology"
      ],
      "preparation": [
        "Ex vivo"
      ]
    },
    {
      "protocols": [
        "imaging"
      ],
      "preparation": [
        "Ex vivo"
      ]
    },
    {
      "protocols": [
        "brain mapping"
      ],
      "preparation": [
        "Ex vivo"
      ]
    }
  ],
  "referenceSpaces": [
    {
      "name": null,
      "fullId": "https://nexus.humanbrainproject.org/v0/data/minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2"
    },
    {
      "name": "MNI Colin 27",
      "fullId": "https://nexus.humanbrainproject.org/v0/data/minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992"
    }
  ],
  "methods": [
    "silver staining",
    "magnetic resonance imaging (MRI)",
    "probability mapping",
    "cytoarchitectonic mapping"
  ],
  "custodians": [
    "Amunts, Katrin"
  ],
  "project": [
    "JuBrain: cytoarchitectonic probabilistic maps of the human brain"
  ],
  "description": "This dataset contains the distinct architectonic Area hOc1 (V1, 17, CalcS) in the individual, single subject template of the MNI Colin 27 as well as the MNI ICBM 152 2009c nonlinear asymmetric reference space. As part of the JuBrain cytoarchitectonic atlas, the area was identified using cytoarchitectonic analysis on cell-body-stained histological sections of 10 human postmortem brains obtained from the body donor program of the University of Düsseldorf. The results of the cytoarchitectonic analysis were then mapped to both reference spaces, where each voxel was assigned the probability to belong to Area hOc1 (V1, 17, CalcS). The probability map of Area hOc1 (V1, 17, CalcS) are provided in the NifTi format for each brain reference space and hemisphere. The JuBrain atlas relies on a modular, flexible and adaptive framework containing workflows to create the probabilistic brain maps for these structures. Note that methodological improvements and integration of new brain structures may lead to small deviations in earlier released datasets.",
  "parcellationAtlas": [
    {
      "name": "Jülich Cytoarchitechtonic Brain Atlas (human)",
      "fullId": "https://nexus.humanbrainproject.org/v0/data/minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579",
      "id": [
        "deec923ec31a82f89a9c7c76a6fefd6b",
        "e2d45e028b6da0f6d9fdb9491a4de80a"
      ]
    }
  ],
  "licenseInfo": [
    {
      "name": "Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International",
      "url": "https://creativecommons.org/licenses/by-nc-sa/4.0/"
    }
  ],
  "embargoStatus": [
    "Free"
  ],
  "license": [],
  "parcellationRegion": [
    {
      "species": [],
      "name": "Area hOc1 (V1, 17, CalcS)",
      "alias": null,
      "fullId": "https://nexus.humanbrainproject.org/v0/data/minds/core/parcellationregion/v1.0.0/5151ab8f-d8cb-4e67-a449-afe2a41fb007"
    }
  ],
  "species": [
    "Homo sapiens"
  ],
  "name": "Probabilistic cytoarchitectonic map of Area hOc1 (V1, 17, CalcS) (v2.4)",
  "fullId": "https://nexus.humanbrainproject.org/v0/data/minds/core/dataset/v1.0.0/5c669b77-c981-424a-858d-fe9f527dbc07",
  "contributors": [
    "Zilles, Karl",
    "Schormann, Thorsten",
    "Mohlberg, Hartmut",
    "Malikovic, Aleksandar",
    "Amunts, Katrin"
  ],
  "id": "5c669b77-c981-424a-858d-fe9f527dbc07",
  "kgReference": [
    "10.25493/MXJ6-6DH"
  ],
  "publications": [
    {
      "name": "Brodmann's Areas 17 and 18 Brought into Stereotaxic Space—Where and How Variable?",
      "cite": "Amunts, K., Malikovic, A., Mohlberg, H., Schormann, T., & Zilles, K. (2000). Brodmann’s Areas 17 and 18 Brought into Stereotaxic Space—Where and How Variable? NeuroImage, 11(1), 66–84. ",
      "doi": "10.1006/nimg.1999.0516"
    }
  ]
} as any

const receptorhoc1 = {
  "formats": [
    "xlsx, tif, txt"
  ],
  "datasetDOI": [
    {
      "cite": "Eickhoff, S. B., Schleicher, A., Scheperjans, F., Palomero-Gallagher, N., & Zilles, K. (2007). Analysis of neurotransmitter receptor distribution patterns in the cerebral cortex. NeuroImage, 34(4), 1317–1330. ",
      "doi": "10.1016/j.neuroimage.2006.11.016"
    },
    {
      "cite": "Zilles, K., Bacha-Trams, M., Palomero-Gallagher, N., Amunts, K., & Friederici, A. D. (2015). Common molecular basis of the sentence comprehension network revealed by neurotransmitter receptor fingerprints. Cortex, 63, 79–89. ",
      "doi": "10.1016/j.cortex.2014.07.007"
    }
  ],
  "activity": [
    {
      "protocols": [
        "brain mapping"
      ],
      "preparation": [
        "Ex vivo"
      ]
    },
    {
      "protocols": [
        "histology"
      ],
      "preparation": [
        "Ex vivo"
      ]
    }
  ],
  "referenceSpaces": [],
  "methods": [
    "receptor autoradiography plot",
    "receptor density fingerprint analysis",
    "receptor density profile analysis",
    "autoradiography with [³H] SCH23390",
    "autoradiography with [³H] ketanserin",
    "autoradiography with [³H] 8-OH-DPAT",
    "autoradiography with [³H] UK-14,304",
    "autoradiography with [³H] epibatidine",
    "autoradiography with [³H] 4-DAMP",
    "autoradiography with [³H] oxotremorine-M",
    "autoradiography with [³H] flumazenil",
    "autoradiography with [³H] CGP 54626",
    "autoradiography with [³H] prazosin",
    "autoradiography with [³H] muscimol",
    "autoradiography with [³H]LY 341 495",
    "autoradiography with [³H] pirenzepine",
    "autoradiography with [³H] MK-801",
    "autoradiography with [³H] kainate",
    "autoradiography with [³H] AMPA"
  ],
  "custodians": [
    "Palomero-Gallagher, Nicola",
    "Zilles, Karl"
  ],
  "project": [
    "Quantitative Receptor data"
  ],
  "description": "This dataset contains the densities (in fmol/mg protein) of 16 receptors for classical neurotransmitters in Area hOc1 using quantitative in vitro autoradiography. The receptor density measurements can be provided in three ways: (fp) as density fingerprints (average across samples; mean density and standard deviation for each of the 16 receptors), (pr) as laminar density profiles (exemplary data from one sample; average course of the density from the pial surface to the border between layer VI and the white matter for each receptor), and (ar) as color-coded autoradiographs (exemplary data from one sample; laminar density distribution patterns for each receptor labeling). \nThis dataset contains the following receptor density measurements based on the labeling of these receptor binding sites: \n\nAMPA (glutamate; labelled with [³H]AMPA): fp, pr, ar\n\nkainate (glutamate; [³H]kainate): fp, pr, ar\n\nNMDA (glutamate; [³H]MK-801): fp, pr, ar\n\nmGluR2/3 (glutamate; [³H] LY 341 495): pr, ar\n\nGABA<sub>A</sub> (GABA; [³H]muscimol): fp, pr, ar\n\nGABA<sub>B</sub> (GABA; [³H] CGP54626): fp, pr, ar\n\nGABA<sub>A</sub> associated benzodiazepine binding sites (BZ; [³H]flumazenil): fp, pr, ar\n\nmuscarinic M₁ (acetylcholine; [³H]pirenzepine): fp, pr, ar\n\nmuscarinic M₂ (acetylcholine; [³H]oxotremorine-M): fp, pr, ar\n\nmuscarinic M₃ (acetylcholine; [³H]4-DAMP): fp, pr, ar\n\nnicotinic α₄β₂ (acetylcholine; [³H]epibatidine): fp, pr, ar\n\nα₁ (noradrenalin; [³H]prazosin): fp, pr, ar\n\nα₂ (noradrenalin; [³H]UK-14,304): fp, pr, ar\n\n5-HT₁<sub>A</sub> (serotonin; [³H]8-OH-DPAT): fp, pr, ar\n\n5-HT₂ (serotonin; [³H]ketanserin): fp, pr, ar\n\nD₁ (dopamine; [³H]SCH23390): fp, pr, ar\n\nWhich sample was used for which receptor density measurement is stated in metadata files accompanying the main data repository. For methodological details, see Zilles et al. (2002), and in Palomero-Gallagher and Zilles (2018).\n\nZilles, K. et al. (2002). Quantitative analysis of cyto- and receptorarchitecture of the human brain, pp. 573-602. In: Brain Mapping: The Methods, 2nd edition (A.W. Toga and J.C. Mazziotta, eds.). San Diego, Academic Press.\n\nPalomero-Gallagher N, Zilles K. (2018) Cyto- and receptorarchitectonic mapping of the human brain. In: Handbook of Clinical Neurology 150: 355-387",
  "parcellationAtlas": [],
  "licenseInfo": [
    {
      "name": "Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International",
      "url": "https://creativecommons.org/licenses/by-nc-sa/4.0/"
    }
  ],
  "embargoStatus": [
    "Free"
  ],
  "license": [],
  "parcellationRegion": [
    {
      "species": [],
      "name": "Area hOc1",
      "alias": null,
      "fullId": "https://nexus.humanbrainproject.org/v0/data/minds/core/parcellationregion/v1.0.0/b851eb9d-9502-45e9-8dd8-2861f0e6da3f"
    }
  ],
  "species": [
    "Homo sapiens"
  ],
  "name": "Density measurements of different receptors for Area hOc1",
  "fullId": "https://nexus.humanbrainproject.org/v0/data/minds/core/dataset/v1.0.0/e715e1f7-2079-45c4-a67f-f76b102acfce",
  "contributors": [
    "Scheperjans, Filip",
    "Schleicher, Axel",
    "Eickhoff, Simon B.",
    "Friederici, Angela D.",
    "Amunts, Katrin",
    "Palomero-Gallagher, Nicola",
    "Bacha-Trams, Maraike",
    "Zilles, Karl"
  ],
  "id": "0616d1e97b8be75de526bc265d9af540",
  "kgReference": [
    "10.25493/P8SD-JMH"
  ],
  "publications": [
    {
      "name": "Analysis of neurotransmitter receptor distribution patterns in the cerebral cortex",
      "cite": "Eickhoff, S. B., Schleicher, A., Scheperjans, F., Palomero-Gallagher, N., & Zilles, K. (2007). Analysis of neurotransmitter receptor distribution patterns in the cerebral cortex. NeuroImage, 34(4), 1317–1330. ",
      "doi": "10.1016/j.neuroimage.2006.11.016"
    },
    {
      "name": "Common molecular basis of the sentence comprehension network revealed by neurotransmitter receptor fingerprints",
      "cite": "Zilles, K., Bacha-Trams, M., Palomero-Gallagher, N., Amunts, K., & Friederici, A. D. (2015). Common molecular basis of the sentence comprehension network revealed by neurotransmitter receptor fingerprints. Cortex, 63, 79–89. ",
      "doi": "10.1016/j.cortex.2014.07.007"
    }
  ]
} as any

const receptor44d = {
  "formats": [
    "xlsx, tif, txt"
  ],
  "datasetDOI": [
    {
      "cite": "Amunts, K., Lenzen, M., Friederici, A. D., Schleicher, A., Morosan, P., Palomero-Gallagher, N., & Zilles, K. (2010). Broca’s Region: Novel Organizational Principles and Multiple Receptor Mapping. PLoS Biology, 8(9), e1000489. ",
      "doi": "10.1371/journal.pbio.1000489"
    },
    {
      "cite": "Zilles, K., Bacha-Trams, M., Palomero-Gallagher, N., Amunts, K., & Friederici, A. D. (2015). Common molecular basis of the sentence comprehension network revealed by neurotransmitter receptor fingerprints. Cortex, 63, 79–89. ",
      "doi": "10.1016/j.cortex.2014.07.007"
    }
  ],
  "activity": [
    {
      "protocols": [
        "brain mapping"
      ],
      "preparation": [
        "Ex vivo"
      ]
    },
    {
      "protocols": [
        "histology"
      ],
      "preparation": [
        "Ex vivo"
      ]
    }
  ],
  "referenceSpaces": [],
  "methods": [
    "receptor autoradiography plot",
    "receptor density fingerprint analysis",
    "receptor density profile analysis",
    "autoradiography with [³H] SCH23390",
    "autoradiography with [³H] ketanserin",
    "autoradiography with [³H] 8-OH-DPAT",
    "autoradiography with [³H] UK-14,304",
    "autoradiography with [³H] epibatidine",
    "autoradiography with [³H] 4-DAMP",
    "autoradiography with [³H] oxotremorine-M",
    "autoradiography with [³H] flumazenil",
    "autoradiography with [³H] CGP 54626",
    "autoradiography with [³H] prazosin",
    "autoradiography with [³H] muscimol",
    "autoradiography with [³H]LY 341 495",
    "autoradiography with [³H] pirenzepine",
    "autoradiography with [³H] MK-801",
    "autoradiography with [³H] kainate",
    "autoradiography with [³H] AMPA"
  ],
  "custodians": [
    "Palomero-Gallagher, Nicola",
    "Zilles, Karl"
  ],
  "project": [
    "Quantitative Receptor data"
  ],
  "description": "This dataset contains the densities (in fmol/mg protein) of 16 receptors for classical neurotransmitters in Area 44d using quantitative in vitro autoradiography. The receptor density measurements can be provided in three ways: (fp) as density fingerprints (average across samples; mean density and standard deviation for each of the 16 receptors), (pr) as laminar density profiles (exemplary data from one sample; average course of the density from the pial surface to the border between layer VI and the white matter for each receptor), and (ar) as color-coded autoradiographs (exemplary data from one sample; laminar density distribution patterns for each receptor labeling). \nThis dataset contains the following receptor density measurements based on the labeling of these receptor binding sites: \n\nAMPA (glutamate; labelled with [³H]AMPA): fp, pr, ar\n\nkainate (glutamate; [³H]kainate): fp, pr, ar\n\nNMDA (glutamate; [³H]MK-801): fp, pr, ar\n\nmGluR2/3 (glutamate; [³H] LY 341 495): pr, ar\n\nGABA<sub>A</sub> (GABA; [³H]muscimol): fp, pr, ar\n\nGABA<sub>B</sub> (GABA; [³H] CGP54626): fp, pr, ar\n\nGABA<sub>A</sub> associated benzodiazepine binding sites (BZ; [³H]flumazenil): fp, pr, ar\n\nmuscarinic M₁ (acetylcholine; [³H]pirenzepine): fp, pr, ar\n\nmuscarinic M₂ (acetylcholine; [³H]oxotremorine-M): fp, pr, ar\n\nmuscarinic M₃ (acetylcholine; [³H]4-DAMP): fp, pr, ar\n\nnicotinic α₄β₂ (acetylcholine; [³H]epibatidine): fp, pr, ar\n\nα₁ (noradrenalin; [³H]prazosin): fp, pr, ar\n\nα₂ (noradrenalin; [³H]UK-14,304): fp, pr, ar\n\n5-HT₁<sub>A</sub> (serotonin; [³H]8-OH-DPAT): fp, pr, ar\n\n5-HT₂ (serotonin; [³H]ketanserin): fp, pr, ar\n\nD₁ (dopamine; [³H]SCH23390): fp, pr, ar\n\nWhich sample was used for which receptor density measurement is stated in metadata files accompanying the main data repository. For methodological details, see Zilles et al. (2002), and in Palomero-Gallagher and Zilles (2018).\n\nZilles, K. et al. (2002). Quantitative analysis of cyto- and receptorarchitecture of the human brain, pp. 573-602. In: Brain Mapping: The Methods, 2nd edition (A.W. Toga and J.C. Mazziotta, eds.). San Diego, Academic Press.\n\nPalomero-Gallagher N, Zilles K. (2018) Cyto- and receptorarchitectonic mapping of the human brain. In: Handbook of Clinical Neurology 150: 355-387",
  "parcellationAtlas": [],
  "licenseInfo": [
    {
      "name": "Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International",
      "url": "https://creativecommons.org/licenses/by-nc-sa/4.0/"
    }
  ],
  "embargoStatus": [
    "Free"
  ],
  "license": [],
  "parcellationRegion": [
    {
      "species": [],
      "name": "Area 44d",
      "alias": null,
      "fullId": "https://nexus.humanbrainproject.org/v0/data/minds/core/parcellationregion/v1.0.0/8aeae833-81c8-4e27-a8d6-deee339d6052"
    }
  ],
  "species": [
    "Homo sapiens"
  ],
  "name": "Density measurements of different receptors for Area 44d",
  "fullId": "https://nexus.humanbrainproject.org/v0/data/minds/core/dataset/v1.0.0/cb875c0d-97f4-4dbc-a9ce-472d8ba58c99",
  "contributors": [
    "Morosan, Patricia",
    "Schleicher, Axel",
    "Lenzen, Marianne",
    "Friederici, Angela D.",
    "Amunts, Katrin",
    "Palomero-Gallagher, Nicola",
    "Bacha-Trams, Maraike",
    "Zilles, Karl"
  ],
  "id": "31397abd7aebcf13bf3b1d5eb2e2d400",
  "kgReference": [
    "10.25493/YQCR-1DQ"
  ],
  "publications": [
    {
      "name": "Broca's Region: Novel Organizational Principles and Multiple Receptor Mapping",
      "cite": "Amunts, K., Lenzen, M., Friederici, A. D., Schleicher, A., Morosan, P., Palomero-Gallagher, N., & Zilles, K. (2010). Broca’s Region: Novel Organizational Principles and Multiple Receptor Mapping. PLoS Biology, 8(9), e1000489. ",
      "doi": "10.1371/journal.pbio.1000489"
    },
    {
      "name": "Common molecular basis of the sentence comprehension network revealed by neurotransmitter receptor fingerprints",
      "cite": "Zilles, K., Bacha-Trams, M., Palomero-Gallagher, N., Amunts, K., & Friederici, A. D. (2015). Common molecular basis of the sentence comprehension network revealed by neurotransmitter receptor fingerprints. Cortex, 63, 79–89. ",
      "doi": "10.1016/j.cortex.2014.07.007"
    }
  ]
} as any

const mni152JuBrain = [
  cytoPmapHoc1,
  receptorhoc1,
  receptor44d
]

describe('filterDataEntriesByRegion.pipe', () => {

  describe('regionsEqual', () => {
    it('should return true when fullId is equal', () => {
      const region1 = {
        "referenceSpaces": [
          {
            "name": "MNI Colin 27",
            "fullId": "https://nexus.humanbrainproject.org/v0/data/minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992"
          }
        ],
        "project": [
          "JuBrain: cytoarchitectonic probabilistic maps of the human brain"
        ],
        "parcellationAtlas": [
          {
            "name": "Jülich Cytoarchitechtonic Brain Atlas (human)",
            "fullId": "https://nexus.humanbrainproject.org/v0/data/minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579",
            "id": [
              "deec923ec31a82f89a9c7c76a6fefd6b",
              "e2d45e028b6da0f6d9fdb9491a4de80a"
            ]
          }
        ],
        "parcellationRegion": [
          {
            "species": [],
            "name": "CA1 (Hippocampus)",
            "alias": null,
            "fullId": "https://nexus.humanbrainproject.org/v0/data/minds/core/parcellationregion/v1.0.0/bfc0beb7-310c-4c57-b810-2adc464bd02c"
          }
        ],
        "species": [
          "Homo sapiens"
        ],
        "fullId": "https://nexus.humanbrainproject.org/v0/data/minds/core/dataset/v1.0.0/1bbe0651-f646-4366-84f1-d37dc3c39bb3",
        "id": "ca2d24694a35504816e7aefa30754f80",
        "kgReference": [
          "10.25493/W4WK-QSK"
        ],
        "preview": false
      }

      const { parcellationRegion } = region1
      regionsEqual(parcellationRegion[0], {})
    })

    it('should return true when there is a related area', () => {

      const region1 = {
        "parcellationRegion": [
          {
            "species": [],
            "name": "Area 4p",
            "alias": null,
            "fullId": "https://nexus.humanbrainproject.org/v0/data/minds/core/parcellationregion/v1.0.0/861ab96a-c4b5-4ba6-bd40-1e80d4680f89"
          }
        ],
        "species": [
          "Homo sapiens"
        ],
        "fullId": "https://nexus.humanbrainproject.org/v0/data/minds/core/dataset/v1.0.0/b3cac84d-2146-4750-a5f1-174076f82292",
        "id": "ef2de94a2b532b91031ecf65300283cb",
        "kgReference": [
          "10.25493/J5JR-YH0"
        ],
        "preview": true
      }
    })
  })

  describe('FilterDataEntriesByRegion', () => {
    const pipe = new FilterDataEntriesByRegion()
    it('if selectedRegions is an empty array, should return original dataentries', () => {
      expect(
        pipe.transform(mni152JuBrain, [], [])
      ).toEqual(mni152JuBrain)
    })

    it('if selectedRegions include area 44, should return receptor data', () => {
      const selectedRegions = [
        {
          "name": "Area 44 (IFG) - left hemisphere",
          "rgb": [
            54,
            74,
            75
          ],
          "labelIndex": 2,
          "ngId": "jubrain mni152 v18 left",
          "children": [],
          "position": [
            -54134365,
            11216664,
            15641040
          ],
          "relatedAreas": [
            {
              "name": "Area 44v",
              "fullId": {
                "kg": {
                  "kgSchema": "minds/core/parcellationregion/v1.0.0",
                  "kgId": "7e5e7aa8-28b8-445b-8980-2a6f3fa645b3"
                }
              }
            },
            {
              "name": "Area 44d",
              "fullId": {
                "kg": {
                  "kgSchema": "minds/core/parcellationregion/v1.0.0",
                  "kgId": "8aeae833-81c8-4e27-a8d6-deee339d6052"
                }
              }
            }
          ],
        }
      ]
      expect(
        pipe.transform(mni152JuBrain, selectedRegions, [])
      ).toEqual([receptor44d])
    })
  })
})