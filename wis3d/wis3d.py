# coding=utf-8
"""
Some tips for this file:
class method definition must be in a single line for correct doc generation.
"""
import os
import os.path as osp
import json
import base64
import shutil
import warnings

import trimesh
import numpy as np
from PIL import Image
from io import BytesIO
from typing import overload, Iterable, Dict, Union, Any
from scipy.spatial.transform import Rotation
from shutil import copyfile
import torch
from transforms3d import affines, euler
from termcolor import colored

from wis3d.utils import random_choice

file_exts = dict(
    point_cloud="ply",
    mesh="ply",
    boxes="json",
    image="png",
    lines="json",
    binVoxel="binvox",
    voxVoxel="vox",
    boxVoxel="json",
    spheres="json",
    camera_trajectory="json",
    correspondences="json",
    planes="json",
)

folder_names = dict(
    point_cloud="point_clouds",
    mesh="meshes",
    boxes="boxes",
    image="images",
    lines="lines",
    binVoxel="voxels",
    voxVoxel="voxels",
    boxVoxel="voxels",
    spheres="spheres",
    camera_trajectory="camera_trajectories",
    correspondences="correspondences",
    planes="planes",
)


def img2url(image: Image.Image):
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    img_data = base64.b64encode(buffered.getvalue())
    if not isinstance(img_data, str):
        img_data = img_data.decode()
    return "data:image/png;base64," + img_data


def tensor2ndarray(tensor: Union[np.ndarray, torch.Tensor]) -> np.ndarray:
    if isinstance(tensor, torch.Tensor):
        if tensor.device.type != "cpu":
            tensor = tensor.detach().cpu()
        tensor = tensor.numpy()
    return tensor


