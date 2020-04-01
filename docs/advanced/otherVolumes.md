# Displaying non-atlas volumes

!!! warning
    This section is still been developed, and the content/API may change in future versions.

Interactive atlas can allow for arbitary volumes to be viewed, either in the context of a reference template or without. 

## Viewing standalone volumes

`standaloneVolumes` query param is parsed, and parsed as JSON. They are passed directly to be rendered in nehuba. 

If both `standaloneVolumes` and `templateSelected` are present, the latter is ignored.

### Query param

standaloneVolumes

### Example
```
/?standaloneVolumes=%5B%22nifti%3A%2F%2Fhttp%3A%2F%2Flocalhost%3A1234%2Fnii.gz%22%2C%22precomputed%3A%2F%2Fhttp%3A%2F%2Flocalhost%3A4321%2Fvolume%22%5D
```

decoding and parsing as JSON:

```json
[
  "nifti://http://localhost:1234/nii.gz",
  "precomputed://http://localhost:4321/volume"
]
```

## Viewing registered volumes

`previewingDatasetFiles` query param is parsed, and parsed as JSON. Then, relevant volume information is retrieved, and displayed with `templateSelected` and `parcellationSelected`

### Query param

previewingDatasetFiles

### Example

```
/?templateSelected=Big+Brain+%28Histology%29&parcellationSelected=Grey%2FWhite+matter&previewingDatasetFiles=%5B%7B%22datasetId%22%3A%22minds%2Fcore%2Fdataset%2Fv1.0.0%2Fb08a7dbc-7c75-4ce7-905b-690b2b1e8957%22%2C%22filename%22%3A%22Overlay%20of%20data%20modalities%22%7D%5D
```

decoding and parsing as JSON:

```json
[
  {
    "datasetId":"minds/core/dataset/v1.0.0/b08a7dbc-7c75-4ce7-905b-690b2b1e8957",
    "filename":"Overlay of data modalities"
  }
]
```

The metadata fetched from these ID [^1] is as follows. 

[^1]: Currently, `kg-dataset-previewer` is used to resolve the preview URL. This is very likely going to change in the future.

```json
{
  "name": "Overlay of data modalities",
  "filename": "Overlay of data modalities",
  "mimetype": "application/json",
  "data": {
    "iav-registered-volumes": {
      "volumes": [
        {
          "name": "PLI Fiber Orientation Red Channel",
          "source": "precomputed://https://zam10143.zam.kfa-juelich.de/chumni/nifti/8b970e20de0e31b1b78ec9dba13d20319111189711983cb03ddbb7cc/BI-FOM-HSV_R",
          "shader": "void main(){ float x = toNormalized(getDataValue()); if (x < 0.1) { emitTransparent(); } else { emitRGB(vec3(1.0 * x, x * 0., 0. * x )); } }",
          "transform": [[0.7400000095367432, 0, 0, 11020745], [0, 0.2653011679649353, -0.6908077001571655, 2533286.5], [0, 0.6908077001571655, 0.2653011679649353, -32682974], [0, 0, 0, 1]],
          "opacity": 1.0
        },
        {
          "name": "PLI Fiber Orientation Green Channel",
          "source": "precomputed://https://zam10143.zam.kfa-juelich.de/chumni/nifti/8b970e20de0e31b1b78ec9dba13d20319111189711983cb03ddbb7cc/BI-FOM-HSV_G",
          "shader": "void main(){ float x = toNormalized(getDataValue()); if (x < 0.1) { emitTransparent(); } else { emitRGB(vec3(0. * x, x * 1., 0. * x )); } }",
          "transform": [[0.7400000095367432, 0, 0, 11020745], [0, 0.2653011679649353, -0.6908077001571655, 2533286.5], [0, 0.6908077001571655, 0.2653011679649353, -32682974], [0, 0, 0, 1]],
          "opacity": 0.5
        },
        {
          "name": "PLI Fiber Orientation Blue Channel",
          "source": "precomputed://https://zam10143.zam.kfa-juelich.de/chumni/nifti/8b970e20de0e31b1b78ec9dba13d20319111189711983cb03ddbb7cc/BI-FOM-HSV_B",
          "shader": "void main(){ float x = toNormalized(getDataValue()); if (x < 0.1) { emitTransparent(); } else { emitRGB(vec3(0. * x, x * 0., 1.0 * x )); } }",
          "transform": [[0.7400000095367432, 0, 0, 11020745], [0, 0.2653011679649353, -0.6908077001571655, 2533286.5], [0, 0.6908077001571655, 0.2653011679649353, -32682974], [0, 0, 0, 1]],
          "opacity": 0.25
        },
        {
          "name": "Blockface Image",
          "source": "precomputed://https://zam10143.zam.kfa-juelich.de/chumni/nifti/cb905d54437734b39807e252ef8aa68bc6ac889047fbebbafd885490/BI",
          "shader": "void main(){ float x = toNormalized(getDataValue()); if (x < 0.1) { emitTransparent(); } else { emitRGB(vec3(0.8 * x, x * 1., 0.8 * x )); } }",
          "transform": [[0.7400000095367432, 0, 0, 11020745], [0, 0.2653011679649353, -0.6908077001571655, 2533286.5], [0, 0.6908077001571655, 0.2653011679649353, -32682974], [0, 0, 0, 1]],
          "opacity": 1.0
        },
        {
          "name": "PLI Transmittance",
          "source": "precomputed://https://zam10143.zam.kfa-juelich.de/chumni/nifti/cb905d54437734b39807e252ef8aa68bc6ac889047fbebbafd885490/BI-TIM",
          "shader": "void main(){ float x = toNormalized(getDataValue()); if (x > 0.9) { emitTransparent(); } else { emitRGB(vec3(x * 1., x * 0.8, x * 0.8 )); } }",
          "transform": [[0.7400000095367432, 0, 0, 11020745], [0, 0.2653011679649353, -0.6908077001571655, 2533286.5], [0, 0.6908077001571655, 0.2653011679649353, -32682974], [0, 0, 0, 1]],
          "opacity": 1.0
        },
        {
          "name": "T2w MRI",
          "source": "precomputed://https://zam10143.zam.kfa-juelich.de/chumni/nifti/cb905d54437734b39807e252ef8aa68bc6ac889047fbebbafd885490/BI-MRI",
          "shader": "void main(){ float x = toNormalized(getDataValue()); if (x < 0.1) { emitTransparent(); } else { emitRGB(vec3(0.8 * x, 0.8 * x, x * 1. )); } }",
          "transform": [[0.7400000095367432, 0, 0, 11020745], [0, 0.2653011679649353, -0.6908077001571655, 2533286.5], [0, 0.6908077001571655, 0.2653011679649353, -32682974], [0, 0, 0, 1]],
          "opacity": 1.0
        },
        {
          "name": "MRI Labels",
          "source": "precomputed://https://zam10143.zam.kfa-juelich.de/chumni/nifti/cb905d54437734b39807e252ef8aa68bc6ac889047fbebbafd885490/BI-MRS",
          "transform": [[0.7400000095367432, 0, 0, 11020745], [0, 0.2653011679649353, -0.6908077001571655, 2533286.5], [0, 0.6908077001571655, 0.2653011679649353, -32682974], [0, 0, 0, 1]],
          "opacity": 1.0
        }
      ]
    }
  },
  "referenceSpaces": [
    {
      "name": "Big Brain (Histology)",
      "fullId": "minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588"
    }
  ]
}
```
