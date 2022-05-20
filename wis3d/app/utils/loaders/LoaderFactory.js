/**
 * @author André Storhaug <andr3.storhaug@gmail.com>
 */

import { ArrayLoader } from "./ArrayLoader";
import { OctreeLoader } from "./OctreeLoader";
import { VOXLoader } from "./VOXLoader";
import { XMLLoader } from "./XMLLoader";
import { BINVOXLoader } from "./BINVOXLoader";

/**
 * Factory class for creating various loaders.
 */
class LoaderFactory {
  /**
   * Create a LoaderFactory.
   * @param {LoadingManager} manager
   */
  constructor(manager) {
    this.manager = manager;
  }
  /**
   * Get a loader based on type.
   * @param {string} type The type of loader to get.
   */
  getLoader(type) {
    switch (type) {
      case 'vox':
        return new VOXLoader(this.manager);
        break;
      case 'xml':
        return new XMLLoader(this.manager);
        break;
      case 'binvox':
        return new BINVOXLoader(this.manager);
        break;
      case 'array':
        return new ArrayLoader(this.manager);
        break;
      case 'octree':
        return new OctreeLoader();
        break;
      default:
        throw new Error('Unsupported type (' + type + ').');
        break;
    }
  }
}

export { LoaderFactory };
