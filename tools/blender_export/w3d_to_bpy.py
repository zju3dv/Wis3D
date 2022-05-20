import bpy
import numpy as np
import json
from easydict import EasyDict
from pathlib import Path
import os
from mathutils import Euler, Vector
import transforms3d
# import blender_utils as utils


cfg = EasyDict({
    'project_folder': '/Users/xieyiming/Downloads/neucon_newscene1_website',
    'data_folder': 'scene_demo_fusion_middle_full_pos15_mnas_view9_Aug_47',
    'scene': '2021-01-31T21-19-11',
    # camera config
    'camera_mesh_name': 'Camera Concept.STL',
    'camera_scale': 0.002,
    # light config
    'light_type': 'SUN',
    'light_energy': 5,
    # box config
    'max_num_box': 10,
    'box_thickness': 0.06,
    'predict_color': ((0, 0.737056, 1, 1)), # blue
    'backend_color': (1, 0, 0.0134555, 1), # red
    'gt_color': (0, 1, 0.00223623, 1), # green
    'proposal_color': (0.071, 1, 0.913, 1.0),
    # point cloud config
    'particle_count': 6000,
    'particle_size': 0.02,
    # 'seen_color':(0.0137019, 0.708376, 1, 1),
    'seen_color':(0.238398, 0.533276, 0.132868, 1),
    'track_high_color': (0.83077, 0.0648031, 0.0544803, 1),
    'track_low_color': (0.919202, 1, 0, 1), # yellow
    'unseen_color':(0.00212055, 0.179657, 1, 1),
    # 'unseen_color': (0.238398, 0.533276, 0.132868, 1),
    # object mesh config
    'object_color':((1, 0.969936, 0.969936, 1.0)),
    'object_roughness': 0.5,
    'object_ior': 1.15,
    # render image config
    'frame': 825, # 54 85 391 825
    'focal_length': 35,
    'render_camera_location': [-1.22359, -0.585782, 2.30216],
    'render_camera_rotation': [1.12333, 3.12414e-06, 4.64345]
    ,
    # 'content_types': ['cam_pose', 'point_cloud', 'mesh', 'box_dof']
})


class V3dFrame(object):
    def __init__(self, frame_folder):
        self.frame_folder = Path(frame_folder)
        self.boxes_dof = self.frame_folder.glob('boxes_dof/*')
        self.point_clouds = list(self.frame_folder.glob('point_cloud/*'))
        self.imgs = self.frame_folder.glob('images/*')
        self.meshes = list(self.frame_folder.glob('mesh/*'))
        self.cam_poses = list(self.frame_folder.glob('camera_pose/*'))
        self.image_ids = list(self.frame_folder.glob('image_ids/*'))


