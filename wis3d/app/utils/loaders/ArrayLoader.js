/**
 * @author André Storhaug <andr3.storhaug@gmail.com>
 */

import { FileLoader, Loader, Vector3 } from 'three';
import { PointOctree } from "sparse-octree";
import autoBind from 'auto-bind';
import { levelOfDetail } from '../mixins/levelOfDetail';

class ArrayLoader extends Loader {
  /**
   * Create an ArrayLoader.
   * @classdesc Class for loading voxel data stored as a 3D array.
   * @extends Loader
   * @mixes levelOfDetail
   * @param {LoadingManager} manager
   */
  constructor(manager) {
    super(manager)
    autoBind(this);
    Object.assign(this, levelOfDetail);
  }

	/**
	 * Loads and parses a 3D array stored in a JS file from a URL.
	 * @param {String} url URL to the JS file with array.
	 * @param {Function} [onLoad] Callback invoked with the loaded object.
	 * @param {Function} [onProgress] Callback for download progress.
	 * @param {Function} [onError] Callback for download errors.
	 */
  load(url, onLoad, onProgress, onError) {
    var scope = this;

    var loader = new FileLoader(this.manager);
    loader.setPath(this.path);
    //loader.setResponseType('arraybuffer')
    loader.load(url, function (data) {

      scope.parse(data)
        .then(octree => onLoad(octree))
        .catch(err => console.error(err))

    }, onProgress, onError);
  }

	/**
	 * Parses a 3D array.
   * @param {Object} data The volume data to parse.
   * @param {number[][][]} data.voxels The voxel data.
   * @param {number[][][][]} [data.colors=null] The color data.
	 * @return {Promise<PointOctree>} Promise with an octree filled with voxel data.
	 */
  parse(data = null) {
    let voxels = data.voxels;
    let colors = data.colors;

    var that = this;
    return new Promise((resolve, reject) => {

      const minX = -(voxels[0][0].length - 1) / 2
      const maxX = (voxels[0][0].length - 1) / 2

      const minZ = -(voxels.length - 1) / 2
      const maxZ = (voxels.length - 1) / 2

      const minY = -(voxels[0].length - 1) / 2
      const maxY = (voxels[0].length - 1) / 2

      const min = new Vector3(minX, minY, minZ);
      const max = new Vector3(maxX, maxY, maxZ);

      const octree = new PointOctree(min, max, 0, that.LOD.maxPoints, that.LOD.maxDepth);

      var voxelData = {};

      for (var i = 0; i < voxels.length; i++) { // z-axis
        for (let j = 0; j < voxels[i].length; j++) { // y-axis
          for (let k = 0; k < voxels[i][j].length; k++) { // x-axis
            const element = voxels[i][j][k];
            if (element === 1) {

              let x = k - ((voxels[i][j].length - 1) / 2);
              let y = j - ((voxels[i].length - 1) / 2);
              let z = i - ((voxels.length - 1) / 2);

              if (colors) {
                let r = colors[i][j][k][0];
                let g = colors[i][j][k][1];
                let b = colors[i][j][k][2];
                voxelData = { color: { r, g, b } };
              }
              octree.insert(new Vector3(x, y, z), voxelData);
            }
          }
        }
      }

      resolve(octree);
    });
  }
}

export { ArrayLoader };
