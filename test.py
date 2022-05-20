# coding=utf-8
from wis3d.wis3d import Wis3D
import trimesh
from PIL import Image
from transforms3d import affines, quaternions
import os
import numpy as np
import torch
import json
from PIL import Image
import io
import base64
import re

wis3d = Wis3D('/home/zhangjingmeng/Documents/visual',
              'test_camera')


# cam_poses = torch.eye(4)[None].repeat(10, 1, 1)
# for j in range(10):
#     cam_poses[j, :3, 3] = j
for i in range(10):
    cam_poses = torch.eye(4)[None].repeat(i + 1, 1, 1)
    for j in range(i + 1):
        cam_poses[j, :3, 3] = j
    wis3d.set_scene_id(i)
    wis3d.add_camera_trajectory(cam_poses)

# wis3d.add_mesh("/nas/dataset/static_recon/SLR/objects/C0066/recon_mesh.ply")
# wis3d.add_point_cloud("/nas/dataset/static_recon/SLR/objects/C0066/recon_mesh.ply")
# wis3d.add_point_cloud("/nas/dataset/static_recon/SLR/objects/C0066/pcd.ply")
# wis3d.add_point_cloud('/nas/dataset/static_recon/SLR/objects/C0066/sfm_ws_scaled/model_scaled.ply')

# wis3d.set_scene_id(0)

# wis3d.add_plane(2, 7, 9, 5, name='plane1')
# wis3d.add_plane(np.array([4, 6, 3]), 8, name='plane2')


# def load_poses(data_path, downsample_rate=5):
#     poses = []
#     with open(os.path.join(data_path, 'ARposes.txt')) as f:
#         index = 0
#         lines = f.readlines()
#         for line in lines:
#             line = line.strip()
#             if len(line) == 0 or line[0] == '#':
#                 continue

#             if index % downsample_rate == 0:
#                 eles = line.split(',')

#                 data = [float(e) for e in eles]
#                 position = data[1:4]
#                 quaternion = data[4:]
#                 rot_mat = quaternions.quat2mat(quaternion)
#                 rot_mat = rot_mat @ np.asarray([
#                     [1, 0, 0],
#                     [0, -1, 0],
#                     [0, 0, -1]
#                 ])
#                 T_cw = affines.compose(position, rot_mat, np.ones(3))
#                 poses.append(T_cw)

#     return np.asarray(poses)

# # test line
# wis3d.add_lines(np.array([0, 0, 0]),np.array([1, 1, 1]), name='line0')
# wis3d.add_lines(np.array([[0, 0, 0], [1, 1, 1]]), np.array([[0, 1, 0], [1, 2, 1]]), name='line1')
# colors = np.array([[255, 255, 255], [0, 0, 0]])
# wis3d.add_lines(np.array([[0, 1, 0], [0, -1, 0]]), np.array([[1, 0, 0], [1, 0, 0]]), colors, name='line2')
# colors = torch.tensor([[255, 255, 255], [0, 0, 0]])
# wis3d.add_lines(torch.tensor([[0, 1, 0], [0, -1, 0]]), torch.tensor([[1, 0, 0], [1, 0, 0]]), colors, name='line_torch')

# test sphere
# wis3d.add_spheres(np.array([0, 0, 0]), 0.5, name='sphere0')
# wis3d.add_spheres(torch.tensor([[0, 1, 0], [0, 0, 1]]), np.array([0.25, 0.25]), torch.tensor([[0, 255, 0], [0, 0, 255]]), name='sphere1')

# test voxel
# file_path = "/home/zhangjingmeng/downloads/sample0.json"
# with open(file_path,'r') as load_f:
#     load_dict = json.load(load_f)
# positions = []
# colors = []
# size = 0.019999999552965164
# for val in load_dict:
#     positions.append(val["position"])
#     colors.append([255, 0, 0])
# wis3d.add_voxel(positions, size, colors, name='boxvox')
# wis3d.add_voxel(torch.tensor([[1.0, 1.0, 1.0], [-1, -1, -1]]), 0.1, torch.tensor([[255, 255, 255], [0, 0, 0]]), name='boxvox')

# # test point cloud
# pcd_path = '/data/zhaohongcheng/Doll/Doll2/ws_refine/0/dense/fused.ply'
# wis3d.add_point_cloud(pcd_path, name='pcd0')
# pcd = trimesh.load_mesh(pcd_path)
# wis3d.add_point_cloud(pcd, name='pcd1')
# wis3d.add_point_cloud(pcd.vertices, pcd.colors, name='pcd2')
# wis3d.add_point_cloud(torch.tensor(pcd.vertices), torch.tensor(pcd.colors), name='pcd_torch')


