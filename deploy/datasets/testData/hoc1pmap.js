module.exports = [
  {
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
    "files": [
      {
        "byteSize": 199561,
        "name": "Area-hOc1_r_N10_nlin2Stdcolin27_2.4_publicP_b3b742528b1d1a933c89b2604d23028d.nii.gz",
        "absolutePath": "https://object.cscs.ch/v1/AUTH_227176556f3c4bb38df9feea4b91200c/hbp-d000001_jubrain-cytoatlas-Area-hOc1_pub/2.4/Area-hOc1_r_N10_nlin2Stdcolin27_2.4_publicP_b3b742528b1d1a933c89b2604d23028d.nii.gz",
        "contentType": "application/octet-stream"
      },
      {
        "byteSize": 217968,
        "name": "Area-hOc1_l_N10_nlin2Stdcolin27_2.4_publicP_788fe1ea663b1fa4e7e9a8b5cf26c5d6.nii.gz",
        "absolutePath": "https://object.cscs.ch/v1/AUTH_227176556f3c4bb38df9feea4b91200c/hbp-d000001_jubrain-cytoatlas-Area-hOc1_pub/2.4/Area-hOc1_l_N10_nlin2Stdcolin27_2.4_publicP_788fe1ea663b1fa4e7e9a8b5cf26c5d6.nii.gz",
        "contentType": "application/octet-stream"
      },
      {
        "byteSize": 188966,
        "name": "Area-hOc1_l_N10_nlin2MNI152ASYM2009C_2.4_publicP_d3045ee3c0c4de9820eb1516d2cc72bb.nii.gz",
        "absolutePath": "https://object.cscs.ch/v1/AUTH_227176556f3c4bb38df9feea4b91200c/hbp-d000001_jubrain-cytoatlas-Area-hOc1_pub/2.4/Area-hOc1_l_N10_nlin2MNI152ASYM2009C_2.4_publicP_d3045ee3c0c4de9820eb1516d2cc72bb.nii.gz",
        "contentType": "application/octet-stream"
      },
      {
        "byteSize": 181550,
        "name": "Area-hOc1_r_N10_nlin2MNI152ASYM2009C_2.4_publicP_a48ca5d938781ebaf1eaa25f59df74d0.nii.gz",
        "absolutePath": "https://object.cscs.ch/v1/AUTH_227176556f3c4bb38df9feea4b91200c/hbp-d000001_jubrain-cytoatlas-Area-hOc1_pub/2.4/Area-hOc1_r_N10_nlin2MNI152ASYM2009C_2.4_publicP_a48ca5d938781ebaf1eaa25f59df74d0.nii.gz",
        "contentType": "application/octet-stream"
      },
      {
        "byteSize": 20,
        "name": "subjects_Area-hOc1.csv",
        "absolutePath": "https://object.cscs.ch/v1/AUTH_227176556f3c4bb38df9feea4b91200c/hbp-d000001_jubrain-cytoatlas-Area-hOc1_pub/subjects_Area-hOc1.csv",
        "contentType": "text/csv"
      }
    ],
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
    ],
    "preview": true
  }
]