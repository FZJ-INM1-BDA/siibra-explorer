# What Makes a Brain Atlas

siibra organizes atlases into the following conceptual structures:

- Atlases. An atlas can be understood as a collection of complementary parcellations and reference spaces for a particular species, with links between brain regions, spatial locations and anatomically organized data features.

- Reference spaces. A reference space defines a coordinate system in the brain. Since reference spaces can be of different type (e.g. volumetric or surface-based, single-subject of average subject), an atlas can support multiple reference spaces. Each reference space comes with at least one reference template, which is an image volume or mesh representing the brain structures in that space.

- Parcellations. A parcellation defines a (searchable) hierarchy of brain regions and corresponding metadata, and thus represents a semantic object. Different parcellations may reflect different organizational principles of the brain, and thus an atlas can offer multiple, typically complementary parcellations. Each parcellation is linked to a set of corresponding parcellation maps.

- Parcellation maps. The regions defined by a given parcellation can be mapped in multiple reference spaces. The actual parcellation maps are spatial objects. They take the form of image volumes or surface meshes, and can be of labelled type, where coordinates or vertices in the reference space have a single unique brain region label, or of statistical type, where coordinates are linked to one floating point value per brain region, reflecting the weight or probability of each region at the given coordinate. Since statistical maps of closeby brain regions usually overlap, they are typically accessed by selecting a specific region from a labelled map in siibra-explorer.

- Regions. A region represents a subtree of a region hierarchy, and contains metadata about the parcellation it belongs to, the parcellation maps where it is included, related publications, and more. Each region has links to its parent and child regions.