# # test mesh
# mesh_path = '/data/zhaohongcheng/Doll/Doll2/ws_refine2/0/dense/model.obj'
# wis3d.add_mesh(mesh_path, name='mesh0')
# mesh = trimesh.load_mesh(mesh_path)
# wis3d.add_mesh(mesh, name='mesh1')
# wis3d.add_mesh(mesh.vertices, mesh.faces,
#                mesh.visual.vertex_colors[:, :3], name='mesh2')
# wis3d.add_mesh(torch.tensor(mesh.vertices).to('cuda:0'), torch.tensor(mesh.faces), torch.tensor(mesh.visual.vertex_colors[:, :3]), name='torch_mesh')

# # test image
# image_path = '/data/zhaohongcheng/Doll/Doll2/color/5.png'
# wis3d.add_image(image_path, name='image0')
# image = Image.open(image_path)
# # wis3d.add_image(image, name='image1')
# # wis3d.add_image(np.asarray(image), name='image2')

# # test trajectory
# poses = load_poses('/data/zhaohongcheng/Doll/Doll2')
# wis3d.add_camera_trajectory(poses, name='trajectory0')
# wis3d.add_camera_trajectory(torch.tensor(poses).to('cuda:0'), name='traj_torch')

# # test box
# points = np.array([
#     [-0.5, -0.5, -0.5],
#     [0.5, -0.5, -0.5],
#     [0.5, -0.5, 0.5],
#     [-0.5, -0.5, 0.5],
#     [-0.5, 0.5, -0.5],
#     [0.5, 0.5, -0.5],
#     [0.5, 0.5, 0.5],
#     [-0.5, 0.5, 0.5]
# ])
# wis3d.add_boxes(points, name='box0', labels='test0')
# wis3d.add_boxes(points.reshape(1, 8, 3) + 0.6, name='box1', labels=['test1'])
# wis3d.add_boxes([0.5, 0.2, 0.1], [1.24, 3.0, 2.1], [0.5, 0.6, 0.7], name='box2', labels='test2')
# wis3d.add_boxes([[0.2, 0.6, 0.3],[0.5, 0.9, 1.0]], [[2.24, 1.0, 3.1], [0.6, 2.9, 2.1]], [[0.2, 0.5, 0.8], [0.4, 0.6, 0.8]], name='box3', labels=['test3', 'test4'])
# points = torch.tensor(points)
# wis3d.add_boxes_by_corners(points, name='box_torch', label='torch')
# wis3d.add_boxes(torch.tensor([[0.2, 0.6, 0.3],[0.5, 0.9, 1.0]]), torch.tensor([[2.24, 1.0, 3.1], [0.6, 2.9, 2.1]]), torch.tensor([[0.2, 0.5, 0.8], [0.4, 0.6, 0.8]]), name='box_torch2', labels=['torch2_0', 'torch2_1'])

# test correspondences
# dumps = np.load(
#     '/home/zhaohongcheng/Documents/LoFTR/dump/loftr_ds_indoor/LoFTR_pred_eval.npy', allow_pickle=True)
# root_dir = '/data/scannet/scannet_test_1500'
# for i in range(len(dumps)):
#     if i >= 1:
#         break
#     wis3d.set_scene_id(i)
#     pe = dumps[i]

#     unmatched_kpts0 = np.random.rand(50, 2)
#     unmatched_kpts0[: ,0] *= 640
#     unmatched_kpts0[: ,1] *= 480

#     unmatched_kpts1 = np.random.rand(50, 2)
#     unmatched_kpts1[: ,0] *= 640
#     unmatched_kpts1[: ,1] *= 480

#     img0 = Image.open(os.path.join(root_dir, pe['pair_names'][0])).convert(
#         'LA').resize((640, 480))
#     img1 = Image.open(os.path.join(root_dir, pe['pair_names'][1])).convert(
#         'LA').resize((640, 480))
#     wis3d.add_keypoint_correspondences(img0, img1, pe['mkpts0_f'], pe['mkpts1_f'], metrics={
#         "epi_errs": pe["epi_errs"].tolist(),
#         "mconf": pe["mconf"].tolist(),
#     },
#     unmatched_kpts0=unmatched_kpts0,
#     unmatched_kpts1=unmatched_kpts1,
#     booleans={
#         "inliers": pe["inliers"].tolist()
#     }, meta={
#         "R_errs": pe["R_errs"],
#         "t_errs": pe["t_errs"]
#     }, name='matches')
