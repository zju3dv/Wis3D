# coding=utf-8
from setuptools import setup, find_packages

with open('wis3d/version.py') as f:
    exec(f.read())

setup(
    name='wis3d',
    version=__version__,
    author='Jingmeng Zhang, Hongcheng Zhao, Zijing Huang, Jiaming Sun',
    url='https://github.com/zju3dv/wis3d.git',
    description='A web-based 3D visualization tool for 3D computer vision.',
    packages=find_packages(),
    package_dir={'wis3d': 'wis3d'},
    include_package_data=True,
    license='Apache License 2.0',
    classifiers=[
        'Programming Language :: Python :: 3',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
    ],
    python_requires='>=3.6',
    install_requires=[
        'numpy',
        'trimesh >= 3.9.0',
        'cherrypy',
        'pillow',
        'scipy',
        'transforms3d',
        'torch'
    ],
    entry_points={
        'console_scripts': [
            'wis3d = wis3d:main'
        ]
    },
)
