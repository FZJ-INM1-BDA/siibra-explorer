# Superimposing Remote Files

siibra-explorer supports overlaying remote files on top of existing atlas. The remote sources must:

- be accessible via https ([mixed content](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content) is disabled by browser for security reasons)
- has appropriate [CORS headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) (more specifically [`Access-Control-Allow-Origin` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Origin)) appropriately set

!!! info
    Once added, the remote files _is_ encoded as a part of the URL. URL sharing _will_ include the added remote file.

To start, navigate to the atlas/template/parcellation map of your choice, then drag and drop the file you would like to superimpose.

Click the `+` Button, then enter `<protocol>://<uri>`, then click `Import`

## Supported protocols

siibra-explorer leverages a [fork](https://github.com/humanBrainProject/neuroglancer) of [google/neuroglancer](https://github.com/google/neuroglancer/) for the visualisation of multiresolution volumetric images. As such, the supported resources depend heavily on the resources supported by neuroglancer.

### [`precomputed`](https://github.com/google/neuroglancer/blob/master/src/datasource/precomputed/README.md)

- Supports [meta.json](#metajson)

### [`zarr`](https://zarr-specs.readthedocs.io/en/latest/v2/v2.0.html)

- Supports [meta.json](#metajson)

!!! info
    Currently, only [zarr2](https://zarr-specs.readthedocs.io/en/latest/v2/v2.0.html) is tested and supported. [zarr3](https://zarr-specs.readthedocs.io/en/latest/v3/core/index.html) support is planned.

### [`n5`](https://github.com/saalfeldlab/n5)

- Supports [meta.json](#metajson)

### [`deepzoom`](https://learn.microsoft.com/en-us/previous-versions/windows/silverlight/dotnet-windows-silverlight/cc645050(v=vs.95)?redirectedfrom=MSDN)

- Supports [meta.json](#metajson)

### `nifti`

!!! warning
    Rendering nifti files in neuroglancer introduces a [half voxel shift](https://github.com/google/neuroglancer/issues/730).

### [`swc`](https://www.incf.org/swc)

!!! info
    Anchoring swc file is somewhat tricky. siibra-explorer currently searches the swc file for the regex `/ccf/i` or `/https\:\/\/mouselight\.janelia\.org/`. If found, siibra-explorer will apply the transform as if the swc file is in Allen CCF v2.5 space. 

## `meta.json`

See [documentation](https://github.com/FZJ-INM1-BDA/siibra-explorer/tree/master/.metaSpec) and [json schema](https://raw.githubusercontent.com/FZJ-INM1-BDA/siibra-explorer/refs/heads/master/.metaSpec/meta.schema.json).

The external multiresolution volume source may optionally contain a `meta.json` file. This file can provide auxiliary information, which enhances the visualisation. Some of the anxiliary information may be: spatial anchoring, color map, min/max values.