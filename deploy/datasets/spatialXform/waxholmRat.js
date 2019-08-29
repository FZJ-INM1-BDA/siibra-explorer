
/**
 * perhaps export the xform fns into a different module
 * ideally, in the future, KG can handle xform of voxel to nm
 */
const transformWaxholmV2NmToVoxel = (coord) => {
  /**
   * as waxholm is already in RAS, does not need to swap axis
   */

  /**
   * atlas viewer applies translation (below in nm) in order to center the brain
   * query already translates nm to mm, so the unit of transl should be [mm, mm, mm]
   */
  const transl = [-9550781, -24355468, -9707031].map(v => v / 1e6)

  /**
   * mm/voxel
   */
  const voxelDim = [0.0390625, 0.0390625, 0.0390625]
  return coord.map((v, idx) => (v - transl[idx]) / voxelDim[idx])
}

const transformWaxholmV2VoxelToNm = (coord) => {
  const transl = [-9550781, -24355468, -9707031].map(v => v / 1e6)
  const voxelDim = [0.0390625, 0.0390625, 0.0390625]
  return coord.map((v, idx) => (v * voxelDim[idx]) + transl[idx])
}

module.exports = {
  transformWaxholmV2NmToVoxel,
  transformWaxholmV2VoxelToNm
}