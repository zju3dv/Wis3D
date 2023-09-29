import argparse
import os
import os.path as osp
import tempfile

import trimesh
from wis3d import Wis3D

cnts = {}


def add_file(path, vis3d):
    name = osp.abspath(path).split('/')[-1]
    if name not in cnts: cnts[name] = -1
    cnts[name] += 1
    if cnts[name] > 0:
        name = f"{name} ({cnts[name]})"
    if path.split('.')[-1] in ['ply', 'obj']:
        mesh = trimesh.load_mesh(path)
        vis3d.add_mesh(mesh, name=name)
    elif path.split('.')[-1] in ['jpg', 'png']:
        vis3d.add_image(path, name=name)
    else:
        raise NotImplementedError()


def main():
    """
    Usage: w3dcli [OPTIONS] FILES...
    :return:
    """
    parser = argparse.ArgumentParser()
    parser.add_argument('files', nargs=argparse.ONE_OR_MORE)
    parser.add_argument('--host', default='')
    args = parser.parse_args()

    with tempfile.TemporaryDirectory() as d:
        print('Running wis3d on TemporaryDirectory', d)
        vis3d = Wis3D(
            out_folder=d,
            sequence_name='tmp',
            xyz_pattern=('x', 'y', 'z')
        )
        path: str
        for path in args.files:
            if not os.path.isdir(path):
                add_file(path, vis3d)
            else:
                for f in os.listdir(path):
                    add_file(osp.join(path, f), vis3d)
        # host
        host = args.host
        if host == '':
            host = os.environ.get('iterm2_hostname', 'localhost')
        os.system(f'wis3d --host {host} --vis_dir {d}')


if __name__ == '__main__':
    main()
