# Wis3D: A web-based 3D visualization tool for 3D computer vision
[Online Demo](http://wis3d.idr.ai/) | [Installation](#basic-installation) | [Tutorial](#basic-installation) | [Documentation](https://wis3d-doc.readthedocs.io)

Wis3D is a web-based 3D visualization tool built for 3D computer vision researchers. You can import 3D bounding box, point clouds, meshes and feature correspondences directly from your python code and view them in your local browser. You can think of it as [TensorBoard](https://www.tensorflow.org/tensorboard) but with 3D data as the first-class citizen.
<p align="center">
  <img src="https://github.com/zju3dv/Wis3D/blob/main/docs/source/_static/introduction/3d_scene_demo.gif?raw=true" width="44%" />
  <img src="https://github.com/zju3dv/Wis3D/blob/main/docs/source/_static/introduction/human_demo.gif?raw=true" width="44%" />
  <img src="https://github.com/zju3dv/Wis3D/blob/main/docs/source/_static/introduction/keypoint_correspondences_demo.gif?raw=true" width="45%" />
  <img src="https://github.com/zju3dv/Wis3D/blob/db7105d60b286e3e0d3896df1045e06a153b2c65/docs/source/_static/introduction/mesh_and_camera.gif?raw=true" width="45%" />
</p>

## Basic Installation

### Install from Pre-built whl

```bash
pip install https://github.com/zju3dv/Wis3D/releases/download/2.0.0/wis3d-2.0.0-py3-none-any.whl
```

### or Build from source

1. install [Node.js](https://nodejs.org/en/download/)
2. run `pip install -r requirements.txt`
3. build web pages
   ```bash
   cd wis3d/app
   npm install # install dependencies
   npx next build
   npx next export
   ```
4. install package
   ```bash
   cd ../..
   python setup.py develop
   ```

## Web Page

![](https://github.com/zju3dv/Wis3D/blob/main/docs/source/_static/tutorials/3d_objects/3d_objects.png?raw=true)
![](https://github.com/zju3dv/Wis3D/blob/main/docs/source/_static/tutorials/keypoint_correspondences/keypoint_correspondences.png?raw=true)

##  Quick Start

Please reference to `examples/test.py`. For more usage, see [Documentation](https://wis3d-doc.readthedocs.io)

### Start the Web Server

Start the web service to view the visualization in the browser.

```bash
wis3d --vis_dir $path_to_vis_dir --host 0.0.0.0 -port 19090
```

Open your browser, and enter http://localhost:19090 to see the results.


## Authors
 - Project lead: [Jiaming Sun](https://jiamingsun.ml), [Xiaowei Zhou](https://xzhou.me)
 - Core members: [Linghao Chen](ootts.github.io), [Jingmeng Zhang](https://github.com/ahazss), [Hongcheng Zhao](https://github.com/HongchengZhao), [Siyu Zhang](https://derizsy.github.io)
 - Past contributors: Zijing Huang


## Citation
```
@article{sun2022onepose,
    title={{OnePose}: One-Shot Object Pose Estimation without {CAD} Models},
    author = {Sun, Jiaming and Wang, Zihao and Zhang, Siyu and He, Xingyi and Zhao, Hongcheng and Zhang, Guofeng and Zhou, Xiaowei},
    journal={CVPR},
    year={2022},
}
```