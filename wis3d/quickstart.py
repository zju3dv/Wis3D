import cv2
import numpy as np
import matplotlib.pyplot as plt
import PIL.Image as Image
import argparse
import os
import os.path as osp
import tempfile

import trimesh
from wis3d import Wis3D
from PIL import Image, ImageDraw, ImageFont


def gen_image():
    # Create an image with a white background
    img = Image.new('RGB', (300, 300), color='white')
    img = np.array(img)
    cv2.putText(img, 'wis3d', (120, 120), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
    # plt.imshow(img)
    # plt.show()
    # Save the image to a file
    return img


def text_to_point_cloud(gen_image):
    # Create a figure to draw the text on
    mask = gen_image[:, :, 0] != 255
    points = np.argwhere(mask)
    points = points[:, [1, 0]]
    points = points - np.mean(points, axis=0)
    points = points / np.max(np.abs(points))
    points[:, 1] = -points[:, 1]
    points = np.concatenate([points, np.zeros((points.shape[0], 1))], axis=1)
    return points


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', default='')
    args = parser.parse_args()

    with tempfile.TemporaryDirectory() as d:
        wis3d = Wis3D(
            out_folder=d,
            sequence_name='quickstart',
            xyz_pattern=('x', 'y', 'z')
        )
        # host
        img = gen_image()
        wis3d.add_image(img)
        points = text_to_point_cloud(img)
        wis3d.add_point_cloud(points)
        wis3d.add_mesh(trimesh.primitives.Cylinder(radius=0.1, height=1.0), name='cylinder')
        host = args.host
        if host == '':
            host = os.environ.get('iterm2_hostname', 'localhost')
        print(f'Running wis3d quickstart on {host}: TemporaryDirectory', d)
        os.system(f'wis3d --host {host} --vis_dir {d}')


if __name__ == '__main__':
    main()
