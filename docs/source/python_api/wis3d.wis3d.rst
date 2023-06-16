.. AUTO-GENERATED FILE 


.. automodule:: wis3d.wis3d

.. currentmodule:: wis3d.wis3d

.. currentmodule:: wis3d.wis3d


:class:`Wis3D`
**************

.. automethod:: Wis3D.__init__

set_scene_id
============

.. automethod:: Wis3D.set_scene_id(self, scene_id: int) -> None

add_point_cloud
===============

.. method:: Wis3D.add_point_cloud(self, path: str, *, name: str = None) -> None
   :noindex: 

   Add a point cloud by file path.
   Support importing point clouds from STL, OBJ, PLY, etc.
   
   :Parameters:   **path** - path to the point cloud file

      **name** - output name of the point cloud



.. method:: Wis3D.add_point_cloud(self, vertices: Union[np.ndarray, torch.Tensor], colors: Union[np.ndarray, torch.Tensor] = None, *, name: str = None) -> None
   :noindex: 

   Add a point cloud by point cloud definition.
   
   :Parameters:   **vertices** - points constituting the point cloud, shape: `(n, 3)`

      **colors** - colors of the points, shape: `(n, 3)`

      **name** - output name of the point cloud


.. method:: Wis3D.add_point_cloud(self, pcd: trimesh.PointCloud, name: str = None) -> None
   :noindex: 

   Add a point cloud loaded by `trimesh`.
   
   :Parameters:   **pcd** - point cloud loaded by `trimesh`

      **name** - output name of the point cloud


add_mesh
========

.. method:: Wis3D.add_mesh(self, path: str, *, name: str = None) -> None
   :noindex: 

   Add a mesh by file path.
   
   Support importing meshes from STL, OBJ, PLY, etc.
   
   :Parameters:   **path** - path to the mesh file

      **name** - output name of the mesh


.. method:: Wis3D.add_mesh
   :noindex: 

   self,
   vertices: Union[np.ndarray, torch.Tensor],
   faces: Union[np.ndarray, torch.Tensor],
   vertex_colors: Union[np.ndarray, torch.Tensor],
   *,
   name: str = None
   ) -> None:
   Add a mesh loaded by mesh definition
   
   :Parameters:   **vertices** - vertices of the mesh, shape: `(n, 3)`

      **faces** - faces of the mesh, shape: `(m, 3)`

      **vertex_colors** - vertex colors of the mesh, shape: `(n, 3)`

      **name** - output name of the mesh


.. method:: Wis3D.add_mesh(self, mesh: trimesh.Trimesh, *, name: str = None) -> None
   :noindex: 

   Add a mesh loaded by `trimesh`
   
   :Parameters:   **mesh** - mesh loaded by `trimesh`

      **name** - output name of the mesh


add_image
=========

.. method:: Wis3D.add_image(self, path: str, *, name: str = None) -> None
   :noindex: 

   Add an image by file path
   
   :Parameters:   **path** - path to the image file

      **name** - output name of the image


.. method:: Wis3D.add_image(self, data: Union[np.ndarray, torch.Tensor], *, name: str = None) -> None
   :noindex: 

   Add an image by image definition
   
   :Parameters:   **data** - data of the image

      **name** - output name of the image


.. method:: Wis3D.add_image(self, image: Image.Image, *, name: str = None) -> None
   :noindex: 

   Add an image by `PIL.Image.Image`
   
   :Parameters:   **image** - image loaded by `PIL.Image.open`

      **name** - output name of the image


add_boxes
=========

.. method:: Wis3D.add_boxes(self, corners: Union[np.ndarray, torch.Tensor], *, order: Iterable[int] = (0, 1, 2, 3, 4, 5, 6, 7), labels: Iterable[str] = None, name: str = None) -> None
   :noindex: 

   Add boxes by corners
   
   :Parameters:   **corners** - eight corners of the boxes, shape: `(n, 8, 3)` or `(8, 3)`

      **order** - order of the corners, the default indices are defined as

        ::

                 4 --- 5        y
                /|   / |        ｜
              7 --- 6  |        ｜
              |  0--|- 1        o —— —— x
              | /   | /        /
              3 --- 2         z

      **labels** - label for each box

      **name** - output name for these boxes


.. method:: Wis3D.add_boxes(self, positions: Union[np.ndarray, torch.Tensor], eulers: Union[np.ndarray, torch.Tensor], extents: Union[np.ndarray, torch.Tensor], *, labels: Iterable[str] = None, name: str = None) -> None
   :noindex: 

   Add boxes by definition
   
   :Parameters:   **positions** - position for each box, shape: `(n, 3)` or `(3,)`

      **eulers** - euler angles, shape: `(n, 3)` or `(3,)`

      **extents** - extents of the boxes, shape: `(n, 3)` or `(3,)`

      **labels** - label for each box, shape: `(n,)` or `str`

      **name** - output name for these boxes


add_lines
=========

.. automethod:: Wis3D.add_lines(self, start_points: Union[np.ndarray, torch.Tensor], end_points: Union[np.ndarray, torch.Tensor], colors: Union[np.ndarray, torch.Tensor] = None, *, name: str = Non

add_voxel
=========

.. method:: Wis3D.add_voxel(self, path: str, *, name: str = None) -> None
   :noindex: 

   Add voxels by binvox/vox file
   
   @param path: path to the BINVOX or VOX file
   
   @param name: output name for these lines


.. method:: Wis3D.add_voxel(self, voxel_centers: Union[np.ndarray, torch.Tensor], voxel_size: float, colors: Union[np.ndarray, torch.Tensor] = None, *, name: str = None) -> None
   :noindex: 

   Add voxels by boxes
   
   :Parameters:   **voxel_centers** - center for each box, shape: `(n, 3)` or `(3,)`

      **voxel_size** - size of all boxes

      **colors** - colors of each box, shape: `(n, 3)`

      **name** - output name for the voxel


add_spheres
===========

.. automethod:: Wis3D.add_spheres

add_camera_trajectory
=====================

.. automethod:: Wis3D.add_camera_trajectory

add_keypoint_correspondences
============================

.. automethod:: Wis3D.add_keypoint_correspondences

increase_scene_id
=================

.. automethod:: Wis3D.increase_scene_id(self)

add_box_by_6border
==================

.. automethod:: Wis3D.add_box_by_6border(self, xmin, ymin, zmin, xmax, ymax, zmax, name=None)

add_camera_pose
===============

.. automethod:: Wis3D.add_camera_pose(self, pose: Union[np.ndarray, torch.Tensor], *, name: str = None) -> None

add_rays
========

.. automethod:: Wis3D.add_rays(self, rays_o, rays_d, max=10.0, min=0.0, sample=1.0, name=None)