class Wis3D:
    has_removed = []
    default_xyz_pattern = ('x', 'y', 'z')
    sequence_ids = {}

    def __init__(self, out_folder: str, sequence_name: str, xyz_pattern=None, auto_increase=True, auto_remove=True, enable: bool = True):
        """
        Initialize Wis3D

        :param out_folder: the folder to store the output files.
        :param sequence_name: a subfolder of `out_folder` holding files of the sequence.
        :param xyz_pattern: mapping of the three.js coordinate to the target coordinate. Take opencv camera coordinate as an example:
        ::

                   three.js:                               opencv:

            (up: y, right: x, backward:z)         (down: y, right: x, forward:z)
                    y                                     z
                    |                                    /
                    o -- x             -->              o -- x
                   /                                    |
                  z                                     y

                three.js:      x     y     z
                               |     |     |
               xyz_pattern = ['x', '-y', '-z']
                               |     |     |
                  opencv:       x    -y    -z

        :param auto_increase: In one program run, whether to increase the scene id automatically for Wis3D instances with the same sequence names.
        :param auto_remove: On program launch, whether to automatically remove the output folder if it exists.
        :param enable: Whether to enable Wis3D. Since Wis3D can be time-consuming, this flag is useful for you to keep the Wis3D code unchanged and enable/disable it at debug time/running time.
        """
        assert enable in [True, False]
        self.enable = enable
        if enable is True:
            assert out_folder != "", "out_folder cannot be empty"
            assert sequence_name != "", "sequence_name cannot be empty"
            self.scene_id = 0
            if not os.path.isabs(out_folder):
                seq_out_folder = os.path.join(
                    os.getcwd(), out_folder, sequence_name)
            else:
                seq_out_folder = out_folder
            if auto_remove:
                if not osp.exists(seq_out_folder):
                    Wis3D.has_removed.append(seq_out_folder)
                elif os.path.exists(seq_out_folder) and seq_out_folder not in Wis3D.has_removed:
                    shutil.rmtree(seq_out_folder)
                    Wis3D.has_removed.append(seq_out_folder)
            self.out_folder = out_folder
            self.sequence_name = sequence_name
            if xyz_pattern is None:
                xyz_pattern = Wis3D.default_xyz_pattern
            self.three_to_world = self.__get_world_transform(xyz_pattern)
            self.counters = {}
            for key in folder_names:
                self.counters[key] = 0

            if seq_out_folder not in Wis3D.sequence_ids:
                Wis3D.sequence_ids[seq_out_folder] = 0
            else:
                Wis3D.sequence_ids[seq_out_folder] += 1
            self.auto_increase = auto_increase
            if auto_increase:
                scene_id = Wis3D.sequence_ids[seq_out_folder]
            else:
                scene_id = 0
            print(colored(f'Set up Wis3D for {sequence_name}: {scene_id}', 'magenta'))
            self.set_scene_id(scene_id)

    def __get_world_transform(self, xyz_pattern=("x", "y", "z")) -> np.ndarray:
        rots = {
            "x": [1, 0, 0],
            "-x": [-1, 0, 0],
            "y": [0, 1, 0],
            "-y": [0, -1, 0],
            "z": [0, 0, 1],
            "-z": [0, 0, -1],
        }
        R = np.array([rots[axis] for axis in xyz_pattern], dtype=np.float32)
        T = np.eye(4)
        T[:3, :3] = R
        return T

    def __get_export_file_name(self, file_type: str, name: str = None) -> str:
        export_dir = os.path.join(
            self.out_folder,
            self.sequence_name,
            "%05d" % self.scene_id,
            folder_names[file_type],
        )
        os.makedirs(export_dir, exist_ok=True)
        if name is None:
            name = "%05d" % self.counters[file_type]

        filename = os.path.join(export_dir, name + "." + file_exts[file_type])
        self.counters[file_type] += 1

        return filename

    def set_scene_id(self, scene_id: int) -> None:
        """
        Set scene ID.

        Use it to create the new scene and add content to different scenes

        :param scene_id: scene ID to be set
        """
        if not self.enable:
            return
        self.scene_id = scene_id

    @overload
    def add_point_cloud(self, path: str, *, name: str = None) -> None:
        """
        Add a point cloud by file path.
        Support importing point clouds from STL, OBJ, PLY, etc.

        :param path: path to the point cloud file

        :param name: output name of the point cloud

        """

        pass

    @overload
    def add_point_cloud(self, vertices: Union[np.ndarray, torch.Tensor], colors: Union[np.ndarray, torch.Tensor] = None, *, name: str = None) -> None:
        """
        Add a point cloud by point cloud definition.

        :param vertices: points constituting the point cloud, shape: `(n, 3)`

        :param colors: colors of the points, shape: `(n, 3)`

        :param name: output name of the point cloud
        """
        pass

    @overload
    def add_point_cloud(self, pcd: trimesh.PointCloud, name: str = None) -> None:
        """
        Add a point cloud loaded by `trimesh`.

        :param pcd: point cloud loaded by `trimesh`

        :param name: output name of the point cloud
        """
        pass

    def add_point_cloud(self, vertices, colors=None, *, name=None) -> None:
        """
        Add a point cloud.

        :param vertices:

        :param colors:

        :param name:

        :return:

        """
        if not self.enable:
            return
        if isinstance(vertices, str):
            pcd = trimesh.load_mesh(vertices)
        elif isinstance(vertices, trimesh.PointCloud):
            pcd = vertices
        elif isinstance(vertices, (np.ndarray, torch.Tensor)):
            vertices = tensor2ndarray(vertices)
            colors = tensor2ndarray(colors)
            pcd = trimesh.PointCloud(vertices, colors)
        else:
            raise NotImplementedError()
        pcd.apply_transform(self.three_to_world)
        filename = self.__get_export_file_name("point_cloud", name)
        pcd.export(filename)

    @overload
    def add_mesh(self, path: str, *, name: str = None) -> None:
        """
        Add a mesh by file path.

        Support importing meshes from STL, OBJ, PLY, etc.

        :param path: path to the mesh file

        :param name: output name of the mesh
        """
        pass

    @overload
    def add_mesh(self, vertices: Union[np.ndarray, torch.Tensor], faces: Union[np.ndarray, torch.Tensor], vertex_colors: Union[np.ndarray, torch.Tensor], *, name: str = None) -> None:
        """
        Add a mesh loaded by mesh definition

        :param vertices: vertices of the mesh, shape: `(n, 3)`

        :param faces: faces of the mesh, shape: `(m, 3)`

        :param vertex_colors: vertex colors of the mesh, shape: `(n, 3)`

        :param name: output name of the mesh
        """
        pass

    @overload
    def add_mesh(self, mesh: trimesh.Trimesh, *, name: str = None) -> None:
        """
        Add a mesh loaded by `trimesh`

        :param mesh: mesh loaded by `trimesh`

        :param name: output name of the mesh
        """
        pass

    def add_mesh(self, vertices, faces=None, vertex_colors=None, *, name=None):
        """
        Add a mesh.

        :param vertices:
        :param faces:
        :param vertex_colors:
        :param name:
        :return:
        """
        if not self.enable: return
        if isinstance(vertices, str):
            mesh = trimesh.load_mesh(vertices)
        elif isinstance(vertices, trimesh.Trimesh):
            mesh = vertices.copy()
        elif isinstance(vertices, (np.ndarray, torch.Tensor)):
            vertices = tensor2ndarray(vertices)
            faces = tensor2ndarray(faces)
            vertex_colors = tensor2ndarray(vertex_colors)
            mesh = trimesh.Trimesh(vertices, faces, vertex_colors=vertex_colors)
        else:
            raise NotImplementedError()

        mesh.apply_transform(self.three_to_world)
        filename = self.__get_export_file_name("mesh", name)
        mesh.export(filename)

    @overload
    def add_image(self, path: str, *, name: str = None) -> None:
        """
        Add an image by file path

        :param path: path to the image file

        :param name: output name of the image
        """
        pass

    @overload
    def add_image(self, data: Union[np.ndarray, torch.Tensor], *, name: str = None) -> None:
        """
        Add an image by image definition

        :param data: data of the image

        :param name: output name of the image
        """
        pass

    @overload
    def add_image(self, image: Image.Image, *, name: str = None) -> None:
        """
        Add an image by `PIL.Image.Image`

        :param image: image loaded by `PIL.Image.open`

        :param name: output name of the image
        """
        pass

    def add_image(self, image, *, name: str = None):
        """
        Add an image.

        :param image:
        :param name:
        :return:
        """
        if not self.enable: return
        if isinstance(image, str):
            img = Image.open(image)
        elif isinstance(image, (np.ndarray, torch.Tensor)):
            image = tensor2ndarray(image)
            img = Image.fromarray(image)
        elif isinstance(image, Image.Image):
            img = image
        else:
            raise NotImplementedError()

        filename = self.__get_export_file_name("image", name)
        img.save(filename)

    @overload
    def add_boxes(self, corners: Union[np.ndarray, torch.Tensor], *, order: Iterable[int] = (0, 1, 2, 3, 4, 5, 6, 7), labels: Iterable[str] = None, name: str = None) -> None:
        """
        Add boxes by corners

        :param corners: eight corners of the boxes, shape: `(n, 8, 3)` or `(8, 3)`

        :param order: order of the corners, the default indices are defined as

        ::

                 4 --- 5        y
                /|   / |        ｜
              7 --- 6  |        ｜
              |  0--|- 1        o —— —— x
              | /   | /        /
              3 --- 2         z

        :param labels: label for each box

        :param name: output name for these boxes
        """
        pass

    @overload
    def add_boxes(self, positions: Union[np.ndarray, torch.Tensor], eulers: Union[np.ndarray, torch.Tensor], extents: Union[np.ndarray, torch.Tensor], *, labels: Iterable[str] = None, name: str = None) -> None:
        """
        Add boxes by definition

        :param positions: position for each box, shape: `(n, 3)` or `(3,)`

        :param eulers: euler angles, shape: `(n, 3)` or `(3,)`

        :param extents: extents of the boxes, shape: `(n, 3)` or `(3,)`

        :param labels: label for each box, shape: `(n,)` or `str`

        :param name: output name for these boxes
        """
        pass

    def add_boxes(self, positions, eulers=None, extents=None, *, axes=None, order=(0, 1, 2, 3, 4, 5, 6, 7), labels=None, name=None):
        """
        Add boxes.

        :param positions:
        :param eulers:
        :param extents:
        :param axes:
        :param order:
        :param labels:
        :param name:
        :return:
        """
        if not self.enable: return
        positions = tensor2ndarray(positions)

        if eulers is None or extents is None:
            positions = np.asarray(positions).reshape(-1, 8, 3)
            corners = positions
            if order != (0, 1, 2, 3, 4, 5, 6, 7):
                for i, o in enumerate(order):
                    corners[:, o, :] = positions[:, i, :]

            positions = (corners[:, 0, :] + corners[:, 6, :]) / 2
            vector_xs = corners[:, 1, :] - corners[:, 0, :]
            vector_ys = corners[:, 4, :] - corners[:, 0, :]
            vector_zs = corners[:, 3, :] - corners[:, 0, :]

            extent_xs = np.linalg.norm(vector_xs, axis=1).reshape(-1, 1)
            extent_ys = np.linalg.norm(vector_ys, axis=1).reshape(-1, 1)
            extent_zs = np.linalg.norm(vector_zs, axis=1).reshape(-1, 1)
            extents = np.hstack((extent_xs, extent_ys, extent_zs))

            rot_mats = np.stack(
                (vector_xs / extent_xs, vector_ys / extent_ys, vector_zs / extent_zs),
                axis=2,
            )
            Rs = Rotation.from_matrix(rot_mats)
            eulers = Rs.as_euler("XYZ")
        else:
            positions = tensor2ndarray(positions)
            eulers = tensor2ndarray(eulers)
            extents = tensor2ndarray(extents)
            positions = np.asarray(positions).reshape(-1, 3)
            extents = np.asarray(extents).reshape(-1, 3)
            eulers = np.asarray(eulers).reshape(-1, 3)

        boxes = []
        if axes is None:
            warnings.warn("Axes is not specified, use default axes rxyz. To preserve old behavior, use axes='sxyz'")
            axes = "rxyz"
        for i in range(len(positions)):
            box_def = self.three_to_world @ affines.compose(
                positions[i], euler.euler2mat(*eulers[i], axes), extents[i]
            )
            T, R, Z, _ = affines.decompose(box_def)
            box = dict(position=T.tolist(), euler=euler.mat2euler(R, axes), extent=Z.tolist())
            if labels is not None:
                if isinstance(labels, str):
                    labels = [labels]
                box.update({"label": labels[i]})

            boxes.append(box)

        filename = self.__get_export_file_name("boxes", name)
        with open(filename, "w") as f:
            f.write(json.dumps(boxes))

    def add_lines(self, start_points: Union[np.ndarray, torch.Tensor], end_points: Union[np.ndarray, torch.Tensor], colors: Union[np.ndarray, torch.Tensor] = None, *, name: str = None) -> None:
        """
        Add lines by points

        :param start_points: start point of each line, shape: `(n, 3)` or `(3,)`

        :param end_points: end point of each line, shape: `(n, 3)` or `(3,)`

        :param colors: colors of the lines, shape: `(n, 3)`

        :param name: output name for these lines
        """
        if not self.enable: return
        start_points = tensor2ndarray(start_points)
        end_points = tensor2ndarray(end_points)
        colors = tensor2ndarray(colors)

        if len(start_points) != len(end_points):
            raise NotImplementedError()

        start_points = np.asarray(start_points).reshape(-1, 3)
        end_points = np.asarray(end_points).reshape(-1, 3)

        n = start_points.shape[0]
        start_points = (
                self.three_to_world @ np.hstack((start_points, np.zeros((n, 1)))).T
        )
        end_points = self.three_to_world @ np.hstack((end_points, np.zeros((n, 1)))).T

        start_points = start_points[:3, :].T
        end_points = end_points[:3, :].T

        if colors is not None:
            if len(colors) != len(start_points):
                raise NotImplementedError()
            colors = np.asarray(colors).reshape(-1, 3)

        lines = []
        for i in range(len(start_points)):
            line = dict(
                start_point=start_points[i].tolist(), end_point=end_points[i].tolist()
            )
            if colors is not None:
                line.update({"color": colors[i].tolist()})

            lines.append(line)

        filename = self.__get_export_file_name("lines", name)
        with open(filename, "w") as f:
            f.write(json.dumps(lines))

    @overload
    def add_voxel(self, path: str, *, name: str = None) -> None:
        """
        Add voxels by binvox/vox file

        @param path: path to the BINVOX or VOX file

        @param name: output name for these lines
        """
        pass

    @overload
    def add_voxel(self, voxel_centers: Union[np.ndarray, torch.Tensor], voxel_size: float, colors: Union[np.ndarray, torch.Tensor] = None, *, name: str = None) -> None:
        """
        Add voxels by boxes

        :param voxel_centers: center for each box, shape: `(n, 3)` or `(3,)`

        :param voxel_size: size of all boxes

        :param colors: colors of each box, shape: `(n, 3)`

        :param name: output name for the voxel
        """
        pass

    def add_voxel(self, voxel_centers, voxel_size=None, colors=None, *, name=None):
        if not self.enable: return
        if isinstance(voxel_centers, str):
            file_type = voxel_centers.split(".")[-1]
            if file_type == "binvox":
                filename = self.__get_export_file_name("binVoxel", name)
            elif file_type == "vox":
                filename = self.__get_export_file_name("voxVoxel", name)
            else:
                raise NotImplementedError()

            copyfile(voxel_centers, filename)
        else:
            if voxel_size is None:
                raise NotImplementedError()
            voxel_centers = tensor2ndarray(voxel_centers)
            colors = tensor2ndarray(colors)
            voxel_size = float(voxel_size)
            voxel_centers = np.asarray(voxel_centers).reshape(-1, 3)

            n = voxel_centers.shape[0]
            voxel_centers = (
                    self.three_to_world @ np.hstack((voxel_centers, np.zeros((n, 1)))).T
            )
            voxel_centers = voxel_centers[:3, :].T

            if colors is not None:
                colors = np.asarray(colors).reshape(-1, 3)
                if len(colors) != len(voxel_centers):
                    raise NotImplementedError()

            data = []
            data.append(dict(voxel_size=voxel_size))
            boxes = []
            for i in range(len(voxel_centers)):
                box = dict(voxel_center=voxel_centers[i].tolist())
                if colors is not None:
                    box.update({"color": colors[i].tolist()})
                boxes.append(box)
            data.append(dict(voxels=boxes))

            filename = self.__get_export_file_name("boxVoxel", name)
            with open(filename, "w") as f:
                f.write(json.dumps(data))

    def add_spheres(self, centers: Union[np.ndarray, torch.Tensor], radius: Union[float, np.ndarray, torch.Tensor], colors=None, scales: Union[np.ndarray, torch.Tensor] = [1, 1, 1], quaternions: Union[np.ndarray, torch.Tensor] = [0, 0, 0, 1], *, name=None) -> None:
        """
        Add spheres

        :param centers: center of each sphere, shape: `(n, 3)` or `(3,)`
        :param radius: radius of each sphere, either float or shape of `(n,)` or `(1,)`
        :param scales: scales of each sphere, shape: `(n, 3)`, defaults to [1,1,1], useful for ellipsoids
        :param quaternions: rotations of each sphere, format wxyz, shape: `(n, 4)`, defaults to [1,0,0,0], useful for ellipsoids
        :param colors: colors of each box, shape: `(n, 3)`

        :param name: output name for the spheres
        """
        if not self.enable: return
        centers = tensor2ndarray(centers)
        centers = np.asarray(centers).reshape(-1, 3)
        n = centers.shape[0]
        centers = self.three_to_world @ np.hstack((centers, np.zeros((n, 1)))).T
        centers = centers[:3, :].T

        scales = tensor2ndarray(scales)
        scales = np.asarray(scales).reshape(-1, 3)
        assert len(scales) == len(centers)

        quaternions = tensor2ndarray(quaternions)
        quaternions = np.asarray(quaternions).reshape(-1, 4)
        quaternions = quaternions[:, [1, 2, 3, 0]]  # wxyz -> xyzw
        assert len(quaternions) == len(centers)

        if colors is not None:
            colors = tensor2ndarray(colors)
            colors = np.asarray(colors).reshape(-1, 3)
            if len(colors) != len(centers):
                raise NotImplementedError()

        spheres = []
        if isinstance(radius, float):
            for i in range(len(centers)):
                sphere = dict(center=centers[i].tolist(), radius=radius, scales=scales[i].tolist(), quaternion=quaternions[i].tolist())
                if colors is not None:
                    sphere.update({"color": colors[i].tolist()})
                spheres.append(sphere)
        else:
            radius = tensor2ndarray(radius)
            radius = np.asarray(radius).reshape(-1, 1)
            if len(radius) != len(centers):
                raise NotImplementedError()
            for i in range(len(centers)):
                sphere = dict(center=centers[i].tolist(), radius=radius[i].tolist(), scales=scales[i].tolist(), quaternion=quaternions[i].tolist())
                if colors is not None:
                    sphere.update({"color": colors[i].tolist()})
                spheres.append(sphere)

        filename = self.__get_export_file_name("spheres", name)
        with open(filename, "w") as f:
            f.write(json.dumps(spheres))

    def add_camera_trajectory(self, poses: Union[np.ndarray, torch.Tensor], is_opencv=None, *, name: str = None) -> None:
        """
        Add a camera trajectory

        :param poses: transformation matrices of shape `(n, 4, 4)`

        :param name: output name of the camera trajectory
        """
        if not self.enable: return
        poses = tensor2ndarray(poses)
        if poses.ndim == 2:
            raise ValueError("poses should be of shape (n, 4, 4). To add a single pose, use add_camera_pose.")

        poses = (self.three_to_world @ poses.T).T

        if is_opencv is None:
            warnings.warn(
                "is_opencv is not specified, assuming True. To preserve old behavior, specify is_opencv=False.")
            is_opencv = True
        if is_opencv:
            poses[:, :, [1, 2]] *= -1
            axes = "rxyz"
        else:
            axes = 'sxyz'
        quats = []
        positions = poses[:, :3, 3].reshape((-1, 3))
        for pose in poses:
            trans_quat = euler.mat2euler(pose[:3, :3], axes=axes)
            quats.append(trans_quat)

        filename = self.__get_export_file_name("camera_trajectory", name)
        with open(filename, "w") as f:
            f.write(json.dumps(dict(eulers=quats, positions=positions.tolist())))

    def add_keypoint_correspondences(self, img0, img1, kpts0: Union[np.ndarray, torch.Tensor], kpts1, *, unmatched_kpts0=None, unmatched_kpts1=None, metrics: Dict[str, Iterable[int]] = None, booleans: Dict[str, Iterable[bool]] = None, meta: Dict[str, Any] = None, name: str = None) -> None:
        """
        Add keypoint correspondences

        :param img0: path to the image or a `PIL.Image.Image` instance or a `numpy.ndarray`

        :param img1: path to the image or a `PIL.Image.Image` instance or a `numpy.ndarray`

        :param kpts0: keypoints of shape `(n, 2)`

        :param kpts1: keypoints of shape `(n, 2)`

        :param unmatched_kpts0: unmatched keypoints of shape `(m, 2)`

        :param unmatched_kpts1: unmatched keypoints of shape `(l, 2)`

        :param metrics: a dictionary of metrics, each with the shape of `(n, )`

        :param booleans: a dictionary of booleans, each with the shape of `(n, )`

        :param meta: a dictionary of meta information of correspondences

        :param name: outputname of the file
        """
        if not self.enable: return
        if isinstance(img0, str):
            image0 = Image.open(img0)
        elif isinstance(img0, np.ndarray):
            image0 = Image.fromarray(img0)
        elif isinstance(img0, torch.Tensor):
            image0 = Image.fromarray(tensor2ndarray(img0))
        elif isinstance(img0, Image.Image):
            image0 = img0

        if isinstance(img1, str):
            image1 = Image.open(img1)
        elif isinstance(img1, np.ndarray):
            image1 = Image.fromarray(img1)
        elif isinstance(img1, torch.Tensor):
            image1 = Image.fromarray(tensor2ndarray(img1))
        elif isinstance(img1, Image.Image):
            image1 = img1

        data = {}
        data["img0"] = img2url(image0)
        data["img1"] = img2url(image1)
        kpts0 = tensor2ndarray(kpts0)
        data["kpts0"] = np.asarray(kpts0).tolist()
        kpts1 = tensor2ndarray(kpts1)
        data["kpts1"] = np.asarray(kpts1).tolist()

        if unmatched_kpts0 is not None:
            unmatched_kpts0 = tensor2ndarray(unmatched_kpts0)
            data["unmatched_kpts0"] = np.asarray(unmatched_kpts0).tolist()

        if unmatched_kpts1 is not None:
            unmatched_kpts1 = tensor2ndarray(unmatched_kpts1)
            data["unmatched_kpts1"] = np.asarray(unmatched_kpts1).tolist()

        if metrics is not None and len(dict.keys(metrics)) > 0:
            m = {}
            for k, v in metrics.items():
                m[k] = np.asarray(v).reshape(-1).tolist()
            data["metrics"] = m

        if booleans is not None and len(dict.keys(booleans)) > 0:
            b = {}
            for k, v in booleans.items():
                b[k] = np.asarray(v).reshape(-1).tolist()
            data["booleans"] = b

        if meta is not None:
            data["meta"] = meta

        filename = self.__get_export_file_name("correspondences", name)
        with open(filename, "w") as f:
            f.write(json.dumps(data))

    def __repr__(self):
        if not self.enable:
            return f'Wis3D:NA'
        else:
            return f'Wis3D:{self.sequence_name}:{self.scene_id}'

    def increase_scene_id(self):
        """
        Increase scene ID by 1
        :return:
        """
        if not self.enable:
            return
        self.set_scene_id(self.scene_id + 1)

    def add_box_by_6border(self, xmin, ymin, zmin, xmax, ymax, zmax, name=None):
        """
        Add a box by 6 borders

        :param xmin: float
        :param ymin: float
        :param zmin: float
        :param xmax: float
        :param ymax: float
        :param zmax: float
        :param name: float
        :return:
        """
        if not self.enable:
            return
        x = (xmin + xmax) / 2
        y = (ymin + ymax) / 2
        z = (zmin + zmax) / 2
        sx = xmax - xmin
        sy = ymax - ymin
        sz = zmax - zmin
        self.add_boxes(np.array([x, y, z]), np.array(
            [0, 0, 0]), np.array([sx, sy, sz]), name=name)

    def add_camera_pose(self, pose: Union[np.ndarray, torch.Tensor], *, name: str = None) -> None:
        """
        Add a camera pose (w2c)

        :param pose: transformation matrices of shape `(4, 4)`. Definition:

        ::

                pt_world=matmul(pose,pt_camera)

        :param name: output name of the camera pose
        """
        if not self.enable:
            return
        self.add_camera_trajectory(pose[None], is_opencv=True, name=name)

    def add_rays(self, rays_o, rays_d, max=10.0, min=0.0, sample=1.0, name=None):
        """
        add rays to the scene, useful for debugging NeRF

        :param rays_o: (np.ndarray or torch.Tensor): [n, 3]

        :param rays_d: (np.ndarray or torch.Tensor): [n,3]
        :param max: (float, optional): Maximum norm of the ray. Defaults to 10.
        :param min: (float, optional): Minimum norm of the ray. Defaults to 0.
        :param sample: (float, optional): Sample ratio of the rays. Defaults to 1.0.
            If sample < 1.0, ratio of the rays will be sampled.
            If sample > 1.0, number of the rays will be sampled.
        :param name: (str, optional): Name of the rays. Defaults to None.
        """
        if not self.enable:
            return
        rays_o = rays_o.reshape(-1, 3)
        rays_d = rays_d.reshape(-1, 3)
        if sample < 1.0:
            size = int(sample * rays_d.shape[0])
            _, idx = random_choice(rays_o, size, dim=0)
            rays_o = rays_o[idx]
            rays_d = rays_d[idx]
        elif sample > 1.0:
            size = int(sample)
            _, idx = random_choice(rays_o, size, dim=0)
            rays_o = rays_o[idx]
            rays_d = rays_d[idx]

        self.add_lines(rays_o + rays_d * min, rays_o + rays_d * max, name=name)
