module.exports = [
  {
    "formats": [],
    "datasetDOI": [
      {
        "cite": "Schleicher, A., Amunts, K., Geyer, S., Morosan, P., & Zilles, K. (1999). Observer-Independent Method for Microstructural Parcellation of Cerebral Cortex: A Quantitative Approach to Cytoarchitectonics. NeuroImage, 9(1), 165–177. ",
        "doi": "10.1006/nimg.1998.0385"
      },
      {
        "cite": "Spitzer, H., Kiwitz, K., Amunts, K., Harmeling, S., Dickscheid, T. (2018). Improving Cytoarchitectonic Segmentation of Human Brain Areas with Self-supervised Siamese Networks. In: Frangi A., Schnabel J., Davatzikos C., Alberola-López C., Fichtinger G. (eds) Medical Image Computing and Computer Assisted Intervention – MICCAI 2018. MICCAI 2018. Lecture Notes in Computer Science, vol 11072. Springer, Cham.",
        "doi": "10.1007/978-3-030-00931-1_76"
      },
      {
        "cite": "Spitzer, H., Amunts, K., Harmeling, S., and Dickscheid, T. (2017). Parcellation of visual cortex on high-resolution histological brain sections using convolutional neural networks, in 2017 IEEE 14th International Symposium on Biomedical Imaging (ISBI 2017), pp. 920–923.",
        "doi": "10.1109/ISBI.2017.7950666"
      },
      {
        "cite": "Amunts, K., Lepage, C., Borgeat, L., Mohlberg, H., Dickscheid, T., Rousseau, M. -E., Bludau, S., Bazin, P. -L., Lewis, L. B., Oros-Peusquens, A.-M., Shah, N. J., Lippert, T., Zilles, K., Evans, A. C. (2013).  BigBrain: An Ultrahigh-Resolution 3D Human Brain Model. Science, 340(6139),1472-5.",
        "doi": "10.1126/science.1235381"
      }
    ],
    "activity": [
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
          "histology"
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
      },
      {
        "protocols": [
          "analysis technique"
        ],
        "preparation": [
          "Ex vivo"
        ]
      }
    ],
    "referenceSpaces": [
      {
        "name": "BigBrain",
        "fullId": "https://nexus.humanbrainproject.org/v0/data/minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588"
      }
    ],
    "methods": [
      "magnetic resonance imaging (MRI)",
      "silver staining",
      "cytoarchitectonic mapping",
      "Deep-Learning based cytoarchitectonic mapping"
    ],
    "custodians": [
      "Amunts, Katrin"
    ],
    "project": [
      "Ultrahigh resolution 3D maps of cytoarchitectonic areas in the Big Brain model"
    ],
    "description": "This dataset contains automatically created cytoarchitectonic maps of Area hOc1 (V1, 17, CalcS) in the BigBrain dataset [Amunts et al. 2013]. The mappings were created using Deep Convolutional Neural networks based on the idea presented in Spitzer et al. 2017 and Spitzer et al. 2018, which were trained on delineations on every 120th section created using the semi-automatic method presented in Schleicher et al. 1999. Mappings are available on every section. Their quality was observed by a trained neuroscientist to exclude sections with low quality results from further processing. Automatic mappings were then transformed to the 3D reconstructed BigBrain space using transformations used in Amunts et al. 2013, which were provided by Claude Lepage (McGill). Individual sections were used to assemble a 3D volume of the area, low quality results were replaced by interpolations between nearest neighboring sections. The volume was then smoothed using an 11³ median filter and largest connected components were identified to remove false positive results of the classification algorithm.\nThe dataset consists of a single HDF5 file containing the volume in RAS dimension ordering and 20 micron isotropic resolution in the dataset “volume” and affine transformation matrix in the dataset “affine”. An additional dataset “interpolation_info” contains a vector with an integer value for each section which indicates if a section was interpolated due to low quality results (value 2) or not (value 1).\nDue to the large size of the volume, it’s recommended to view the data online using the provided viewer link.\n",
    "parcellationAtlas": [
      {
        "name": "Jülich Cytoarchitechtonic Brain Atlas (human)",
        "fullId": "https://nexus.humanbrainproject.org/v0/data/minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-26",
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
        "alias": null
      }
    ],
    "species": [
      "Homo sapiens"
    ],
    "name": "Ultrahigh resolution 3D cytoarchitectonic map of Area hOc1 (V1, 17, CalcS) created by a Deep-Learning assisted workflow",
    "files": [],
    "fullId": "https://nexus.humanbrainproject.org/v0/data/minds/core/dataset/v1.0.0/696d6062-3b86-498f-9ca6-e4d67b433396",
    "contributors": [
      "Dickscheid, Timo",
      "Amunts, Katrin",
      "Kiwitz, Kai",
      "Schiffer, Christian "
    ],
    "id": "696d6062-3b86-498f-9ca6-e4d67b433396",
    "kgReference": [
      "10.25493/DGEZ-Q93"
    ],
    "publications": [
      {
        "name": "Observer-Independent Method for Microstructural Parcellation of Cerebral Cortex: A Quantitative Approach to Cytoarchitectonics",
        "cite": "Schleicher, A., Amunts, K., Geyer, S., Morosan, P., & Zilles, K. (1999). Observer-Independent Method for Microstructural Parcellation of Cerebral Cortex: A Quantitative Approach to Cytoarchitectonics. NeuroImage, 9(1), 165–177. ",
        "doi": "10.1006/nimg.1998.0385"
      },
      {
        "name": "Improving Cytoarchitectonic Segmentation of Human Brain Areas with Self-supervised Siamese Networks",
        "cite": "Spitzer, H., Kiwitz, K., Amunts, K., Harmeling, S., Dickscheid, T. (2018). Improving Cytoarchitectonic Segmentation of Human Brain Areas with Self-supervised Siamese Networks. In: Frangi A., Schnabel J., Davatzikos C., Alberola-López C., Fichtinger G. (eds) Medical Image Computing and Computer Assisted Intervention – MICCAI 2018. MICCAI 2018. Lecture Notes in Computer Science, vol 11072. Springer, Cham.",
        "doi": "10.1007/978-3-030-00931-1_76"
      },
      {
        "name": "Parcellation of visual cortex on high-resolution histological brain sections using convolutional neural networks",
        "cite": "Spitzer, H., Amunts, K., Harmeling, S., and Dickscheid, T. (2017). Parcellation of visual cortex on high-resolution histological brain sections using convolutional neural networks, in 2017 IEEE 14th International Symposium on Biomedical Imaging (ISBI 2017), pp. 920–923.",
        "doi": "10.1109/ISBI.2017.7950666"
      },
      {
        "name": "BigBrain: An Ultrahigh-Resolution 3D Human Brain Model",
        "cite": "Amunts, K., Lepage, C., Borgeat, L., Mohlberg, H., Dickscheid, T., Rousseau, M. -E., Bludau, S., Bazin, P. -L., Lewis, L. B., Oros-Peusquens, A.-M., Shah, N. J., Lippert, T., Zilles, K., Evans, A. C. (2013).  BigBrain: An Ultrahigh-Resolution 3D Human Brain Model. Science, 340(6139),1472-5.",
        "doi": "10.1126/science.1235381"
      }
    ]
  }
]