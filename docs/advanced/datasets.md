# Fetching datasets from Knowledge Graph

Human Brain Project Knowledge Graph is a metadata database consisting of datasets contributed by collaborators of the Human Brain Project and curated by human curoators in order to ensure the highest standards. 

The interactive atlas viewer fetches the datasets relevant to the template space and parcellation atlas selected by the user using the following conditions:

## Species

The relevant species of datasets catalogued by Knowledge Graph are obtained from the following links:

```json
{
  "fieldname": "query:species",
  "relative_path": [
    "https://schema.hbp.eu/minds/specimen_group",
    "https://schema.hbp.eu/minds/subjects",
    "https://schema.hbp.eu/minds/species",
    "http://schema.org/name"
  ]
}
```

Depending on the selected template space and/or parcellation atlas, the datasets will be filtered to include only datasets from the relevant species.

### Human

If the selected template is any of:

- Big Brain (Histology)
- MNI Colin 27
- MNI 152 ICBM 2009c Nonlinear Asymmetric

**or**, the selected parcellation is any of:

- Grey/White matter
- Cytoarchitectonic Maps
- BigBrain Cortical Layers Segmentation
- JuBrain Cytoarchitectonic Atlas
- Fibre Bundle Atlas - Short Bundle
- Fibre Bundle Atlas - Long Bundle
- Cytoarchitectonic Maps

Then datasets which have *`Homo sapiens`* as one of its species described above will proceed to the next filter.

### Rat

And selected parcellation is any of:

- Waxholm Space rat brain atlas v1
- Waxholm Space rat brain atlas v2
- Waxholm Space rat brain atlas v3

Then datasets which have *`Rattus norvegicus`* as one of its species described above will proceed to the next filter.

### Mouse

And selected parcellation is any of:

- Allen Mouse Common Coordinate Framework v3 2017
- Allen Mouse Common Coordinate Framework v3 2015

Then datasets which have *`Mus musculus`* as one of its species described above will proceed to the next filter.


## Selected template space and parcellation atlas

The datasets are then filtered based on the selected template space and parcellation atlas. 

The dataset must satisfy both conditionals.

### Template space

The reference space associated with datasets are queried with the following querying links:

```json
{
  "fieldname": "query:referenceSpaces",
  "fields": [
    {
      "fieldname": "query:name",
      "relative_path": "http://schema.org/name"
    },
    {
      "fieldname": "query:fullId",
      "relative_path": "@id"
    }
  ],
  "relative_path": "https://schema.hbp.eu/minds/reference_space"
}
```

The dataset is considered relevant (returns true for this conditional) if the stripped `fullId` attribute[^1]  of any of the reference spaces matches to:

[^1]: `fullId` is a URI, which in the case of Human Brain Project Knowledge Graph, always starts with `https://nexus.humanbrainproject.org/v0/data/`. Stripping the domain allows for easier comparison.

| Selected template space | fullId |
| --- | --- |
| Big Brain (Histology) | minds/core/dataset/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588 |
| MNI 152 ICBM 2009c Nonlinear Asymmetric | minds/core/dataset/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2 |
| MNI Colin 27 | minds/core/dataset/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992 |

!!! important
    If the dataset does not have any reference spaces defined, it is considered relevant for any template space, and will return `true` for this conditional.

### Parcellation atlas

The parcellation atlas associated with the dataset are quried with the following querying links:

```json
{
  "fieldname": "query:parcellationAtlas",
  "fields": [
    {
      "fieldname": "query:name",
      "relative_path": "http://schema.org/name"
    },
    {
      "fieldname": "query:fullId",
      "relative_path": "@id"
    },
    {
      "fieldname": "query:id",
      "relative_path": "http://schema.org/identifier"
    }
  ],
  "relative_path": "https://schema.hbp.eu/minds/parcellationAtlas"
}
```

The parcellation region associated with the dataset are queried with the following querying links:

```json
{
  "fieldname": "query:parcellationRegion",
  "fields": [
    {
      "fieldname": "query:name",
      "relative_path": "http://schema.org/name"
    },
    {
      "fieldname": "query:species",
      "fields": [
        {
          "fieldname": "query:name",
          "relative_path": "http://schema.org/name"
        },
        {
          "fieldname": "query:@id",
          "relative_path": "@id"
        },
        {
          "fieldname": "query:identifier",
          "relative_path": "http://schema.org/identifier"
        }
      ],
      "relative_path": "https://schema.hbp.eu/minds/species"
    },
    {
      "fieldname": "query:alias",
      "relative_path": "https://schema.hbp.eu/minds/alias"
    }
  ],
  "relative_path": "https://schema.hbp.eu/minds/parcellationRegion"
}
```

A dataset is considered relevant (returns true for this conditional) if **both** of the following conditionals are true:

#### Parcellation name

If the name of the selected parcellation in interactive atlas viewer matches exactly with either name of any of the `parcellationAtlas`, or any of its aliases listed below

| `parcellationAtlas` name | aliases |
| --- | --- |
| Jülich Cytoarchitechtonic Brain Atlas (human) | Cytoarchitectonic Maps |
| Jülich Cytoarchitechtonic Brain Atlas (human) | JuBrain Cytoarchitectonic Atlas |

!!! important
    If the dataset does not have any `parcellationAtlas` defined, it is considered relevant, and will return `true` for this conditional.

#### Parcellation region

If the name of any of the `parcellationRegion` matches either the name or any of the `relatedAreas` attribute of any of the regions of the selected parcellation.

For example, the following dataset ...

```json
{
  "name": "dataset foobar",
  "parcellationRegion": [
    {
      "species": [],
      "name": "Area 44v",
      "alias": null
    }
  ]
}

```

... will be considered relevant to `JuBrain Cytoarchitectonic Atlas`, as it has an region entry with the following attributes:

```json

{
  "name": "Area 44 (IFG)",
  "relatedAreas": [
    "Area 44v",
    "Area 44d"
  ]
}
```