class BlenderImporter(object):
    def __init__(self, cfg):
        self.cfg = cfg
        data_path = os.path.join(cfg.project_folder, cfg.data_folder)
        self.w3d_folder = Path(data_path) / cfg.scene
        all_folder = [f for f in self.w3d_folder.iterdir()]
        all_folder.sort()
        self.frames = [V3dFrame(f) for f in all_folder]
        bpy.context.space_data.lens = self.cfg.focal_length
        o = bpy.data.objects['Camera']
        o.location = self.cfg.render_camera_location
        o.rotation_euler = self.cfg.render_camera_rotation

    def setup(self):
        self.bcam = bpy.data.objects['Camera']
        self.world_to_bcam = utils.get_3x4_RT_matrix_from_blender(self.bcam)

    def run_nurfu_demo(self):
        bi.add_mesh(preserve=9)
        # bi.add_cam_pose()
        bi.add_cam_pose(use_frustum=True)
        bi.add_light()

    def run_input_scene(self):
        bpy.ops.mesh.primitive_plane_add(size=100, enter_editmode=False, location=(0, 0, 0))
        self.cfg.seen_color = (0.00212055, 0.179657, 1, 1)
        self.cfg.track_high_color = (0.00212055, 0.179657, 1, 1)
        self.cfg.track_low_color = (0.00212055, 0.179657, 1, 1)
        self.cfg.unseen_color = (0.00212055, 0.179657, 1, 1)
        
        bi.add_point_cloud(frame=self.cfg.frame)
        # bi.add_cam_pose()
        # bi.add_box_dof()
        # bi.add_image()
        bi.add_light()
        # bi.add_mesh()

    def run_input_scene_color(self):
        bpy.ops.mesh.primitive_plane_add(size=100, enter_editmode=False, location=(0, 0, 0))
        bi.add_point_cloud(frame=self.cfg.frame)
        # bi.add_cam_pose()
        # bi.add_box_dof()
        # bi.add_image()
        bi.add_light()
        # bi.add_mesh()

    def run_all(self):
        self.add_point_cloud()
        self.add_cam_pose()
        self.add_box_dof()
        self.add_image()
        self.add_light()
        # self.add_mesh()

    def run_proposal(self,):
        bpy.ops.mesh.primitive_plane_add(size=100, enter_editmode=False, location=(0, 0, 0))
        self.add_point_cloud()
        self.add_box_dof()
        self.add_light()

    def run_update_state(self, ):
        self.add_point_cloud(frame=self.cfg.frame)
        self.add_box_dof(frame=self.cfg.frame)
        self.add_light()
    
    def run_b5_all_with_scene_mesh(self):
        # self.add_point_cloud()
        self.add_cam_pose()
        self.add_box_dof()
        self.add_light()
        self.add_b5_scene_mesh()

    def run_tracklet(self):
        self.add_cam_pose(frame=self.cfg.frame)
        self.add_light()
        bpy.ops.mesh.primitive_plane_add(size=100, enter_editmode=False, location=(0, 0, 0))
        proposal_mat = bpy.data.materials.new("proposal_color")
        proposal_mat.diffuse_color = self.cfg.proposal_color
        for i in range(3 * len(self.frames)):
            bpy.ops.mesh.primitive_cube_add(enter_editmode=False, location=(5, -6, 3))
            o = bpy.data.objects['Cube']
            o.name = 'proposal_box' + str(i)
            o.active_material = proposal_mat
            wireframe_modifier = o.modifiers.new(name='wireframe', type='WIREFRAME')
            wireframe_modifier.thickness = self.cfg.box_thickness
        num = -1
        for frame, w3d in enumerate(self.frames):
            for index, path in enumerate(w3d.boxes_dof):
                str_path = str(path)
                print(str_path)
                with open(path) as f:
                    boxes_dof = json.load(f)
                dof = boxes_dof['boxes']
                if 'predict' in str_path:
                    continue
                    box_type = 'predict_box'
                elif 'backend' in str_path:
                    box_type = 'proposal_box'
                else:
                    continue
                    box_type = 'gt_box'
                for i, dof_ in enumerate(dof):
                    num += 1
                    position = dof_['position']
                    rotation = dof_['rotation']
                    rotation = transforms3d.euler.euler2mat(rotation[0], rotation[1], rotation[2], 'rxyz')
                    rotation = transforms3d.euler.mat2euler(rotation, 'sxyz')
                    scale = dof_['scale']

                    obj = bpy.data.objects[box_type + str(num)]
                    obj.hide_viewport = False
                    obj.hide_render = False
                    obj.location = position[0], position[1], position[2]
                    obj.rotation_euler = Euler((rotation[0], rotation[1], rotation[2]), 'XYZ')
                    obj.scale = scale[0] / 2, scale[1] / 2, scale[2] / 2

    def add_b5_scene_mesh(self):
        myCol = bpy.data.collections.new('B5_Scene_Collection')
        bpy.context.scene.collection.children.link(myCol)
        object_mat = bpy.data.materials.new("b5_scene_mat")
        object_mat.diffuse_color = self.cfg.object_color
        object_mat.use_nodes = True
        nodes = object_mat.node_tree.nodes
        attribute = nodes.new(type="ShaderNodeAttribute")
        attribute.attribute_name='Col'
        links = object_mat.node_tree.links
        link = links.new(attribute.outputs[0], nodes.get('Principled BSDF').inputs[0])

        # rot_path = str(self.cfg.project_folder) + 'offset.json'
        # with open(rot_path) as f:
            # camera0_pose = json.load(f)
            # camera0_pose = np.reshape(np.array(camera0_pose), (4, 4))
            # print(camera0_pose)
            # rotation = transforms3d.euler.mat2euler(camera0_pose, 'sxyz')
            # position = camera0_pose[:, 3]

        rot_path = str(self.cfg.project_folder) + 'annotation.json'
        with open(rot_path) as f:
            ann_dict = json.load(f)
            camera0_pose = ann_dict['task']['items'][0]['transform']
            camera0_pose = np.reshape(np.array(camera0_pose), (4, 4)).transpose(1, 0)
            print(camera0_pose)
            rotation = transforms3d.euler.mat2euler(camera0_pose, 'sxyz')
            position = camera0_pose[:, 3]
        
        path = Path('/home/xieyiming/Downloads/udolo-blender-demo/semantic_mesh/')
        all_file = list(path.glob('*'))
        all_file.sort()
        b5_sequence_len = len(self.frames)
        for frame in range(b5_sequence_len):
            str_path = str(all_file[frame])
            print(str_path)
            self._add_ply(str_path)
            instance = str_path.split('/')[-1].split('.')[0]
            o = bpy.data.objects[instance]
            o.name = instance + '_' + str(frame)
            o.active_material = object_mat
            # o.rotation_euler = Euler((rotation[0], rotation[1], rotation[2]), 'XYZ')
            # o.location = position[0], position[1], position[2]
            o.rotation_euler = Euler((0, 0, 4.8468 * np.pi / 180), 'XYZ')
            o.location = 0.054298, 1.19073, 1.27552

            bpy.data.collections['Collection'].objects.unlink(o)
            bpy.data.collections['B5_Scene_Collection'].objects.link(o)
            o.keyframe_insert('hide_viewport', frame=frame)
            o.keyframe_insert('hide_render', frame=frame)
            o.hide_viewport=True
            o.hide_render=True
            for i in range(len(self.frames)):
                if i != frame:
                    o.keyframe_insert('hide_viewport', frame=i)
                    o.keyframe_insert('hide_render', frame=i)
    
    def add_cam_pose(self, frame=None, use_frustum=False):
        if frame is not None:
            frames = [self.frames[frame]]
        else:
            frames = self.frames
        if not use_frustum:
            camera_mesh_name = self.cfg.camera_mesh_name.split('.')[0]
            camera_mesh_path = os.path.join(self.cfg.project_folder, self.cfg.camera_mesh_name)
            bpy.ops.import_mesh.stl(filepath=camera_mesh_path, global_scale=self.cfg.camera_scale)
            camera_name = camera_mesh_name
        else:
            camera_name = 'Cube'
        bpy.ops.object.origin_set(type='GEOMETRY_ORIGIN', center='MEDIAN')
        for frame, w3d in enumerate(frames):
            for index, path in enumerate(w3d.cam_poses):
                with open(str(path)) as f:
                    camera_pose = json.load(f)
                position = camera_pose['positions'][-1]
                rotation = camera_pose['rotations'][-1]
                rotation = transforms3d.euler.euler2mat(rotation[0], rotation[1], rotation[2], 'rxyz')
                rotation = transforms3d.euler.mat2euler(rotation, 'sxyz')
                print(rotation)
                obj = bpy.data.objects[camera_name]
                obj.location = position[0], position[1], position[2]
                obj.rotation_euler = Euler((rotation[0], rotation[1], rotation[2]), 'XYZ')
                if use_frustum:
                    obj.scale = 1.5, 1.5, 1.8
                    # translate in local coordinate
                    inv = Euler((rotation[0], rotation[1], rotation[2]), 'XYZ').to_matrix()
                    inv.invert()
                    vec = Vector((0, 0, obj.scale[2]))
                    vec_rot = vec @ inv
                    obj.location = obj.location + vec_rot
                obj.keyframe_insert(data_path="location", frame=frame)
                obj.keyframe_insert(data_path="rotation_euler", frame=frame)

    def add_box_dof(self, frame=None):
        if frame is None:
            frames = self.frames
        else:
            frames = [self.frames[frame]]
        myCol = bpy.data.collections.new('Box_Collection')
        bpy.context.scene.collection.children.link(myCol)
        predict_mat = bpy.data.materials.new("predict_color")
        predict_mat.diffuse_color = self.cfg.predict_color
        backend_mat = bpy.data.materials.new("backend_color")
        backend_mat.diffuse_color = self.cfg.backend_color
        gt_mat = bpy.data.materials.new("gt_corlor")
        gt_mat.diffuse_color = self.cfg.gt_color
        for i in range(self.cfg.max_num_box):
            # bpy.ops.mesh.primitive_cube_add(enter_editmode=False, location=(5, -6, 3))
            # o = bpy.data.objects['Cube']
            # o.name = 'predict_box' + str(i)
            # o.active_material = predict_mat
            # wireframe_modifier = o.modifiers.new(name='wireframe', type='WIREFRAME')
            # wireframe_modifier.thickness = 0.08
            # bpy.data.collections['Collection'].objects.unlink(o)
            # bpy.data.collections['Box_Collection'].objects.link(o)

            bpy.ops.mesh.primitive_cube_add(enter_editmode=False, location=(5, -6, 3))
            o = bpy.data.objects['Cube']
            o.name = 'gt_box' + str(i)
            o.active_material = gt_mat
            wireframe_modifier = o.modifiers.new(name='wireframe', type='WIREFRAME')
            wireframe_modifier.thickness = self.cfg.box_thickness
            bpy.data.collections['Collection'].objects.unlink(o)
            bpy.data.collections['Box_Collection'].objects.link(o)

            bpy.ops.mesh.primitive_cube_add(enter_editmode=False, location=(5, -6, 3))
            o = bpy.data.objects['Cube']
            o.name = 'backend_box' + str(i)
            o.active_material = backend_mat
            wireframe_modifier = o.modifiers.new(name='wireframe', type='WIREFRAME')
            wireframe_modifier.thickness = self.cfg.box_thickness
            bpy.data.collections['Collection'].objects.unlink(o)
            bpy.data.collections['Box_Collection'].objects.link(o)

        for frame, w3d in enumerate(frames):
            predict_num = -1
            backend_num = -1
            gt_num = -1
            current_num = None
            for index, path in enumerate(w3d.boxes_dof):
                str_path = str(path)
                print(str_path)
                with open(str_path, 'rb') as f:
                    boxes_dof = json.load(f)
                dof = boxes_dof['boxes']
                print(dof)
                if 'predict' in str_path:
                    continue
                    predict_num += 1
                    box_type = 'predict_box'
                    current_num = predict_num
                elif 'backend' in str_path:
                    backend_num += 1
                    box_type = 'backend_box'
                    current_num = backend_num
                else:
                    gt_num += 1
                    box_type = 'gt_box'
                    current_num = gt_num
                for i, dof_ in enumerate(dof):
                    current_num += i
                    position = dof_['position']
                    rotation = dof_['rotation']
                    rotation = transforms3d.euler.euler2mat(rotation[0], rotation[1], rotation[2], 'rxyz')
                    rotation = transforms3d.euler.mat2euler(rotation, 'sxyz')
                    scale = dof_['scale']

                    obj = bpy.data.objects[box_type + str(current_num)]
                    obj.hide_viewport = False
                    obj.hide_render = False
                    obj.location = position[0], position[1], position[2]
                    obj.rotation_euler = Euler((rotation[0], rotation[1], rotation[2]), 'XYZ')
                    obj.scale = scale[0] / 2, scale[1] / 2, scale[2] / 2
                    obj.keyframe_insert(data_path="location", frame=frame)
                    obj.keyframe_insert(data_path="rotation_euler", frame=frame)
                    obj.keyframe_insert(data_path="scale", frame=frame)
                    obj.keyframe_insert(data_path='hide_viewport', frame=frame)
                    obj.keyframe_insert(data_path='hide_render', frame=frame)
                    print(str(path))
                for i in range(self.cfg.max_num_box - (current_num + 1)):
                    index = self.cfg.max_num_box - i - 1
                    obj = bpy.data.objects[box_type + str(index)]
                    obj.hide_viewport = True
                    obj.hide_render = True
                    obj.keyframe_insert(data_path='hide_viewport', frame=frame)
                    obj.keyframe_insert(data_path='hide_render', frame=frame)
                

    def add_point_cloud(self,frame=None):
        if frame is None:
            frames = self.frames
        else:
            frames = [self.frames[frame]]

        myCol = bpy.data.collections.new('Point_Collection')
        bpy.context.scene.collection.children.link(myCol)

        seen_mat = bpy.data.materials.new("seen_mat")
        seen_mat.diffuse_color = self.cfg.seen_color
        track_high_mat = bpy.data.materials.new("track_high_mat")
        track_high_mat.diffuse_color = self.cfg.track_high_color
        track_low_mat = bpy.data.materials.new("track_low_mat")
        track_low_mat.diffuse_color = self.cfg.track_low_color 
        unseen_mat = bpy.data.materials.new("unseen_mat")
        unseen_mat.diffuse_color = self.cfg.unseen_color

        bpy.ops.mesh.primitive_uv_sphere_add(enter_editmode=False, location=(-5, -6, 3))
        o = bpy.data.objects['Sphere']
        o.name = 'instance_seen_area'
        o.active_material = seen_mat
        bpy.ops.mesh.primitive_uv_sphere_add(enter_editmode=False, location=(-5, -6, 4))
        o = bpy.data.objects['Sphere']
        o.name = 'instance_track_area_high'
        o.active_material = track_high_mat
        bpy.ops.mesh.primitive_uv_sphere_add(enter_editmode=False, location=(-5, -6, 5))
        o = bpy.data.objects['Sphere']
        o.name = 'instance_track_area_low'
        o.active_material = track_low_mat
        bpy.ops.mesh.primitive_uv_sphere_add(enter_editmode=False, location=(-5, -6, 5))
        o = bpy.data.objects['Sphere']
        o.name = 'instance_unseen_area'
        o.active_material = unseen_mat
        num = 0
        for frame, w3d in enumerate(frames):
            for index, path in enumerate(w3d.point_clouds):
                str_path = str(path)
                instance = str_path.split('/')[-1].split('.')[0]
                self._add_ply(str_path)
                o = bpy.data.objects[instance]
                print(o.name)
                o.name = instance + '_' + str(frame) 
                area = bpy.context.area
                area.type = 'VIEW_3D'
                bpy.ops.object.particle_system_add()
                if num == 0:
                    particle_name = 'ParticleSettings'
                elif num < 10:
                    particle_name = 'ParticleSettings.00' + str(num)
                elif num < 100:
                    particle_name = 'ParticleSettings.0' + str(num)
                else:
                   particle_name = 'ParticleSettings.' + str(num)
                bpy.data.particles[particle_name].emit_from = 'VERT' 
                bpy.data.particles[particle_name].count = self.cfg.particle_count
                print(particle_name)
                print(frame)
                bpy.data.particles[particle_name].frame_start = frame
                bpy.data.particles[particle_name].frame_end = frame
                bpy.data.particles[particle_name].lifetime = 1000
                bpy.data.particles[particle_name].normal_factor = 0
                bpy.data.particles[particle_name].effector_weights.gravity = 0
                bpy.data.particles[particle_name].render_type = 'OBJECT'
                bpy.data.particles[particle_name].particle_size = self.cfg.particle_size
                bpy.data.particles[particle_name].instance_object = bpy.data.objects['instance_' + instance]
                
                bpy.data.collections['Collection'].objects.unlink(o)
                bpy.data.collections['Point_Collection'].objects.link(o)
                o.keyframe_insert('hide_viewport', frame=frame)
                o.keyframe_insert('hide_render', frame=frame)
                o.hide_viewport=True
                o.hide_render=True
                for i in range(len(self.frames)):
                    if i != frame:
                        o.keyframe_insert('hide_viewport', frame=i)
                        o.keyframe_insert('hide_render', frame=i)
                num += 1


    def add_mesh(self, preserve=1):
        myCol = bpy.data.collections.new('Scene_Collection')
        bpy.context.scene.collection.children.link(myCol)
        

        object_mat = bpy.data.materials.new("b5_scene_mat")
        object_mat.diffuse_color = self.cfg.object_color
        object_mat.use_nodes = True
        nodes = object_mat.node_tree.nodes
        attribute = nodes.new(type="ShaderNodeAttribute")
        attribute.attribute_name='Col'
        links = object_mat.node_tree.links
        link = links.new(attribute.outputs[0], nodes.get('Principled BSDF').inputs[0])


        # glass_texture = nodes.new(type="ShaderNodeBsdfGlass")
        # glass_texture.inputs[1].default_value = self.cfg.object_roughness
        # glass_texture.inputs[2].default_value = self.cfg.object_ior
        # links = object_mat.node_tree.links
        # link = links.new(glass_texture.outputs[0], nodes.get('Material Output').inputs[0])
        count = 0
        for frame, w3d in enumerate(self.frames):
            for index, path in enumerate(w3d.meshes):
                str_path = str(path)
                # if '/scale3_texture.obj' not in str_path:
                    # continue
                if '/scale3.ply' not in str_path:
                    continue
                # self._add_obj(str_path)
                self._add_ply(str_path)

                instance = str_path.split('/')[-1].split('.')[0]
                # if count > 0:
                    # instance += '.{:0>3d}'.format(count)
                
                o = bpy.data.objects[instance]

                o.name = instance + '_' + str(frame)
                o.active_material = object_mat
                bpy.data.collections['Collection'].objects.unlink(o)
                bpy.data.collections['Scene_Collection'].objects.link(o)
                o.keyframe_insert('hide_viewport', frame=frame)
                o.keyframe_insert('hide_render', frame=frame)
                o.hide_viewport=True
                o.hide_render=True
                for i in range(len(self.frames)):
                    if i < frame or i >= frame + preserve:
                        o.keyframe_insert('hide_viewport', frame=i)
                        o.keyframe_insert('hide_render', frame=i)
                
                count += 1
        
    def add_image_with_pose(self):
        myCol = bpy.data.collections.new('Map_Collection')
        bpy.context.scene.collection.children.link(myCol)
        for frame, w3d in enumerate(self.frames):
            for index, path in enumerate(w3d.imgs):
                str_path = str(path)
                if 'voxel' in str_path:
                    print(str_path)
                    bpy.ops.mesh.primitive_plane_add(size=10, enter_editmode=False, location=(0, 0, 0))
                    plane = bpy.data.objects['Plane']
                    plane.name = 'voxel_map' + str(frame)
                    plane.rotation_euler[2] = 1.5708
                    plane.location[2] = -1.5
                    bpy.context.view_layer.objects.active = plane
                    image = bpy.data.images.load(str_path)
                    mat_voxel_map = bpy.data.materials.new('mat_voxel_map' + str(frame))
                    mat_voxel_map.use_nodes = True
                    nodes = mat_voxel_map.node_tree.nodes
                    node_texture = nodes.new(type='ShaderNodeTexImage')
                    node_texture.name = 'texture'
                    node_texture.interpolation = 'Closest'
                    node_texture.image = image
                    links = mat_voxel_map.node_tree.links
                    link = links.new(node_texture.outputs[0], nodes.get('Principled BSDF').inputs[0])
                    plane.active_material = mat_voxel_map

                    bpy.data.collections['Collection'].objects.unlink(plane)
                    bpy.data.collections['Map_Collection'].objects.link(plane)
                    plane.keyframe_insert('hide_viewport', frame=frame)
                    plane.keyframe_insert('hide_render', frame=frame)
                    plane.hide_viewport=True
                    plane.hide_render=True
                    for i in range(len(self.frames)):
                        if i != frame:
                            plane.keyframe_insert('hide_viewport', frame=i)
                            plane.keyframe_insert('hide_render', frame=i)

    def add_image(self):
        myCol = bpy.data.collections.new('Map_Collection')
        bpy.context.scene.collection.children.link(myCol)
        for frame, w3d in enumerate(self.frames):
            for index, path in enumerate(w3d.imgs):
                str_path = str(path)
                if 'voxel' in str_path:
                    print(str_path)
                    bpy.ops.mesh.primitive_plane_add(size=10, enter_editmode=False, location=(0, 0, 0))
                    plane = bpy.data.objects['Plane']
                    plane.name = 'voxel_map' + str(frame)
                    plane.rotation_euler[2] = 1.5708
                    plane.location[2] = -1.5
                    bpy.context.view_layer.objects.active = plane
                    image = bpy.data.images.load(str_path)
                    mat_voxel_map = bpy.data.materials.new('mat_voxel_map' + str(frame))
                    mat_voxel_map.use_nodes = True
                    nodes = mat_voxel_map.node_tree.nodes
                    node_texture = nodes.new(type='ShaderNodeTexImage')
                    node_texture.name = 'texture'
                    node_texture.interpolation = 'Closest'
                    node_texture.image = image
                    links = mat_voxel_map.node_tree.links
                    link = links.new(node_texture.outputs[0], nodes.get('Principled BSDF').inputs[0])
                    plane.active_material = mat_voxel_map

                    bpy.data.collections['Collection'].objects.unlink(plane)
                    bpy.data.collections['Map_Collection'].objects.link(plane)
                    plane.keyframe_insert('hide_viewport', frame=frame)
                    plane.keyframe_insert('hide_render', frame=frame)
                    plane.hide_viewport=True
                    plane.hide_render=True
                    for i in range(len(self.frames)):
                        if i != frame:
                            plane.keyframe_insert('hide_viewport', frame=i)
                            plane.keyframe_insert('hide_render', frame=i)
                             
    def add_light(self,):
        if 'Light' in bpy.data.objects:
            light = bpy.data.objects['Light']
            bpy.ops.object.delete({"selected_objects": [light]})
        My_light = bpy.data.lights.new(name="My_Light", type=self.cfg.light_type)
        My_light.energy = self.cfg.light_energy
        # create new object with our light datablock
        light_object = bpy.data.objects.new(name="My_Light", object_data=My_light)
        light_object.location[2] = 5
        bpy.context.collection.objects.link(light_object)

    def _apply_tf_to_last_obj(translation, rotation, scale=None):
        mesh = bpy.context.selected_objects[0]
        mesh.location += translation
        mesh.rotation_euler = angle
        if scale:
            mesh.scale = scale

    def _add_ply(self, ply_path):
        # example input types:
        # - location = (0.5, -0.5, 0)
        # - rotation_euler = (90, 0, 0) in radius
        # - scale = (1,1,1)
        bpy.ops.import_mesh.ply(filepath=ply_path)

    def _add_obj(self, obj_path):
        bpy.ops.import_scene.obj(filepath=obj_path, axis_forward='Y', axis_up='Z')

    def grab_content(self):
        pass
    
# if __name__ == '__main__':
bi = BlenderImporter(cfg)
# bi.run_update_state()
# bi.run_all()
# bi.run_input_scene_color()
# bi.run_input_scene()
# bi.run_proposal()
# bi.run_tracklet()
# bi.run_update_state()
bi.run_nurfu_demo()
# update scene, if needed
dg = bpy.context.evaluated_depsgraph_get() 
dg.update()
# bi.add_mesh()
# bi.add_point_cloud('/Users/xieyiming/Downloads/udolo-blender-demo/b5_demo/sequence/00001/point_cloud/seen_area.ply', 0)
# bi.add_point_cloud('/Users/xieyiming/Downloads/udolo-blender-demo/b5_demo/sequence/00001/point_cloud/track_area_high.ply', 1)
# bi.add_point_cloud('/Users/xieyiming/Downloads/udolo-blender-demo/b5_demo/sequence/00001/point_cloud/track_area_low.ply', 2)
# bi.add_point_cloud('/Users/xieyiming/Downloads/udolo-blender-demo/b5_demo/sequence/00001/point_cloud/unseen_area.ply', 3)
# bi.add_mesh('/Users/xieyiming/Downloads/udolo-blender-demo/b5_demo/sequence/00001/mesh/1.ply')
