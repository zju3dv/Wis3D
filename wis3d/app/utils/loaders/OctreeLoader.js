/**
 * @author André Storhaug <andr3.storhaug@gmail.com>
 */

import { PointOctree } from "sparse-octree";
import autoBind from 'auto-bind';
import { levelOfDetail } from "../mixins/levelOfDetail";

class OctreeLoader {
  /**
   * Create a OctreeLoader.
   * @classdesc Class for loading voxel data stored in a PointOctree.
   * @mixes levelOfDetail
   */
  constructor() {
    autoBind(this);
    Object.assign(this, levelOfDetail);
  }

	/**
	 * Parses a PointOctree.
   * @param {number[][][]} matrix The matrix to be transformed.
	 * @return {Promise<PointOctree>} Promise with an octree filled with voxel data.
	 */
  parse(octree) {
    let self = this;
    return new Promise((resolve) => {
      const newOctree = new PointOctree(octree.root.min, octree.max, 0, self.LOD.maxPoints, self.LOD.maxDepth);

      for (const leaf of octree.leaves()) {
        if (leaf.points !== null) {
          var i;
          for (i = 0; i < leaf.points.length; i++) {

            const point = leaf.points[i];
            const data = leaf.data[i];
            newOctree.insert(point, data);
          }
        }
      }
      resolve(newOctree);
    });
  }
}

export { OctreeLoader };
