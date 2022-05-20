/**
 * @author André Storhaug <andr3.storhaug@gmail.com>
 */

import autoBind from 'auto-bind';
import { FileLoader, Loader, Vector3 } from 'three';
import { PointOctree } from "sparse-octree";
import { Parser } from 'binvox';
import { levelOfDetail } from '../mixins/levelOfDetail';

class BINVOXLoader extends Loader {

  /**
   * Create a BINVOXLoader.
   * @classdesc Class for loading voxel data stored in BINVOX files.
   * @extends Loader
   * @mixes levelOfDetail
   * @param {LoadingManager} manager
   */
  constructor(manager) {
    super(manager);
    autoBind(this);
    Object.assign(this, levelOfDetail);
  }

	/**
	 * Loads and parses a BINVOX file from a URL.
	 *
	 * @param {String} url - URL to the BINVOX file.
	 * @param {Function} [onLoad] - Callback invoked with the loaded object.
	 * @param {Function} [onProgress] - Callback for download progress.
	 * @param {Function} [onError] - Callback for download errors.
	 */
  load(url, onLoad, onProgress, onError) {
    var scope = this;

    var loader = new FileLoader(this.manager);
    loader.setPath(this.path);
    loader.setResponseType('arraybuffer')
    loader.load(url, function (buffer) {

      scope.parse(buffer)
        .then(octree => onLoad(octree))
        .catch(err => console.error(err))

    }, onProgress, onError);
  }

	/**
	 * Parse BINVOX file data.
	 * @param {Buffer} buffer Content of BINVOX file.
	 * @return {Promise<PointOctree>} Promise with an octree filled with voxel data.
	 */
  parse(buffer) {

    return new Promise((resolve, reject) => {
      const parser = new Parser();
      let data = parser.parse(buffer);
      const depth = data.dimension.depth;
      const width = data.dimension.width;
      const height = data.dimension.height;

      const min = new Vector3(-depth / 2, -height / 2, -width / 2);
      const max = new Vector3(depth / 2, height / 2, width / 2);

      const octree = new PointOctree(min, max, 0, this.LOD.maxPoints, this.LOD.maxDepth);
      let voxelData = {};

      data.voxels.forEach(voxel => {
        let x, y, z;

        x = voxel.x - (depth / 2);
        y = voxel.y - (width / 2);
        z = voxel.z - (height / 2);

        let point = new Vector3(x, z, y);
        octree.insert(point, voxelData);
      });

      resolve(octree);
    });
  }

}

export { BINVOXLoader };
