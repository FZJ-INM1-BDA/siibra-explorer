# URL encoding

!!! warning
    It is generally advised that users leverage the [explorer module of siibra-python](https://siibra-python.readthedocs.io/en/latest/autoapi/siibra/explorer/index.html#module-siibra.explorer) to encode and decode URL.

siibra-explorer achieves [state persistence](../basics/storing_and_sharing_3d_views.md) via URL encoding. 

## Basics

State that are persisted is first serialized to string. These string are then prefixed by the label representing the string. The list is joined with `/` as a delimiter. 

The resultant string is then prepended by `<path_to_viewer>#/`, where `<path_to_viewer>` is usually `https://atlases.ebrains.eu/viewer/`.

!!! example
    User navigated to the following viewer configuration

    | state | prefix | value | serialized | prefix + serialized |
    | --- | --- | --- | --- | --- |
    | atlas | `a:` | Multilevel Human Atlas | `juelich:iav:atlas:v1.0.0:1` | `a:juelich:iav:atlas:v1.0.0:1` |
    | space | `t:` | ICBM 2009c nonlinear asymmetrical | `minds:core:referencespace:v1.0.0:dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2` | `t:minds:core:referencespace:v1.0.0:dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2` |
    | parcellation | `p:` | Julich Brain v3.0.3 | `minds:core:parcellationatlas:v1.0.0:94c1125b-b87e-45e4-901c-00daee7f2579-300` | `p:minds:core:parcellationatlas:v1.0.0:94c1125b-b87e-45e4-901c-00daee7f2579-300` |

    The URL would be

    ```
    https://atlases.ebrains.eu/viewer/#/a:juelich:iav:atlas:v1.0.0:1/t:minds:core:referencespace:v1.0.0:dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2/p:minds:core:parcellationatlas:v1.0.0:94c1125b-b87e-45e4-901c-00daee7f2579-300
    ```

## Escaping Characters

As `/` character is used to separate state, it is escaped to `:`. 

## References

Here is a comprehensive list of the state encoded in the URL:

| selected state | prefix | value | example |
| --- | --- | --- | --- |
| atlas | `a:` | id property | | 
| parcellation | `p:` | id property | |
| space | `t:` | id property | |
| region | `rn:` | Quick hash of region name[^1] | |
| geometry | `g:` | Serialized selected geometry of interest[^geometry_hash] | `/g:v1.0.3CfEFg.1AgkO0` |
| navigation | `@:` | navigation state hash[^2] | |
| feature | `f:` | id property + additional escaping[^3] | |
| misc viewer state | `vs:` | misc viewer state serialization[^4] | | 
| auto launch plugin | `pl` (query param) | stringified JSON representing `string[]` | `?pl=%5B%22http%3A%2F%2Flocalhost%3A1234%2Fmanifest.json%22%5D` . Modern browsers also accept `?pl=["http://localhost:1234/manifest.json"]` |

[^1]: Quick hash. [[source]](https://github.com/FZJ-INM1-BDA/siibra-explorer/blob/v2.14.4/src/util/fn.ts#L146-L154) Quick one way hash. It will likely be deprecated in favor of [crypto.digest](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest) in the near future.

[^geometry_hash]: Encoding geometry of interest. Only selected point is supported. Each coordinate is base64 encoded The number is base64 encodded [[source]](https://github.com/FZJ-INM1-BDA/siibra-explorer/blob/v2.14.4/common/util.js#L242-L313). The final value is in the form of `v1.{encoded_x}.{encoded_y}.{encoded_z}`. 

[^2]: Encoding navigation state. [[source]](https://github.com/FZJ-INM1-BDA/siibra-explorer/blob/v2.14.4/src/routerModule/routeStateTransform.service.ts#L366-L372) Each of the following state are encoded: `orientation`, `perspectiveOrientation`, `perspectiveZoom`, `position`, `zoom`. They are cast into `[f32, f32, f32, f32]`, `[f32, f32, f32, f32]`, `int`, `[int, int, int]` and `int` respective. Each of the number is base64 encoded [[source]](https://github.com/FZJ-INM1-BDA/siibra-explorer/blob/v2.14.4/common/util.js#L242-L313) with the following cipher: `0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-`. Negation is denoted using `~` as the beginning of encoded value. If the state consists of a tuple of values, they are joined by a single separator (i.e. `:`). The encoded state is then joined with two separators (i.e. `::`)

[^3]: additional feature id escaping: since feature id can be a lot more varied, they are further encoded by: first instance of `://` is replaced with `~ptc~`; all instances of `:` is replaced with `~`; *any* occurances `[()]` are URL encoded.

[^4]: miscellaneous viewer state serialization. [[source]](https://github.com/FZJ-INM1-BDA/siibra-explorer/blob/v2.14.4/src/routerModule/routeStateTransform.service.ts#L272-L293) Various viewer configuration related state is encoded. This encoded state is versioned, in order to preserve backwards compatibility. The current version is `v1`. In the current version, three `uint8` values are base64 encoded. First encodes for panel mode ( four-panel, `FOUR_PANEL`, encoded as `1`; `PIP_PANEL`, encoded as `2`). Second encodes for panel order. Third encodes for the bit masked boolean flags for octant removal and show delination, with the remaining 6 bits ignored.
