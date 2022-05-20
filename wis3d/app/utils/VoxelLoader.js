/**
 * @author André Storhaug <andr3.storhaug@gmail.com>
 */

 import autoBind from 'auto-bind';
 import { Color, BufferGeometry, MeshPhongMaterial, BoxGeometry, Vector3, Mesh, BufferAttribute } from 'three';
 import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils"
 import { LoaderFactory } from "./loaders/LoaderFactory";
 import { levelOfDetail } from './mixins/levelOfDetail';
 
 export class VoxelLoader {
   /**
    * Create a VoxelLoader.
    * @classdesc Class for loading voxel data stored in various formats.
    * @param {LoadingManager} manager
    * @mixes levelOfDetail
    */
   constructor(manager) {
     autoBind(this);
 
     Object.assign(this, levelOfDetail);
     this.manager = manager;
     this.octree = null;
     this.material = null;
     this.voxelSize = null;
     this.vertexColors = true;
 
     this.setVoxelMaterial();
     this.setVoxelSize();
     this.setVoxelColor();
   }
 
   /**
    * Set the material used for all voxels.
    * Note that the {@link Material.vertexColors} will be set to {@link VertexColors}.
    * @param {Material} Material The wanted material.
    */
   setVoxelMaterial(material) {
     let defaultMaterial = new MeshPhongMaterial({
       color: 0xffffff
     });
 
     material = typeof material !== 'undefined' ? material : defaultMaterial;
     material.vertexColors = true;
     this.material = material;
   }

   setVoxelColor(userColor) {
     if (typeof userColor !== 'undefined') {
      const materialColor = new Color(userColor);
      let material = new MeshPhongMaterial({
        color: materialColor
      })
      this.material = material;
    }
   }

   setVertexColors(vertexColors) {
     this.vertexColors = vertexColors;
   }
 
   /**
    * Set the size of the cubes representing voxels generated in {@link VoxelLoader#generateMesh}.
    * @param {float} [voxelSize=1]
    */
   setVoxelSize(voxelSize = 1) {
     this.voxelSize = voxelSize;
   }
 
   /**
    * Update the internal data structures and settings.
    * @return {Promise<PointOctree>} Promise with an updated octree.
    */
   update() {
     if (this.octree === null) {
       throw new Error('Octree is not built');
     }
     return this.parseData(this.octree, 'octree');
   }
 
   /**
    * Loads and parses a 3D model file from a URL.
    *
    * @param {String} url - URL to the VOX file.
    * @param {Function} [onLoad] - Callback invoked with the Mesh object.
    * @param {Function} [onProgress] - Callback for download progress.
    * @param {Function} [onError] - Callback for download errors.
    */
   loadFile(url, onLoad, onProgress, onError) {
     let scope = this;
     let extension = url.split('.').pop().toLowerCase();
     let loaderFactory = new LoaderFactory(this.manager);
     let loader = loaderFactory.getLoader(extension);
     loader.setLOD(this.LOD.maxPoints, this.LOD.maxDepth);
 
     loader.load(url, function (octree) {
       scope.octree = octree;
       onLoad(scope.generateMesh(octree));
     }, onProgress, onError);
   }
 
   /**
    * Parses voxel data.
    * @param {PointOctree} octree Octree with voxel data stored as points in space.
    * @return {Promise<PointOctree>} Promise with an octree filled with voxel data.
    */
   parseData(data, type) {
     let scope = this;
     let loaderFactory = new LoaderFactory(this.manager);
 
     let loader = loaderFactory.getLoader(type);
     loader.setLOD(this.LOD.maxPoints, this.LOD.maxDepth);
 
     return new Promise((resolve) => {
       loader.parse(data).then((octree) => {
         scope.octree = octree;
         resolve(octree);
       });
     });
   }
 
   /**
    * Generates a polygon mesh with cubes based on voxel data.
    * One cube for each voxel.
    * @param {PointOctree} octree Octree with voxel data stored as points in space.
    * @returns {Mesh} 3D mesh based on voxel data
    */
   generateMesh(octree) {
     let mergedGeometry = new BufferGeometry();
     var hasColor = false;

     for (const leaf of octree.leaves()) {
       if (leaf.points !== null) {
         const pos = new Vector3();
         var i;
         let min = { x: leaf.points[0].x, y: leaf.points[0].y, z: leaf.points[0].z };
         let max = { x: leaf.points[0].x, y: leaf.points[0].y, z: leaf.points[0].z };
 
         for (i = 0; i < leaf.points.length; i++) {
           const point = leaf.points[i];
           pos.add(point);
           min.x = Math.min(min.x, point.x);
           min.y = Math.min(min.y, point.y);
           min.z = Math.min(min.z, point.z);
           max.x = Math.max(max.x, point.x);
           max.y = Math.max(max.y, point.y);
           max.z = Math.max(max.z, point.z);
         }
 
         let width = Math.round((this.voxelSize + (max.x - min.x)) * 100) / 100;;
         let height = Math.round((this.voxelSize + (max.y - min.y)) * 100) / 100;;
         let depth = Math.round((this.voxelSize + (max.z - min.z)) * 100) / 100;
 
         let voxelGeometry = new BoxGeometry(width, height, depth);
         pos.divideScalar(i);
 
         const rgb = leaf.data[0].color;
         if (rgb != null) {
           hasColor = true;
           const color = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
           var colors = [];
           for(var i = 0; i < voxelGeometry.attributes.position.count; i++) {
             colors.push(color);
           }
           voxelGeometry.attributes.color = new BufferAttribute(new Float32Array(colors.flat()), 3);
         }
 
         voxelGeometry.translate(pos.x, pos.y, pos.z);
         if(mergedGeometry.index == null) {
           mergedGeometry = voxelGeometry.clone();
         } else {
          mergedGeometry = BufferGeometryUtils.mergeBufferGeometries([mergedGeometry,voxelGeometry]);
         }
         voxelGeometry.translate(-pos.x, -pos.y, -pos.z);
        }
     }
 
     var bufGeometry  = mergedGeometry.clone();
     bufGeometry.computeVertexNormals();

     if (hasColor && this.vertexColors) this.setVoxelMaterial();
     const material = this.material;
     var voxels = new Mesh(bufGeometry, material);
 
     return voxels;
   }
 }
 