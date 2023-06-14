On the bottom left of siibra-explorer, [three most important concepts](https://siibra-python.readthedocs.io/en/latest/concepts.html) can be found: atlas, reference space, and parcellation.

## Atlas

An **atlas** in siibra can be understood as a collection of complementary parcellations and reference spaces at different spatial scales for a particular species, with functionality to access links between brain regions, spatial locations and anatomically organized data features.

## Reference Space

A **reference space** defines a coordinate system in the brain. Since reference spaces can be of different types (e.g. volumetric or surface-based, single-subject or average subject), an atlas can support multiple reference spaces. Each reference space comes with at least one reference template, which is an image volume or mesh representing the brain structures in that space.

## Parcellation

A **parcellation** defines a (searchable) hierarchy of brain regions and corresponding metadata. Different parcellations may reflect different organizational principles of the brain, and thus an atlas can offer multiple, typically complementary parcellations. Each parcellation is linked to a set of corresponding parcellation maps.
