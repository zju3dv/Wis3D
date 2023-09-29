import trimesh.primitives

from wis3d import Wis3D
import json
import os
import numpy as np

wis3d = Wis3D("example/visual", 'get_started', xyz_pattern=('x', '-y', '-z'))

# Add image
image_path = os.path.abspath("./example/data/3d_objects/image.jpg")
wis3d.add_image(image_path, name='example_image')

# Add mesh
mesh_path = os.path.abspath("./example/data/3d_objects/object_mesh.ply")
mesh = trimesh.primitives.Capsule(radius=0.1, height=1.0)
wis3d.add_mesh(mesh, name='capsule')

# Add point cloud
pcd = mesh.sample(1000)
wis3d.add_point_cloud(pcd, name="pcd")

# Add camera pose
camera_pose = np.array([[1, 0, 0, 1],
                        [0, 1, 0, 0],
                        [0, 0, 1, 0],
                        [0, 0, 0, 1]])
wis3d.add_camera_pose(camera_pose, name="camera_pose")

# Add rays
rays_o = np.zeros([2, 3])
rays_d = np.array([[0.717, 0.717, 0], [0.866, 0.866, 0.866]])
wis3d.add_rays(rays_o, rays_d, name="rays")

# Add boxes
box_position = np.array([0.031110053956829253, 0.14903110053844104, 0.06947125259015194])
box_euler = np.array([0.2983695071801829, 0, 0])
box_scale = np.array([0.10659366288916065, 0.25998074671930477, 0.11320996768381944])
wis3d.add_boxes(box_position, box_euler, box_scale)

# Add sphere
wis3d.add_spheres(np.array([0.0170813, 0.1977202, 0.05446463]), 0.32, colors=np.array([255, 255, 255]))

# Add keypoint correspondences
img0_path = os.path.abspath("./example/data/keypoint_correspondences/img0.png")
img1_path = os.path.abspath("./example/data/keypoint_correspondences/img1.png")
keypoints_path = os.path.abspath("./example/data/keypoint_correspondences/keypoint_correspondences.json")
with open(keypoints_path, 'r') as f:
    keypoints_data = json.load(f)

wis3d.add_keypoint_correspondences(img0_path,
                                   img1_path,
                                   kpts0=keypoints_data["kpts0"],
                                   kpts1=keypoints_data["kpts1"],
                                   metrics={
                                       "epi_errs": keypoints_data["epi_errs"],
                                       "mconf": keypoints_data["mconf"]
                                   },
                                   booleans={
                                       "inliers": keypoints_data["inliers"]
                                   })
