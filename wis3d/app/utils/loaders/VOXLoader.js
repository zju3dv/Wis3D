/**
 * @author André Storhaug <andr3.storhaug@gmail.com>
 */

import autoBind from 'auto-bind';
import { FileLoader, Matrix4, Vector3, Loader } from 'three';
import { PointOctree } from "sparse-octree";
import formatVox from '@sh-dave/format-vox';
import { Vector4 } from 'math-ds';
import { levelOfDetail } from '../mixins/levelOfDetail';

class VOXLoader extends Loader {
  /**
   * Create a VOXLoader.
   * @classdesc Class for loading voxel data stored in VOX files.
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
	 * Loads and parses a VOX file from a URL.
	 *
	 * @param {String} url - URL to the VOX file.
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
	 * Parse VOX file data.
	 * @param {Buffer} buffer Content of VOX file.
	 * @return {Promise<PointOctree>} Promise with an octree filled with voxel data.
	 */
  parse(buffer) {
    const { VoxReader, VoxNodeTools, VoxTools } = formatVox;
    return new Promise((resolve, reject) => {
      VoxReader.read(buffer, (data, err) => {

        if (err) {
          reject(err);
        }

        let transforms = [];
        let vector = new Vector3();
        let rotation = new Matrix4();

        let positions = [];

        if (data.world == null) {
          let size = data.sizes[0];
          let modelSize = new Vector3(size.x, size.z, size.y);

          positions.push({
            model: 0,
            position: new Vector3(),
            rotation: new Vector4(),
            size: modelSize,
          });

        } else {

          VoxNodeTools.walkNodeGraph(data, {
            beginGraph: () => {
            },

            endGraph: () => {
            },

            onTransform: attributes => {
              if (VoxTools.dictHasTranslation(attributes)) {
                const t = VoxTools.getTranslationFromDict(attributes);
                transforms.push(new Vector3(t.x, t.z, t.y))
                vector.add(new Vector3(t.x, t.z, t.y))
              } else {
                transforms.push(new Vector3())
              }

              if (VoxTools.dictHasRotation(attributes)) {
                const r = VoxTools.getRotationFromDict(attributes);
                let m = new Matrix4();
                m.set(
                  r._00, r._01, r._02, 0,
                  r._10, r._11, r._12, 0,
                  r._20, r._21, r._22, 0,
                  0, 0, 0, 1
                );

                transforms.push(m)
                rotation.multiply(m);
              } else {
                transforms.push(new Matrix4())
              }
            },

            beginGroup: () => {
            },

            endGroup: () => {
              let m = transforms.pop();
              let vec = transforms.pop();
              vector.sub(vec);
              rotation.multiply(m.getInverse(m));
            },

            onShape: (attributes, models) => {
              let modelId = models[0].modelId;
              let position = new Vector3().add(vector);
              let rotVec = new Matrix4().multiply(rotation);

              let size = data.sizes[modelId];
              let modelSize = new Vector3(size.x, size.z, size.y);

              positions.push({
                model: modelId,
                position: position,
                rotation: rotVec,
                size: modelSize,
              });

              let m = transforms.pop();
              let vec = transforms.pop();
              vector.sub(vec);
              rotation.multiply(m.getInverse(m));
            }
          });
        }

        let xMin = Infinity;
        let yMin = Infinity;
        let zMin = Infinity;

        let xMax = -Infinity;
        let yMax = -Infinity;
        let zMax = -Infinity;

        for (let i = 0; i < positions.length; i++) {
          const element = positions[i];
          const position = element.position;
          const size = element.size;

          if (position.x < xMin) xMin = position.x - size.x / 2;
          if (position.y < yMin) yMin = position.y - size.y / 2;
          if (position.z < zMin) zMin = position.z - size.z / 2;

          if (position.x > xMax) xMax = position.x + size.x / 2;
          if (position.y > yMax) yMax = position.y + size.y / 2;
          if (position.z > zMax) zMax = position.z + size.z / 2;
        }

        const min = new Vector3(xMin, yMin, zMin);
        const max = new Vector3(xMax, yMax, zMax);

        let octree = new PointOctree(min, max, 0, this.LOD.maxPoints, this.LOD.maxDepth);

        for (let i = 0; i < positions.length; i++) {
          let model = positions[i].model;
          let pos = positions[i].position;
          let size = positions[i].size;
          let worldCorrection = new Vector3().copy(size).divideScalar(2);

          for (let j = 0; j < data.models[model].length; j++) {
            const element = data.models[model][j];
            const color = data.palette[element.colorIndex];

            var voxelData = { color: { r: color.r, g: color.g, b: color.b } };
            let position = new Vector3(element.x, element.z, element.y);

            position.sub(worldCorrection);
            // TODO fix rotation matrix basis
            //position.applyMatrix4(rot
            position.add(pos);

            octree.insert(position, voxelData);
          }
        }

        resolve(octree);
      });
    });
  }

}

export { VOXLoader };
